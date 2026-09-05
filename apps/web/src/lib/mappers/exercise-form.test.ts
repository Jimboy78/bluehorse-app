import { describe, expect, it } from 'vitest';
import type { ExerciseFormInput } from '../../routes/panel/exercise-schemas.ts';
import { toExerciseEquipmentInserts, toExerciseInsert } from './exercise-form.ts';

const input: ExerciseFormInput = {
  name: 'Ejemplo — Curl de bíceps',
  pattern: 'isolation',
  primaryMuscles: ['biceps'],
  secondaryMuscles: ['forearms'],
  modality: 'reps_weight',
  isCompound: false,
  isUnilateral: false,
  skillLevel: 'beginner',
  cues: '',
  equipmentIds: ['eq-1', 'eq-2'],
};

describe('toExerciseInsert', () => {
  it('mapea camelCase a snake_case', () => {
    expect(toExerciseInsert('gym-1', input)).toEqual({
      gym_id: 'gym-1',
      name: 'Ejemplo — Curl de bíceps',
      pattern: 'isolation',
      primary_muscles: ['biceps'],
      secondary_muscles: ['forearms'],
      modality: 'reps_weight',
      is_compound: false,
      is_unilateral: false,
      skill_level: 'beginner',
      cues: null,
    });
  });
});

describe('toExerciseEquipmentInserts', () => {
  it('marca el primer equipamiento elegido como principal', () => {
    const rows = toExerciseEquipmentInserts('ex-1', ['eq-1', 'eq-2']);
    expect(rows).toEqual([
      { exercise_id: 'ex-1', equipment_id: 'eq-1', is_primary: true },
      { exercise_id: 'ex-1', equipment_id: 'eq-2', is_primary: false },
    ]);
  });

  it('devuelve un arreglo vacío para peso corporal sin equipamiento', () => {
    expect(toExerciseEquipmentInserts('ex-1', [])).toEqual([]);
  });
});
