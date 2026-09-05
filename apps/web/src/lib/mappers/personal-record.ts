/**
 * Traducción hacia `personal_records`. Hoy solo se detecta `max_load`: la
 * serie con más `load_kg_normalized` para ese ejercicio. `max_reps`,
 * `max_volume` y `est_1rm` quedan para cuando haga falta — la tabla ya los
 * admite (`07_adaptation.sql`), pero inventar esa lógica sin necesidad real
 * es peor que no tenerla.
 */

export interface PersonalRecordInsertRow {
  readonly user_id: string;
  readonly exercise_id: string;
  readonly type: 'max_load';
  readonly value: number;
  readonly set_log_id: string;
  readonly achieved_at: string;
}

export function toPersonalRecordInsert(
  userId: string,
  exerciseId: string,
  value: number,
  setLogId: string,
  achievedAt: string,
): PersonalRecordInsertRow {
  return {
    user_id: userId,
    exercise_id: exerciseId,
    type: 'max_load',
    value,
    set_log_id: setLogId,
    achieved_at: achievedAt,
  };
}
