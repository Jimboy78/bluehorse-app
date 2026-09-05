import type { EquipmentLoadSpec, ExperienceLevel, LoadReading, Sex } from '@bh/domain';
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
    constraints: [],
    baselines: [],
  };
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
 * Genera el plan con el motor y lo persiste en tres pasos (plan → sesiones →
 * items), porque cada tabla necesita el id que la anterior generó.
 *
 * `plans` tiene un índice único por socio con `status = 'active'`
 * (`05_plans.sql`): si sesiones o ítems fallan a mitad de camino, el `plans`
 * ya insertado no se limpiaba solo, y ese huérfano bloqueaba CUALQUIER
 * reintento futuro con un error de clave duplicada — sin ninguna pantalla
 * para borrarlo. Por eso, si algo falla después de crear el plan, se borra
 * acá mismo (`on delete cascade` se lleva sesiones/ítems si llegó a haber
 * alguno) antes de relanzar el error original.
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
      });

      const primaryGoal = userSnapshot.goals[0];
      const { data: plan, error: planError } = await client
        .from('plans')
        .insert(toPlanInsert(user.id, gymId, blueprint, { ...primaryGoal }))
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
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
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

      const userSnapshot = await fetchUserSnapshot(client, user.id);
      const gymId = userSnapshot.profile.gymId;
      const { gym } = await fetchGymCatalog(client, gymId);
      const blueprint = engine.generatePlan({
        context: engineContext(user.id),
        user: userSnapshot,
        gym,
        ruleset: activeRuleset,
      });

      // Recién acá se archiva: si algo de lo de arriba fallaba, la persona se
      // quedaba sin plan activo y sin plan nuevo.
      await setPlanStatus(client, previousId, 'archived');

      try {
        const planId = await insertPlan(client, user.id, gymId, blueprint, userSnapshot.goals[0]);
        try {
          await persistSessions(client, planId, blueprint.sessions);
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
      void queryClient.invalidateQueries({ queryKey: ['proposals', user?.id] });
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

async function insertPlan(
  client: SupabaseClient,
  userId: string,
  gymId: string,
  blueprint: PlanBlueprint,
  primaryGoal: UserSnapshot['goals'][number] | undefined,
): Promise<string> {
  const { data, error } = await client
    .from('plans')
    .insert(toPlanInsert(userId, gymId, blueprint, { ...primaryGoal }))
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
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
  readonly sector: string;
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
  | { readonly kind: 'active'; readonly session: ActiveSession };

export function useActivePlan() {
  const { user, status } = useAuth();

  return useQuery<ActivePlanState>({
    queryKey: ['active-plan', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();

      const { data: plan, error: planError } = await client
        .from('plans')
        .select('id')
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
          'id, exercise_id, equipment_id, order_index, target_sets, target_reps_min, target_reps_max, target_rir, target_load, target_load_unit, rest_seconds, rationale, is_placeholder, exercises(name), equipment(location_note, load_unit, load_min, load_max, load_increment, stack_kg, base_weight_kg)',
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

      return { kind: 'active', session: activeSession };
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
  readonly exercises: { name: string } | null;
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
    sector: row.equipment?.location_note ?? 'sin ubicación',
    load: targetLoad ? formatLoad(targetLoad) : 'sin carga previa',
    targetLoad,
    equipmentLoadSpec: toLoadSpec(row.equipment),
    sets: row.target_sets,
    repsTarget: row.target_reps_max,
    reps: `${row.target_reps_min}-${row.target_reps_max}`,
    targetRir: row.target_rir,
    restSeconds: row.rest_seconds,
    rationale: row.rationale,
    isPlaceholder: row.is_placeholder,
  };
}
