import { describe, expect, it } from 'vitest';
import {
  type AdherenceContext,
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
    primaryMuscles: ['chest'],
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
      exercises: { name: 'Press de banca', primary_muscles: ['chest'] },
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
  // Mediodía de acá (15:00 UTC) para que ningún caso dependa de la zona.
  const sesion = (dia: string) => ({ startedAt: `${dia}T15:00:00Z` });
  const ctx = (over: Partial<AdherenceContext> = {}): AdherenceContext => ({
    restDays: [],
    sessionsPerWeekTarget: null,
    today: '2026-08-10',
    ...over,
  });

  it('sin sesiones, todo en cero', () => {
    expect(computeAdherence([], ctx())).toEqual({
      totalSessions: 0,
      currentStreakDays: 0,
      lastSessionAt: null,
    });
  });

  it('sin frecuencia declarada, solo días seguidos cuentan', () => {
    const summary = computeAdherence(
      [sesion('2026-08-10'), sesion('2026-08-09'), sesion('2026-08-08'), sesion('2026-08-05')],
      ctx(),
    );
    expect(summary.totalSessions).toBe(4);
    expect(summary.currentStreakDays).toBe(3);
    expect(summary.lastSessionAt).toBe('2026-08-10T15:00:00Z');
  });

  it('dos sesiones el mismo día cuentan como un solo día de racha', () => {
    const summary = computeAdherence(
      [{ startedAt: '2026-08-10T12:00:00Z' }, { startedAt: '2026-08-10T21:00:00Z' }],
      ctx(),
    );
    expect(summary.currentStreakDays).toBe(1);
    expect(summary.totalSessions).toBe(2);
  });

  it('elige la más reciente por instante, no por el orden en que llegan', () => {
    const summary = computeAdherence([sesion('2026-08-08'), sesion('2026-08-10')], ctx());
    expect(summary.lastSessionAt).toBe('2026-08-10T15:00:00Z');
  });

  it('hoy sin entrenar todavía no corta la racha de ayer', () => {
    const summary = computeAdherence(
      [sesion('2026-08-09'), sesion('2026-08-08')],
      ctx({ today: '2026-08-10' }),
    );
    expect(summary.currentStreakDays).toBe(2);
  });

  it('un día sin anotar entre dos sesiones es descanso si la frecuencia lo deja', () => {
    // Lunes, (martes sin nada), miércoles: 3 por semana deja 4 días libres.
    const summary = computeAdherence(
      [sesion('2026-08-12'), sesion('2026-08-10')],
      ctx({ sessionsPerWeekTarget: 3, today: '2026-08-12' }),
    );
    expect(summary.currentStreakDays).toBe(2);
  });

  it('lunes a viernes con el fin de semana libre sigue la racha con 5 por semana', () => {
    const dias = [
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-10',
    ];
    const summary = computeAdherence(
      dias.map(sesion),
      ctx({ sessionsPerWeekTarget: 5, today: '2026-08-10' }),
    );
    expect(summary.currentStreakDays).toBe(6);
  });

  it('faltar más de lo que la frecuencia deja corta la racha', () => {
    // 5 por semana deja 2 libres; lunes → viernes son 3 días sin nada.
    const summary = computeAdherence(
      [sesion('2026-08-07'), sesion('2026-08-03')],
      ctx({ sessionsPerWeekTarget: 5, today: '2026-08-07' }),
    );
    expect(summary.currentStreakDays).toBe(1);
  });

  it('huecos chicos repartidos también cortan si en una semana suman de más', () => {
    // 5 por semana: cada hueco es de 2 días, pero una sesión cada tres días son
    // 4 libres en cualquier ventana de siete.
    const summary = computeAdherence(
      ['2026-08-01', '2026-08-04', '2026-08-07', '2026-08-10'].map(sesion),
      ctx({ sessionsPerWeekTarget: 5, today: '2026-08-10' }),
    );
    expect(summary.currentStreakDays).toBeLessThan(4);
  });

  it('un descanso marcado nunca corta, aunque la frecuencia no lo deje', () => {
    const summary = computeAdherence(
      [sesion('2026-08-10'), sesion('2026-08-08')],
      ctx({ sessionsPerWeekTarget: 7, restDays: ['2026-08-09'], today: '2026-08-10' }),
    );
    expect(summary.currentStreakDays).toBe(2);
  });

  it('el descanso marcado no suma a la racha: la racha cuenta entrenamientos', () => {
    const summary = computeAdherence(
      [sesion('2026-08-08')],
      ctx({ restDays: ['2026-08-09', '2026-08-10'], today: '2026-08-10' }),
    );
    expect(summary.currentStreakDays).toBe(1);
  });

  it('el descanso marcado gasta el cupo: una falta más ya corta', () => {
    // 5 por semana, 2 libres. Martes marcado + miércoles marcado + jueves sin nada.
    const summary = computeAdherence(
      [sesion('2026-08-07'), sesion('2026-08-03')],
      ctx({
        sessionsPerWeekTarget: 5,
        restDays: ['2026-08-04', '2026-08-05'],
        today: '2026-08-07',
      }),
    );
    expect(summary.currentStreakDays).toBe(1);
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

/**
 * "Días consecutivos" y "esta semana" no existen en UTC: existen donde está
 * parada la persona. Agrupar por día UTC rompía las dos cosas justo en la
 * franja horaria en la que más se entrena. Ver `lib/gym-time.ts`.
 */
describe('la hora del gimnasio, no la de Greenwich', () => {
  it('lunes a la noche y martes a la mañana son dos días de racha', () => {
    // Lunes 2026-09-07 22:00 y martes 2026-09-08 10:00 en Arroyo Seco: los dos
    // caen en el martes UTC, así que la racha se comía uno de los dos días.
    const summary = computeAdherence(
      [{ startedAt: '2026-09-08T13:00:00Z' }, { startedAt: '2026-09-08T01:00:00Z' }],
      { restDays: [], sessionsPerWeekTarget: null, today: '2026-09-08' },
    );
    expect(summary.currentStreakDays).toBe(2);
  });

  it('el domingo a la noche suma a su semana, no a la siguiente', () => {
    // Domingo 2026-09-06 21:00 en Arroyo Seco ya es lunes en UTC.
    const semanas = computeWeeklyVolume([set({ completedAt: '2026-09-07T00:00:00Z' })]);
    expect(semanas).toHaveLength(1);
    expect(semanas[0]?.weekStart).toBe('2026-08-31');
  });

  it('lunes a la madrugada de acá sigue siendo lunes', () => {
    // 2026-09-07 00:30 local = 2026-09-07T03:30Z. Mismo día en las dos zonas,
    // pero es el borde de la semana: tiene que abrir la barra del 07.
    const semanas = computeWeeklyVolume([set({ completedAt: '2026-09-07T03:30:00Z' })]);
    expect(semanas[0]?.weekStart).toBe('2026-09-07');
  });
});
