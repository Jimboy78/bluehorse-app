import type {
  EquipmentLoadSpec,
  ExperienceLevel,
  Goal,
  LoadReading,
  MovementPattern,
  MuscleGroup,
  Sex,
  UserBaseline,
  UserConstraint,
} from '@bh/domain';
import { formatLoad } from '@bh/domain';
import type { PlanBlueprint, UserSnapshot } from '@bh/engine';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { fetchGymCatalog } from './catalog.ts';
import { activeRuleset, engine, engineContext } from './engine.ts';
import { toPlanInsert, toPlanSessionInserts, toPlanSessionItemInserts } from './mappers/plan.ts';
import { requireSupabase } from './supabase.ts';

/**
 * GENERAR EL PLAN — una vez, al terminar el onboarding — y LEERLO — cada vez
 * que se abre la app. El motor corre en el cliente (es puro, no necesita
 * servidor), pero el resultado se guarda: la pantalla "Hoy" lee de
 * `plan_sessions`/`plan_session_items`, no vuelve a generar nada.
 *
 * Regla dura: `plans.ruleset_version` tiene FK a `rulesets`. Sin una fila ahí
 * (`npm run db:ruleset`), esto falla. Se rompe siempre después de un
 * `db:reset` porque el ruleset no vive en `seed.sql` — ver CLAUDE.md.
 */

/** Exportada para reuso: la revisión de progreso necesita el mismo snapshot que generar el plan. */
export async function fetchUserSnapshot(
  client: SupabaseClient,
  userId: string,
): Promise<UserSnapshot> {
  const { data: profileRow, error: profileError } = await client
    .from('profiles')
    .select('id, gym_id, display_name, birth_date, sex, experience_level')
    .eq('id', userId)
    .single();
  if (profileError) throw profileError;

  const { data: goalRows, error: goalError } = await client
    .from('user_goals')
    .select('goal, sport, priority, sessions_per_week_target, session_minutes_target')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority');
  if (goalError) throw goalError;
  if (!goalRows || goalRows.length === 0) {
    throw new Error('El socio no tiene ningún objetivo cargado todavía (falta el onboarding).');
  }

  // Molestias y lesiones vigentes (`active_to` nulo). Sin esto el motor no puede
  // sacar del plan lo que irrita una zona que duele: la regla existe en el
  // ruleset y en el motor, pero nunca recibía con qué dispararse.
  const { data: constraintRows, error: constraintError } = await client
    .from('user_constraints')
    .select('type, body_region, exercise_id, equipment_id, severity')
    .eq('user_id', userId)
    .is('active_to', null);
  if (constraintError) throw constraintError;

  // Punto de partida por ejercicio: lo declarado o lo que la app calibró. Es de
  // donde sale la carga objetivo del plan y lo que el ajuste por ausencia
  // reduce al volver.
  const { data: baselineRows, error: baselineError } = await client
    .from('user_baselines')
    .select('exercise_id, source, load_value, load_unit, reps, recorded_at')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false });
  if (baselineError) throw baselineError;

  return {
    profile: {
      id: profileRow.id,
      gymId: profileRow.gym_id,
      displayName: profileRow.display_name,
      birthDate: profileRow.birth_date,
      sex: profileRow.sex as Sex,
      experienceLevel: profileRow.experience_level as ExperienceLevel,
    },
    goals: goalRows.map((g) => ({
      goal: g.goal,
      sport: g.sport,
      priority: g.priority,
      sessionsPerWeekTarget: g.sessions_per_week_target,
      sessionMinutesTarget: g.session_minutes_target,
    })),
    constraints: (constraintRows ?? []).map((c) => ({
      type: c.type as UserConstraint['type'],
      bodyRegion: c.body_region as UserConstraint['bodyRegion'],
      exerciseId: c.exercise_id,
      equipmentId: c.equipment_id,
      severity: c.severity,
    })),
    // Una fila por ejercicio: la más reciente. La consulta viene ordenada, así
    // que la primera de cada ejercicio gana.
    baselines: dedupeByExercise(baselineRows ?? []),
  };
}

/** Baseline vigente de cada ejercicio: la más reciente de las registradas. */
export function dedupeByExercise(rows: readonly BaselineRow[]): UserBaseline[] {
  const seen = new Set<string>();
  const out: UserBaseline[] = [];

  for (const row of rows) {
    if (seen.has(row.exercise_id)) continue;
    seen.add(row.exercise_id);
    out.push({
      exerciseId: row.exercise_id,
      source: row.source,
      load: { value: row.load_value, unit: row.load_unit },
      reps: row.reps ?? 0,
      recordedAt: row.recorded_at,
    });
  }

  return out;
}

export interface BaselineRow {
  readonly exercise_id: string;
  readonly source: UserBaseline['source'];
  readonly load_value: number | null;
  readonly load_unit: LoadReading['unit'];
  readonly reps: number | null;
  readonly recorded_at: string;
}

/**
 * Guarda sesiones e ítems del plan ya insertado. Separado de `useGeneratePlan`
 * para que el `try/catch` de ahí pueda limpiar el `plans` huérfano si esto
 * falla a mitad de camino, sin mezclar esa lógica de rollback acá.
 */
async function persistSessions(
  client: SupabaseClient,
  planId: string,
  sessions: PlanBlueprint['sessions'],
): Promise<void> {
  const { data: sessionRows, error: sessionsError } = await client
    .from('plan_sessions')
    .insert(toPlanSessionInserts(planId, sessions))
    .select('id, sequence_index');
  if (sessionsError) throw sessionsError;

  const sessionIdBySequence = new Map(
    (sessionRows ?? []).map((s) => [s.sequence_index, s.id as string]),
  );

  for (const session of sessions) {
    const sessionId = sessionIdBySequence.get(session.sequenceIndex);
    if (!sessionId) continue; // no debería pasar: insertamos una fila por cada sesión

    const { error: itemsError } = await client
      .from('plan_session_items')
      .insert(toPlanSessionItemInserts(sessionId, session.items));
    if (itemsError) throw itemsError;
  }
}

/**
 * Guarda un blueprint en tres pasos (plan → sesiones → items), porque cada
 * tabla necesita el id que la anterior generó.
 *
 * `plans` tiene un índice único por socio con `status = 'active'`
 * (`05_plans.sql`): si sesiones o ítems fallan a mitad de camino, el `plans`
 * ya insertado no se limpiaba solo, y ese huérfano bloqueaba CUALQUIER
 * reintento futuro con un error de clave duplicada — sin ninguna pantalla
 * para borrarlo. Por eso, si algo falla después de crear el plan, se borra
 * acá mismo (`on delete cascade` se lleva sesiones/ítems si llegó a haber
 * alguno) antes de relanzar el error original.
 *
 * Exportada porque la vista previa guarda por el mismo camino: lo que se
 * confirma en pantalla es un blueprint igual al que arma el motor, y tener dos
 * formas de escribir un plan sería tener dos formas de romperlo.
 */
export async function persistBlueprint(
  client: SupabaseClient,
  userId: string,
  gymId: string,
  blueprint: PlanBlueprint,
  primaryGoal: UserSnapshot['goals'][number] | undefined,
): Promise<string> {
  const { data: plan, error: planError } = await client
    .from('plans')
    .insert(toPlanInsert(userId, gymId, blueprint, { ...primaryGoal }))
    .select('id')
    .single();
  if (planError) throw planError;

  try {
    await persistSessions(client, plan.id as string, blueprint.sessions);
  } catch (error) {
    await client.from('plans').delete().eq('id', plan.id);
    throw error;
  }

  return plan.id as string;
}

/**
 * Genera el plan con el motor y lo guarda de una. Sigue existiendo para el
 * botón "Generar mi plan" de "Hoy" — el camino de rescate de alguien que
 * terminó el onboarding sin confirmar la previa. El alta normal pasa por
 * `plan-preview.ts`.
 */
export function useGeneratePlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();

      const userSnapshot = await fetchUserSnapshot(client, user.id);
      const gymId = userSnapshot.profile.gymId;
      const { gym } = await fetchGymCatalog(client, gymId);

      const blueprint = engine.generatePlan({
        context: engineContext(user.id),
        user: userSnapshot,
        gym,
        ruleset: activeRuleset,
        daysSinceLastSession: await daysSinceLastSession(client, user.id),
      });

      return persistBlueprint(client, user.id, gymId, blueprint, userSnapshot.goals[0]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
    },
  });
}

/**
 * PEDIR LAS PRÓXIMAS SESIONES
 *
 * Terminar la cola era un callejón sin salida: la pantalla felicitaba y no
 * ofrecía nada. Esto arma el plan siguiente con el mismo motor.
 *
 * Lo importante es lo que se lleva puesto del plan que terminó: la carga
 * objetivo de cada ejercicio. Sin eso, alguien que entrenó ocho sesiones y
 * aceptó tres propuestas de subir carga volvería a arrancar de cero, y el
 * trabajo de la adaptación se perdería en el momento justo en que empieza a
 * servir. No es una regla de entrenamiento nueva: es seguir donde quedó.
 *
 * La base tiene un índice único de un plan activo por persona, así que el
 * anterior se archiva sí o sí. Se archiva DESPUÉS de tener el blueprint en la
 * mano y se desarchiva si la inserción falla: quedarse sin plan activo es
 * peor que no haber pedido nada.
 */
export function useRequestNextPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();

      const previousId = await activePlanId(client, user.id);
      const carried = previousId ? await carriedLoads(client, previousId) : new Map();
      // Rotar los ejercicios del bloque que terminó: el músculo trabaja en
      // ángulos distintos y se evita la lesión por sobreuso. Rotar dentro del
      // mismo bloque sería lo contrario — impediría medir si progresó.
      const previousExerciseIds = previousId ? await planExerciseIds(client, previousId) : [];

      const userSnapshot = await fetchUserSnapshot(client, user.id);
      const gymId = userSnapshot.profile.gymId;
      const { gym } = await fetchGymCatalog(client, gymId);
      const blueprint = engine.generatePlan({
        context: engineContext(user.id),
        user: userSnapshot,
        gym,
        ruleset: activeRuleset,
        previousExerciseIds,
        daysSinceLastSession: await daysSinceLastSession(client, user.id),
      });

      // Recién acá se archiva: si algo de lo de arriba fallaba, la persona se
      // quedaba sin plan activo y sin plan nuevo.
      await setPlanStatus(client, previousId, 'archived');

      try {
        const planId = await persistBlueprint(
          client,
          user.id,
          gymId,
          blueprint,
          userSnapshot.goals[0],
        );
        try {
          await applyCarriedLoads(client, planId, carried);
        } catch (error) {
          await client.from('plans').delete().eq('id', planId);
          throw error;
        }
        return planId;
      } catch (error) {
        await setPlanStatus(client, previousId, 'active');
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['proposals', user?.id] });
    },
  });
}

/**
 * Días desde la última serie registrada. El motor lo usa para arrancar más suave
 * cuando alguien vuelve después de mucho: la fuerza se retiene bien, pero el
 * tendón pierde tolerancia y es lo que se lastima al retomar con la carga vieja.
 *
 * Es best-effort: si la consulta falla, se devuelve `null` y el motor no ajusta
 * nada. No vale la pena frenar la generación del plan por esto.
 */
async function daysSinceLastSession(
  client: SupabaseClient,
  userId: string,
): Promise<number | null> {
  const { data, error } = await client
    .from('workout_logs')
    .select('started_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.started_at) return null;

  const last = Date.parse(data.started_at as string);
  if (Number.isNaN(last)) return null;
  return Math.floor((Date.now() - last) / 86_400_000);
}

/** Ejercicios que tenía el plan anterior, para rotarlos en el siguiente. */
async function planExerciseIds(client: SupabaseClient, planId: string): Promise<string[]> {
  const { data: sessions, error: sessionsError } = await client
    .from('plan_sessions')
    .select('id')
    .eq('plan_id', planId);
  if (sessionsError || !sessions?.length) return [];

  const { data: items, error: itemsError } = await client
    .from('plan_session_items')
    .select('exercise_id')
    .in(
      'plan_session_id',
      sessions.map((s) => s.id),
    );
  if (itemsError || !items) return [];

  return [...new Set(items.map((i) => i.exercise_id as string))];
}

export interface PlanSummary {
  readonly id: string;
  readonly templateId: string;
  readonly status: 'active' | 'archived';
  readonly generatedAt: string;
  readonly rulesetVersion: string;
  /** Sesiones totales y cuántas ya se completaron, para mostrar el avance. */
  readonly totalSessions: number;
  readonly completedSessions: number;
  /**
   * Con qué objetivo se generó, congelado al momento de generarlo. Es lo que
   * distingue dos planes guardados que si no se leerían igual: "cuerpo
   * completo A/B" armado para fuerza no es el mismo que armado para hipertrofia.
   */
  readonly goal: Goal | null;
  /** La sesión que toca si se retoma este plan. `null` si ya se completó entero. */
  readonly nextSessionLabel: string | null;
  /** Lo que el motor avisó al armarlo. Vacío casi siempre: solo se llena cuando hay algo real que decir. */
  readonly warnings: readonly string[];
}

/**
 * Todos los planes del socio, el activo primero. La regla dura sigue siendo
 * un plan `active` a la vez (la base tiene un índice único que lo garantiza:
 * `plans_one_active_per_user_idx`) — lo que esto habilita es guardar los que
 * ya no están activos en vez de perderlos, y poder volver a cualquiera.
 *
 * Es lo mismo que ya hacía `useRequestNextPlan` al archivar el plan viejo al
 * pedir el siguiente: esos archivados nunca se borraron, solo no había forma
 * de verlos ni de reactivarlos.
 */
export function usePlans() {
  const { user, status } = useAuth();

  return useQuery<PlanSummary[]>({
    queryKey: ['plans', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const { data: plans, error } = await client
        .from('plans')
        .select('id, template_id, status, generated_at, ruleset_version, goal_snapshot, warnings')
        .eq('user_id', user?.id as string)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      if (!plans || plans.length === 0) return [];

      const { data: sessions, error: sessionsError } = await client
        .from('plan_sessions')
        .select('plan_id, status, label, sequence_index')
        .in(
          'plan_id',
          plans.map((p) => p.id),
        )
        .order('sequence_index');
      if (sessionsError) throw sessionsError;

      const counts = countSessionsByPlan(sessions ?? []);

      return plans.map((p) => {
        const bucket = counts.get(p.id as string) ?? { total: 0, completed: 0, next: null };
        return {
          id: p.id as string,
          templateId: p.template_id as string,
          status: p.status as 'active' | 'archived',
          generatedAt: p.generated_at as string,
          rulesetVersion: p.ruleset_version as string,
          totalSessions: bucket.total,
          completedSessions: bucket.completed,
          goal: goalOf(p.goal_snapshot),
          nextSessionLabel: bucket.next,
          warnings: (p.warnings as string[] | null) ?? [],
        };
      });
    },
  });
}

interface SessionBucket {
  readonly total: number;
  readonly completed: number;
  /** Etiqueta de la primera sesión pendiente, o `null` si ya se completó entera. */
  readonly next: string | null;
}

/**
 * Cuántas sesiones tiene cada plan, cuántas ya se completaron, y cuál es la
 * próxima. Aparte de `usePlans` porque el bajo nivel de agregar filas de a una
 * (en vez de un `reduce` con el objeto entero) es lo que empujaba la
 * complejidad del hook por encima del límite del linter.
 */
function countSessionsByPlan(
  sessions: readonly { plan_id: unknown; status: unknown; label: unknown }[],
): Map<string, SessionBucket> {
  const counts = new Map<string, SessionBucket>();

  for (const row of sessions) {
    const planId = row.plan_id as string;
    const bucket = counts.get(planId) ?? { total: 0, completed: 0, next: null };
    // Las filas vienen ordenadas por `sequence_index`: la primera pendiente
    // que aparece es la que tocaría si se retoma este plan.
    const isNextPending = row.status === 'pending' && bucket.next === null;
    counts.set(planId, {
      total: bucket.total + 1,
      completed: bucket.completed + (row.status === 'completed' ? 1 : 0),
      next: isNextPending ? (row.label as string) : bucket.next,
    });
  }

  return counts;
}

/**
 * El objetivo con el que se generó el plan. `goal_snapshot` es jsonb: puede
 * venir de un plan viejo con otra forma, así que se lee defensivamente en vez
 * de confiar en el tipo.
 */
function goalOf(snapshot: unknown): Goal | null {
  if (typeof snapshot !== 'object' || snapshot === null) return null;
  const value = (snapshot as Record<string, unknown>).goal;
  return typeof value === 'string' ? (value as Goal) : null;
}

export interface PlanSessionSummary {
  readonly id: string;
  readonly sequenceIndex: number;
  readonly label: string;
  readonly focus: string;
  readonly estimatedMinutes: number;
  readonly status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  readonly completedAt: string | null;
  readonly exercises: readonly string[];
}

/**
 * Las sesiones de un plan, con los ejercicios de cada una. Se pide solo cuando
 * se abre un plan en la pantalla de planes: son dos consultas más y no tiene
 * sentido pagarlas por los planes que quedaron plegados.
 */
export function usePlanSessions(planId: string | null) {
  const { user, status } = useAuth();

  return useQuery<readonly PlanSessionSummary[]>({
    queryKey: ['plan-sessions', user?.id, planId],
    enabled: status === 'signed-in' && !!user && !!planId,
    queryFn: async () => {
      const client = requireSupabase();
      const { data: sessions, error } = await client
        .from('plan_sessions')
        .select('id, sequence_index, label, focus, estimated_minutes, status, completed_at')
        .eq('plan_id', planId as string)
        .order('sequence_index');
      if (error) throw error;
      if (!sessions || sessions.length === 0) return [];

      const { data: items, error: itemsError } = await client
        .from('plan_session_items')
        .select('plan_session_id, order_index, exercises(name)')
        .in(
          'plan_session_id',
          sessions.map((s) => s.id),
        )
        .order('order_index');
      if (itemsError) throw itemsError;

      const bySession = new Map<string, string[]>();
      for (const raw of (items ?? []) as unknown[]) {
        const row = raw as { plan_session_id: string; exercises: { name: string } | null };
        const list = bySession.get(row.plan_session_id) ?? [];
        list.push(row.exercises?.name ?? 'Ejercicio');
        bySession.set(row.plan_session_id, list);
      }

      return sessions.map((s) => ({
        id: s.id as string,
        sequenceIndex: s.sequence_index as number,
        label: s.label as string,
        focus: s.focus as string,
        estimatedMinutes: s.estimated_minutes as number,
        status: s.status as PlanSessionSummary['status'],
        completedAt: s.completed_at as string | null,
        exercises: bySession.get(s.id as string) ?? [],
      }));
    },
  });
}

/**
 * ACTIVAR UN PLAN GUARDADO
 *
 * "Guardado" y "deshabilitado" son el mismo estado (`archived`): un plan que
 * no es el de hoy pero que la persona quiere retomar. Esto lo vuelve a poner
 * activo, archivando el que estaba activo antes — nunca puede haber dos
 * activos, es el mismo índice único que usa `useRequestNextPlan`.
 *
 * Orden defensivo, mismo criterio que el resto de `plan.ts`: se archiva el
 * viejo primero y recién después se activa el elegido. Si el segundo paso
 * falla, se reactiva el que estaba antes — quedarse sin ningún plan activo es
 * peor que no haber cambiado nada.
 */
export function useActivatePlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();

      const currentActiveId = await activePlanId(client, user.id);
      if (currentActiveId === planId) return; // ya es el activo, no hay nada que hacer

      await setPlanStatus(client, currentActiveId, 'archived');
      try {
        await setPlanStatus(client, planId, 'active');
      } catch (error) {
        await setPlanStatus(client, currentActiveId, 'active');
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
    },
  });
}

async function activePlanId(client: SupabaseClient, userId: string): Promise<string | null> {
  const { data, error } = await client
    .from('plans')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return (data?.id as string) ?? null;
}

/** No-op si no había plan previo: el primer plan de alguien no archiva nada. */
async function setPlanStatus(
  client: SupabaseClient,
  planId: string | null,
  status: 'active' | 'archived',
): Promise<void> {
  if (!planId) return;
  const { error } = await client.from('plans').update({ status }).eq('id', planId);
  if (error) throw error;
}

/** La última carga objetivo de cada ejercicio en el plan que termina. */
async function carriedLoads(
  client: SupabaseClient,
  planId: string,
): Promise<Map<string, { value: number; unit: string }>> {
  const { data, error } = await client
    .from('plan_session_items')
    .select('exercise_id, target_load, target_load_unit, plan_sessions!inner(plan_id)')
    .eq('plan_sessions.plan_id', planId)
    .not('target_load', 'is', null);
  if (error) throw error;

  const out = new Map<string, { value: number; unit: string }>();
  for (const raw of data ?? []) {
    const row = raw as {
      exercise_id: string;
      target_load: number;
      target_load_unit: string | null;
    };
    // Sin unidad no se puede arrastrar: sería un número sin saber de qué.
    if (row.target_load_unit === null) continue;
    out.set(row.exercise_id, { value: row.target_load, unit: row.target_load_unit });
  }
  return out;
}

async function applyCarriedLoads(
  client: SupabaseClient,
  planId: string,
  carried: Map<string, { value: number; unit: string }>,
): Promise<void> {
  if (carried.size === 0) return;

  const { data: sessions, error } = await client
    .from('plan_sessions')
    .select('id')
    .eq('plan_id', planId);
  if (error) throw error;
  const sessionIds = (sessions ?? []).map((s) => s.id as string);
  if (sessionIds.length === 0) return;

  for (const [exerciseId, load] of carried) {
    const { error: applyError } = await client
      .from('plan_session_items')
      .update({ target_load: load.value, target_load_unit: load.unit })
      .eq('exercise_id', exerciseId)
      .in('plan_session_id', sessionIds);
    if (applyError) throw applyError;
  }
}

export interface ActiveSessionItem {
  readonly id: string;
  readonly exerciseId: string;
  readonly equipmentId: string | null;
  readonly name: string;
  /** Dónde está la estación, o `null` si el catálogo todavía no lo tiene cargado. */
  readonly sector: string | null;
  /** Patrón de movimiento y músculos: el ícono y el subtítulo de la fila salen de acá. */
  readonly pattern: MovementPattern;
  readonly primaryMuscles: readonly MuscleGroup[];
  /** Ya formateada tal como la máquina la muestra: nunca convertida. */
  readonly load: string;
  /** El mismo dato, crudo, para poder registrar la serie sin re-parsear el texto. */
  readonly targetLoad: LoadReading | null;
  /** La spec de carga de la estación, para normalizar a kg al registrar (nunca al mostrar). */
  readonly equipmentLoadSpec: EquipmentLoadSpec | null;
  readonly sets: number;
  readonly repsTarget: number;
  readonly reps: string;
  /** RIR prescripto para esta serie. Sale del ruleset, no del código. */
  readonly targetRir: number | null;
  readonly restSeconds: number;
  readonly rationale: string;
  readonly isPlaceholder: boolean;
  /**
   * Cardio: duración del bloque (o del trabajo de cada vuelta) y zona de
   * intensidad. Nulos en el trabajo de sala, que va por series y repeticiones.
   */
  readonly durationSeconds: number | null;
  readonly intensityZone: number | null;
  readonly intervalRestSeconds: number | null;
}

export interface ActiveSession {
  readonly planSessionId: string;
  readonly label: string;
  readonly focus: string;
  readonly items: readonly ActiveSessionItem[];
}

/**
 * Tres estados reales, no un `null` que los confunde a todos: "todavía no
 * generó ningún plan" pide un botón para generarlo; "generó uno pero
 * completó toda la cola" es otra cosa (no se resuelve regenerando a lo loco,
 * `plans` solo admite un plan activo por socio a la vez).
 */
export type ActivePlanState =
  | { readonly kind: 'no-plan' }
  | { readonly kind: 'queue-empty' }
  | {
      readonly kind: 'active';
      readonly session: ActiveSession;
      /** Lo que el motor avisó al armar ESTE plan, no esta sesión — vale mientras el plan siga activo. */
      readonly planWarnings: readonly string[];
    };

export function useActivePlan() {
  const { user, status } = useAuth();

  return useQuery<ActivePlanState>({
    queryKey: ['active-plan', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();

      const { data: plan, error: planError } = await client
        .from('plans')
        .select('id, warnings')
        .eq('user_id', user?.id as string)
        .eq('status', 'active')
        .maybeSingle();
      if (planError) throw planError;
      if (!plan) return { kind: 'no-plan' };

      const { data: session, error: sessionError } = await client
        .from('plan_sessions')
        .select('id, label, focus')
        .eq('plan_id', plan.id)
        .eq('status', 'pending')
        .order('sequence_index')
        .limit(1)
        .maybeSingle();
      if (sessionError) throw sessionError;
      if (!session) return { kind: 'queue-empty' };

      const { data: items, error: itemsError } = await client
        .from('plan_session_items')
        .select(
          'id, exercise_id, equipment_id, order_index, target_sets, target_reps_min, target_reps_max, target_rir, target_load, target_load_unit, rest_seconds, rationale, is_placeholder, target_duration_seconds, target_intensity_zone, target_interval_rest_seconds, exercises(name, pattern, primary_muscles), equipment(location_note, load_unit, load_min, load_max, load_increment, stack_kg, base_weight_kg)',
        )
        .eq('plan_session_id', session.id)
        .order('order_index');
      if (itemsError) throw itemsError;

      const activeSession: ActiveSession = {
        planSessionId: session.id,
        label: session.label,
        focus: session.focus,
        items: (items ?? []).map(toActiveSessionItem),
      };

      return {
        kind: 'active',
        session: activeSession,
        planWarnings: (plan.warnings as string[] | null) ?? [],
      };
    },
  });
}

interface PlanSessionItemRow {
  readonly id: string;
  readonly exercise_id: string;
  readonly equipment_id: string | null;
  readonly target_sets: number;
  readonly target_reps_min: number;
  readonly target_reps_max: number;
  readonly target_rir: number | null;
  readonly target_load: number | null;
  readonly target_load_unit: LoadReading['unit'] | null;
  readonly rest_seconds: number;
  readonly rationale: string;
  readonly is_placeholder: boolean;
  readonly target_duration_seconds: number | null;
  readonly target_intensity_zone: number | null;
  readonly target_interval_rest_seconds: number | null;
  readonly exercises: {
    name: string;
    pattern: MovementPattern;
    primary_muscles: MuscleGroup[] | null;
  } | null;
  readonly equipment: {
    location_note: string | null;
    load_unit: LoadReading['unit'];
    load_min: number | null;
    load_max: number | null;
    load_increment: number | null;
    stack_kg: number[] | null;
    base_weight_kg: number | null;
  } | null;
}

function toLoadSpec(equipment: PlanSessionItemRow['equipment']): EquipmentLoadSpec | null {
  if (!equipment) return null;
  return {
    unit: equipment.load_unit,
    ...(equipment.load_min !== null && { min: equipment.load_min }),
    ...(equipment.load_max !== null && { max: equipment.load_max }),
    ...(equipment.load_increment !== null && { increment: equipment.load_increment }),
    ...(equipment.stack_kg?.length && { stackKg: equipment.stack_kg }),
    ...(equipment.base_weight_kg !== null && { baseWeightKg: equipment.base_weight_kg }),
  };
}

function toActiveSessionItem(raw: unknown): ActiveSessionItem {
  const row = raw as PlanSessionItemRow;
  const targetLoad: LoadReading | null =
    row.target_load !== null && row.target_load_unit !== null
      ? { value: row.target_load, unit: row.target_load_unit }
      : null;

  return {
    id: row.id,
    exerciseId: row.exercise_id,
    equipmentId: row.equipment_id,
    name: row.exercises?.name ?? 'Ejercicio',
    sector: row.equipment?.location_note ?? null,
    pattern: row.exercises?.pattern ?? 'isolation',
    primaryMuscles: row.exercises?.primary_muscles ?? [],
    load: targetLoad ? formatLoad(targetLoad) : 'sin carga previa',
    targetLoad,
    equipmentLoadSpec: toLoadSpec(row.equipment),
    sets: row.target_sets,
    repsTarget: row.target_reps_max,
    reps: describeReps(row),
    targetRir: row.target_rir,
    restSeconds: row.rest_seconds,
    rationale: row.rationale,
    isPlaceholder: row.is_placeholder,
    durationSeconds: row.target_duration_seconds,
    intensityZone: row.target_intensity_zone,
    intervalRestSeconds: row.target_interval_rest_seconds,
  };
}

/**
 * Un bloque de cardio se lee en minutos, no en repeticiones: "40 min" o
 * "4 × 4 min". Mostrar "1-1 reps" en una cinta no le dice nada a nadie.
 */
function describeReps(row: PlanSessionItemRow): string {
  const duration = row.target_duration_seconds;
  if (duration === null) return `${row.target_reps_min}-${row.target_reps_max}`;

  const minutes = Math.round(duration / 60);
  if (row.target_interval_rest_seconds !== null) {
    const restMinutes = Math.round(row.target_interval_rest_seconds / 60);
    return `${row.target_sets} × ${minutes} min · ${restMinutes} min suave`;
  }
  return `${minutes} min`;
}
