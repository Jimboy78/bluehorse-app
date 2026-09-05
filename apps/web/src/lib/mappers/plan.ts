import type { LoadUnit, SessionStatus } from '@bh/domain';
import type { PlanBlueprint, SessionBlueprint, SessionItemBlueprint } from '@bh/engine';

/**
 * Traducción entre lo que devuelve el motor (`PlanBlueprint`, en memoria) y
 * las filas que van a `plans` / `plan_sessions` / `plan_session_items`.
 *
 * Tres tablas con FKs entre sí: la base genera los ids, así que esto se
 * inserta en tres pasos (plan → sesiones → items), no en un solo insert.
 * Ver `apps/web/src/lib/plan.ts` para el orden real contra Supabase.
 */

export interface PlanInsertRow {
  readonly user_id: string;
  readonly gym_id: string;
  readonly ruleset_version: string;
  readonly template_id: string;
  /** El objetivo con el que se generó, para poder mirarlo después sin releer `user_goals`. */
  readonly goal_snapshot: Record<string, unknown>;
  readonly status: 'active';
}

export interface PlanSessionInsertRow {
  readonly plan_id: string;
  readonly sequence_index: number;
  readonly label: string;
  readonly focus: string;
  readonly estimated_minutes: number;
  readonly status: SessionStatus;
}

export interface PlanSessionItemInsertRow {
  readonly plan_session_id: string;
  readonly order_index: number;
  readonly exercise_id: string;
  readonly equipment_id: string | null;
  readonly target_sets: number;
  readonly target_reps_min: number;
  readonly target_reps_max: number;
  readonly target_load: number | null;
  readonly target_load_unit: LoadUnit | null;
  readonly target_rir: number | null;
  readonly rest_seconds: number;
  readonly rationale: string;
  readonly is_placeholder: boolean;
}

export function toPlanInsert(
  userId: string,
  gymId: string,
  blueprint: PlanBlueprint,
  goalSnapshot: Record<string, unknown>,
): PlanInsertRow {
  return {
    user_id: userId,
    gym_id: gymId,
    ruleset_version: blueprint.rulesetVersion,
    template_id: blueprint.templateId,
    goal_snapshot: goalSnapshot,
    status: 'active',
  };
}

export function toPlanSessionInserts(
  planId: string,
  sessions: readonly SessionBlueprint[],
): PlanSessionInsertRow[] {
  return sessions.map((s) => ({
    plan_id: planId,
    sequence_index: s.sequenceIndex,
    label: s.label,
    focus: s.focus,
    estimated_minutes: s.estimatedMinutes,
    status: 'pending',
  }));
}

export function toPlanSessionItemInserts(
  planSessionId: string,
  items: readonly SessionItemBlueprint[],
): PlanSessionItemInsertRow[] {
  return items.map((item) => ({
    plan_session_id: planSessionId,
    order_index: item.orderIndex,
    exercise_id: item.exerciseId,
    equipment_id: item.equipmentId,
    target_sets: item.targetSets,
    target_reps_min: item.targetRepsMin,
    target_reps_max: item.targetRepsMax,
    target_load: item.targetLoad?.value ?? null,
    target_load_unit: item.targetLoad?.unit ?? null,
    target_rir: item.targetRir,
    rest_seconds: item.restSeconds,
    rationale: item.rationale,
    is_placeholder: item.isPlaceholder,
  }));
}
