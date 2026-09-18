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
  /** Días entrenados en la seguidilla actual, sin contar descansos. Ver `computeAdherence`. */
  readonly currentStreakDays: number;
  readonly lastSessionAt: string | null;
}

export interface AdherenceContext {
  /** Días que el socio marcó como descanso, `YYYY-MM-DD` del gimnasio. */
  readonly restDays: readonly string[];
  /** La frecuencia que declaró en su objetivo. `null` si no tiene uno. */
  readonly sessionsPerWeekTarget: number | null;
  /** Hoy, `YYYY-MM-DD` del gimnasio. Por parámetro para que la función no lea el reloj. */
  readonly today: string;
}

const DIAS_DE_LA_SEMANA = 7;

/**
 * LA RACHA NO SE CORTA POR DESCANSAR
 *
 * Antes contaba días calendario seguidos con sesión: quien entrena lunes,
 * miércoles y viernes —que es exactamente lo que el plan le pide— nunca
 * pasaba de 1. Y un sábado sin entrenar le borraba la semana entera.
 *
 * Ahora cuenta días ENTRENADOS en una seguidilla que no se cortó, y un día
 * sin sesión no la corta si:
 *
 * - el socio lo marcó como descanso, o
 * - entra en los descansos que su propia frecuencia le deja: quien declaró N
 *   sesiones por semana tiene 7 − N días libres en cualquier ventana de siete.
 *   El número no es de la app, es del socio.
 *
 * Lally et al. 2010 (doi 10.1002/ejsp.674), 96 personas durante 12 semanas:
 * faltar una oportunidad no afectó de forma material la formación del hábito,
 * pero la constancia sí predijo el ajuste. Una falta suelta no es un corte;
 * faltar más de lo que el plan prevé, sí.
 *
 * El descanso declarado consume el cupo igual que el inferido, pero nunca
 * corta: si el socio dice que descansó, descansó. Y no suma a la racha —
 * la racha cuenta entrenamientos, no días que pasaron.
 *
 * Hoy sin sesión no corta nada: el día no terminó.
 */
export function computeAdherence(
  workoutLogs: readonly { startedAt: string }[],
  context: AdherenceContext,
): AdherenceSummary {
  if (workoutLogs.length === 0) {
    return { totalSessions: 0, currentStreakDays: 0, lastSessionAt: null };
  }

  // Por instante, no por texto: dos ISO del mismo momento se escriben distinto.
  const sorted = [...workoutLogs].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  // Por día del gimnasio, no por día UTC: ver `lib/gym-time.ts`. Lunes 22:00 y
  // martes 10:00 de acá son el mismo día allá, y la racha se comía uno.
  const entrenados = new Set(sorted.map((w) => diaDelGimnasio(w.startedAt)));
  const declarados = new Set(context.restDays);
  const cupo =
    context.sessionsPerWeekTarget === null
      ? 0
      : Math.max(0, DIAS_DE_LA_SEMANA - context.sessionsPerWeekTarget);
  const primero = [...entrenados].reduce((a, b) => (diasEntre(a, b) < 0 ? a : b));

  // Índice k = el día `hoy - k`, hasta la primera sesión que hay en la historia.
  const dias: string[] = [];
  for (let k = 0; diasEntre(sumarDias(context.today, -k), primero) >= 0; k++) {
    dias.push(sumarDias(context.today, -k));
  }
  const pendiente = (k: number) =>
    k === 0 && !entrenados.has(context.today) && !declarados.has(context.today);
  const libre = (k: number) => !pendiente(k) && !entrenados.has(dias[k] as string);

  let racha = 0;
  for (let k = 0; k < dias.length; k++) {
    const dia = dias[k] as string;
    if (entrenados.has(dia)) {
      racha++;
      continue;
    }
    if (pendiente(k) || declarados.has(dia)) continue;
    if (sePasaDelCupo(k, dias.length, libre, cupo)) break;
  }

  return {
    totalSessions: workoutLogs.length,
    currentStreakDays: racha,
    lastSessionAt: sorted[0]?.startedAt ?? null,
  };
}

/**
 * Si alguna ventana de siete días que contiene el día `k` tiene más días libres
 * que el cupo. Todas, no solo la que arranca en `k`: los descansos marcados
 * antes de la falta también gastan el cupo.
 */
function sePasaDelCupo(
  k: number,
  total: number,
  libre: (j: number) => boolean,
  cupo: number,
): boolean {
  for (let inicio = k; inicio < k + DIAS_DE_LA_SEMANA; inicio++) {
    let enLaVentana = 0;
    for (let j = Math.min(inicio, total - 1); j > inicio - DIAS_DE_LA_SEMANA && j >= 0; j--) {
      if (libre(j)) enLaVentana++;
    }
    if (enLaVentana > cupo) return true;
  }
  return false;
}

function sumarDias(clave: string, dias: number): string {
  const fecha = new Date(`${clave}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
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
