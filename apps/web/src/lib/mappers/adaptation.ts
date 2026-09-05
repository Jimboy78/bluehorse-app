import type { AdaptationProposal, SetLog } from '@bh/domain';
import { loadUnitSchema, proposalStatusSchema, proposalTypeSchema } from '@bh/domain';
import type { ProposalBlueprint } from '@bh/engine';
import { z } from 'zod';

/**
 * Traducción entre `adaptation_proposals`/`set_logs` (snake_case, Supabase) y
 * lo que consume/produce el motor (camelCase). El motor solo propone
 * (`ProposalBlueprint`, sin id ni estado) — acá se decide cómo eso se
 * convierte en una fila real, y cómo una fila real vuelve a ser algo que el
 * motor puede leer como `resolvedProposals`.
 */

export const setLogHistoryRowSchema = z.object({
  id: z.uuid(),
  plan_session_item_id: z.uuid().nullable(),
  exercise_id: z.uuid(),
  equipment_id: z.uuid().nullable(),
  set_index: z.number().int(),
  load_value: z.coerce.number().nullable(),
  // Nula cuando no hubo carga que anotar. Antes esto era obligatorio: una
  // sola serie sin unidad hacía explotar el zod, la query de propuestas
  // quedaba en error, y la pantalla no mostraba nada — indistinguible de
  // "no hay propuestas".
  load_unit: loadUnitSchema.nullable(),
  load_kg_normalized: z.coerce.number().nullable(),
  reps: z.number().int().nullable(),
  reps_target: z.number().int().nullable(),
  rir: z.number().int().nullable(),
  duration_seconds: z.number().int().nullable(),
  distance_meters: z.coerce.number().nullable(),
  rest_prescribed_seconds: z.number().int().nullable(),
  rest_actual_seconds: z.number().int().nullable(),
  is_warmup: z.boolean(),
  completed_at: z.string(),
  client_id: z.string(),
  workout_log_id: z.uuid(),
});
export type SetLogHistoryRow = z.infer<typeof setLogHistoryRowSchema>;

export function toSetLog(row: SetLogHistoryRow): SetLog {
  return {
    id: row.id,
    workoutLogId: row.workout_log_id,
    planSessionItemId: row.plan_session_item_id,
    exerciseId: row.exercise_id,
    equipmentId: row.equipment_id,
    setIndex: row.set_index,
    load: row.load_unit === null ? null : { value: row.load_value, unit: row.load_unit },
    loadKg: row.load_kg_normalized,
    reps: row.reps,
    repsTarget: row.reps_target,
    rir: row.rir,
    durationSeconds: row.duration_seconds,
    distanceMeters: row.distance_meters,
    restPrescribedSeconds: row.rest_prescribed_seconds,
    restActualSeconds: row.rest_actual_seconds,
    isWarmup: row.is_warmup,
    completedAt: row.completed_at,
    clientId: row.client_id,
  };
}

export const proposalRowSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  plan_id: z.uuid(),
  type: proposalTypeSchema,
  target_ref: z.record(z.string(), z.string()),
  from_value: z.string().nullable(),
  to_value: z.string().nullable(),
  reason_code: z.string(),
  reason_text: z.string(),
  ruleset_version: z.string(),
  status: proposalStatusSchema,
});
export type ProposalRow = z.infer<typeof proposalRowSchema>;

export function toAdaptationProposal(row: ProposalRow): AdaptationProposal {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    type: row.type,
    targetRef: row.target_ref,
    fromValue: row.from_value,
    toValue: row.to_value,
    reasonCode: row.reason_code,
    reasonText: row.reason_text,
    rulesetVersion: row.ruleset_version,
    status: row.status,
  };
}

/** Lo que el motor propuso (`ProposalBlueprint`) todavía no tiene id ni estado: se lo da la base al insertarlo. */
export function toProposalInsert(userId: string, planId: string, blueprint: ProposalBlueprint) {
  return {
    user_id: userId,
    plan_id: planId,
    type: blueprint.type,
    target_ref: blueprint.targetRef,
    from_value: blueprint.fromValue,
    to_value: blueprint.toValue,
    reason_code: blueprint.reasonCode,
    reason_text: blueprint.reasonText,
    ruleset_version: blueprint.rulesetVersion,
  };
}
