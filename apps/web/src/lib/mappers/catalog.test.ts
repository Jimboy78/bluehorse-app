import { describe, expect, it } from 'vitest';
import {
  equipmentRowSchema,
  exerciseRowSchema,
  toDomainEquipment,
  toDomainExercise,
} from './catalog.ts';

describe('equipmentRowSchema + toDomainEquipment', () => {
  it('mapea una fila de disco a un EquipmentLoadSpec completo', () => {
    const row = equipmentRowSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      gym_id: '22222222-2222-4222-8222-222222222222',
      name: 'Ejemplo — Prensa',
      category: 'plate_loaded',
      brand: null,
      model: null,
      photo_url: null,
      location_note: 'fondo',
      setup_notes: null,
      load_unit: 'plates_kg',
      load_min: '0', // PostgREST a veces serializa numeric como string
      load_max: '300',
      load_increment: '10',
      stack_kg: null,
      base_weight_kg: '20',
      quantity: 1,
      is_active: true,
    });

    const equipment = toDomainEquipment(row);
    expect(equipment.load).toEqual({
      unit: 'plates_kg',
      min: 0,
      max: 300,
      increment: 10,
      baseWeightKg: 20,
    });
  });

  it('omite stackKg cuando la fila trae un arreglo vacío, en vez de guardar []', () => {
    const row = equipmentRowSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      gym_id: '22222222-2222-4222-8222-222222222222',
      name: 'Ejemplo — Pin sin tabla',
      category: 'selectorized',
      brand: null,
      model: null,
      photo_url: null,
      location_note: null,
      setup_notes: null,
      load_unit: 'stack_level',
      load_min: 1,
      load_max: 12,
      load_increment: 1,
      stack_kg: [],
      base_weight_kg: null,
      quantity: 1,
      is_active: true,
    });

    expect(toDomainEquipment(row).load.stackKg).toBeUndefined();
  });

  it('coacciona los niveles de stack_kg venidos como strings', () => {
    const row = equipmentRowSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      gym_id: '22222222-2222-4222-8222-222222222222',
      name: 'Ejemplo — Polea',
      category: 'selectorized',
      brand: null,
      model: null,
      photo_url: null,
      location_note: null,
      setup_notes: null,
      load_unit: 'stack_level',
      load_min: 1,
      load_max: 3,
      load_increment: 1,
      stack_kg: ['5', '10', '15'],
      base_weight_kg: null,
      quantity: 1,
      is_active: true,
    });

    expect(toDomainEquipment(row).load.stackKg).toEqual([5, 10, 15]);
  });
});

describe('exerciseRowSchema + toDomainExercise', () => {
  it('mapea una fila global (gym_id null) y adjunta el equipamiento', () => {
    const row = exerciseRowSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      gym_id: null,
      name: 'Sentadilla',
      pattern: 'squat',
      primary_muscles: ['quads', 'glutes'],
      secondary_muscles: ['lower_back'],
      modality: 'reps_weight',
      is_compound: true,
      is_unilateral: false,
      skill_level: 'intermediate',
      cues: 'Bajá controlado.',
      is_active: true,
    });

    const exercise = toDomainExercise(row, ['eq-1', 'eq-2']);
    expect(exercise.gymId).toBeNull();
    expect(exercise.equipmentIds).toEqual(['eq-1', 'eq-2']);
  });
});
