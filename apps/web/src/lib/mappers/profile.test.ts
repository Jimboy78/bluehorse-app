import { describe, expect, it } from 'vitest';
import type { OnboardingInput } from '../../routes/onboarding/schemas.ts';
import { toBodyMetricInsert, toProfileUpdate, toUserGoalInsert } from './profile.ts';

const input: OnboardingInput = {
  goal: 'hypertrophy',
  sport: '  Fútbol  ',
  birthDate: '1994-05-10',
  sex: 'male',
  weightKg: 78.5,
  heightCm: 175,
  experienceLevel: 'intermediate',
  sessionsPerWeekTarget: 4,
  sessionMinutesTarget: 60,
  baselineMode: 'calibrate',
};

describe('toProfileUpdate', () => {
  it('mapea camelCase a snake_case exacto de la tabla profiles', () => {
    const now = new Date('2026-09-04T12:00:00.000Z');
    expect(toProfileUpdate(input, now)).toEqual({
      birth_date: '1994-05-10',
      sex: 'male',
      experience_level: 'intermediate',
      onboarded_at: '2026-09-04T12:00:00.000Z',
    });
  });
});

describe('toBodyMetricInsert', () => {
  it('mapea peso y altura a la fila de body_metrics', () => {
    expect(toBodyMetricInsert('user-1', 'gym-1', input)).toEqual({
      user_id: 'user-1',
      gym_id: 'gym-1',
      weight_kg: 78.5,
      height_cm: 175,
    });
  });

  it('no manda recorded_at: lo pone la base', () => {
    expect(toBodyMetricInsert('user-1', 'gym-1', input)).not.toHaveProperty('recorded_at');
  });
});

describe('toUserGoalInsert', () => {
  it('mapea camelCase a snake_case y recorta el deporte', () => {
    expect(toUserGoalInsert('user-1', input)).toEqual({
      user_id: 'user-1',
      goal: 'hypertrophy',
      sport: 'Fútbol',
      priority: 1,
      sessions_per_week_target: 4,
      session_minutes_target: 60,
    });
  });

  it('guarda null cuando no se declaró deporte', () => {
    const sinDeporte = { ...input, sport: undefined };
    expect(toUserGoalInsert('user-1', sinDeporte).sport).toBeNull();
  });

  it('guarda null cuando el deporte es solo espacios', () => {
    const soloEspacios = { ...input, sport: '   ' };
    expect(toUserGoalInsert('user-1', soloEspacios).sport).toBeNull();
  });
});
