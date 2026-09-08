import type { Id } from '@bh/domain';
import type { SubstituteOption } from '@bh/engine';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useGymCatalog } from '../lib/catalog.ts';
import { activeRuleset, engine, engineContext } from '../lib/engine.ts';
import { tappable } from '../lib/motion.ts';
import { Button, Card, Skeleton } from './ui/index.ts';

/**
 * "Esta máquina está ocupada": ofrece un reemplazo equivalente calculado por
 * el motor real, contra el catálogo real del gimnasio (con el mismo
 * fallback a placeholder que el resto de la app). No toca `plan_session_items`
 * — es una decisión de ese momento, no una reescritura del plan.
 */
export function SubstitutePicker({
  userId,
  gymId,
  exerciseId,
  equipmentId,
  onPick,
  onCancel,
}: {
  userId: string | undefined;
  gymId: string | null;
  exerciseId: Id;
  equipmentId: Id | null;
  onPick: (option: SubstituteOption, exerciseName: string, sector: string) => void;
  onCancel: () => void;
}) {
  const catalog = useGymCatalog(gymId);

  const options = useMemo<readonly SubstituteOption[]>(() => {
    if (!catalog.data) return [];
    return engine.findSubstitutes({
      context: engineContext(userId ?? 'sin-sesion'),
      item: { exerciseId, equipmentId },
      gym: catalog.data.gym,
      constraints: [],
      unavailableEquipmentIds: equipmentId ? [equipmentId] : [],
      ruleset: activeRuleset,
    });
  }, [catalog.data, userId, exerciseId, equipmentId]);

  const exerciseById = new Map((catalog.data?.gym.exercises ?? []).map((e) => [e.id, e]));
  const equipmentById = new Map((catalog.data?.gym.equipment ?? []).map((e) => [e.id, e]));

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em]">
        ¿Con qué la reemplazamos?
      </h3>

      {catalog.isPending && (
        <div role="status" className="flex flex-col gap-1.5">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <span className="sr-only">Buscando alternativas…</span>
        </div>
      )}

      {!catalog.isPending && options.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-slate">
          <AlertCircle size={13} aria-hidden="true" />
          No encontramos un reemplazo equivalente con lo que hay disponible.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {options.map((option) => {
          const exercise = exerciseById.get(option.exerciseId);
          const equipment = option.equipmentId ? equipmentById.get(option.equipmentId) : undefined;
          return (
            <motion.button
              key={option.exerciseId}
              type="button"
              {...tappable}
              onClick={() =>
                onPick(
                  option,
                  exercise?.name ?? 'Ejercicio',
                  equipment?.locationNote ?? 'sin ubicación',
                )
              }
              className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-navy px-3.5 py-3 text-left transition-colors hover:border-brand/50"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold">{exercise?.name ?? 'Ejercicio'}</span>
                <span className="text-xs leading-snug text-slate">{option.reason}</span>
              </span>
              {/* Cuánto se parece al original, que es la única forma de elegir
                  entre dos reemplazos sin saber de biomecánica. */}
              <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-brand">
                {Math.round(option.equivalence * 100)}%
              </span>
            </motion.button>
          );
        })}
      </div>

      <Button variant="quiet" size="sm" onClick={onCancel}>
        Cancelar
      </Button>
    </Card>
  );
}
