import { EXPERIENCE_LEVELS, MODALITIES, MOVEMENT_PATTERNS, MUSCLE_GROUPS } from '@bh/domain';
import { z } from 'zod';

/**
 * Validación del alta de ejercicios en el panel admin. Espeja `exercises`
 * (supabase/schemas/03_catalog.sql) + la selección de equipamiento que va a
 * `exercise_equipment`, que no es una columna de `exercises` sino una tabla
 * aparte — por eso vive acá como un campo más del formulario y se separa
 * recién al mapear a filas de inserción.
 */
export const exerciseFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Ingresá un nombre.').max(120),
    pattern: z.enum(MOVEMENT_PATTERNS, { message: 'Elegí un patrón de movimiento.' }),
    primaryMuscles: z.array(z.enum(MUSCLE_GROUPS)).min(1, 'Elegí al menos un músculo principal.'),
    secondaryMuscles: z.array(z.enum(MUSCLE_GROUPS)),
    modality: z.enum(MODALITIES, { message: 'Elegí cómo se registra.' }),
    isCompound: z.boolean(),
    isUnilateral: z.boolean(),
    skillLevel: z.enum(EXPERIENCE_LEVELS, { message: 'Elegí el nivel mínimo.' }),
    cues: z.string().trim().max(400),
    /** IDs de `equipment` donde se puede hacer. Vacío = ejercicio de peso corporal puro. */
    equipmentIds: z.array(z.uuid()),
  })
  .refine((v) => v.modality === 'reps_bodyweight' || v.equipmentIds.length > 0, {
    message: 'Elegí en qué estación se hace, o marcá "peso corporal" si no necesita ninguna.',
    path: ['equipmentIds'],
  });

export type ExerciseFormInput = z.infer<typeof exerciseFormSchema>;
