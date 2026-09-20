import { EXPERIENCE_LEVELS, GOALS, SEASON_PHASES, SECONDARY_GOALS, SEXES } from '@bh/domain';
import { z } from 'zod';
import { activeRuleset } from '../../lib/engine.ts';

/**
 * Validación del wizard de onboarding, un schema por paso. Vive en la app web
 * (no en @bh/domain) porque es la forma de un formulario, no una entidad del
 * dominio: la entidad (`Profile`, `UserGoal`) ya está en @bh/domain/entities.
 */

/**
 * Los ids que el motor sabe mapear. Era `z.string().trim().max(60)`, o sea texto
 * libre, y `user_goals.sport` guarda el id de una entrada de `sports.catalog`:
 * el motor busca por id exacto y si no encuentra sigue sin deporte, callado.
 *
 * Medido sobre 17 formas de escribir un deporte, solo 6 matchean: fallan todas
 * las que llevan mayúscula o tilde. La pantalla ahora es una lista, pero el
 * límite va acá igual — la validación es el lugar donde se dice qué vale, y un
 * schema más permisivo que la pantalla es una puerta que alguien va a usar.
 */
const SPORT_IDS = (activeRuleset.sports?.catalog ?? []).map((s) => s.id);

export const goalStepSchema = z.object({
  goal: z.enum(GOALS, { message: 'Elegí un objetivo.' }),
  sport: z
    .string()
    .trim()
    // El vacío es "no practico ninguno" y se guarda como `null` (`mappers/profile.ts`).
    .refine((v) => v === '' || SPORT_IDS.includes(v), {
      message: 'Elegí un deporte de la lista.',
    })
    .optional(),
  /**
   * Solo con deporte (`docs/research/65`). Sin deporte el mapper guarda
   * `none` pase lo que pase, y sin temporada con partidos no guarda el día.
   */
  seasonPhase: z.enum(SEASON_PHASES).optional(),
  /** 1 lunes … 7 domingo; `null` es "varía". */
  matchWeekday: z.number().int().min(1).max(7).nullable().optional(),
  /** En orden de prioridad (`docs/research/68`). */
  secondaryGoals: z.array(z.enum(SECONDARY_GOALS)).optional(),
});

/**
 * Los rangos son los mismos que los `check` de `body_metrics` en la base: si
 * se separan, el formulario deja pasar algo que el insert rechaza y el socio
 * ve un error de Postgres en vez de un mensaje.
 */
export const personalStepSchema = z.object({
  birthDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Ingresá una fecha válida.')
    .refine((v) => {
      const age = yearsSince(v);
      return age >= 13 && age <= 100;
    }, 'La edad tiene que estar entre 13 y 100 años.'),
  sex: z.enum(SEXES),
  weightKg: z.coerce
    .number({ message: 'Ingresá tu peso en kilos.' })
    .min(25, 'El peso tiene que estar entre 25 y 350 kg.')
    .max(350, 'El peso tiene que estar entre 25 y 350 kg.'),
  heightCm: z.coerce
    .number({ message: 'Ingresá tu altura en centímetros.' })
    .min(100, 'La altura tiene que estar entre 100 y 250 cm.')
    .max(250, 'La altura tiene que estar entre 100 y 250 cm.'),
});

export const experienceStepSchema = z.object({
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
  .extend(experienceStepSchema.shape)
  .extend(frequencyStepSchema.shape)
  .extend(calibrationStepSchema.shape);

export type OnboardingInput = z.infer<typeof onboardingSchema>;

function yearsSince(isoDate: string): number {
  const ms = Date.now() - Date.parse(isoDate);
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}
