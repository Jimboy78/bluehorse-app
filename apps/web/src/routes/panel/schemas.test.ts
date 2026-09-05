import { describe, expect, it } from 'vitest';
import { equipmentFormSchema, parseStackKg } from './schemas.ts';

const base = {
  name: 'Ejemplo — Prensa',
  category: 'plate_loaded' as const,
  loadUnit: 'plates_kg' as const,
  loadMin: '0',
  loadMax: '300',
  loadIncrement: '10',
  stackKgRaw: '',
  baseWeightKg: '20',
  quantity: '1',
  locationNote: 'fondo',
  setupNotes: '',
};

describe('equipmentFormSchema', () => {
  it('acepta una estación de discos válida', () => {
    expect(equipmentFormSchema.safeParse(base).success).toBe(true);
  });

  it('convierte campos numéricos vacíos a null, no a NaN', () => {
    const result = equipmentFormSchema.parse({ ...base, loadMin: '', loadMax: '' });
    expect(result.loadMin).toBeNull();
    expect(result.loadMax).toBeNull();
  });

  it('rechaza un número inválido en un campo numérico', () => {
    expect(equipmentFormSchema.safeParse({ ...base, loadIncrement: 'abc' }).success).toBe(false);
  });

  it('exige stackKgRaw cuando la unidad es stack_level', () => {
    const result = equipmentFormSchema.safeParse({
      ...base,
      loadUnit: 'stack_level',
      stackKgRaw: '',
    });
    expect(result.success).toBe(false);
  });

  it('acepta stack_level cuando sí trae la tabla de niveles', () => {
    const result = equipmentFormSchema.safeParse({
      ...base,
      loadUnit: 'stack_level',
      stackKgRaw: '5,10,15,20',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza una categoría que no existe', () => {
    expect(equipmentFormSchema.safeParse({ ...base, category: 'crossfit' }).success).toBe(false);
  });
});

describe('parseStackKg', () => {
  it('parsea una lista separada por comas con espacios', () => {
    expect(parseStackKg('5, 10 ,15,20')).toEqual([5, 10, 15, 20]);
  });

  it('devuelve null para un string vacío', () => {
    expect(parseStackKg('')).toBeNull();
  });

  it('devuelve null si algún término no es numérico', () => {
    expect(parseStackKg('5,diez,15')).toBeNull();
  });
});
