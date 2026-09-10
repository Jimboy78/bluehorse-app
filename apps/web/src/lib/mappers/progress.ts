import type { LoadReading, MuscleGroup } from '@bh/domain';
import { loadUnitSchema, muscleGroupSchema } from '@bh/domain';
import { z } from 'zod';
import { diaDelGimnasio, diasEntre, lunesDeLaSemana } from '../gym-time.ts';

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
  // Nula cuando todavía no se sabe con cuánto entrena la persona y la
  // estación tampoco está en el catálogo: no hay unidad que anotar sin
  // inventarla. Distinto de la unidad 'none', que sí afirma algo (esta
  // estación no lleva carga).
  load_unit: loadUnitSchema.nullable(),
  load_kg_normalized: z.coerce.number().nullable(),
  reps: z.number().int().nullable(),
  // Repeticiones en reserva declaradas al cerrar la serie. `null` cuando no
  // lo dijo — es lo mismo que ya lee `reviewProgress()` para proponer subir
  // o bajar carga; hasta acá el socio nunca veía su propia tendencia.
  rir: z.number().int().nullable(),
  is_warmup: z.boolean(),
  completed_at: z.string(),
  // `primary_muscles` viaja para poder agrupar los récords por región del
  // cuerpo. Sin esto la lista era una sola columna alfabética de N ejercicios,
  // que crece con el catálogo y no se puede recorrer con el pulgar.
  exercises: z
    .object({ name: z.string(), primary_muscles: z.array(muscleGroupSchema).nullable() })
    .nullable(),
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
  /** Para agrupar en pantalla. Vacío si el ejercicio no los declara. */
  readonly primaryMuscles: readonly MuscleGroup[];
  /** `null` cuando no se registró ninguna unidad: no hay lectura que mostrar. */
  readonly load: LoadReading | null;
  readonly loadKgNormalized: number | null;
  readonly reps: number | null;
  readonly rir: number | null;
  readonly isWarmup: boolean;
  readonly completedAt: string;
}

export function toSetRecord(row: SetLogRow): SetRecord {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercises?.name ?? 'Ejercicio',
    primaryMuscles: row.exercises?.primary_muscles ?? [],
    load: row.load_unit === null ? null : { value: row.load_value, unit: row.load_unit },
    loadKgNormalized: row.load_kg_normalized,
    reps: row.reps,
    rir: row.rir,
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

export function computeAdherence(workoutLogs: readonly { startedAt: string }[]): AdherenceSummary {
  if (workoutLogs.length === 0) {
    return { totalSessions: 0, currentStreakDays: 0, lastSessionAt: null };
  }

  const sorted = [...workoutLogs].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  // Por día del gimnasio, no por día UTC: ver `lib/gym-time.ts`. Lunes 22:00 y
  // martes 10:00 de acá son el mismo día allá, y la racha se comía uno.
  const distinctDays = [...new Set(sorted.map((w) => diaDelGimnasio(w.startedAt)))];

  let streak = 1;
  for (let i = 1; i < distinctDays.length; i++) {
    const anterior = distinctDays[i - 1] as string;
    const actual = distinctDays[i] as string;
    if (diasEntre(anterior, actual) === 1) streak++;
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

/**
 * Solo suma series que se pueden convertir a kg sin inventar nada
 * (`loadKgNormalized` no nulo) y con repeticiones registradas. Las demás
 * quedan afuera del volumen — no entran como 0, que falsearía el total.
 */
export function computeWeeklyVolume(sets: readonly SetRecord[]): WeeklyVolumePoint[] {
  const byWeek = new Map<string, number>();
  for (const set of sets) {
    if (set.isWarmup || set.loadKgNormalized === null || set.reps === null) continue;
    // El domingo a la noche de acá ya es lunes en UTC: sin esto esa sesión
    // se sumaba a la barra de la semana siguiente.
    const week = lunesDeLaSemana(diaDelGimnasio(set.completedAt));
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
  readonly load: LoadReading | null;
  readonly reps: number | null;
  readonly achievedAt: string;
  readonly primaryMuscles: readonly MuscleGroup[];
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
      primaryMuscles: best.primaryMuscles,
      isRanked: rankable.length > 0,
    });
  }
  return records.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}
