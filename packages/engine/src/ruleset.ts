import type { ExperienceLevel, Goal } from '@bh/domain';
import { EXPERIENCE_LEVELS, GOALS, MOVEMENT_PATTERNS, RULESET_SOURCES } from '@bh/domain';
import { z } from 'zod';

/**
 * EL RULESET ES EL CONTENIDO. El motor es el mecanismo.
 *
 * Todos los números de entrenamiento de la app viven acá adentro. Cuando termine
 * el research, se escribe un ruleset nuevo con `source: "research"`, se activa, y
 * se regeneran los planes. No cambia una línea de `apps/web` ni de este paquete.
 *
 * Investigaciones que llenan cada parte:
 *   prescription.{strength,hypertrophy,power}   → training_program_design_strength_hypertrophy_power
 *   prescription.{cardio,endurance,recomposition} → training_program_design_cardio_endurance_recomposition
 *   modifiers                                    → training_program_individual_variables_age_sex_experience_sport
 */

export const SLOT_ROLES = ['primary', 'secondary', 'isolation'] as const;
export type SlotRole = (typeof SLOT_ROLES)[number];

const roleParamsSchema = z.object({
  sets: z.number().int().min(1).max(10),
  repsMin: z.number().int().min(1).max(100),
  repsMax: z.number().int().min(1).max(100),
  /** Reps en reserva objetivo. `null` para trabajo que no se mide así (cardio continuo). */
  rirTarget: z.number().int().min(0).max(10).nullable(),
  restSeconds: z.number().int().min(0).max(600),
});

const progressionSchema = z.object({
  /** Cuánto subir cuando corresponde. En estaciones de pin se ignora: sube un nivel. */
  stepPct: z.number().min(0).max(50),
  /** Se sube si el RIR de la serie tope fue mayor o igual a esto... */
  triggerRirAtLeast: z.number().int().min(0).max(10),
  /** ...durante esta cantidad de sesiones seguidas. */
  consecutiveSessions: z.number().int().min(1).max(10),
});

const regressionSchema = z.object({
  stepPct: z.number().min(0).max(50),
  /** Sesiones seguidas sin alcanzar el mínimo de reps antes de bajar la carga. */
  missedRepsSessions: z.number().int().min(1).max(10),
});

const deloadSchema = z.object({
  /** Sesiones sin progresar antes de proponer descarga. */
  stallSessions: z.number().int().min(1).max(20),
  /** Días de ausencia que disparan una descarga al volver. */
  absenceDays: z.number().int().min(1).max(365),
  /** Multiplicador de volumen durante la descarga. */
  volumeMultiplier: z.number().min(0.1).max(1),
});

const goalParamsSchema = z.object({
  primary: roleParamsSchema,
  secondary: roleParamsSchema,
  isolation: roleParamsSchema,
  progression: progressionSchema,
  regression: regressionSchema,
  deload: deloadSchema,
});

export type GoalParams = z.infer<typeof goalParamsSchema>;

const templateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  goals: z.array(z.enum(GOALS)).min(1),
  sessionsPerWeek: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
  sessions: z
    .array(
      z.object({
        label: z.string().min(1),
        focus: z.string().min(1),
        estimatedMinutes: z.number().int().min(10).max(180),
        slots: z
          .array(
            z.object({
              pattern: z.enum(MOVEMENT_PATTERNS),
              role: z.enum(SLOT_ROLES),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

export const rulesetSchema = z.object({
  version: z.string().min(1),
  source: z.enum(RULESET_SOURCES),
  /** Advertencias visibles: por qué estos números no son de fiar todavía. */
  notes: z.array(z.string()),
  planning: z.object({
    /** Cuántas sesiones se generan por adelantado en la cola. */
    sessionsAhead: z.number().int().min(1).max(60),
  }),
  prescription: z.record(
    z.enum(GOALS),
    z.object({
      default: goalParamsSchema,
      byLevel: z.partialRecord(z.enum(EXPERIENCE_LEVELS), goalParamsSchema.partial()).optional(),
    }),
  ),
  templates: z.array(templateSchema).min(1),
  substitution: z.object({
    /** Debajo de esto no se ofrece el reemplazo. */
    minEquivalence: z.number().min(0).max(1),
    /** Peso de compartir patrón de movimiento en el puntaje de equivalencia. */
    patternWeight: z.number().min(0).max(1),
    /** Peso de compartir músculos primarios. */
    muscleWeight: z.number().min(0).max(1),
    maxOptions: z.number().int().min(1).max(10),
  }),
  /** Plantillas de texto para el "por qué va acá". `{exercise}` se reemplaza. */
  rationale: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
    isolation: z.string().min(1),
  }),
});

export type Ruleset = z.infer<typeof rulesetSchema>;

/** Valida un ruleset crudo. Se llama al cargarlo, no en cada uso. */
export function parseRuleset(raw: unknown): Ruleset {
  return rulesetSchema.parse(raw);
}

/**
 * Parámetros efectivos para un objetivo y nivel: el `default` del objetivo con
 * los ajustes de nivel encima. Si el ruleset no cubre el objetivo, tira error:
 * es preferible fallar a inventar una prescripción.
 */
export function resolveParams(ruleset: Ruleset, goal: Goal, level: ExperienceLevel): GoalParams {
  const block = ruleset.prescription[goal];
  if (!block) {
    throw new Error(
      `El ruleset ${ruleset.version} no define prescripción para el objetivo "${goal}".`,
    );
  }
  const override = block.byLevel?.[level];
  if (!override) return block.default;

  // Merge explícito: un `byLevel` puede pisar un bloque suelto (solo `primary`,
  // por ejemplo) y el resto tiene que caer al default sin quedar `undefined`.
  const base = block.default;
  return {
    primary: override.primary ?? base.primary,
    secondary: override.secondary ?? base.secondary,
    isolation: override.isolation ?? base.isolation,
    progression: override.progression ?? base.progression,
    regression: override.regression ?? base.regression,
    deload: override.deload ?? base.deload,
  };
}

/** `true` cuando lo generado no debe presentarse como consejo real. */
export function isPlaceholder(ruleset: Ruleset): boolean {
  return ruleset.source === 'placeholder';
}
