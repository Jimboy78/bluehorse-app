import { z } from 'zod';
import {
  BASELINE_SOURCES,
  BODY_REGIONS,
  EQUIPMENT_CATEGORIES,
  EXPERIENCE_LEVELS,
  GOALS,
  LOAD_UNITS,
  MODALITIES,
  MOVEMENT_PATTERNS,
  MUSCLE_GROUPS,
  SEXES,
} from './enums.ts';

/**
 * Validación en los bordes: respuestas de Supabase, formularios y rulesets.
 * Adentro del dominio se confía en los tipos de TypeScript.
 */

export const loadUnitSchema = z.enum(LOAD_UNITS);
export const goalSchema = z.enum(GOALS);
export const experienceLevelSchema = z.enum(EXPERIENCE_LEVELS);
export const sexSchema = z.enum(SEXES);
export const movementPatternSchema = z.enum(MOVEMENT_PATTERNS);
export const modalitySchema = z.enum(MODALITIES);
export const equipmentCategorySchema = z.enum(EQUIPMENT_CATEGORIES);
export const muscleGroupSchema = z.enum(MUSCLE_GROUPS);
export const bodyRegionSchema = z.enum(BODY_REGIONS);
export const baselineSourceSchema = z.enum(BASELINE_SOURCES);

export const loadReadingSchema = z.object({
  value: z.number().finite().nullable(),
  unit: loadUnitSchema,
});

export const equipmentLoadSpecSchema = z.object({
  unit: loadUnitSchema,
  min: z.number().nonnegative().optional(),
  max: z.number().positive().optional(),
  increment: z.number().positive().optional(),
  stackKg: z.array(z.number().positive()).optional(),
  baseWeightKg: z.number().nonnegative().optional(),
});

export const equipmentSchema = z.object({
  id: z.uuid(),
  gymId: z.uuid(),
  name: z.string().min(1),
  category: equipmentCategorySchema,
  brand: z.string().nullable(),
  model: z.string().nullable(),
  photoUrl: z.url().nullable(),
  locationNote: z.string().nullable(),
  setupNotes: z.string().nullable(),
  load: equipmentLoadSpecSchema,
  quantity: z.number().int().positive(),
  isActive: z.boolean(),
});

export const exerciseSchema = z.object({
  id: z.uuid(),
  gymId: z.uuid().nullable(),
  name: z.string().min(1),
  pattern: movementPatternSchema,
  primaryMuscles: z.array(muscleGroupSchema).min(1),
  secondaryMuscles: z.array(muscleGroupSchema),
  modality: modalitySchema,
  isCompound: z.boolean(),
  isUnilateral: z.boolean(),
  skillLevel: experienceLevelSchema,
  cues: z.string().nullable(),
  equipmentIds: z.array(z.uuid()),
});

/** Lo que el usuario carga al terminar una serie. El borde más caliente de la app. */
export const setEntrySchema = z.object({
  load: loadReadingSchema,
  reps: z.number().int().min(0).max(200).nullable(),
  rir: z.number().int().min(0).max(10).nullable(),
  durationSeconds: z.number().int().min(0).nullable(),
  distanceMeters: z.number().min(0).nullable(),
  restActualSeconds: z.number().int().min(0).nullable(),
  isWarmup: z.boolean().default(false),
});

export type SetEntry = z.infer<typeof setEntrySchema>;
