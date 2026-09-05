import { formatLoad } from '@bh/domain';
import { useMemo } from 'react';
import { useAuth } from './auth/AuthProvider.tsx';
import { useGymCatalog } from './catalog.ts';
import { activeRuleset, engine, engineContext } from './engine.ts';
import { useProfileStatus } from './onboarding.ts';
import { PLACEHOLDER_GYM, PLACEHOLDER_USER } from './placeholder-gym.ts';

/**
 * La sesión "de hoy", calculada con el motor real contra el catálogo del
 * gimnasio del socio (`useGymCatalog`), que a su vez cae al gimnasio de
 * ejemplo si el catálogo real todavía no tiene equipamiento cargado. El
 * componente que use este hook no necesita saber cuál de los dos está
 * activo: `isPlaceholder` ya viene resuelto.
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
  readonly isPlaceholder: boolean;
}

export function useTodaySession(): TodaySession | null {
  const { user } = useAuth();
  const profile = useProfileStatus();
  const catalog = useGymCatalog(profile.data?.gymId ?? null);

  return useMemo(() => {
    // Sin Supabase configurado, sin sesión, o mientras se resuelve la consulta
    // real: se cae al gimnasio de ejemplo. Nunca deja al usuario sin nada que ver.
    const gym = catalog.data?.gym ?? PLACEHOLDER_GYM;
    const isPlaceholder = catalog.data?.isPlaceholder ?? true;

    const seedSource = user?.id ?? 'sesion-anonima-de-ejemplo';
    const context = engineContext(seedSource);

    const plan = engine.generatePlan({
      context,
      user: PLACEHOLDER_USER,
      gym,
      ruleset: activeRuleset,
    });

    const session = plan.sessions[0];
    if (!session) return null;

    const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));
    const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));

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

    return {
      label: session.label,
      focus: session.focus,
      items,
      warnings: plan.warnings,
      isPlaceholder,
    };
  }, [user?.id, catalog.data]);
}
