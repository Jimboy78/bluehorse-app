import type { EquipmentLoadSpec, LoadReading, LoadUnit } from '@bh/domain';
import { toKg } from '@bh/domain';

/**
 * Traducción hacia `workout_logs` / `set_logs`. Estas dos filas se escriben
 * mientras el socio está parado en el gimnasio, así que sus `id` los genera
 * el cliente (no la base): eso es lo que permite encolarlas en la cola
 * offline y que un `set_log` referencie a su `workout_log` sin haber hecho
 * ida y vuelta al servidor todavía. Ver `apps/web/src/lib/session-log.ts`.
 */

export interface WorkoutLogInsertRow {
  readonly id: string;
  readonly user_id: string;
  readonly plan_session_id: string;
  readonly started_at: string;
  readonly client_id: string;
}

export function toWorkoutLogInsert(
  id: string,
  userId: string,
  planSessionId: string,
  clientId: string,
  startedAt: string,
): WorkoutLogInsertRow {
  return {
    id,
    user_id: userId,
    plan_session_id: planSessionId,
    started_at: startedAt,
    client_id: clientId,
  };
}

export interface SetLogInsertRow {
  readonly id: string;
  readonly workout_log_id: string;
  readonly plan_session_item_id: string;
  readonly exercise_id: string;
  readonly equipment_id: string | null;
  readonly set_index: number;
  readonly load_value: number | null;
  readonly load_unit: LoadUnit | null;
  readonly load_kg_normalized: number | null;
  readonly reps: number | null;
  readonly reps_target: number;
  readonly rir: number | null;
  readonly rest_prescribed_seconds: number;
  readonly rest_actual_seconds: number;
  readonly is_warmup: boolean;
  readonly completed_at: string;
  readonly client_id: string;
}

export interface SetLogItemInput {
  readonly planSessionItemId: string;
  readonly exerciseId: string;
  readonly equipmentId: string | null;
  readonly targetLoad: LoadReading | null;
  readonly equipmentLoadSpec: EquipmentLoadSpec | null;
  readonly repsTarget: number;
  readonly restPrescribedSeconds: number;
}

/**
 * Lo que efectivamente pasó en la serie. Es la mitad que le faltaba a
 * `set_logs`: sin esto se guardaba el objetivo del plan como si fuera el
 * resultado, y el motor terminaba comparando el plan contra sí mismo.
 */
export interface SetActual {
  /** Repeticiones hechas de verdad. */
  readonly reps: number;
  /** Cuántas más podría haber hecho. `null` si no lo dijo. */
  readonly rir: number | null;
}

export function toSetLogInsert(
  id: string,
  workoutLogId: string,
  item: SetLogItemInput,
  setIndex: number,
  restActualSeconds: number,
  clientId: string,
  completedAt: string,
  actual: SetActual,
): SetLogInsertRow {
  return {
    id,
    workout_log_id: workoutLogId,
    plan_session_item_id: item.planSessionItemId,
    exercise_id: item.exerciseId,
    equipment_id: item.equipmentId,
    set_index: setIndex,
    // La carga sigue saliendo del plan: todavía no hay campo para corregirla
    // si el socio usó otra. Las repeticiones y el RIR, en cambio, ya son lo
    // que pasó de verdad (se preguntan durante el descanso).
    load_value: item.targetLoad?.value ?? null,
    load_unit: item.targetLoad?.unit ?? null,
    load_kg_normalized:
      item.targetLoad && item.equipmentLoadSpec
        ? toKg(item.targetLoad, item.equipmentLoadSpec)
        : null,
    reps: actual.reps,
    reps_target: item.repsTarget,
    rir: actual.rir,
    rest_prescribed_seconds: item.restPrescribedSeconds,
    rest_actual_seconds: restActualSeconds,
    is_warmup: false,
    completed_at: completedAt,
    client_id: clientId,
  };
}
