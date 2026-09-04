import { describe, expect, it } from 'vitest';
import {
  calibrationStepSchema,
  frequencyStepSchema,
  goalStepSchema,
  personalStepSchema,
} from './schemas.ts';

describe('goalStepSchema', () => {
  it('acepta un objetivo válido sin deporte', () => {
    const result = goalStepSchema.safeParse({ goal: 'hypertrophy' });
    expect(result.success).toBe(true);
  });

  it('rechaza un objetivo que no existe', () => {
    const result = goalStepSchema.safeParse({ goal: 'flexibilidad' });
    expect(result.success).toBe(false);
  });
});

describe('personalStepSchema', () => {
  it('rechaza una fecha que da menos de 13 años', () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const result = personalStepSchema.safeParse({
      birthDate: tenYearsAgo.toISOString().slice(0, 10),
      sex: 'male',
      experienceLevel: 'beginner',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una fecha inválida', () => {
    const result = personalStepSchema.safeParse({
      birthDate: 'no-es-una-fecha',
      sex: 'male',
      experienceLevel: 'beginner',
    });
    expect(result.success).toBe(false);
  });

  it('acepta un adulto con datos completos', () => {
    const result = personalStepSchema.safeParse({
      birthDate: '1994-05-10',
      sex: 'female',
      experienceLevel: 'intermediate',
    });
    expect(result.success).toBe(true);
  });
});

describe('frequencyStepSchema', () => {
  it('rechaza más de 7 sesiones por semana', () => {
    const result = frequencyStepSchema.safeParse({
      sessionsPerWeekTarget: 8,
      sessionMinutesTarget: 60,
    });
    expect(result.success).toBe(false);
  });

  it('coerciona strings numéricos de un <input>', () => {
    const result = frequencyStepSchema.safeParse({
      sessionsPerWeekTarget: '3',
      sessionMinutesTarget: '45',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionsPerWeekTarget).toBe(3);
    }
  });
});

describe('calibrationStepSchema', () => {
  it('solo acepta los dos modos definidos', () => {
    expect(calibrationStepSchema.safeParse({ baselineMode: 'declared' }).success).toBe(true);
    expect(calibrationStepSchema.safeParse({ baselineMode: 'calibrate' }).success).toBe(true);
    expect(calibrationStepSchema.safeParse({ baselineMode: 'ya_se' }).success).toBe(false);
  });
});
