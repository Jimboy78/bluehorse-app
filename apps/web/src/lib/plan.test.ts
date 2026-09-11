import { describe, expect, it } from 'vitest';
import { type BaselineRow, dedupeByExercise } from './plan.ts';

/**
 * El punto de partida de cada ejercicio es de donde sale la carga objetivo del
 * plan. Si se toma la fila equivocada, alguien arranca con una carga vieja —o
 * peor, con la de un ejercicio que dejó atrás— y el error se arrastra por todo
 * el bloque.
 */

function row(
  over: Partial<BaselineRow> & Pick<BaselineRow, 'exercise_id' | 'recorded_at'>,
): BaselineRow {
  return {
    source: 'declared',
    load_value: 50,
    load_unit: 'kg',
    reps: 10,
    ...over,
  };
}

describe('dedupeByExercise', () => {
  it('se queda con la más reciente de cada ejercicio', () => {
    // Llega ordenada de más nueva a más vieja, como la pide la consulta.
    // El test de abajo cubre el caso en que no.
    const result = dedupeByExercise([
      row({ exercise_id: 'ex-1', recorded_at: '2026-09-01T10:00:00Z', load_value: 80 }),
      row({ exercise_id: 'ex-1', recorded_at: '2026-06-01T10:00:00Z', load_value: 60 }),
      row({ exercise_id: 'ex-2', recorded_at: '2026-08-01T10:00:00Z', load_value: 40 }),
    ]);

    expect(result).toHaveLength(2);
    expect(result.find((b) => b.exerciseId === 'ex-1')?.load.value).toBe(80);
    expect(result.find((b) => b.exerciseId === 'ex-2')?.load.value).toBe(40);
  });

  it('conserva la carga cruda con su unidad, sin convertir', () => {
    const result = dedupeByExercise([
      row({
        exercise_id: 'ex-1',
        recorded_at: '2026-09-01T10:00:00Z',
        load_value: 45,
        load_unit: 'lb',
      }),
    ]);

    // La máquina dice 45 libras: se guarda 45 y "lb", no 20,4 kg.
    expect(result[0]?.load).toEqual({ value: 45, unit: 'lb' });
  });

  it('acepta un baseline sin carga: hay ejercicios que no la tienen', () => {
    const result = dedupeByExercise([
      row({ exercise_id: 'ex-dominadas', recorded_at: '2026-09-01T10:00:00Z', load_value: null }),
    ]);

    expect(result[0]?.load.value).toBeNull();
  });

  it('sin baselines devuelve una lista vacía, no rompe', () => {
    expect(dedupeByExercise([])).toEqual([]);
  });
});

describe('dedupeByExercise y el orden de las filas', () => {
  /**
   * La consulta pide `recorded_at` descendente y la función se apoyaba en eso:
   * se quedaba con la **primera** fila de cada ejercicio, no con la más reciente.
   *
   * Es la misma clase que tenía `reviewProgress` con el historial
   * (`docs/research/30-el-orden-del-historial.md`), y acá pesa igual: de estos
   * baselines sale la carga que el plan le propone al socio. Una fila vieja
   * elegida por venir primera es una carga equivocada, sin error ni aviso.
   */
  it('elige la más reciente aunque las filas vengan en cualquier orden', () => {
    const filas = [
      row({ exercise_id: 'ex-1', recorded_at: '2026-06-01T10:00:00Z', load_value: 60 }),
      row({ exercise_id: 'ex-1', recorded_at: '2026-09-01T10:00:00Z', load_value: 80 }),
      row({ exercise_id: 'ex-1', recorded_at: '2026-07-15T10:00:00Z', load_value: 70 }),
    ];

    for (const orden of [filas, [...filas].reverse(), [filas[2], filas[0], filas[1]]]) {
      const result = dedupeByExercise(orden.filter((f) => f !== undefined));
      expect(result).toHaveLength(1);
      expect(result[0]?.load.value, 'eligió un baseline viejo').toBe(80);
    }
  });

  it('compara instantes y no texto, que no siempre coinciden', () => {
    // El mismo día con husos distintos: 12:00+02:00 son las 10:00 UTC, o sea
    // **anteriores** a las 11:00 UTC. Pero alfabéticamente la cadena que empieza
    // con "12" va primero, así que ordenar por texto elegiría el baseline viejo.
    // `timestamptz` no garantiza una sola escritura del mismo instante.
    const result = dedupeByExercise([
      row({ exercise_id: 'ex-1', recorded_at: '2026-09-01T12:00:00+02:00', load_value: 60 }),
      row({ exercise_id: 'ex-1', recorded_at: '2026-09-01T11:00:00Z', load_value: 80 }),
    ]);

    expect(result[0]?.load.value, 'ordenó por texto y no por instante').toBe(80);
  });
});
