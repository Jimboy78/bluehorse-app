import { formatLoad } from '@bh/domain';
import { Clock, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { activeRuleset } from '../lib/engine.ts';
import type { ManualPlanItem, ManualPlanSession } from '../lib/manual-plan.ts';
import { resumenDelItem, zonaDe } from '../lib/objetivo.ts';
import { Button, Card, ConfirmDialog } from './ui/index.ts';

/**
 * UN DÍA DEL PLAN A MANO
 *
 * Muestra lo que la persona cargó, con los números como los escribió. No hay
 * ninguna interpretación acá: ni "carga sugerida", ni "descanso recomendado".
 * Lo que se ve es lo que puso.
 *
 * Un día ya entrenado se puede editar igual. Antes quedaba bloqueado ("no se
 * toca"), y en un plan a mano —una semana que se repite sin fecha de fin—
 * eso dejaba el lunes congelado para siempre después del primer lunes. Lo
 * que se temía no pasa: `set_logs.plan_session_item_id` es `on delete set
 * null`, así que las series quedan en el historial, y Progreso y la
 * adaptación las leen por ejercicio, no por ítem del plan (regla dura 7: lo
 * real no se pierde cuando cambia lo planificado). Lo que sí cambia es que
 * sacar algo ya entrenado se confirma antes.
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
  const [sacando, setSacando] = useState<ManualPlanItem | null>(null);
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
        {
          <button
            type="button"
            onClick={() => setBorrando(true)}
            aria-label={`Borrar ${session.focus}`}
            className="shrink-0 text-slate-dim transition-colors hover:text-orange"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        }
      </div>

      {session.items.length > 0 && (
        <ul className="flex flex-col divide-y divide-line/70">
          {session.items.map((item) => (
            <li key={item.id}>
              <ItemRow
                item={item}
                onDelete={() => (yaEntrenada ? setSacando(item) : onDeleteItem(item.id))}
              />
            </li>
          ))}
        </ul>
      )}

      {cargando ? (
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
        {yaEntrenada && ' Lo que ya entrenaste ese día queda en tu historial.'}
      </ConfirmDialog>

      <ConfirmDialog
        open={sacando !== null}
        title={`¿Sacar ${sacando?.exerciseName ?? ''}?`}
        confirmLabel="Sacarlo"
        confirmVariant="danger"
        onConfirm={() => {
          if (sacando) onDeleteItem(sacando.id);
          setSacando(null);
        }}
        onCancel={() => setSacando(null)}
      >
        Ya lo entrenaste este día. Tus series quedan en tu historial y en Progreso; lo que cambia es
        lo que te toca las próximas veces.
      </ConfirmDialog>
    </Card>
  );
}

function ItemRow({
  item,
  onDelete,
}: {
  readonly item: ManualPlanItem;
  readonly onDelete: () => void;
}) {
  const resumen = resumenDelItem({
    ...item,
    zone: zonaDe(item.intensityZone, activeRuleset.cardio?.zones),
  });
  const cardio = item.durationSeconds !== null;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold">{item.exerciseName}</p>
        <p className="text-[0.65rem] text-slate-dim">
          {resumen}
          {/* La carga se muestra cruda, en la unidad de la máquina (regla dura 6). */}
          {item.targetLoad && ` · ${formatLoad(item.targetLoad)}`}
          {item.targetRir !== null && ` · RIR ${item.targetRir}`}
          {!cardio && ` · ${item.restSeconds}s de descanso`}
        </p>
        {item.equipmentName && (
          <p className="truncate text-[0.6rem] text-slate-dim">{item.equipmentName}</p>
        )}
      </div>
      {
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Sacar ${item.exerciseName}`}
          className="shrink-0 text-slate-dim transition-colors hover:text-orange"
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      }
    </div>
  );
}
