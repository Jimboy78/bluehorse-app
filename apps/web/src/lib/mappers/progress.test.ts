import { describe, expect, it } from 'vitest';
import {
  computeAdherence,
  computeRecords,
  computeWeeklyVolume,
  type SetRecord,
  toSetRecord,
} from './progress.ts';

function set(overrides: Partial<SetRecord> = {}): SetRecord {
  return {
    id: 's-1',
    exerciseId: 'ex-1',
    exerciseName: 'Press de banca',
    load: { value: 40, unit: 'kg' },
    loadKgNormalized: 40,
    reps: 8,
    rir: 2,
    isWarmup: false,
    completedAt: '2026-08-10T12:00:00Z',
    ...overrides,
  };
}

describe('toSetRecord', () => {
  it('mapea la fila cruda, sin tocar load_value ni load_unit', () => {
    const record = toSetRecord({
      id: 's-1',
      exercise_id: 'ex-1',
      load_value: 40,
      load_unit: 'kg',
      load_kg_normalized: 40,
      reps: 8,
      rir: 2,
      is_warmup: false,
      completed_at: '2026-08-10T12:00:00Z',
      exercises: { name: 'Press de banca' },
    });
    expect(record.load).toEqual({ value: 40, unit: 'kg' });
    expect(record.exerciseName).toBe('Press de banca');
    expect(record.rir).toBe(2);
  });

  it('usa "Ejercicio" cuando no viene el join', () => {
    const record = toSetRecord({
      id: 's-1',
      exercise_id: 'ex-1',
      load_value: null,
      load_unit: 'bodyweight',
      load_kg_normalized: null,
      reps: 10,
      rir: null,
      is_warmup: false,
      completed_at: '2026-08-10T12:00:00Z',
      exercises: null,
    });
    expect(record.exerciseName).toBe('Ejercicio');
  });

  it('deja el RIR en null cuando no se declaró', () => {
    const record = toSetRecord({
      id: 's-1',
      exercise_id: 'ex-1',
      load_value: 40,
      load_unit: 'kg',
      load_kg_normalized: 40,
      reps: 8,
      rir: null,
      is_warmup: false,
      completed_at: '2026-08-10T12:00:00Z',
      exercises: null,
    });
    expect(record.rir).toBeNull();
  });
});

describe('computeAdherence', () => {
  it('sin sesiones, todo en cero', () => {
    expect(computeAdherence([])).toEqual({
      totalSessions: 0,
      currentStreakDays: 0,
      lastSessionAt: null,
    });
  });

  it('cuenta días consecutivos terminando en la sesión más reciente', () => {
    const summary = computeAdherence([
      { startedAt: '2026-08-10T09:00:00Z' },
      { startedAt: '2026-08-09T09:00:00Z' },
      { startedAt: '2026-08-08T09:00:00Z' },
      { startedAt: '2026-08-05T09:00:00Z' }, // corta la racha
    ]);
    expect(summary.totalSessions).toBe(4);
    expect(summary.currentStreakDays).toBe(3);
    expect(summary.lastSessionAt).toBe('2026-08-10T09:00:00Z');
  });

  it('dos sesiones el mismo día cuentan como un solo día de racha', () => {
    const summary = computeAdherence([
      { startedAt: '2026-08-10T09:00:00Z' },
      { startedAt: '2026-08-10T18:00:00Z' },
    ]);
    expect(summary.currentStreakDays).toBe(1);
    expect(summary.totalSessions).toBe(2);
  });
});

describe('computeWeeklyVolume', () => {
  it('suma reps × kg normalizado, agrupado por semana ISO (lunes)', () => {
    const points = computeWeeklyVolume([
      set({ completedAt: '2026-08-10T12:00:00Z', loadKgNormalized: 40, reps: 8 }), // lunes
      set({ completedAt: '2026-08-12T12:00:00Z', loadKgNormalized: 40, reps: 8 }), // misma semana
    ]);
    expect(points).toEqual([{ weekStart: '2026-08-10', volumeKg: 640 }]);
  });

  it('ignora series de entrada en calor y series sin kg normalizado', () => {
    const points = computeWeeklyVolume([
      set({ isWarmup: true }),
      set({ loadKgNormalized: null }),
      set({ reps: null }),
    ]);
    expect(points).toEqual([]);
  });
});

describe('computeRecords', () => {
  it('elige la serie con más kg normalizado como récord', () => {
    const records = computeRecords([
      set({
        load: { value: 40, unit: 'kg' },
        loadKgNormalized: 40,
        completedAt: '2026-08-01T00:00:00Z',
      }),
      set({
        load: { value: 45, unit: 'kg' },
        loadKgNormalized: 45,
        completedAt: '2026-08-10T00:00:00Z',
      }),
    ]);
    expect(records).toEqual([
      expect.objectContaining({ load: { value: 45, unit: 'kg' }, isRanked: true }),
    ]);
  });

  it('sin ninguna serie comparable, muestra la más reciente marcada como no comparada', () => {
    const records = computeRecords([
      set({
        exerciseId: 'ex-banda',
        load: { value: 3, unit: 'band' },
        loadKgNormalized: null,
        completedAt: '2026-08-01T00:00:00Z',
      }),
      set({
        exerciseId: 'ex-banda',
        load: { value: 4, unit: 'band' },
        loadKgNormalized: null,
        completedAt: '2026-08-10T00:00:00Z',
      }),
    ]);
    expect(records).toEqual([
      expect.objectContaining({
        load: { value: 4, unit: 'band' },
        isRanked: false,
        achievedAt: '2026-08-10T00:00:00Z',
      }),
    ]);
  });

  it('ignora series de entrada en calor', () => {
    const records = computeRecords([set({ isWarmup: true })]);
    expect(records).toEqual([]);
  });
});
