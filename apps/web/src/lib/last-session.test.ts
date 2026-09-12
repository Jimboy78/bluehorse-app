import { describe, expect, it } from 'vitest';
import { ultimaVezDe } from './last-session.ts';

function fila(over: Record<string, unknown> = {}) {
  return {
    workout_log_id: 'wl-2',
    set_index: 0,
    load_value: 60,
    load_unit: 'kg',
    reps: 10,
    rir: 2,
    completed_at: '2026-09-08T13:00:00Z',
    ...over,
  };
}

describe('ultimaVezDe', () => {
  it('sin historial, no hay vez pasada', () => {
    expect(ultimaVezDe([])).toBeNull();
  });

  it('trae las series del entrenamiento más reciente', () => {
    const out = ultimaVezDe([
      fila({ set_index: 1, load_value: 65 }),
      fila({ set_index: 0, load_value: 60 }),
    ]);
    expect(out?.series.map((s) => s.load?.value)).toEqual([60, 65]);
  });

  it('no mezcla dos entrenamientos distintos', () => {
    // Dos sesiones del mismo día son dos entrenamientos: mezclarlas mostraría
    // cuatro series donde hubo dos.
    const out = ultimaVezDe([
      fila({ workout_log_id: 'wl-2', set_index: 0 }),
      fila({ workout_log_id: 'wl-1', set_index: 0, load_value: 40 }),
      fila({ workout_log_id: 'wl-1', set_index: 1, load_value: 40 }),
    ]);
    expect(out?.series).toHaveLength(1);
  });

  it('ordena por número de serie, no por como vino la consulta', () => {
    const out = ultimaVezDe([
      fila({ set_index: 2 }),
      fila({ set_index: 0 }),
      fila({ set_index: 1 }),
    ]);
    expect(out?.series.map((s) => s.setIndex)).toEqual([0, 1, 2]);
  });

  it('una serie sin carga registrable no inventa una', () => {
    // Peso corporal, banda, pin sin tabla: la carga es `null` y se muestra
    // como lo que es (regla dura 6).
    const out = ultimaVezDe([fila({ load_value: null, load_unit: null })]);
    expect(out?.series[0]?.load).toBeNull();
    expect(out?.series[0]?.reps).toBe(10);
  });

  it('guarda cuándo fue, para poder decirlo en pantalla', () => {
    const out = ultimaVezDe([fila({ completed_at: '2026-09-08T13:00:00Z' })]);
    expect(out?.cuando).toBe('2026-09-08T13:00:00Z');
  });

  it('elige el entrenamiento más reciente aunque no venga primero', () => {
    // `useUltimaVez` pide `.order('completed_at', { ascending: false })`, pero
    // esta función no puede confiar en eso: con la fila vieja primero, el
    // socio vería "la última vez" de hace meses en vez de la de ayer.
    const out = ultimaVezDe([
      fila({ workout_log_id: 'wl-vieja', completed_at: '2026-01-01T10:00:00Z', load_value: 20 }),
      fila({ workout_log_id: 'wl-nueva', completed_at: '2026-09-08T13:00:00Z', load_value: 60 }),
    ]);
    expect(out?.cuando).toBe('2026-09-08T13:00:00Z');
    expect(out?.series[0]?.load?.value).toBe(60);
  });

  it('compara por instante, no por texto: un huso horario distinto no invierte el orden', () => {
    // Mismo momento, dos formas válidas de escribirlo. Alfabéticamente "12"
    // va antes que "11", pero en UTC las 12:00+02:00 son antes que las 11:00Z.
    const out = ultimaVezDe([
      fila({ workout_log_id: 'wl-a', completed_at: '2026-09-01T12:00:00+02:00', load_value: 10 }),
      fila({ workout_log_id: 'wl-b', completed_at: '2026-09-01T11:00:00Z', load_value: 20 }),
    ]);
    expect(out?.series[0]?.load?.value).toBe(20);
  });
});
