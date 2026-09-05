import { describe, expect, it } from 'vitest';
import type { EquipmentLoadSpec } from './load.ts';
import { formatLoad, nextLoad, snapToEquipment, stepLoad, toKg } from './load.ts';

const discos: EquipmentLoadSpec = {
  unit: 'plates_kg',
  min: 0,
  max: 200,
  increment: 2.5,
  baseWeightKg: 20,
};
const libras: EquipmentLoadSpec = { unit: 'lb', min: 20, max: 200, increment: 10 };
const pin: EquipmentLoadSpec = {
  unit: 'stack_level',
  min: 1,
  max: 12,
  increment: 1,
  stackKg: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
};
const pinSinTabla: EquipmentLoadSpec = { unit: 'stack_level', min: 1, max: 10, increment: 1 };

describe('toKg', () => {
  it('convierte libras con el factor exacto', () => {
    expect(toKg({ value: 45, unit: 'lb' })).toBeCloseTo(20.41, 2);
  });

  it('suma el peso de la barra en estaciones de discos', () => {
    expect(toKg({ value: 60, unit: 'plates_kg' }, discos)).toBe(80);
  });

  it('traduce el nivel del pin usando la tabla de la estación', () => {
    expect(toKg({ value: 7, unit: 'stack_level' }, pin)).toBe(35);
  });

  it('devuelve null si el pin no tiene tabla de kg: no inventa un número', () => {
    expect(toKg({ value: 7, unit: 'stack_level' }, pinSinTabla)).toBeNull();
  });

  it('devuelve null fuera del rango del stack', () => {
    expect(toKg({ value: 99, unit: 'stack_level' }, pin)).toBeNull();
  });

  it('devuelve null para peso corporal y bandas', () => {
    expect(toKg({ value: null, unit: 'bodyweight' })).toBeNull();
    expect(toKg({ value: 3, unit: 'band' })).toBeNull();
  });
});

describe('formatLoad', () => {
  it('muestra lo que dice la máquina, nunca lo convertido', () => {
    expect(formatLoad({ value: 45, unit: 'lb' })).toBe('45 lb');
    expect(formatLoad({ value: 7, unit: 'stack_level' })).toBe('pin 7');
    expect(formatLoad({ value: null, unit: 'bodyweight' })).toBe('peso corporal');
  });
});

describe('snapToEquipment', () => {
  it('ajusta al escalón real de la estación', () => {
    expect(snapToEquipment(63.7, discos)).toBe(62.5);
  });

  it('recorta al rango físico', () => {
    expect(snapToEquipment(500, libras)).toBe(200);
    expect(snapToEquipment(0, libras)).toBe(20);
  });
});

describe('nextLoad', () => {
  it('sube un nivel en estaciones de pin e ignora el porcentaje', () => {
    expect(nextLoad({ value: 7, unit: 'stack_level' }, pin, 2.5)).toBe(8);
  });

  it('no propone un nivel que la máquina no tiene', () => {
    expect(nextLoad({ value: 12, unit: 'stack_level' }, pin, 2.5)).toBeNull();
  });

  it('sube al menos un escalón aunque el porcentaje quede corto', () => {
    // 100 lb + 2.5% = 102.5, que redondeado a escalones de 10 vuelve a 100.
    expect(nextLoad({ value: 100, unit: 'lb' }, libras, 2.5)).toBe(110);
  });

  it('respeta el escalón cuando el porcentaje alcanza', () => {
    expect(nextLoad({ value: 60, unit: 'plates_kg' }, discos, 5)).toBe(62.5);
  });
});

describe('stepLoad', () => {
  const pin = { unit: 'stack_level' as const, stackKg: [5, 10, 15, 20, 25], increment: 1 };
  const discos = { unit: 'plates_kg' as const, increment: 2.5, min: 0, max: 200 };

  it('en pin sube y baja de a un nivel, nunca medio', () => {
    expect(stepLoad(3, pin, 1)).toBe(4);
    expect(stepLoad(3, pin, -1)).toBe(2);
  });

  it('en pin no se pasa del último nivel ni baja del primero', () => {
    expect(stepLoad(5, pin, 1)).toBe(5);
    expect(stepLoad(1, pin, -1)).toBe(1);
  });

  it('en discos se mueve un escalón real de la estación', () => {
    expect(stepLoad(60, discos, 1)).toBe(62.5);
    expect(stepLoad(60, discos, -1)).toBe(57.5);
  });

  it('respeta el máximo y el mínimo de la estación', () => {
    expect(stepLoad(200, discos, 1)).toBe(200);
    expect(stepLoad(0, discos, -1)).toBe(0);
  });

  it('sin carga previa arranca desde el mínimo de la estación', () => {
    expect(stepLoad(null, discos, 1)).toBe(0);
    expect(stepLoad(null, pin, 1)).toBe(1);
  });

  it('devuelve null si la estación no dice de cuánto es su escalón: mover "un poco" sería inventar', () => {
    expect(stepLoad(40, { unit: 'kg' }, 1)).toBeNull();
    expect(stepLoad(40, { unit: 'kg', increment: 0 }, 1)).toBeNull();
  });
});
