import type { LoadReading } from '@bh/domain';
import { loadUnitSchema } from '@bh/domain';
import { z } from 'zod';

/**
 * Traducción de `set_logs`/`workout_logs` (lo que la persona hizo de verdad)
 * hacia lo que necesita la pantalla de Progreso, y la aritmética pura para
 * armar adherencia, volumen semanal y récords a partir de esas filas.
 *
 * Regla dura 5 (CLAUDE.md): un récord siempre muestra `load` cruda (lo que
 * decía la máquina). `loadKgNormalized` solo se usa para ELEGIR cuál serie es
 * el récord entre estaciones distintas — nunca para mostrarle un número al
 * usuario que la máquina no mostró.
 */

export const setLogRowSchema = z.object({
  id: z.uuid(),
  exercise_id: z.uuid(),
  load_value: z.coerce.number().nullable(),
  load_unit: loadUnitSchema,
  load_kg_normalized: z.coerce.number().nullable(),
  reps: z.number().int().nullable(),
  is_warmup: z.boolean(),
  completed_at: z.string(),
  exercises: z.object({ name: z.string() }).nullable(),
});
export type SetLogRow = z.infer<typeof setLogRowSchema>;

export const workoutLogRowSchema = z.object({
  id: z.uuid(),
  started_at: z.string(),
});
export type WorkoutLogRow = z.infer<typeof workoutLogRowSchema>;

export interface SetRecord {
  readonly id: string;
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly load: LoadReading;
  readonly loadKgNormalized: number | null;
  readonly reps: number | null;
  readonly isWarmup: boolean;
  readonly completedAt: string;
}

export function toSetRecord(row: SetLogRow): SetRecord {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercises?.name ?? 'Ejercicio',
    load: { value: row.load_value, unit: row.load_unit },
    loadKgNormalized: row.load_kg_normalized,
    reps: row.reps,
    isWarmup: row.is_warmup,
    completedAt: row.completed_at,
  };
}

export interface AdherenceSummary {
  readonly totalSessions: number;
  /** Días calendario consecutivos con al menos una sesión, terminando en la más reciente. */
  readonly currentStreakDays: number;
  readonly lastSessionAt: string | null;
}

/** Solo la fecha (UTC), como clave de día — la zona del gimnasio queda para cuando se formatee. */
function dayKeyUtc(iso: string): string {
  return iso.slice(0, 10);
}

export function computeAdherence(workoutLogs: readonly { startedAt: string }[]): AdherenceSummary {
  if (workoutLogs.length === 0) {
    return { totalSessions: 0, currentStreakDays: 0, lastSessionAt: null };
  }

  const sorted = [...workoutLogs].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const distinctDays = [...new Set(sorted.map((w) => dayKeyUtc(w.startedAt)))];

  let streak = 1;
  for (let i = 1; i < distinctDays.length; i++) {
    const previous = new Date(`${distinctDays[i - 1]}T00:00:00Z`);
    const current = new Date(`${distinctDays[i]}T00:00:00Z`);
    const diffDays = Math.round((previous.getTime() - current.getTime()) / 86_400_000);
    if (diffDays === 1) streak++;
    else break;
  }

  return {
    totalSessions: workoutLogs.length,
    currentStreakDays: streak,
    lastSessionAt: sorted[0]?.startedAt ?? null,
  };
}

export interface WeeklyVolumePoint {
  /** Lunes de esa semana ISO, UTC. */
  readonly weekStart: string;
  readonly volumeKg: number;
}

/** Lunes (UTC) de la semana ISO a la que pertenece esta fecha. */
function isoWeekStartUtc(iso: string): string {
  const date = new Date(`${dayKeyUtc(iso)}T00:00:00Z`);
  const isoDow = date.getUTCDay() === 0 ? 7 : date.getUTCDay(); // lunes=1 … domingo=7
  date.setUTCDate(date.getUTCDate() - (isoDow - 1));
  return dayKeyUtc(date.toISOString());
}

/**
 * Solo suma series que se pueden convertir a kg sin inventar nada
 * (`loadKgNormalized` no nulo) y con repeticiones registradas. Las demás
 * quedan afuera del volumen — no entran como 0, que falsearía el total.
 */
export function computeWeeklyVolume(sets: readonly SetRecord[]): WeeklyVolumePoint[] {
  const byWeek = new Map<string, number>();
  for (const set of sets) {
    if (set.isWarmup || set.loadKgNormalized === null || set.reps === null) continue;
    const week = isoWeekStartUtc(set.completedAt);
    byWeek.set(week, (byWeek.get(week) ?? 0) + set.loadKgNormalized * set.reps);
  }
  return [...byWeek.entries()]
    .map(([weekStart, volumeKg]) => ({ weekStart, volumeKg: Math.round(volumeKg * 10) / 10 }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export interface PersonalRecord {
  readonly exerciseId: string;
  readonly exerciseName: string;
  /** Cruda, tal como la mostró la máquina ese día — nunca convertida para mostrar. */
  readonly load: LoadReading;
  readonly reps: number | null;
  readonly achievedAt: string;
  /** `false` cuando no hubo forma de comparar entre series (sin kg normalizado): es la última serie registrada, no necesariamente la mejor. */
  readonly isRanked: boolean;
}

/**
 * Un récord por ejercicio. Compara por `loadKgNormalized` cuando existe (para
 * poder comparar entre estaciones distintas); si un ejercicio nunca tuvo una
 * serie convertible (banda, peso corporal, pin sin tabla), no inventa una
 * comparación — muestra la serie más reciente marcada como "sin comparar".
 */
export function computeRecords(sets: readonly SetRecord[]): PersonalRecord[] {
  const byExercise = new Map<string, SetRecord[]>();
  for (const set of sets) {
    if (set.isWarmup) continue;
    const list = byExercise.get(set.exerciseId) ?? [];
    list.push(set);
    byExercise.set(set.exerciseId, list);
  }

  const records: PersonalRecord[] = [];
  for (const [exerciseId, exerciseSets] of byExercise) {
    const rankable = exerciseSets.filter((s) => s.loadKgNormalized !== null);
    const best =
      rankable.length > 0
        ? rankable.reduce((a, b) => ((b.loadKgNormalized ?? 0) > (a.loadKgNormalized ?? 0) ? b : a))
        : [...exerciseSets].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
    if (!best) continue;
    records.push({
      exerciseId,
      exerciseName: best.exerciseName,
      load: best.load,
      reps: best.reps,
      achievedAt: best.completedAt,
      isRanked: rankable.length > 0,
    });
  }
  return records.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}
