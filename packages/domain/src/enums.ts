/**
 * Enums del dominio. Espejo de los tipos enumerados de la base
 * (`supabase/schemas/`). Si cambia uno, cambian los dos.
 */

export const GOALS = [
  'strength',
  'hypertrophy',
  'power',
  'cardio',
  'endurance',
  'recomposition',
] as const;
export type Goal = (typeof GOALS)[number];

export const EXPERIENCE_LEVELS = ['beginner', 'novice', 'intermediate', 'advanced'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const SEXES = ['female', 'male', 'other', 'undisclosed'] as const;
export type Sex = (typeof SEXES)[number];

/** Patrones de movimiento. Es el vocabulario que comparten el research y el catálogo. */
export const MOVEMENT_PATTERNS = [
  'squat',
  'hinge',
  'lunge',
  'horizontal_push',
  'horizontal_pull',
  'vertical_push',
  'vertical_pull',
  'carry',
  'core',
  'isolation',
  'cardio',
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];

/** Cómo se registra un ejercicio. Define qué campos de `set_logs` se completan. */
export const MODALITIES = ['reps_weight', 'reps_bodyweight', 'time', 'distance'] as const;
export type Modality = (typeof MODALITIES)[number];

export const EQUIPMENT_CATEGORIES = [
  'selectorized',
  'plate_loaded',
  'free_weight',
  'rack',
  'cardio',
  'bodyweight',
  'accessory',
] as const;
export type EquipmentCategory = (typeof EQUIPMENT_CATEGORIES)[number];

/**
 * Unidad en la que se lee la carga EN LA MÁQUINA. Es propiedad de cada estación,
 * no del usuario ni de la app: Blue Horse mezcla kg, lb y pines en la misma sala.
 */
export const LOAD_UNITS = [
  'kg',
  'lb',
  'stack_level',
  'plates_kg',
  'plates_lb',
  'band',
  'bodyweight',
  'none',
] as const;
export type LoadUnit = (typeof LOAD_UNITS)[number];

export const MUSCLE_GROUPS = [
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'chest',
  'back',
  'lats',
  'traps',
  'front_delts',
  'side_delts',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'lower_back',
  'full_body',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const BODY_REGIONS = [
  'neck',
  'shoulder',
  'elbow',
  'wrist',
  'upper_back',
  'lower_back',
  'hip',
  'knee',
  'ankle',
  'other',
] as const;
export type BodyRegion = (typeof BODY_REGIONS)[number];

export const SESSION_STATUSES = ['pending', 'in_progress', 'completed', 'skipped'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const PROPOSAL_TYPES = [
  'load_increase',
  'load_decrease',
  'deload',
  'swap_exercise',
  'volume_change',
] as const;
export type ProposalType = (typeof PROPOSAL_TYPES)[number];

export const PROPOSAL_STATUSES = ['pending', 'accepted', 'rejected', 'expired'] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

/** De dónde salieron los números de entrenamiento. Ver regla dura 3 en CLAUDE.md. */
export const RULESET_SOURCES = ['placeholder', 'research'] as const;
export type RulesetSource = (typeof RULESET_SOURCES)[number];

export const BASELINE_SOURCES = ['declared', 'calibrated', 'estimated'] as const;
export type BaselineSource = (typeof BASELINE_SOURCES)[number];
