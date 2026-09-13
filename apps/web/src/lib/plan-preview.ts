import type { Id, MovementPattern, MuscleGroup, UserConstraint } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import type {
  GymSnapshot,
  PlanBlueprint,
  SessionBlueprint,
  SessionItemBlueprint,
  SubstituteOption,
} from '@bh/engine';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { fetchGymCatalog } from './catalog.ts';
import { activeRuleset, engine, engineContext } from './engine.ts';
import { fetchUserSnapshot, persistBlueprint } from './plan.ts';
import { requireSupabase } from './supabase.ts';

/**
 * VISTA PREVIA DEL PLAN
 *
 * Hasta acá, terminar el onboarding generaba el plan y lo guardaba en el mismo
 * gesto: la persona apretaba "Empezar" y aparecía en "Hoy" con una rutina que
 * nunca había visto. Si algún ejercicio no le servía, no había forma de saberlo
 * antes de estar parado frente a la máquina.
 *
 * Esto parte ese gesto en dos. El motor es puro, así que armar el plan no
 * cuesta nada y no toca la base: se puede mostrar, cambiar y recién después
 * guardar. Lo que se guarda es exactamente lo que se vio.
 *
 * Lo que la previa NO hace es cambiar los números. Series, repeticiones, RIR y
 * descanso siguen saliendo del ruleset (regla dura 3): se puede cambiar QUÉ
 * ejercicio, nunca CUÁNTO. Un ejercicio elegido a mano hereda la prescripción
 * del que reemplaza, igual que la sustitución por máquina ocupada.
 */

export interface PreviewItem {
  /** Estable entre re-render y sustituciones: es la posición, no el ejercicio. */
  readonly key: string;
  readonly exerciseId: Id;
  readonly equipmentId: Id | null;
  readonly name: string;
  /** Dónde está la estación, o `null` si el catálogo todavía no lo tiene. */
  readonly sector: string | null;
  readonly pattern: MovementPattern;
  readonly primaryMuscles: readonly MuscleGroup[];
  /** Indicaciones de ejecución del catálogo, si las tiene. */
  readonly cues: string | null;
  readonly sets: number;
  /** "8-12", o "4 × 4 min · 3 min suave" en un bloque de cardio. */
  readonly reps: string;
  readonly load: string;
  readonly restSeconds: number;
  readonly rationale: string;
  /** `true` si se cambió a mano en la previa: la fila lo dice. */
  readonly swapped: boolean;
}

export interface PreviewSession {
  readonly sequenceIndex: number;
  readonly label: string;
  readonly focus: string;
  readonly estimatedMinutes: number;
  readonly items: readonly PreviewItem[];
}

export interface PlanPreview {
  /** Lo que se va a guardar, tal cual. Se edita con `swapPreviewItem`. */
  readonly blueprint: PlanBlueprint;
  readonly sessions: readonly PreviewSession[];
  readonly warnings: readonly string[];
  /** El catálogo, para buscar alternativas sin volver a pedirlo a la base. */
  readonly gym: GymSnapshot;
  /** Qué combinación es esta. Sube de a uno con "probá otra". */
  readonly variant: number;
  /**
   * Molestias y lesiones vigentes. Viajan con la previa porque buscar
   * equivalentes las necesita: sin esto `previewSubstitutes` corría con
   * `constraints: []` y podía ofrecer justo lo que la lesión prohíbe.
   */
  readonly constraints: readonly UserConstraint[];
  readonly totalSets: number;
}

// ------------------------------------------------------------------ armado

/** Nombres y ubicaciones para lo que el motor devuelve como ids. */
function describe(blueprint: PlanBlueprint, gym: GymSnapshot, swapped: ReadonlySet<string>) {
  const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));
  const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));

  return blueprint.sessions.map((session) => ({
    sequenceIndex: session.sequenceIndex,
    label: session.label,
    focus: session.focus,
    estimatedMinutes: session.estimatedMinutes,
    items: session.items.map((item) => {
      const key = itemKey(session.sequenceIndex, item.orderIndex);
      const exercise = exerciseById.get(item.exerciseId);
      const equipment = item.equipmentId ? equipmentById.get(item.equipmentId) : undefined;
      return {
        key,
        exerciseId: item.exerciseId,
        equipmentId: item.equipmentId,
        name: exercise?.name ?? 'Ejercicio',
        // `null` y no "sin ubicación": las 58 estaciones todavía no tienen
        // `location_note` cargado, y repetir "sin ubicación" en cada fila
        // ocupa el lugar de un dato sin ser uno. La pantalla lo omite.
        sector: equipment?.locationNote ?? null,
        pattern: exercise?.pattern ?? 'isolation',
        primaryMuscles: exercise?.primaryMuscles ?? [],
        cues: exercise?.cues ?? null,
        sets: item.targetSets,
        reps: describeReps(item),
        load: item.targetLoad ? formatLoad(item.targetLoad) : 'a calibrar',
        restSeconds: item.restSeconds,
        rationale: item.rationale,
        swapped: swapped.has(key),
      } satisfies PreviewItem;
    }),
  }));
}

export function itemKey(sequenceIndex: number, orderIndex: number): string {
  return `s${sequenceIndex}-i${orderIndex}`;
}

/** Mismo criterio que la pantalla "Hoy": un bloque de cardio se lee en minutos. */
function describeReps(item: SessionItemBlueprint): string {
  if (item.targetDurationSeconds === null) {
    return `${item.targetRepsMin}-${item.targetRepsMax}`;
  }
  const minutes = Math.round(item.targetDurationSeconds / 60);
  if (item.targetIntervalRestSeconds !== null) {
    const rest = Math.round(item.targetIntervalRestSeconds / 60);
    return `${item.targetSets} × ${minutes} min · ${rest} min suave`;
  }
  return `${minutes} min`;
}

function countSets(blueprint: PlanBlueprint): number {
  return blueprint.sessions.reduce(
    (total, session) => total + session.items.reduce((sub, item) => sub + item.targetSets, 0),
    0,
  );
}

/**
 * Arma la previa a partir de un blueprint y el catálogo. Pura: no toca la red
 * ni la base, así que se testea sin ninguna de las dos.
 */
export function toPreview(
  blueprint: PlanBlueprint,
  gym: GymSnapshot,
  variant: number,
  constraints: readonly UserConstraint[] = [],
  swapped: ReadonlySet<string> = new Set(),
): PlanPreview {
  return {
    blueprint,
    sessions: describe(blueprint, gym, swapped),
    warnings: blueprint.warnings,
    gym,
    variant,
    constraints,
    totalSets: countSets(blueprint),
  };
}

/**
 * Arma el plan sin guardarlo. Lee lo mismo que `useGeneratePlan` (perfil,
 * objetivo, molestias, baselines, catálogo) y corre el motor: la única
 * diferencia es que el resultado se queda en memoria.
 */
export function useBuildPlanPreview() {
  const { user } = useAuth();

  return useMutation<PlanPreview, Error, number | undefined>({
    mutationFn: async (variant = 0) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();

      const userSnapshot = await fetchUserSnapshot(client, user.id);
      const { gym } = await fetchGymCatalog(client, userSnapshot.profile.gymId);

      const blueprint = engine.generatePlan({
        context: engineContext(user.id, new Date(), variant),
        user: userSnapshot,
        gym,
        ruleset: activeRuleset,
      });

      return toPreview(blueprint, gym, variant, userSnapshot.constraints);
    },
  });
}

// ------------------------------------------------------------------ cambiar

/**
 * Reemplaza un ejercicio en la previa. Los objetivos no se tocan: el ejercicio
 * nuevo hereda series, repeticiones, RIR, carga y descanso del que sale — es
 * la misma regla que la sustitución por máquina ocupada, y es lo que mantiene
 * la prescripción del lado del ruleset.
 *
 * El cambio vale para TODA la cola, no solo para la fila que se tocó. La cola
 * repite la sesión A cuatro veces: cambiar la sentadilla en la primera y
 * dejarla en las otras tres no es lo que nadie quiso decir con "cambialo" —
 * el ejercicio volvía en la sesión 3 y la persona tenía que cambiarlo de
 * nuevo, sesión por sesión.
 */
export function swapPreviewItem(
  preview: PlanPreview,
  key: string,
  option: SubstituteOption,
): PlanPreview {
  const target = preview.sessions.flatMap((s) => s.items).find((i) => i.key === key);
  if (!target) return preview;

  const salienteId = target.exerciseId;
  const original = preview.gym.exercises.find((e) => e.id === salienteId);
  const swapped = new Set(
    preview.sessions.flatMap((s) => s.items.filter((i) => i.swapped)).map((i) => i.key),
  );

  const sessions: SessionBlueprint[] = preview.blueprint.sessions.map((session) => ({
    ...session,
    items: session.items.map((item) => {
      if (item.exerciseId !== salienteId) return item;
      swapped.add(itemKey(session.sequenceIndex, item.orderIndex));
      return {
        ...item,
        exerciseId: option.exerciseId,
        equipmentId: option.equipmentId,
        // El `rationale` del motor nombra al ejercicio que salió: dejarlo tal
        // cual sería explicar un ejercicio que ya no está en el plan.
        rationale: original
          ? `Lo elegiste vos en lugar de ${original.name}: mismo patrón de movimiento, mismos objetivos de series y repeticiones.`
          : item.rationale,
      };
    }),
  }));

  const blueprint: PlanBlueprint = { ...preview.blueprint, sessions };
  return toPreview(blueprint, preview.gym, preview.variant, preview.constraints, swapped);
}

/** Alternativas para un ítem de la previa, calculadas por el motor. */
export function previewSubstitutes(
  preview: PlanPreview,
  item: PreviewItem,
  userId: string,
): readonly SubstituteOption[] {
  return engine.findSubstitutes({
    context: engineContext(userId, new Date(), preview.variant),
    item: { exerciseId: item.exerciseId, equipmentId: item.equipmentId },
    gym: preview.gym,
    constraints: preview.constraints,
    // Sin la estación actual en la lista de no disponibles, el motor puede
    // devolver el mismo ejercicio que ya está puesto.
    unavailableEquipmentIds: item.equipmentId ? [item.equipmentId] : [],
    ruleset: activeRuleset,
  });
}

// ------------------------------------------------------------------ guardar

/**
 * Guarda la previa tal como quedó. Reusa exactamente el mismo camino que
 * `useGeneratePlan` (`persistBlueprint`): la previa no es una segunda forma de
 * escribir un plan, es la misma con una pantalla en el medio.
 */
export function useConfirmPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<string, Error, PlanPreview>({
    mutationFn: async (preview) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();
      const userSnapshot = await fetchUserSnapshot(client, user.id);
      return persistBlueprint(
        client,
        user.id,
        userSnapshot.profile.gymId,
        preview.blueprint,
        userSnapshot.goals[0],
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
    },
  });
}

/**
 * "Este ejercicio no me lo propongas más." Se guarda como `avoid_exercise` en
 * `user_constraints`, que es de donde el motor ya lee para no volver a
 * ponerlo: no hace falta ninguna tabla nueva ni ninguna regla nueva.
 */
export function useAvoidExercise() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Id>({
    mutationFn: async (exerciseId) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();
      const { error } = await client.from('user_constraints').insert({
        user_id: user.id,
        type: 'avoid_exercise',
        exercise_id: exerciseId,
        severity: 3,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
    },
  });
}
