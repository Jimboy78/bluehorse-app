import { formatLoad } from '@bh/domain';
import { Clock, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { ManualPlanItem, ManualPlanSession } from '../lib/manual-plan.ts';
import { Button, Card, ConfirmDialog } from './ui/index.ts';

/**
 * UN DÍA DEL PLAN A MANO
 *
 * Muestra lo que la persona cargó, con los números como los escribió. No hay
 * ninguna interpretación acá: ni "carga sugerida", ni "descanso recomendado".
 * Lo que se ve es lo que puso.
 *
 * El día completado no se puede borrar desde acá: sus series ya están en
 * `set_logs` y borrar la sesión planificada dejaría ese registro apuntando a
 * un plan que no existe. Planificado y real son tablas distintas (regla dura
 * 7) justamente para no perder lo segundo cuando cambia lo primero.
 */
export function ManualSessionCard({
  session,
  onDelete,
  onDeleteItem,
  cargando,
  onOpenForm,
  form,
}: {
  readonly session: ManualPlanSession;
  readonly onDelete: () => void;
  readonly onDeleteItem: (itemId: string) => void;
  readonly cargando: boolean;
  readonly onOpenForm: () => void;
  readonly form: ReactNode;
}) {
  const [borrando, setBorrando] = useState(false);
  const yaEntrenada = session.status !== 'pending';

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-navy font-display text-xs font-semibold tabular-nums text-slate-dim">
          {session.sequenceIndex + 1}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate font-display text-base font-semibold leading-tight">
            {session.focus}
          </p>
          <p className="flex items-center gap-1 text-[0.65rem] text-slate-dim">
            <Clock size={10} aria-hidden="true" />
            {session.estimatedMinutes} min · {session.items.length}{' '}
            {session.items.length === 1 ? 'ejercicio' : 'ejercicios'}
          </p>
        </div>
        {!yaEntrenada && (
          <button
            type="button"
            onClick={() => setBorrando(true)}
            aria-label={`Borrar ${session.focus}`}
            className="shrink-0 text-slate-dim transition-colors hover:text-orange"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      {session.items.length > 0 && (
        <ul className="flex flex-col divide-y divide-line/70">
          {session.items.map((item) => (
            <li key={item.id}>
              <ItemRow item={item} onDelete={yaEntrenada ? null : () => onDeleteItem(item.id)} />
            </li>
          ))}
        </ul>
      )}

      {yaEntrenada ? (
        <p className="text-xs text-slate">
          Este día ya lo entrenaste. No se toca: lo que hiciste quedó registrado contra estos
          ejercicios.
        </p>
      ) : cargando ? (
        form
      ) : (
        <Button variant="ghost" size="sm" className="self-start" onClick={onOpenForm}>
          <Plus size={14} aria-hidden="true" />
          Agregar ejercicio
        </Button>
      )}

      <ConfirmDialog
        open={borrando}
        title={`¿Borrar “${session.focus}”?`}
        confirmLabel="Borrar el día"
        confirmVariant="danger"
        onConfirm={() => {
          setBorrando(false);
          onDelete();
        }}
        onCancel={() => setBorrando(false)}
      >
        Se van también los {session.items.length}{' '}
        {session.items.length === 1 ? 'ejercicio' : 'ejercicios'} que le cargaste. Los otros días
        del plan quedan como están.
      </ConfirmDialog>
    </Card>
  );
}

function ItemRow({
  item,
  onDelete,
}: {
  readonly item: ManualPlanItem;
  readonly onDelete: (() => void) | null;
}) {
  const reps =
    item.targetRepsMin === item.targetRepsMax
      ? `${item.targetRepsMin}`
      : `${item.targetRepsMin}–${item.targetRepsMax}`;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold">{item.exerciseName}</p>
        <p className="text-[0.65rem] text-slate-dim">
          {item.targetSets} × {reps}
          {/* La carga se muestra cruda, en la unidad de la máquina (regla dura 6). */}
          {item.targetLoad && ` · ${formatLoad(item.targetLoad)}`}
          {item.targetRir !== null && ` · RIR ${item.targetRir}`}
          {` · ${item.restSeconds}s de descanso`}
        </p>
        {item.equipmentName && (
          <p className="truncate text-[0.6rem] text-slate-dim">{item.equipmentName}</p>
        )}
      </div>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Sacar ${item.exerciseName}`}
          className="shrink-0 text-slate-dim transition-colors hover:text-orange"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
