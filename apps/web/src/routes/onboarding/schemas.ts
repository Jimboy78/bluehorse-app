import { EXPERIENCE_LEVELS, GOALS, SEXES } from '@bh/domain';
import { z } from 'zod';

/**
 * Validación del wizard de onboarding, un schema por paso. Vive en la app web
 * (no en @bh/domain) porque es la forma de un formulario, no una entidad del
 * dominio: la entidad (`Profile`, `UserGoal`) ya está en @bh/domain/entities.
 */

export const goalStepSchema = z.object({
  goal: z.enum(GOALS, { message: 'Elegí un objetivo.' }),
  sport: z.string().trim().max(60).optional(),
});

export const personalStepSchema = z.object({
  birthDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Ingresá una fecha válida.')
    .refine((v) => {
      const age = yearsSince(v);
      return age >= 13 && age <= 100;
    }, 'La edad tiene que estar entre 13 y 100 años.'),
  sex: z.enum(SEXES),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, { message: 'Elegí tu nivel.' }),
});

export const frequencyStepSchema = z.object({
  sessionsPerWeekTarget: z.coerce.number().int().min(1).max(7),
  sessionMinutesTarget: z.coerce.number().int().min(15).max(180),
});

/**
 * Paso de calibración. `baselineMode` es solo informativo en el MVP: no hay
 * catálogo cargado todavía, así que no se puede pedir carga por ejercicio acá.
 * La calibración real ocurre en la primera sesión, contra equipamiento real.
 */
export const calibrationStepSchema = z.object({
  baselineMode: z.enum(['declared', 'calibrate']),
});

export const onboardingSchema = goalStepSchema
  .extend(personalStepSchema.shape)
  .extend(frequencyStepSchema.shape)
  .extend(calibrationStepSchema.shape);

export type OnboardingInput = z.infer<typeof onboardingSchema>;

function yearsSince(isoDate: string): number {
  const ms = Date.now() - Date.parse(isoDate);
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}
