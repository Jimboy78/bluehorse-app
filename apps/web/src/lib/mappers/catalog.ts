import type { Equipment, EquipmentLoadSpec, Exercise, Id } from '@bh/domain';
import {
  bodyRegionSchema,
  equipmentCategorySchema,
  experienceLevelSchema,
  loadUnitSchema,
  modalitySchema,
  movementPatternSchema,
  muscleGroupSchema,
} from '@bh/domain';
import { z } from 'zod';

/**
 * Traducción entre las filas de `equipment`/`exercises` (snake_case, tal como
 * las devuelve Supabase) y los tipos de dominio que consume el motor
 * (camelCase). Vive acá y en ningún otro lado (CLAUDE.md).
 *
 * Validado con zod porque es un borde real: PostgREST serializa `numeric[]`
 * de formas distintas según la versión, así que se coacciona explícitamente
 * en vez de confiar en el tipo que venga.
 */

export const equipmentRowSchema = z.object({
  id: z.uuid(),
  gym_id: z.uuid(),
  name: z.string(),
  category: equipmentCategorySchema,
  brand: z.string().nullable(),
  model: z.string().nullable(),
  photo_url: z.string().nullable(),
  location_note: z.string().nullable(),
  setup_notes: z.string().nullable(),
  load_unit: loadUnitSchema,
  load_min: z.coerce.number().nullable(),
  load_max: z.coerce.number().nullable(),
  load_increment: z.coerce.number().nullable(),
  stack_kg: z.array(z.coerce.number()).nullable(),
  base_weight_kg: z.coerce.number().nullable(),
  quantity: z.number().int(),
  is_active: z.boolean(),
});

export type EquipmentRow = z.infer<typeof equipmentRowSchema>;

export const exerciseRowSchema = z.object({
  id: z.uuid(),
  gym_id: z.uuid().nullable(),
  name: z.string(),
  pattern: movementPatternSchema,
  primary_muscles: z.array(muscleGroupSchema),
  secondary_muscles: z.array(muscleGroupSchema),
  modality: modalitySchema,
  is_compound: z.boolean(),
  is_unilateral: z.boolean(),
  skill_level: experienceLevelSchema,
  cues: z.string().nullable(),
  is_active: z.boolean(),
});

export type ExerciseRow = z.infer<typeof exerciseRowSchema>;

export const exerciseEquipmentRowSchema = z.object({
  exercise_id: z.uuid(),
  equipment_id: z.uuid(),
});

export const painConstraintRowSchema = z.object({
  body_region: bodyRegionSchema.nullable(),
});

export function toDomainEquipment(row: EquipmentRow): Equipment {
  const load: EquipmentLoadSpec = {
    unit: row.load_unit,
    ...(row.load_min !== null && { min: row.load_min }),
    ...(row.load_max !== null && { max: row.load_max }),
    ...(row.load_increment !== null && { increment: row.load_increment }),
    ...(row.stack_kg && row.stack_kg.length > 0 && { stackKg: row.stack_kg }),
    ...(row.base_weight_kg !== null && { baseWeightKg: row.base_weight_kg }),
  };

  return {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    category: row.category,
    brand: row.brand,
    model: row.model,
    photoUrl: row.photo_url,
    locationNote: row.location_note,
    setupNotes: row.setup_notes,
    load,
    quantity: row.quantity,
    isActive: row.is_active,
  };
}

export function toDomainExercise(row: ExerciseRow, equipmentIds: readonly Id[]): Exercise {
  return {
    id: row.id,
    gymId: row.gym_id,
    name: row.name,
    pattern: row.pattern,
    primaryMuscles: row.primary_muscles,
    secondaryMuscles: row.secondary_muscles,
    modality: row.modality,
    isCompound: row.is_compound,
    isUnilateral: row.is_unilateral,
    skillLevel: row.skill_level,
    cues: row.cues,
    equipmentIds,
  };
}
