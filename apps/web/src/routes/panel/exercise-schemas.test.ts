import { describe, expect, it } from 'vitest';
import { exerciseFormSchema } from './exercise-schemas.ts';

const base = {
  name: 'Ejemplo — Curl de bíceps',
  pattern: 'isolation' as const,
  primaryMuscles: ['biceps'] as const,
  secondaryMuscles: [] as const,
  modality: 'reps_weight' as const,
  isCompound: false,
  isUnilateral: false,
  skillLevel: 'beginner' as const,
  cues: '',
  equipmentIds: ['11111111-1111-4111-8111-111111111111'],
};

describe('exerciseFormSchema', () => {
  it('acepta un ejercicio con carga y equipamiento asociado', () => {
    expect(exerciseFormSchema.safeParse(base).success).toBe(true);
  });

  it('exige al menos un músculo principal', () => {
    expect(exerciseFormSchema.safeParse({ ...base, primaryMuscles: [] }).success).toBe(false);
  });

  it('exige equipamiento salvo que sea peso corporal', () => {
    expect(exerciseFormSchema.safeParse({ ...base, equipmentIds: [] }).success).toBe(false);
  });

  it('acepta sin equipamiento cuando la modalidad es peso corporal', () => {
    const result = exerciseFormSchema.safeParse({
      ...base,
      modality: 'reps_bodyweight',
      equipmentIds: [],
    });
    expect(result.success).toBe(true);
  });

  it('rechaza un patrón que no existe', () => {
    expect(exerciseFormSchema.safeParse({ ...base, pattern: 'flexion_lateral' }).success).toBe(
      false,
    );
  });
});
