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
