import type { BodyRegion } from '@bh/domain';

/**
 * Traducción hacia el cierre de sesión: actualizar `workout_logs`, marcar
 * `plan_sessions` como completada (así la cola avanza a la siguiente) y,
 * opcionalmente, una fila de `pain_reports`.
 */

export type SessionFeel = 'easy' | 'right' | 'hard';

export interface WorkoutLogCloseRow {
  readonly ended_at: string;
  readonly session_feel: SessionFeel;
  readonly notes: string | null;
}

export function toWorkoutLogClose(
  feel: SessionFeel,
  notes: string,
  endedAt: string,
): WorkoutLogCloseRow {
  return {
    ended_at: endedAt,
    session_feel: feel,
    notes: notes.trim() || null,
  };
}

export interface PlanSessionCompleteRow {
  readonly status: 'completed';
  readonly completed_at: string;
}

export function toPlanSessionComplete(completedAt: string): PlanSessionCompleteRow {
  return { status: 'completed', completed_at: completedAt };
}

export interface PainReportInsertRow {
  readonly user_id: string;
  readonly workout_log_id: string | null;
  readonly body_region: BodyRegion;
  readonly severity: number;
  readonly note: string | null;
  readonly reported_at: string;
}

export function toPainReportInsert(
  userId: string,
  workoutLogId: string | null,
  bodyRegion: BodyRegion,
  severity: number,
  reportedAt: string,
): PainReportInsertRow {
  return {
    user_id: userId,
    workout_log_id: workoutLogId,
    body_region: bodyRegion,
    severity,
    note: null,
    reported_at: reportedAt,
  };
}
