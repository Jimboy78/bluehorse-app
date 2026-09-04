import { formatLoad } from '@bh/domain';
import { useMemo } from 'react';
import { useAuth } from './auth/AuthProvider.tsx';
import { activeRuleset, engine, engineContext } from './engine.ts';
import { PLACEHOLDER_GYM, PLACEHOLDER_USER } from './placeholder-gym.ts';

/**
 * La sesión "de hoy", calculada con el motor real contra el gimnasio de
 * ejemplo. Cuando `apps/web/src/lib/placeholder-gym.ts` se reemplace por
 * datos leídos de la base (catálogo real de Blue Horse), este hook cambia
 * de dónde saca `gym` y `user` y nada más — la llamada al motor es la misma.
 */
export interface TodaySessionItem {
  readonly exerciseId: string;
  readonly name: string;
  readonly sector: string;
  /** Ya formateada tal como la máquina la muestra: nunca convertida. */
  readonly load: string;
  readonly sets: number;
  readonly reps: string;
  readonly rationale: string;
}

export interface TodaySession {
  readonly label: string;
  readonly focus: string;
  readonly items: readonly TodaySessionItem[];
  readonly warnings: readonly string[];
}

export function useTodaySession(): TodaySession | null {
  const { user } = useAuth();

  return useMemo(() => {
    const seedSource = user?.id ?? 'sesion-anonima-de-ejemplo';
    const context = engineContext(seedSource);

    const plan = engine.generatePlan({
      context,
      user: PLACEHOLDER_USER,
      gym: PLACEHOLDER_GYM,
      ruleset: activeRuleset,
    });

    const session = plan.sessions[0];
    if (!session) return null;

    const exerciseById = new Map(PLACEHOLDER_GYM.exercises.map((e) => [e.id, e]));
    const equipmentById = new Map(PLACEHOLDER_GYM.equipment.map((e) => [e.id, e]));

    const items: TodaySessionItem[] = session.items.map((item) => {
      const exercise = exerciseById.get(item.exerciseId);
      const equipment = item.equipmentId ? equipmentById.get(item.equipmentId) : undefined;
      return {
        exerciseId: item.exerciseId,
        name: exercise?.name ?? 'Ejercicio de ejemplo',
        sector: equipment?.locationNote ?? 'sector de ejemplo',
        load: item.targetLoad ? formatLoad(item.targetLoad) : 'sin carga previa',
        sets: item.targetSets,
        reps: `${item.targetRepsMin}-${item.targetRepsMax}`,
        rationale: item.rationale,
      };
    });

    return { label: session.label, focus: session.focus, items, warnings: plan.warnings };
  }, [user?.id]);
}
