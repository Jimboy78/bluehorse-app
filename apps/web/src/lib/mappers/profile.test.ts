import { describe, expect, it } from 'vitest';
import type { OnboardingInput } from '../../routes/onboarding/schemas.ts';
import { toBodyMetricInsert, toDomainGoal, toProfileUpdate, toUserGoalInsert } from './profile.ts';

const input: OnboardingInput = {
  goal: 'hypertrophy',
  // Un id del catálogo con espacios al costado: el valor válido es el id, y lo
  // que el mapper hace es recortarlo. Decía '  Fútbol  ', que desde que el paso 1
  // es una lista no puede llegar: el motor busca por id exacto y 'Fútbol' no matchea
  // con nada. Un fixture que usa un valor imposible prueba el recorte y enseña mal.
  sport: '  futbol  ',
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
      sport: 'futbol',
      season_phase: 'none',
      match_weekday: null,
      priority: 1,
      secondary_goals: [],
      sessions_per_week_target: 4,
      session_minutes_target: 60,
    });
  });

  it('guarda los objetivos secundarios en el orden elegido, sin repetidos (`docs/research/68`)', () => {
    expect(
      toUserGoalInsert('user-1', { ...input, secondaryGoals: ['health', 'fat_loss', 'health'] })
        .secondary_goals,
    ).toEqual(['health', 'fat_loss']);
  });

  it('en temporada con un deporte de partidos guarda el día; si no, no (`docs/research/65`)', () => {
    const enTemporada = { ...input, seasonPhase: 'in_season' as const, matchWeekday: 6 };
    expect(toUserGoalInsert('user-1', enTemporada)).toMatchObject({
      season_phase: 'in_season',
      match_weekday: 6,
    });
    // En pretemporada no hay partidos: el día que haya quedado no se guarda.
    expect(toUserGoalInsert('user-1', { ...enTemporada, seasonPhase: 'preseason' })).toMatchObject({
      season_phase: 'preseason',
      match_weekday: null,
    });
    // Un deporte sin partidos (running) guarda la temporada, no el día.
    expect(toUserGoalInsert('user-1', { ...enTemporada, sport: 'running' })).toMatchObject({
      season_phase: 'in_season',
      match_weekday: null,
    });
    // Sin deporte no hay temporada.
    expect(toUserGoalInsert('user-1', { ...enTemporada, sport: undefined })).toMatchObject({
      season_phase: 'none',
      match_weekday: null,
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

describe('toDomainGoal', () => {
  it('copia todo lo que el socio contestó, también los secundarios (`docs/research/68`)', () => {
    expect(
      toDomainGoal({
        goal: 'strength',
        sport: 'futbol',
        season_phase: 'in_season',
        priority: 1,
        secondary_goals: ['health', 'fat_loss'],
        sessions_per_week_target: 3,
        session_minutes_target: 45,
      }),
    ).toEqual({
      goal: 'strength',
      sport: 'futbol',
      seasonPhase: 'in_season',
      priority: 1,
      secondaryGoals: ['health', 'fat_loss'],
      sessionsPerWeekTarget: 3,
      sessionMinutesTarget: 45,
    });
  });
});
