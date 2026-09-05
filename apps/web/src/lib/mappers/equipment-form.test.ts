import { describe, expect, it } from 'vitest';
import type { EquipmentFormInput } from '../../routes/panel/schemas.ts';
import { toEquipmentInsert } from './equipment-form.ts';

const input: EquipmentFormInput = {
  name: 'Ejemplo — Remo',
  category: 'selectorized',
  loadUnit: 'stack_level',
  loadMin: 1,
  loadMax: 12,
  loadIncrement: 1,
  stackKgRaw: '5,10,15,20,25,30,35,40,45,50,55,60',
  baseWeightKg: null,
  quantity: 2,
  locationNote: 'poleas',
  setupNotes: '',
};

describe('toEquipmentInsert', () => {
  it('mapea camelCase a snake_case y parsea la tabla de stack', () => {
    const row = toEquipmentInsert('gym-1', input, null);
    expect(row).toMatchObject({
      gym_id: 'gym-1',
      name: 'Ejemplo — Remo',
      load_unit: 'stack_level',
      stack_kg: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
      quantity: 2,
    });
  });

  it('guarda null en setup_notes cuando queda vacío', () => {
    expect(toEquipmentInsert('gym-1', input, null).setup_notes).toBeNull();
  });

  it('adjunta la URL de la foto cuando se subió una', () => {
    const row = toEquipmentInsert('gym-1', input, 'https://x/foto.jpg');
    expect(row.photo_url).toBe('https://x/foto.jpg');
  });
});
