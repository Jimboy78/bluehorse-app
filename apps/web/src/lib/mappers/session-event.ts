/**
 * Traducción hacia `session_events`. Es el registro de por qué una sesión se
 * desvió del plan — hoy solo "sustituido por máquina ocupada", pero el
 * esquema ya admite `reordered`/`skipped_exercise` para cuando haga falta.
 * A los seis meses, esto es un dato que se le puede mostrar al gimnasio
 * ("esta máquina está siempre ocupada a las 19").
 */

export interface SubstitutionEventInsertRow {
  /** Generado por el cliente, como en workout_logs/set_logs: permite reintentar por la cola
   * offline sin duplicar (la tabla no tiene una columna client_id propia; el `id` cumple ese rol). */
  readonly id: string;
  readonly workout_log_id: string;
  readonly type: 'substituted';
  readonly payload: {
    readonly plan_session_item_id: string;
    readonly from_exercise_id: string;
    readonly to_exercise_id: string;
    readonly from_equipment_id: string | null;
    readonly to_equipment_id: string | null;
  };
  readonly occurred_at: string;
}

export function toSubstitutionEvent(
  id: string,
  workoutLogId: string,
  planSessionItemId: string,
  fromExerciseId: string,
  toExerciseId: string,
  fromEquipmentId: string | null,
  toEquipmentId: string | null,
  occurredAt: string,
): SubstitutionEventInsertRow {
  return {
    id,
    workout_log_id: workoutLogId,
    type: 'substituted',
    payload: {
      plan_session_item_id: planSessionItemId,
      from_exercise_id: fromExerciseId,
      to_exercise_id: toExerciseId,
      from_equipment_id: fromEquipmentId,
      to_equipment_id: toEquipmentId,
    },
    occurred_at: occurredAt,
  };
}
