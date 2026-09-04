import type { Equipment, Exercise, Profile, UserGoal } from '@bh/domain';
import type { GymSnapshot, UserSnapshot } from '@bh/engine';

/**
 * GIMNASIO Y SOCIO DE EJEMPLO — no es Blue Horse.
 *
 * El relevamiento real del gimnasio (Fase 0 del roadmap) todavía no está
 * cargado: por instrucción explícita, el desarrollo no se detiene a
 * esperarlo. Esta fixture existe para poder ejercitar el motor de verdad
 * (mismo código que va a correr contra el catálogo real) mientras tanto.
 *
 * Todo acá lleva el prefijo "Ejemplo —" a propósito: que nunca se confunda
 * con equipamiento real cuando el catálogo de Blue Horse se cargue. El día
 * que eso pase, este archivo deja de usarse — no hace falta borrar nada a
 * mano, `apps/web/src/lib/engine.ts` deja de importarlo.
 */

const PLACEHOLDER_GYM_ID = '00000000-0000-4000-8000-0000000000ee';

function equipment(id: string, name: string, over: Partial<Equipment> = {}): Equipment {
  return {
    id,
    gymId: PLACEHOLDER_GYM_ID,
    name: `Ejemplo — ${name}`,
    category: 'selectorized',
    brand: null,
    model: null,
    photoUrl: null,
    locationNote: 'ubicación de ejemplo',
    setupNotes: null,
    load: { unit: 'kg', min: 10, max: 150, increment: 5 },
    quantity: 1,
    isActive: true,
    ...over,
  };
}

function exercise(id: string, name: string, over: Partial<Exercise> = {}): Exercise {
  return {
    id,
    gymId: PLACEHOLDER_GYM_ID,
    name: `Ejemplo — ${name}`,
    pattern: 'squat',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    modality: 'reps_weight',
    isCompound: true,
    isUnilateral: false,
    skillLevel: 'beginner',
    cues: null,
    equipmentIds: [],
    ...over,
  };
}

const eqPrensa = equipment('eq-ph-01', 'Prensa 45°');
const eqPress = equipment('eq-ph-02', 'Press de banco', {
  load: { unit: 'lb', min: 20, max: 200, increment: 10 },
});
const eqRemo = equipment('eq-ph-03', 'Remo sentado', {
  load: {
    unit: 'stack_level',
    min: 1,
    max: 12,
    increment: 1,
    stackKg: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
  },
});
const eqHombro = equipment('eq-ph-04', 'Press de hombro');
const eqColchoneta = equipment('eq-ph-05', 'Colchoneta', {
  category: 'accessory',
  load: { unit: 'none' },
});
const eqMancuernas = equipment('eq-ph-06', 'Mancuernas', {
  category: 'free_weight',
  load: { unit: 'kg', min: 2, max: 30, increment: 2 },
});

export const PLACEHOLDER_GYM: GymSnapshot = {
  gymId: PLACEHOLDER_GYM_ID,
  equipment: [eqPrensa, eqPress, eqRemo, eqHombro, eqColchoneta, eqMancuernas],
  exercises: [
    exercise('ex-ph-01', 'Prensa 45°', { pattern: 'squat', equipmentIds: [eqPrensa.id] }),
    exercise('ex-ph-02', 'Press de banco', {
      pattern: 'horizontal_push',
      primaryMuscles: ['chest'],
      equipmentIds: [eqPress.id],
    }),
    exercise('ex-ph-03', 'Remo sentado', {
      pattern: 'horizontal_pull',
      primaryMuscles: ['back'],
      equipmentIds: [eqRemo.id],
    }),
    exercise('ex-ph-04', 'Press de hombro', {
      pattern: 'vertical_push',
      primaryMuscles: ['front_delts'],
      equipmentIds: [eqHombro.id],
    }),
    exercise('ex-ph-05', 'Plancha', {
      pattern: 'core',
      primaryMuscles: ['abs'],
      modality: 'time',
      isCompound: false,
      equipmentIds: [eqColchoneta.id],
    }),
    exercise('ex-ph-06', 'Peso muerto rumano', {
      pattern: 'hinge',
      primaryMuscles: ['hamstrings', 'glutes'],
      equipmentIds: [eqPrensa.id],
    }),
    exercise('ex-ph-07', 'Dorsalera al pecho', {
      pattern: 'vertical_pull',
      primaryMuscles: ['lats'],
      equipmentIds: [eqRemo.id],
    }),
    exercise('ex-ph-08', 'Zancadas', {
      pattern: 'lunge',
      primaryMuscles: ['quads', 'glutes'],
      equipmentIds: [eqPrensa.id],
    }),
    exercise('ex-ph-09', 'Curl de bíceps', {
      pattern: 'isolation',
      primaryMuscles: ['biceps'],
      isCompound: false,
      equipmentIds: [eqMancuernas.id],
    }),
  ],
  substitutions: [],
};

const placeholderProfile: Profile = {
  id: 'user-ejemplo',
  gymId: PLACEHOLDER_GYM_ID,
  displayName: 'Socio de ejemplo',
  birthDate: '1994-05-10',
  sex: 'undisclosed',
  experienceLevel: 'intermediate',
};

const placeholderGoal: UserGoal = {
  goal: 'hypertrophy',
  sport: null,
  priority: 1,
  sessionsPerWeekTarget: 3,
  sessionMinutesTarget: 60,
};

export const PLACEHOLDER_USER: UserSnapshot = {
  profile: placeholderProfile,
  goals: [placeholderGoal],
  constraints: [],
  baselines: [],
};
