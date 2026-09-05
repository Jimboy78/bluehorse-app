import type { EquipmentLoadSpec, ExperienceLevel, LoadReading, Sex } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import type { UserSnapshot } from '@bh/engine';
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

async function fetchUserSnapshot(client: SupabaseClient, userId: string): Promise<UserSnapshot> {
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
 * Genera el plan con el motor y lo persiste en tres pasos (plan → sesiones →
 * items), porque cada tabla necesita el id que la anterior generó. Falla
 * entero si cualquier paso falla — un plan a medio guardar es peor que nada.
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

      const { data: sessions, error: sessionsError } = await client
        .from('plan_sessions')
        .insert(toPlanSessionInserts(plan.id, blueprint.sessions))
        .select('id, sequence_index');
      if (sessionsError) throw sessionsError;

      const sessionIdBySequence = new Map(
        (sessions ?? []).map((s) => [s.sequence_index, s.id as string]),
      );

      for (const session of blueprint.sessions) {
        const sessionId = sessionIdBySequence.get(session.sequenceIndex);
        if (!sessionId) continue; // no debería pasar: insertamos una fila por cada sesión

        const { error: itemsError } = await client
          .from('plan_session_items')
          .insert(toPlanSessionItemInserts(sessionId, session.items));
        if (itemsError) throw itemsError;
      }

      return plan.id as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
    },
  });
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
          'id, exercise_id, equipment_id, order_index, target_sets, target_reps_min, target_reps_max, target_load, target_load_unit, rest_seconds, rationale, is_placeholder, exercises(name), equipment(location_note, load_unit, load_min, load_max, load_increment, stack_kg, base_weight_kg)',
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
    restSeconds: row.rest_seconds,
    rationale: row.rationale,
    isPlaceholder: row.is_placeholder,
  };
}
