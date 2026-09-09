import type { SubstituteOption } from '@bh/engine';
import {
  AlertCircle,
  Check,
  ChevronDown,
  Clock,
  Info,
  Layers,
  PenLine,
  Repeat2,
  Shuffle,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { listContainer, listItem, spring, tappable } from '../lib/motion.ts';
import type { PlanPreview as Preview, PreviewItem, PreviewSession } from '../lib/plan-preview.ts';
import { previewSubstitutes, swapPreviewItem } from '../lib/plan-preview.ts';
import {
  Button,
  Card,
  muscleSummary,
  Notice,
  PATTERN_LABELS,
  PatternIcon,
  SectionLabel,
} from './ui/index.ts';

/**
 * ASÍ QUEDA TU PLAN
 *
 * La pantalla que faltaba entre "terminé de contestar" y "estoy entrenando".
 * Hasta acá el plan aparecía ya hecho en "Hoy", sin que la persona lo hubiera
 * visto nunca: si algún ejercicio no le servía se enteraba parada frente a la
 * máquina, y para entonces ya no había nada que hacer salvo saltearlo.
 *
 * Lo que se puede cambiar acá es QUÉ ejercicio, nunca CUÁNTO: series,
 * repeticiones, RIR y descanso salen del ruleset (regla dura 3). Un ejercicio
 * elegido a mano hereda la prescripción del que reemplaza, igual que cuando la
 * máquina está ocupada.
 */

export function PlanPreview({
  preview,
  userId,
  busy,
  regenerating,
  onChange,
  onRegenerate,
  onConfirm,
  onAvoid,
}: {
  readonly preview: Preview;
  readonly userId: string;
  readonly busy: boolean;
  readonly regenerating: boolean;
  readonly onChange: (next: Preview) => void;
  readonly onRegenerate: () => void;
  readonly onConfirm: () => void;
  readonly onAvoid: (exerciseId: string) => void;
}) {
  const [openSession, setOpenSession] = useState(0);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const totalMinutes = preview.sessions.reduce((sum, s) => sum + s.estimatedMinutes, 0);
  // Ejercicios distintos, no filas: un cambio se aplica a las cuatro sesiones
  // donde aparecía, y decir "cambiaste 4 ejercicios" por un solo toque miente.
  const swaps = new Set(
    preview.sessions
      .flatMap((s) => s.items)
      .filter((i) => i.swapped)
      .map((i) => i.exerciseId),
  ).size;

  function handlePick(item: PreviewItem, option: SubstituteOption) {
    onChange(swapPreviewItem(preview, item.key, option));
    setEditingKey(null);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <p className="flex items-center gap-1.5 font-display text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand">
          <Sparkles size={13} aria-hidden="true" />
          Listo
        </p>
        <h1 className="font-display text-[2.2rem] font-semibold uppercase leading-[1] tracking-tight">
          Así queda tu plan
        </h1>
        <p className="text-sm leading-relaxed text-slate">
          Revisalo antes de empezar. Si algún ejercicio no te sirve, cambialo acá — los objetivos de
          series y repeticiones no cambian.
        </p>
      </div>

      <PlanSummary
        sessions={preview.sessions.length}
        sets={preview.totalSets}
        minutes={totalMinutes}
      />

      {preview.warnings.length > 0 && (
        <Notice tone="warn" icon={<AlertCircle size={15} aria-hidden="true" />}>
          <span className="flex flex-col gap-1">
            {preview.warnings.map((warning) => (
              <span key={warning}>{warning}</span>
            ))}
          </span>
        </Notice>
      )}

      <div className="flex flex-col gap-2.5">
        <SectionLabel icon={<Layers size={13} aria-hidden="true" />}>
          {preview.sessions.length === 1
            ? 'La sesión'
            : `Las ${preview.sessions.length} sesiones de la cola`}
        </SectionLabel>

        {preview.sessions.map((session, index) => (
          <SessionBlock
            key={session.sequenceIndex}
            session={session}
            open={openSession === index}
            editingKey={editingKey}
            userId={userId}
            preview={preview}
            onToggle={() => setOpenSession(openSession === index ? -1 : index)}
            onEdit={setEditingKey}
            onPick={handlePick}
            onAvoid={onAvoid}
          />
        ))}
      </div>

      {swaps > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-brand">
          <Repeat2 size={13} aria-hidden="true" />
          {swaps === 1 ? 'Cambiaste 1 ejercicio.' : `Cambiaste ${swaps} ejercicios.`}
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        <Button variant="primary" size="lg" disabled={busy || regenerating} onClick={onConfirm}>
          {busy && <Spin />}
          <Check size={16} aria-hidden="true" />
          Confirmar y empezar
        </Button>
        <Button variant="ghost" size="lg" disabled={busy || regenerating} onClick={onRegenerate}>
          {regenerating ? <Spin /> : <Shuffle size={15} aria-hidden="true" />}
          Probá otra combinación
        </Button>
        <p className="px-1 text-center text-xs leading-relaxed text-slate-dim">
          Podés cambiar cualquier ejercicio más adelante, y la app ajusta las cargas sola con lo que
          registres entrenando.
        </p>
      </div>
    </motion.section>
  );
}

function Spin() {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
    />
  );
}

/** Los tres números que contestan "¿en qué me estoy metiendo?" de un vistazo. */
function PlanSummary({
  sessions,
  sets,
  minutes,
}: {
  readonly sessions: number;
  readonly sets: number;
  readonly minutes: number;
}) {
  return (
    <Card tone="brand" className="grid grid-cols-3 divide-x divide-brand/15 px-2 py-4">
      <Stat value={sessions} label={sessions === 1 ? 'sesión' : 'sesiones'} />
      <Stat value={sets} label="series" />
      <Stat value={`${Math.round(minutes / sessions)}′`} label="por sesión" />
    </Card>
  );
}

function Stat({ value, label }: { readonly value: number | string; readonly label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-display text-2xl font-semibold tabular-nums leading-none text-brand">
        {value}
      </span>
      <span className="font-display text-[0.6rem] uppercase tracking-[0.16em] text-slate">
        {label}
      </span>
    </div>
  );
}

/**
 * Una sesión de la cola, plegable. La primera abierta y el resto cerradas:
 * con tres sesiones de cinco ejercicios, mostrarlas todas de una convierte la
 * previa en una lista de quince filas que nadie lee.
 */
function SessionBlock({
  session,
  open,
  editingKey,
  userId,
  preview,
  onToggle,
  onEdit,
  onPick,
  onAvoid,
}: {
  readonly session: PreviewSession;
  readonly open: boolean;
  readonly editingKey: string | null;
  readonly userId: string;
  readonly preview: Preview;
  readonly onToggle: () => void;
  readonly onEdit: (key: string | null) => void;
  readonly onPick: (item: PreviewItem, option: SubstituteOption) => void;
  readonly onAvoid: (exerciseId: string) => void;
}) {
  return (
    <Card animate={false} className="overflow-hidden">
      <motion.button
        type="button"
        {...tappable}
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-navy font-display text-sm font-semibold text-brand">
          {session.sequenceIndex + 1}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{session.label}</span>
          <span className="flex items-center gap-2 text-xs text-slate">
            {session.focus}
            <span className="flex items-center gap-1 text-slate-dim">
              <Clock size={11} aria-hidden="true" />
              {session.estimatedMinutes}′
            </span>
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring.settle}>
          <ChevronDown size={16} className="text-slate-dim" aria-hidden="true" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.settle}
            className="overflow-hidden"
          >
            <motion.ul
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-px border-t border-line/60 bg-line/40"
            >
              {session.items.map((item) => (
                <motion.li key={item.key} variants={listItem} className="bg-surface">
                  <PreviewRow
                    item={item}
                    editing={editingKey === item.key}
                    userId={userId}
                    preview={preview}
                    onEdit={() => onEdit(editingKey === item.key ? null : item.key)}
                    onPick={(option) => onPick(item, option)}
                    onAvoid={() => onAvoid(item.exerciseId)}
                  />
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function PreviewRow({
  item,
  editing,
  userId,
  preview,
  onEdit,
  onPick,
  onAvoid,
}: {
  readonly item: PreviewItem;
  readonly editing: boolean;
  readonly userId: string;
  readonly preview: Preview;
  readonly onEdit: () => void;
  readonly onPick: (option: SubstituteOption) => void;
  readonly onAvoid: () => void;
}) {
  const muscles = muscleSummary(item.primaryMuscles);

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3 px-4 py-3">
        <span
          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border ${
            item.swapped
              ? 'border-brand/40 bg-brand/15 text-brand'
              : 'border-line bg-navy text-slate'
          }`}
          title={PATTERN_LABELS[item.pattern]}
        >
          <PatternIcon pattern={item.pattern} size={17} />
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm font-semibold leading-tight">{item.name}</p>
          <p className="font-mono text-xs text-slate">
            {item.sets} × {item.reps}
            {muscles && <span className="font-sans text-slate-dim"> · {muscles}</span>}
          </p>
          <p className="flex items-center gap-1 text-[0.65rem] text-slate-dim">
            <Timer size={10} aria-hidden="true" />
            {item.restSeconds}s de descanso
            {item.sector && ` · ${item.sector}`}
          </p>
        </div>

        <motion.button
          type="button"
          {...tappable}
          onClick={onEdit}
          aria-expanded={editing}
          className="shrink-0 rounded-full border border-line px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-slate transition-colors hover:border-brand/50 hover:text-brand"
        >
          {editing ? <X size={13} aria-hidden="true" /> : 'Cambiar'}
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.settle}
            className="overflow-hidden"
          >
            <SwapPanel
              item={item}
              userId={userId}
              preview={preview}
              onPick={onPick}
              onAvoid={onAvoid}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Las alternativas para un ejercicio, calculadas por el mismo motor que
 * resuelve "máquina ocupada". No hay una segunda lógica de equivalencia: la
 * que ya existe recorre TODO el catálogo, no solo las máquinas.
 */
function SwapPanel({
  item,
  userId,
  preview,
  onPick,
  onAvoid,
}: {
  readonly item: PreviewItem;
  readonly userId: string;
  readonly preview: Preview;
  readonly onPick: (option: SubstituteOption) => void;
  readonly onAvoid: () => void;
}) {
  const options = previewSubstitutes(preview, item, userId);
  const exerciseById = new Map(preview.gym.exercises.map((e) => [e.id, e]));
  const equipmentById = new Map(preview.gym.equipment.map((e) => [e.id, e]));

  return (
    <div className="flex flex-col gap-2 border-t border-line/60 bg-surface-2 px-4 py-3.5">
      {item.cues && (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate">
          <Info size={12} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
          {item.cues}
        </p>
      )}

      <p className="font-display text-[0.65rem] uppercase tracking-[0.16em] text-slate-dim">
        {options.length === 0 ? 'Sin alternativas equivalentes' : 'Cambialo por'}
      </p>

      {options.length === 0 ? (
        <p className="text-xs leading-relaxed text-slate">
          Con el equipamiento que hay en el gimnasio, no encontramos otro ejercicio equivalente para
          este patrón.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {options.slice(0, 5).map((option) => {
            const exercise = exerciseById.get(option.exerciseId);
            const equipment = option.equipmentId
              ? equipmentById.get(option.equipmentId)
              : undefined;
            return (
              <motion.button
                key={option.exerciseId}
                type="button"
                {...tappable}
                onClick={() => onPick(option)}
                className="flex items-center gap-3 rounded-xl border border-line/70 bg-navy px-3 py-2.5 text-left transition-colors hover:border-brand/50"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-slate">
                  <PatternIcon pattern={exercise?.pattern ?? item.pattern} size={15} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">
                    {exercise?.name ?? 'Ejercicio'}
                  </span>
                  <span className="truncate text-[0.65rem] text-slate">
                    {equipment?.locationNote ?? muscleSummary(exercise?.primaryMuscles ?? [])}
                  </span>
                </span>
                {option.curated && (
                  <span title={option.reason}>
                    <PenLine size={12} className="shrink-0 text-brand" aria-hidden="true" />
                  </span>
                )}
                <span className="shrink-0 font-display text-xs font-semibold tabular-nums text-brand">
                  {Math.round(option.equivalence * 100)}%
                </span>
              </motion.button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onAvoid}
        className="self-start text-[0.7rem] font-medium text-slate-dim underline decoration-dotted underline-offset-4 transition-colors hover:text-orange"
      >
        No me lo propongas más
      </button>
    </div>
  );
}
