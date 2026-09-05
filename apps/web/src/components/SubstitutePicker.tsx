import type { Id } from '@bh/domain';
import type { SubstituteOption } from '@bh/engine';
import { AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo } from 'react';
import { useGymCatalog } from '../lib/catalog.ts';
import { activeRuleset, engine, engineContext } from '../lib/engine.ts';
import { fadeUp, tappable } from '../lib/motion.ts';

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
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3 rounded-xl border border-line bg-navy-soft p-4"
    >
      <h3 className="text-sm font-semibold">¿Con qué la reemplazamos?</h3>

      {catalog.isPending && <p className="text-xs text-slate">Buscando alternativas…</p>}

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
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-navy px-3.5 py-2.5 text-left text-sm"
            >
              <span className="flex flex-col">
                <span className="font-semibold">{exercise?.name ?? 'Ejercicio'}</span>
                <span className="text-xs text-slate">{option.reason}</span>
              </span>
              <span className="shrink-0 text-xs font-mono text-teal">
                {Math.round(option.equivalence * 100)}%
              </span>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        type="button"
        {...tappable}
        onClick={onCancel}
        className="rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-slate"
      >
        Cancelar
      </motion.button>
    </motion.div>
  );
}
