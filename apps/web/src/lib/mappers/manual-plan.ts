import type { LoadReading, LoadUnit } from '@bh/domain';
import { LOAD_UNITS } from '@bh/domain';
import { z } from 'zod';
import type { PlanSessionItemInsertRow } from './plan.ts';

/**
 * PLANES ARMADOS A MANO
 *
 * El motor devuelve un `PlanBlueprint` completo y `mappers/plan.ts` lo traduce
 * de una. Un plan manual no existe de una: nace vacío y crece de a un día y de
 * a un ejercicio, cada uno con lo que la persona escribió en un formulario.
 * Por eso la traducción vive acá y no ahí — no hay blueprint del que partir.
 *
 * **Lo que se guarda en nulo, se guarda en nulo a propósito.** `ruleset_version`
 * y `template_id` del plan, y `rationale` del ítem, son los tres campos que
 * solo tienen sentido si hubo motor. Rellenarlos con el ruleset activo o con
 * una frase armada sería presentar como respaldado algo que la persona eligió
 * sola, que es justo lo que prohíbe la regla dura 4.
 *
 * Los rangos de validación de acá no son prescripción (regla dura 3): son el
 * ancho de la columna y el filtro contra el error de tipeo. Nada de esto le
 * dice a nadie cuántas series hacer.
 */

/** Lo que la columna `smallint` aguanta sin desbordar. No es una recomendación. */
const SMALLINT_MAX = 32767;

const loadUnitSchema = z.enum(LOAD_UNITS as unknown as [LoadUnit, ...LoadUnit[]]);

export const manualItemDraftSchema = z.object({
  exerciseId: z.string().uuid(),
  /** Nulo si el ejercicio no se hace en una estación concreta (peso corporal). */
  equipmentId: z.string().uuid().nullable(),
  targetSets: z.number().int().min(1).max(99),
  targetRepsMin: z.number().int().min(1).max(999),
  targetRepsMax: z.number().int().min(1).max(999),
  /**
   * La carga se guarda cruda, como la lee la máquina (regla dura 6). `null`
   * cuando la persona no quiso fijar ninguna: el plan igual sirve, y el número
   * lo pone el día que entrena.
   */
  targetLoad: z.object({ value: z.number().nullable(), unit: loadUnitSchema }).nullable(),
  targetRir: z.number().int().min(0).max(10).nullable(),
  restSeconds: z.number().int().min(0).max(3600),
});

export type ManualItemDraft = z.infer<typeof manualItemDraftSchema>;

/**
 * Un día del plan manual. `focus` es lo que la persona escribió ("Pierna y
 * core"); el `label` lo pone la app con la posición en la cola.
 *
 * `estimatedMinutes` lo declara la persona. El motor lo saca del template del
 * ruleset, y acá no hay template: deducirlo de la suma de descansos daría
 * menos de la mitad del tiempo real, y poner un promedio por serie sería
 * inventar un número de entrenamiento.
 */
export const manualSessionDraftSchema = z.object({
  focus: z.string().trim().min(1).max(60),
  estimatedMinutes: z.number().int().min(1).max(600),
});

export type ManualSessionDraft = z.infer<typeof manualSessionDraftSchema>;

/** El nombre de la cola: posición, no día de la semana (ver la trampa en CLAUDE.md). */
export function manualSessionLabel(sequenceIndex: number): string {
  return `Día ${sequenceIndex + 1}`;
}

export interface ManualPlanInsertRow {
  readonly user_id: string;
  readonly gym_id: string;
  readonly ruleset_version: null;
  readonly template_id: null;
  readonly name: string;
  readonly goal_snapshot: Record<string, unknown>;
  readonly status: 'archived';
  readonly warnings: readonly string[];
  readonly origin: 'manual';
}

/**
 * Un plan manual nace **guardado**, no activo: arranca sin ningún día, y un
 * plan activo vacío deja la pantalla de "Hoy" sin nada que ofrecer. Se activa
 * desde la lista cuando ya tiene con qué entrenar.
 *
 * `goal_snapshot` va vacío porque no se armó a partir de ningún objetivo: la
 * tarjeta muestra el objetivo solo cuando el plan de verdad salió de él.
 */
export function toManualPlanInsert(
  userId: string,
  gymId: string,
  name: string,
): ManualPlanInsertRow {
  return {
    user_id: userId,
    gym_id: gymId,
    ruleset_version: null,
    template_id: null,
    name: name.trim().slice(0, 60),
    goal_snapshot: {},
    status: 'archived',
    warnings: [],
    origin: 'manual',
  };
}

export interface ManualSessionInsertRow {
  readonly plan_id: string;
  readonly sequence_index: number;
  readonly label: string;
  readonly focus: string;
  readonly estimated_minutes: number;
  readonly status: 'pending';
}

export function toManualSessionInsert(
  planId: string,
  sequenceIndex: number,
  draft: ManualSessionDraft,
): ManualSessionInsertRow {
  return {
    plan_id: planId,
    sequence_index: sequenceIndex,
    label: manualSessionLabel(sequenceIndex),
    focus: draft.focus.trim(),
    estimated_minutes: draft.estimatedMinutes,
    status: 'pending',
  };
}

/**
 * Un ítem cargado a mano.
 *
 * `is_placeholder` va en `false` y no en el default `true` de la columna: esa
 * bandera dice "el ruleset que generó esto es provisorio", y acá no generó
 * nada ningún ruleset. Lo que avisa que el plan no está respaldado es
 * `plans.origin`, y se avisa una vez por plan en vez de una vez por ejercicio.
 *
 * Los tres campos de cardio quedan en nulo: esta pantalla prescribe series y
 * repeticiones. Un bloque aeróbico se pide por duración y zona, que es otro
 * formulario — ver lo declarado en `docs/adr/0007-planes-a-mano.md`.
 */
export function toManualItemInsert(
  planSessionId: string,
  orderIndex: number,
  draft: ManualItemDraft,
): PlanSessionItemInsertRow {
  const load: LoadReading | null = draft.targetLoad;
  return {
    plan_session_id: planSessionId,
    order_index: orderIndex,
    exercise_id: draft.exerciseId,
    equipment_id: draft.equipmentId,
    target_sets: draft.targetSets,
    target_reps_min: Math.min(draft.targetRepsMin, draft.targetRepsMax),
    target_reps_max: Math.max(draft.targetRepsMin, draft.targetRepsMax),
    target_load: load?.value ?? null,
    target_load_unit: load?.unit ?? null,
    target_rir: draft.targetRir,
    rest_seconds: draft.restSeconds,
    rationale: null,
    is_placeholder: false,
    target_duration_seconds: null,
    target_intensity_zone: null,
    target_interval_rest_seconds: null,
  };
}

/**
 * La próxima posición libre de una cola.
 *
 * Va con `max + 1` y no con `length`: borrar el día del medio deja un hueco en
 * `sequence_index`, y contar filas devolvería un índice ya usado, que choca
 * contra el `unique (plan_id, sequence_index)`. El hueco no molesta — la cola
 * se ordena por el índice, no exige que sean consecutivos.
 */
export function nextIndex(usados: readonly number[]): number {
  if (usados.length === 0) return 0;
  const max = Math.max(...usados);
  return Math.min(max + 1, SMALLINT_MAX);
}
