import { describe, expect, it } from 'vitest';
import type { EquipmentLoadSpec } from './load.ts';
import {
  cargaParaPorcentaje,
  estimarMaximo,
  impedimento,
  type SerieParaEstimar,
} from './one-rep-max.ts';

const PARAMS = { maxRepsToFailure: 10, maxRir: 3 };
const RACK: EquipmentLoadSpec = { unit: 'plates_kg', baseWeightKg: 20, increment: 2.5 };
const MANCUERNAS: EquipmentLoadSpec = { unit: 'kg', increment: 2 };

const serie = (over: Partial<SerieParaEstimar>): SerieParaEstimar => ({
  load: { value: 60, unit: 'plates_kg' },
  reps: 5,
  rir: 2,
  isWarmup: false,
  completedAt: '2026-09-15T20:00:00Z',
  workoutLogId: 'w-1',
  ...over,
});

describe('estimarMaximo', () => {
  it('Epley sobre la masa total y las repeticiones hasta el fallo (hechas + RIR)', () => {
    // 60 de discos + 20 de barra = 80; 5 hechas + 2 en reserva = 7 al fallo.
    const m = estimarMaximo([serie({})], RACK, PARAMS);
    expect(m?.total).toBeCloseTo(80 * (1 + 7 / 30), 5);
  });

  it('sin RIR no estima: no se sabe cuán lejos del fallo quedó', () => {
    expect(estimarMaximo([serie({ rir: null })], RACK, PARAMS)).toBeNull();
  });

  it('respeta los límites del ruleset: lejos del fallo o con muchas repeticiones, no', () => {
    expect(estimarMaximo([serie({ rir: 4 })], RACK, PARAMS)).toBeNull();
    expect(estimarMaximo([serie({ reps: 9, rir: 2 })], RACK, PARAMS)).toBeNull();
    expect(estimarMaximo([serie({ reps: 8, rir: 2 })], RACK, PARAMS)).not.toBeNull();
  });

  it('ignora la entrada en calor', () => {
    expect(estimarMaximo([serie({ isWarmup: true })], RACK, PARAMS)).toBeNull();
  });

  it('usa el entrenamiento más reciente, aunque uno viejo diera más', () => {
    const vieja = serie({
      load: { value: 100, unit: 'plates_kg' },
      completedAt: '2026-06-01T20:00:00Z',
      workoutLogId: 'w-0',
    });
    const nueva = serie({ load: { value: 60, unit: 'plates_kg' }, workoutLogId: 'w-1' });
    // En cualquier orden de llegada.
    expect(estimarMaximo([nueva, vieja], RACK, PARAMS)?.desde).toBe(nueva);
    expect(estimarMaximo([vieja, nueva], RACK, PARAMS)?.desde).toBe(nueva);
  });

  it('dentro de ese entrenamiento, la mejor serie', () => {
    const floja = serie({ reps: 3, rir: 3 });
    const buena = serie({ load: { value: 70, unit: 'plates_kg' }, reps: 4, rir: 1 });
    expect(estimarMaximo([floja, buena], RACK, PARAMS)?.desde).toBe(buena);
  });

  it('sin el peso de la barra no inventa: el 80 % de los discos no es el 80 % del levantamiento', () => {
    expect(estimarMaximo([serie({})], { unit: 'plates_kg', increment: 2.5 }, PARAMS)).toBeNull();
    expect(impedimento({ unit: 'plates_kg' })).toBe('barra');
    expect(impedimento({ unit: 'plates_lb' })).toBe('barra');
  });

  it('en un pin no hay porcentaje: no existe medio pin', () => {
    expect(impedimento({ unit: 'stack_level', stackKg: [5, 10, 15] })).toBe('unidad');
  });
});

describe('cargaParaPorcentaje', () => {
  it('lo devuelve como lo lee la estación: sin la barra y al escalón real', () => {
    // Máximo 100 total. 80 % = 80 total → 60 de discos; 85 % = 85 → 65.
    expect(cargaParaPorcentaje(100, { min: 80, max: 85 }, RACK)).toEqual({ min: 60, max: 65 });
  });

  it('en mancuernas el total es lo que dice la mancuerna', () => {
    expect(cargaParaPorcentaje(50, { min: 70, max: 70 }, MANCUERNAS)).toEqual({ min: 36, max: 36 });
  });

  it('sin el peso de la barra, null', () => {
    expect(cargaParaPorcentaje(100, { min: 80, max: 85 }, { unit: 'plates_lb' })).toBeNull();
  });
});
