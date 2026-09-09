import type { BodyRegion, ExperienceLevel, Goal, MuscleGroup, Sex } from '@bh/domain';

/**
 * NOMBRES EN CASTELLANO DE LOS ENUMS DEL DOMINIO
 *
 * Vivían triplicados: el onboarding tenía su copia, el cierre de sesión otra
 * para las zonas de molestia, y la nueva pantalla de perfil hubiera sido la
 * cuarta. Tres copias significan tres lugares donde corregir una traducción,
 * y ya divergían — el onboarding decía "Potencia / explosividad" en un lado.
 * Un solo lugar, y quien necesite ver el objetivo o el nivel de alguien (el
 * onboarding, el perfil, la previa del plan) lee de acá.
 */

export const GOAL_LABELS: Record<Goal, string> = {
  strength: 'Fuerza',
  hypertrophy: 'Hipertrofia',
  power: 'Potencia / explosividad',
  cardio: 'Cardio',
  endurance: 'Resistencia',
  recomposition: 'Recomposición corporal',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Principiante',
  novice: 'Novato',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

export const SEX_LABELS: Record<Sex, string> = {
  female: 'Femenino',
  male: 'Masculino',
  other: 'Otro',
  undisclosed: 'Prefiero no decir',
};

export const BODY_REGION_LABELS: Record<BodyRegion, string> = {
  neck: 'Cuello',
  shoulder: 'Hombro',
  elbow: 'Codo',
  wrist: 'Muñeca',
  upper_back: 'Espalda alta',
  lower_back: 'Zona lumbar',
  hip: 'Cadera',
  knee: 'Rodilla',
  ankle: 'Tobillo',
  other: 'Otra',
};

export const CONSTRAINT_TYPE_LABELS: Record<
  'injury' | 'pain' | 'avoid_exercise' | 'avoid_equipment',
  string
> = {
  injury: 'Lesión',
  pain: 'Molestia',
  avoid_exercise: 'Ejercicio descartado',
  avoid_equipment: 'Máquina descartada',
};

/**
 * REGIONES DEL CUERPO, PARA AGRUPAR LISTAS EN PANTALLA
 *
 * Los 18 grupos musculares del dominio son el vocabulario del motor y del
 * catálogo, y ahí está bien que sean 18. Para agrupar una lista de récords no
 * sirven: 18 secciones de una fila cada una es la misma lista larga con más
 * títulos.
 *
 * Estas seis regiones son **solo de presentación**. No entran al motor, no
 * deciden nada del plan y no son un número de entrenamiento: es cómo se ordena
 * una lista para poder recorrerla con el pulgar.
 */
export const MUSCLE_REGIONS = ['pierna', 'pecho', 'espalda', 'hombro', 'brazo', 'core'] as const;
export type MuscleRegion = (typeof MUSCLE_REGIONS)[number];

export const REGION_LABELS: Record<MuscleRegion, string> = {
  pierna: 'Pierna',
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombro: 'Hombro',
  brazo: 'Brazo',
  core: 'Core',
};

const REGION_BY_MUSCLE: Record<MuscleGroup, MuscleRegion> = {
  quads: 'pierna',
  hamstrings: 'pierna',
  glutes: 'pierna',
  calves: 'pierna',
  chest: 'pecho',
  back: 'espalda',
  lats: 'espalda',
  traps: 'espalda',
  front_delts: 'hombro',
  side_delts: 'hombro',
  rear_delts: 'hombro',
  biceps: 'brazo',
  triceps: 'brazo',
  forearms: 'brazo',
  abs: 'core',
  obliques: 'core',
  lower_back: 'core',
  // El cuerpo completo no es una región: cae en core porque es donde vive lo
  // que no se puede repartir (un `carry`, un remo con barra). Agregar una
  // séptima sección "Cuerpo completo" para dos ejercicios sería volver al
  // problema que esto resuelve.
  full_body: 'core',
};

/**
 * En qué región se agrupa un ejercicio, según su primer músculo primario.
 *
 * El primero y no todos: un ejercicio que toca cuádriceps y glúteos es
 * "pierna" una vez, no dos. Sin músculos declarados cae en `core`, que es
 * donde ya viven los que no se pueden repartir.
 */
export function regionOf(muscles: readonly MuscleGroup[]): MuscleRegion {
  const primero = muscles[0];
  return primero ? REGION_BY_MUSCLE[primero] : 'core';
}
