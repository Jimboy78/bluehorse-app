import type { EquipmentLoadSpec, LoadReading } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { toSetLogInsert, toWorkoutLogInsert } from './session-log.ts';

describe('toWorkoutLogInsert', () => {
  it('mapea camelCase a snake_case con el id generado por el cliente', () => {
    expect(
      toWorkoutLogInsert('w-1', 'user-1', 'session-1', 'client-1', '2026-09-05T10:00:00Z'),
    ).toEqual({
      id: 'w-1',
      user_id: 'user-1',
      plan_session_id: 'session-1',
      started_at: '2026-09-05T10:00:00Z',
      client_id: 'client-1',
    });
  });
});

describe('toSetLogInsert', () => {
  const discos: EquipmentLoadSpec = { unit: 'plates_kg', baseWeightKg: 20 };
  const targetLoad: LoadReading = { value: 60, unit: 'plates_kg' };

  const baseItem = {
    planSessionItemId: 'item-1',
    exerciseId: 'ex-1',
    equipmentId: 'eq-1',
    targetLoad,
    equipmentLoadSpec: discos,
    repsTarget: 10,
    restPrescribedSeconds: 90,
  };

  /** Lo común: salió como estaba planificado. */
  const hechas = { reps: 10, rir: 2, load: targetLoad };

  it('normaliza a kg usando la spec de la estación', () => {
    const row = toSetLogInsert(
      's-1',
      'w-1',
      baseItem,
      0,
      85,
      'client-1',
      '2026-09-05T10:05:00Z',
      hechas,
    );
    expect(row.load_value).toBe(60);
    expect(row.load_unit).toBe('plates_kg');
    expect(row.load_kg_normalized).toBe(80); // 60 + 20 de la barra
  });

  it('guarda el descanso real, no el prescripto', () => {
    const row = toSetLogInsert(
      's-1',
      'w-1',
      baseItem,
      0,
      47,
      'client-1',
      '2026-09-05T10:05:00Z',
      hechas,
    );
    expect(row.rest_actual_seconds).toBe(47);
    expect(row.rest_prescribed_seconds).toBe(90);
  });

  it('la carga guardada es la que se usó, no la que proponía el plan', () => {
    const row = toSetLogInsert(
      's-1',
      'w-1',
      // El plan no proponía carga (primera sesión, sin baseline)...
      { ...baseItem, targetLoad: null },
      0,
      60,
      'client-1',
      '2026-09-05T10:05:00Z',
      // ...pero la persona igual entrenó con algo y lo anotó.
      { reps: 10, rir: 2, load: { value: 40, unit: 'plates_kg' } },
    );
    expect(row.load_value).toBe(40);
    expect(row.load_kg_normalized).toBe(60);
  });

  it('guarda null en normalizado si la estación no tiene spec (pin sin tabla)', () => {
    const row = toSetLogInsert(
      's-1',
      'w-1',
      { ...baseItem, equipmentLoadSpec: null },
      0,
      60,
      'client-1',
      '2026-09-05T10:05:00Z',
      hechas,
    );
    expect(row.load_value).toBe(60); // lo que dice la máquina se guarda igual
    expect(row.load_kg_normalized).toBeNull(); // pero no se puede comparar sin inventar
  });

  it('usa el máximo del rango como repeticiones confirmadas por ahora (sin campo editable todavía)', () => {
    const row = toSetLogInsert(
      's-1',
      'w-1',
      baseItem,
      2,
      60,
      'client-1',
      '2026-09-05T10:05:00Z',
      hechas,
    );
    expect(row.reps).toBe(10);
    expect(row.reps_target).toBe(10);
    expect(row.set_index).toBe(2);
  });

  it('guarda las repeticiones que se hicieron, no las que pedía el plan', () => {
    const row = toSetLogInsert('s-1', 'w-1', baseItem, 0, 90, 'client-1', '2026-09-05T10:05:00Z', {
      reps: 7,
      rir: 0,
      load: targetLoad,
    });
    // Si estos dos fueran siempre iguales, el motor compararía el plan contra
    // sí mismo y ninguna propuesta de bajar la carga podría dispararse.
    expect(row.reps).toBe(7);
    expect(row.reps_target).toBe(10);
    expect(row.rir).toBe(0);
  });

  it('acepta que no se haya dicho el RIR', () => {
    const row = toSetLogInsert('s-1', 'w-1', baseItem, 0, 90, 'client-1', '2026-09-05T10:05:00Z', {
      reps: 10,
      rir: null,
      load: targetLoad,
    });
    expect(row.rir).toBeNull();
  });

  it('guarda la carga que se usó de verdad, no la que proponía el plan', () => {
    const row = toSetLogInsert('s-1', 'w-1', baseItem, 0, 90, 'client-1', '2026-09-05T10:05:00Z', {
      reps: 10,
      rir: 2,
      load: { value: 50, unit: 'plates_kg' },
    });
    // Cruda como la muestra la máquina, y el normalizado recalculado sobre
    // esa carga real (50 + 20 de la barra), no sobre la del plan.
    expect(row.load_value).toBe(50);
    expect(row.load_kg_normalized).toBe(70);
  });

  it('acepta una serie sin carga que anotar', () => {
    const row = toSetLogInsert('s-1', 'w-1', baseItem, 0, 90, 'client-1', '2026-09-05T10:05:00Z', {
      reps: 10,
      rir: 2,
      load: null,
    });
    expect(row.load_value).toBeNull();
    expect(row.load_unit).toBeNull();
    expect(row.load_kg_normalized).toBeNull();
  });
});
