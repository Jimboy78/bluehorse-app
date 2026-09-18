import type { BodyRegion, Goal, MovementPattern, MuscleGroup } from '@bh/domain';

/**
 * Las palabras con que el motor nombra músculos, zonas, patrones y objetivos en
 * los avisos. Viven en el motor y no se importan de `apps/web/src/lib/labels.ts`
 * porque la flecha de dependencias va en un solo sentido.
 */

export const MUSCLE_LABELS: Readonly<Record<MuscleGroup, string>> = {
  quads: 'cuádriceps',
  hamstrings: 'isquiotibiales',
  glutes: 'glúteos',
  calves: 'gemelos',
  chest: 'pecho',
  back: 'espalda',
  lats: 'dorsales',
  traps: 'trapecios',
  front_delts: 'hombro anterior',
  side_delts: 'hombro lateral',
  rear_delts: 'hombro posterior',
  biceps: 'bíceps',
  triceps: 'tríceps',
  forearms: 'antebrazos',
  abs: 'abdominales',
  obliques: 'oblicuos',
  lower_back: 'lumbares',
  full_body: 'cuerpo completo',
};

export function muscleLabel(muscle: MuscleGroup): string {
  return MUSCLE_LABELS[muscle] ?? muscle;
}

export const REGION_LABELS: Readonly<Record<BodyRegion, string>> = {
  neck: 'el cuello',
  shoulder: 'el hombro',
  elbow: 'el codo',
  wrist: 'la muñeca',
  upper_back: 'la espalda alta',
  lower_back: 'la zona lumbar',
  hip: 'la cadera',
  knee: 'la rodilla',
  ankle: 'el tobillo',
  other: 'la zona que marcaste',
};

export function regionLabel(region: BodyRegion): string {
  return REGION_LABELS[region] ?? 'la zona que marcaste';
}

/**
 * El patrón de movimiento en castellano.
 *
 * Mismo caso que `GOAL_LABELS` acá abajo, y que a los objetivos ya les había
 * pasado: el aviso de patrón sin cubrir interpolaba `slot.pattern` crudo, así
 * que el socio leía `el patrón "vertical_pull"` — el identificador interno, en
 * inglés y entrecomillado. No era un caso de borde: cuatro de los 33 planes del
 * reporte lo mostraban, y los dos con lesión lo tienen siempre, porque sacar un
 * patrón entero es justamente lo que dispara ese aviso.
 *
 * Las palabras son las mismas que usa `PATTERN_LABELS` en la app, en minúscula
 * porque acá van en medio de una oración. Que la insignia del ejercicio y el
 * aviso digan cosas distintas del mismo patrón es peor que no traducir.
 */
export const PATTERN_LABELS: Readonly<Record<MovementPattern, string>> = {
  squat: 'sentadilla',
  hinge: 'bisagra de cadera',
  lunge: 'zancada',
  horizontal_push: 'empuje horizontal',
  horizontal_pull: 'tirón horizontal',
  vertical_push: 'empuje vertical',
  vertical_pull: 'tirón vertical',
  carry: 'traslado',
  core: 'zona media',
  isolation: 'aislamiento',
  cardio: 'cardio',
  mobility: 'movilidad',
  balance: 'equilibrio',
  impact: 'impacto',
};

export function patternLabel(pattern: MovementPattern): string {
  return PATTERN_LABELS[pattern] ?? pattern;
}

/**
 * El objetivo en castellano.
 *
 * Los `warnings` del motor se muestran tal cual en la tarjeta del plan, así
 * que un `goal.goal` interpolado crudo le dejaba al socio `el objetivo
 * "hypertrophy"`: el identificador interno, en inglés y entrecomillado.
 *
 * Va acá al lado de `muscleLabel` y `regionLabel` y no se importa de
 * `apps/web/src/lib/labels.ts` porque la flecha de dependencias va en un solo
 * sentido: el motor no conoce la app.
 */
export const GOAL_LABELS: Readonly<Record<Goal, string>> = {
  strength: 'fuerza',
  hypertrophy: 'hipertrofia',
  power: 'potencia',
  cardio: 'cardio',
  endurance: 'resistencia',
  recomposition: 'recomposición corporal',
};

export function goalLabel(goal: Goal): string {
  return GOAL_LABELS[goal] ?? goal;
}

/** "1 sesión" / "3 sesiones". Un socio puede elegir entrenar una vez por semana. */
export function sesiones(cantidad: number): string {
  return cantidad === 1 ? '1 sesión' : `${cantidad} sesiones`;
}
