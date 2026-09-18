import { describe, expect, it } from 'vitest';
import { armarItem, type Modo, type Numeros, VACIO } from './ManualItemForm.tsx';

const EX = '44e652e1-f91d-44f1-a4f8-72a1ea38b4df';
const SALA: Modo = { cardio: false, alFallo: false, porcentaje: false };
const n = (over: Partial<Numeros>): Numeros => ({ ...VACIO, ...over });

describe('armarItem', () => {
  it('sin ejercicio no hay ítem', () => {
    expect(
      armarItem(null, null, n({ sets: '4', rest: '90', repsMin: '6', repsMax: '8' }), SALA, null),
    ).toBeNull();
  });

  it('en sala no completa nada que falte: sin series no hay ítem', () => {
    expect(
      armarItem(EX, null, n({ rest: '90', repsMin: '6', repsMax: '8' }), SALA, null),
    ).toBeNull();
    expect(armarItem(EX, null, n({ sets: '4', rest: '90' }), SALA, null)).toBeNull();
  });

  it('al fallo técnico no pide repeticiones', () => {
    const item = armarItem(
      EX,
      null,
      n({ sets: '3', rest: '90' }),
      { ...SALA, alFallo: true },
      null,
    );
    expect(item?.toFailure).toBe(true);
    expect(item?.targetSets).toBe(3);
  });

  it('con %1RM pide el porcentaje, y uno solo es un rango de un punto', () => {
    const modo = { ...SALA, porcentaje: true };
    const base = { sets: '4', rest: '180', repsMin: '5', repsMax: '5' };
    expect(armarItem(EX, null, n(base), modo, 'plates_kg')).toBeNull();
    expect(armarItem(EX, null, n({ ...base, pctMin: '80' }), modo, 'plates_kg')?.pct1rm).toEqual({
      min: 80,
      max: 80,
    });
    const rango = armarItem(
      EX,
      null,
      n({ ...base, pctMin: '80', pctMax: '85', load: '100' }),
      modo,
      'plates_kg',
    );
    expect(rango?.pct1rm).toEqual({ min: 80, max: 85 });
    // Con porcentaje, una carga fija escrita antes no se guarda: serían dos objetivos.
    expect(rango?.targetLoad).toBeNull();
  });

  it('la carga va en la unidad de la estación, y sin estación no hay carga', () => {
    const base = n({ sets: '4', rest: '90', repsMin: '6', repsMax: '8', load: '45' });
    expect(armarItem(EX, null, base, SALA, 'plates_lb')?.targetLoad).toEqual({
      value: 45,
      unit: 'plates_lb',
    });
    expect(armarItem(EX, null, base, SALA, null)?.targetLoad).toBeNull();
  });

  it('cardio: los minutos alcanzan, y sin vueltas es un bloque', () => {
    const modo = { ...SALA, cardio: true };
    expect(armarItem(EX, null, n({ zone: '2' }), modo, null)).toBeNull();
    const item = armarItem(EX, null, n({ minutes: '40', zone: '2' }), modo, null);
    expect(item?.targetSets).toBe(1);
    expect(item?.cardio).toEqual({ minutes: 40, zone: 2, intervalRestMinutes: null });
    expect(item?.targetRir).toBeNull();
  });

  it('cardio por vueltas lleva el descanso suave', () => {
    const item = armarItem(
      EX,
      null,
      n({ minutes: '4', sets: '4', intervalRest: '3', zone: '4' }),
      { ...SALA, cardio: true },
      null,
    );
    expect(item?.targetSets).toBe(4);
    expect(item?.cardio?.intervalRestMinutes).toBe(3);
  });
});
