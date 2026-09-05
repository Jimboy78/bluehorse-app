import type { AdaptationProposal } from '@bh/domain';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { fetchGymCatalog } from './catalog.ts';
import { activeRuleset, engine, engineContext } from './engine.ts';
import {
  proposalRowSchema,
  setLogHistoryRowSchema,
  toAdaptationProposal,
  toProposalInsert,
  toSetLog,
} from './mappers/adaptation.ts';
import { fetchUserSnapshot } from './plan.ts';
import { requireSupabase } from './supabase.ts';

/**
 * PROPUESTAS DE AJUSTE — "el motor propone, el usuario confirma" (CLAUDE.md,
 * comentario de `07_adaptation.sql`). El motor nunca escribe directo: solo
 * devuelve `ProposalBlueprint[]`, acá se insertan como filas `pending` y el
 * socio decide.
 *
 * No se vuelve a correr `reviewProgress()` si ya hay propuestas pendientes:
 * evita duplicar la misma propuesta en cada visita a la pantalla.
 */

const HISTORY_LIMIT = 200;

export function usePendingProposals() {
  const { user, status } = useAuth();

  return useQuery<readonly AdaptationProposal[]>({
    queryKey: ['proposals', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const userId = user?.id as string;

      const { data: planRow, error: planError } = await client
        .from('plans')
        .select('id, ruleset_version, generated_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
      if (planError) throw planError;
      if (!planRow) return [];

      const { data: pendingRows, error: pendingError } = await client
        .from('adaptation_proposals')
        .select(
          'id, user_id, plan_id, type, target_ref, from_value, to_value, load_unit, reason_code, reason_text, ruleset_version, status',
        )
        .eq('plan_id', planRow.id)
        .eq('status', 'pending');
      if (pendingError) throw pendingError;

      const pending = (pendingRows ?? []).map((raw) =>
        toAdaptationProposal(proposalRowSchema.parse(raw)),
      );
      if (pending.length > 0) return pending;

      return generateProposals(client, userId, planRow.id);
    },
  });
}

async function generateProposals(
  client: SupabaseClient,
  userId: string,
  planId: string,
): Promise<readonly AdaptationProposal[]> {
  const { data: resolvedRows, error: resolvedError } = await client
    .from('adaptation_proposals')
    .select(
      'id, user_id, plan_id, type, target_ref, from_value, to_value, load_unit, reason_code, reason_text, ruleset_version, status',
    )
    .eq('plan_id', planId)
    .neq('status', 'pending');
  if (resolvedError) throw resolvedError;
  const resolvedProposals = (resolvedRows ?? []).map((raw) =>
    toAdaptationProposal(proposalRowSchema.parse(raw)),
  );

  const { data: workoutRows, error: workoutError } = await client
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId);
  if (workoutError) throw workoutError;
  const workoutLogIds = (workoutRows ?? []).map((w) => w.id as string);
  if (workoutLogIds.length === 0) return [];

  const { data: setRows, error: setError } = await client
    .from('set_logs')
    .select(
      'id, plan_session_item_id, exercise_id, equipment_id, set_index, load_value, load_unit, load_kg_normalized, reps, reps_target, rir, duration_seconds, distance_meters, rest_prescribed_seconds, rest_actual_seconds, is_warmup, completed_at, client_id, workout_log_id',
    )
    .in('workout_log_id', workoutLogIds)
    .order('completed_at', { ascending: false })
    .limit(HISTORY_LIMIT);
  if (setError) throw setError;
  const history = (setRows ?? []).map((raw) => toSetLog(setLogHistoryRowSchema.parse(raw)));
  if (history.length === 0) return [];

  const userSnapshot = await fetchUserSnapshot(client, userId);
  const { gym } = await fetchGymCatalog(client, userSnapshot.profile.gymId);

  const { data: planRow, error: planError } = await client
    .from('plans')
    .select('id, user_id, gym_id, ruleset_version, generated_at, status')
    .eq('id', planId)
    .single();
  if (planError) throw planError;

  const blueprints = engine.reviewProgress({
    context: engineContext(userId),
    user: userSnapshot,
    gym,
    plan: {
      id: planRow.id,
      userId: planRow.user_id,
      gymId: planRow.gym_id,
      rulesetVersion: planRow.ruleset_version,
      generatedAt: planRow.generated_at,
      status: planRow.status,
    },
    history,
    resolvedProposals,
    ruleset: activeRuleset,
  });
  if (blueprints.length === 0) return [];

  const { data: inserted, error: insertError } = await client
    .from('adaptation_proposals')
    .insert(blueprints.map((b) => toProposalInsert(userId, planId, b)))
    .select(
      'id, user_id, plan_id, type, target_ref, from_value, to_value, load_unit, reason_code, reason_text, ruleset_version, status',
    );
  if (insertError) throw insertError;

  return (inserted ?? []).map((raw) => toAdaptationProposal(proposalRowSchema.parse(raw)));
}

export interface ResolveProposalInput {
  readonly proposal: AdaptationProposal;
  readonly accept: boolean;
}

/**
 * Ejercicios cuyas sesiones pendientes (`plan_sessions.status = 'pending'`)
 * hay que ajustar. Separado de `useResolveProposal` para no tener un `await`
 * anidado dentro de un `.in(...)`.
 */
async function applyLoadChange(
  client: SupabaseClient,
  planId: string,
  exerciseId: string,
  targetLoad: number,
): Promise<void> {
  const { data: pendingSessions, error: sessionsError } = await client
    .from('plan_sessions')
    .select('id')
    .eq('plan_id', planId)
    .eq('status', 'pending');
  if (sessionsError) throw sessionsError;

  const pendingSessionIds = (pendingSessions ?? []).map((s) => s.id as string);
  if (pendingSessionIds.length === 0) return;

  // La unidad va junto con el número, siempre. Guardar `target_load` sin
  // `target_load_unit` deja un 20 que no se sabe si son kilos, libras o un
  // nivel de pin: es la misma incoherencia que el check de `set_logs`
  // prohíbe, y acá se colaba porque el update solo tocaba el valor.
  const { data: items, error: itemsError } = await client
    .from('plan_session_items')
    .select('id, equipment(load_unit)')
    .eq('exercise_id', exerciseId)
    .in('plan_session_id', pendingSessionIds);
  if (itemsError) throw itemsError;

  for (const raw of items ?? []) {
    const item = raw as unknown as {
      id: string;
      equipment: { load_unit: string } | { load_unit: string }[] | null;
    };
    // PostgREST devuelve la relación como objeto o como array de uno según
    // cómo infiera la cardinalidad; acá siempre es una sola estación.
    const equipment = Array.isArray(item.equipment) ? item.equipment[0] : item.equipment;
    const { error: applyError } = await client
      .from('plan_session_items')
      .update({ target_load: targetLoad, target_load_unit: equipment?.load_unit ?? null })
      .eq('id', item.id);
    if (applyError) throw applyError;
  }
}

/**
 * Aceptar `load_increase`/`load_decrease` también actualiza la carga
 * objetivo de las sesiones pendientes de ese ejercicio en el plan — si no,
 * "aceptar" no cambiaría nada la próxima vez que aparezca ese ejercicio.
 * `deload` solo se resuelve: repartir el volumen reducido entre sesiones
 * pendientes queda para cuando haga falta, no se inventa acá.
 *
 * La carga se aplica ANTES de marcar la propuesta como resuelta, no después:
 * si `applyLoadChange` fallara con la propuesta ya en `accepted`, quedaría
 * resuelta para siempre (deja de aparecer en `usePendingProposals`) sin que
 * el cambio de carga se haya aplicado nunca — inconsistencia silenciosa, sin
 * forma de reintentar desde la UI.
 */
export function useResolveProposal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposal, accept }: ResolveProposalInput) => {
      const client = requireSupabase();
      const now = new Date().toISOString();

      const exerciseId = proposal.targetRef.exerciseId;
      const isLoadChange = proposal.type === 'load_increase' || proposal.type === 'load_decrease';
      if (accept && isLoadChange && exerciseId && proposal.toValue !== null) {
        await applyLoadChange(client, proposal.planId, exerciseId, Number(proposal.toValue));
      }

      const { error: updateError } = await client
        .from('adaptation_proposals')
        .update({ status: accept ? 'accepted' : 'rejected', resolved_at: now })
        .eq('id', proposal.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['proposals', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
    },
  });
}
