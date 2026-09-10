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
  /**
   * Cómo le dice el socio a este plan. `null` cuando no eligió ninguno: la
   * pantalla cae al nombre del template en vez de inventarle uno.
   */
  readonly name: string | null;
  /** El objetivo con el que se generó, para poder mirarlo después sin releer `user_goals`. */
  readonly goal_snapshot: Record<string, unknown>;
  readonly status: 'active';
  /**
   * Lo que el motor avisó al armarlo (patrones sin cubrir, volumen semanal
   * corto). Antes vivía solo en memoria y se perdía apenas se guardaba el
   * plan — la vista previa lo mostraba una vez y no se podía volver a ver
   * mientras el socio entrenaba bajo ese plan. Regla dura 4: la evidencia se
   * muestra como es, y un hueco de volumen no dicho es mentir por omisión.
   */
  readonly warnings: readonly string[];
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
  /**
   * `null` en los ítems que cargó el socio a mano: no hay razón derivada del
   * ruleset que mostrar. El motor siempre escribe una.
   */
  readonly rationale: string | null;
  readonly is_placeholder: boolean;
  /** Cardio: duración del bloque (o del trabajo de cada vuelta) y zona. Nulos en sala. */
  readonly target_duration_seconds: number | null;
  readonly target_intensity_zone: number | null;
  readonly target_interval_rest_seconds: number | null;
}

export function toPlanInsert(
  userId: string,
  gymId: string,
  blueprint: PlanBlueprint,
  goalSnapshot: Record<string, unknown>,
  name?: string | null,
): PlanInsertRow {
  // Se guarda recortado o nulo, nunca en blanco: un nombre de espacios pasaría
  // el `check` de la tabla por poco y después habría que mostrar una tarjeta
  // con el título vacío.
  const limpio = name?.trim();
  return {
    user_id: userId,
    gym_id: gymId,
    ruleset_version: blueprint.rulesetVersion,
    template_id: blueprint.templateId,
    name: limpio ? limpio.slice(0, 60) : null,
    goal_snapshot: goalSnapshot,
    status: 'active',
    warnings: blueprint.warnings,
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
    target_duration_seconds: item.targetDurationSeconds,
    target_intensity_zone: item.targetIntensityZone,
    target_interval_rest_seconds: item.targetIntervalRestSeconds,
  }));
}
