import type { LoadReading } from '@bh/domain';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import type { ManualItemDraft, ManualSessionDraft } from './mappers/manual-plan.ts';
import {
  manualItemDraftSchema,
  manualSessionDraftSchema,
  nextIndex,
  toManualItemInsert,
  toManualPlanInsert,
  toManualSessionInsert,
} from './mappers/manual-plan.ts';
import { requireSupabase } from './supabase.ts';

/**
 * ARMAR UN PLAN A MANO
 *
 * El motor arma el plan entero de una: pide el objetivo, mira el catálogo y
 * devuelve la cola completa. Eso sirve cuando la persona quiere que la app
 * decida. No sirve cuando ya sabe lo que quiere hacer, o cuando lo que quiere
 * es cargar hoy el día de piernas y el resto la semana que viene.
 *
 * Acá el plan crece de a pedazos, y **cada escritura es una sola fila**: no
 * hay un blueprint que persistir en tres pasos como en `plan.ts`, así que
 * tampoco hace falta el rollback de aquel camino. Si falla agregar un
 * ejercicio, lo que ya estaba sigue estando.
 *
 * Lo que este archivo NO hace, a propósito:
 *
 * - **No propone nada.** Ni series, ni repeticiones, ni descanso, ni carga. Un
 *   valor por defecto sugerido acá sería un número de entrenamiento naciendo
 *   en el código (regla dura 3), y encima uno sin ninguna fila de
 *   investigación detrás.
 * - **No revisa el plan.** El motor avisa cuando falta cubrir un patrón o
 *   cuando el volumen semanal queda corto; un plan manual no pasa por ese
 *   control y la pantalla lo dice. Ver `docs/adr/0007-planes-a-mano.md`.
 */

/** El plan manual arranca vacío y guardado. Se activa desde la lista cuando ya tiene un día. */
export function useCreateManualPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (name) => {
      if (!user) throw new Error('No hay sesión activa.');
      if (!name.trim()) throw new Error('Poné un nombre para reconocer el plan.');
      const client = requireSupabase();

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;

      const { data, error } = await client
        .from('plans')
        .insert(toManualPlanInsert(user.id, profile.gym_id, name))
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
    },
  });
}

/** Los índices de cola ya usados en un plan, para saber cuál es el próximo libre. */
async function usedSessionIndexes(client: SupabaseClient, planId: string): Promise<number[]> {
  const { data, error } = await client
    .from('plan_sessions')
    .select('sequence_index')
    .eq('plan_id', planId);
  if (error) throw error;
  return (data ?? []).map((row) => row.sequence_index);
}

async function usedItemIndexes(client: SupabaseClient, sessionId: string): Promise<number[]> {
  const { data, error } = await client
    .from('plan_session_items')
    .select('order_index')
    .eq('plan_session_id', sessionId);
  if (error) throw error;
  return (data ?? []).map((row) => row.order_index);
}

export function useAddManualSession(planId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<string, Error, ManualSessionDraft>({
    mutationFn: async (draft) => {
      if (!planId) throw new Error('No hay plan al que agregarle el día.');
      const parsed = manualSessionDraftSchema.parse(draft);
      const client = requireSupabase();

      const indice = nextIndex(await usedSessionIndexes(client, planId));
      const { data, error } = await client
        .from('plan_sessions')
        .insert(toManualSessionInsert(planId, indice, parsed))
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => invalidatePlan(queryClient, user?.id, planId),
  });
}

export function useRemoveManualSession(planId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (sessionId) => {
      const client = requireSupabase();
      // Los ítems se van solos por `on delete cascade`.
      const { error } = await client.from('plan_sessions').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => invalidatePlan(queryClient, user?.id, planId),
  });
}

export function useAddManualItem(planId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, { sessionId: string; draft: ManualItemDraft }>({
    mutationFn: async ({ sessionId, draft }) => {
      const parsed = manualItemDraftSchema.parse(draft);
      const client = requireSupabase();

      const indice = nextIndex(await usedItemIndexes(client, sessionId));
      const { error } = await client
        .from('plan_session_items')
        .insert(toManualItemInsert(sessionId, indice, parsed));
      if (error) throw error;
    },
    onSuccess: () => invalidatePlan(queryClient, user?.id, planId),
  });
}

export function useRemoveManualItem(planId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (itemId) => {
      const client = requireSupabase();
      const { error } = await client.from('plan_session_items').delete().eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => invalidatePlan(queryClient, user?.id, planId),
  });
}

/**
 * Después de tocar un plan hay tres consultas que quedaron viejas: la lista de
 * planes (cambió el conteo de sesiones), el detalle que se está editando, y el
 * plan activo — este último porque el plan que se edita puede ser el que la
 * persona tiene activo, y "Hoy" estaría mostrando la sesión anterior.
 */
function invalidatePlan(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  planId: string | null,
): void {
  void queryClient.invalidateQueries({ queryKey: ['plans', userId] });
  void queryClient.invalidateQueries({ queryKey: ['manual-plan', userId, planId] });
  void queryClient.invalidateQueries({ queryKey: ['plan-sessions', userId, planId] });
  void queryClient.invalidateQueries({ queryKey: ['active-plan', userId] });
}

export interface ManualPlanItem {
  readonly id: string;
  readonly orderIndex: number;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly equipmentName: string | null;
  readonly targetSets: number;
  readonly targetRepsMin: number;
  readonly targetRepsMax: number;
  readonly targetLoad: LoadReading | null;
  readonly targetRir: number | null;
  readonly restSeconds: number;
}

export interface ManualPlanSession {
  readonly id: string;
  readonly sequenceIndex: number;
  readonly label: string;
  readonly focus: string;
  readonly estimatedMinutes: number;
  readonly status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  readonly items: readonly ManualPlanItem[];
}

export interface ManualPlanDetail {
  readonly id: string;
  readonly name: string | null;
  readonly status: 'active' | 'archived';
  readonly origin: 'engine' | 'manual';
  readonly sessions: readonly ManualPlanSession[];
}

/**
 * El plan que se está editando, con todo adentro.
 *
 * Es una consulta aparte de `usePlanSessions` porque acá hacen falta los
 * números de cada ejercicio para poder editarlos, y esa otra solo trae los
 * nombres para la lista plegada. Pedir los números en la pantalla de planes
 * sería pagarlos en todos los planes para usarlos en ninguno.
 */
export function useManualPlan(planId: string | null) {
  const { user, status } = useAuth();

  return useQuery<ManualPlanDetail | null>({
    // `status` primero: con la sesión sin resolver la query queda deshabilitada
    // y `isPending` no se apaga nunca (la trampa de CLAUDE.md).
    enabled: status === 'signed-in' && !!user && !!planId,
    queryKey: ['manual-plan', user?.id, planId],
    queryFn: async () => {
      const client = requireSupabase();
      const { data: plan, error } = await client
        .from('plans')
        .select('id, name, status, origin')
        .eq('id', planId as string)
        .maybeSingle();
      if (error) throw error;
      if (!plan) return null;

      return {
        id: plan.id,
        name: plan.name ?? null,
        status: plan.status as 'active' | 'archived',
        origin: plan.origin as 'engine' | 'manual',
        sessions: await fetchManualSessions(client, plan.id),
      };
    },
  });
}

async function fetchManualSessions(
  client: SupabaseClient,
  planId: string,
): Promise<ManualPlanSession[]> {
  const { data: sessions, error } = await client
    .from('plan_sessions')
    .select('id, sequence_index, label, focus, estimated_minutes, status')
    .eq('plan_id', planId)
    .order('sequence_index');
  if (error) throw error;
  if (!sessions || sessions.length === 0) return [];

  const { data: items, error: itemsError } = await client
    .from('plan_session_items')
    .select(
      'id, plan_session_id, order_index, exercise_id, target_sets, target_reps_min, target_reps_max, target_load, target_load_unit, target_rir, rest_seconds, exercises(name), equipment(name)',
    )
    .in(
      'plan_session_id',
      sessions.map((s) => s.id),
    )
    .order('order_index');
  if (itemsError) throw itemsError;

  const bySession = groupItems(items ?? []);

  return sessions.map((s) => ({
    id: s.id,
    sequenceIndex: s.sequence_index,
    label: s.label,
    focus: s.focus,
    estimatedMinutes: s.estimated_minutes,
    status: s.status as ManualPlanSession['status'],
    items: bySession.get(s.id) ?? [],
  }));
}

interface RawManualItem {
  readonly id: string;
  readonly plan_session_id: string;
  readonly order_index: number;
  readonly exercise_id: string;
  readonly target_sets: number;
  readonly target_reps_min: number;
  readonly target_reps_max: number;
  readonly target_load: number | null;
  readonly target_load_unit: LoadReading['unit'] | null;
  readonly target_rir: number | null;
  readonly rest_seconds: number;
  readonly exercises: { name: string } | null;
  readonly equipment: { name: string } | null;
}

function groupItems(rows: readonly unknown[]): Map<string, ManualPlanItem[]> {
  const bySession = new Map<string, ManualPlanItem[]>();

  for (const raw of rows) {
    const row = raw as RawManualItem;
    const lista = bySession.get(row.plan_session_id) ?? [];
    lista.push({
      id: row.id,
      orderIndex: row.order_index,
      exerciseId: row.exercise_id,
      exerciseName: row.exercises?.name ?? 'Ejercicio',
      equipmentName: row.equipment?.name ?? null,
      targetSets: row.target_sets,
      targetRepsMin: row.target_reps_min,
      targetRepsMax: row.target_reps_max,
      // La carga se rearma cruda: valor y unidad como los lee la máquina
      // (regla dura 6). Sin unidad no hay lectura que mostrar.
      targetLoad: row.target_load_unit
        ? { value: row.target_load, unit: row.target_load_unit }
        : null,
      targetRir: row.target_rir,
      restSeconds: row.rest_seconds,
    });
    bySession.set(row.plan_session_id, lista);
  }

  return bySession;
}
