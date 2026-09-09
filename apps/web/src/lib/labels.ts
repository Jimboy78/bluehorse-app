import type { BodyRegion, ExperienceLevel, Goal, Sex } from '@bh/domain';

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
