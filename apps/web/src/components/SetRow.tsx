import type { EquipmentLoadSpec, LoadReading } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { checkPop, haptic, hapticPattern, spring, tappable } from '../lib/motion.ts';
import { carriesLoad, LoadInput } from './LoadInput.tsx';

/**
 * Una serie dentro de un ejercicio.
 *
 * Cada serie lleva SU carga, no una del ejercicio entero. Antes había un solo
 * número para las cuatro series, y eso no es lo que pasa en una máquina: se
 * arranca liviano, se sube, y la última a veces baja. Con un valor compartido,
 * anotar la tercera pisaba lo que decían las otras tres — y todas se
 * registraban con el mismo peso, que es un dato falso.
 *
 * Por eso la fila dejó de ser un botón: adentro de un `<button>` no puede
 * haber un campo de texto. Ahora es una fila con el número, la carga
 * editable, las repeticiones y un botón aparte para darla por hecha. El
 * objetivo sigue siendo un toque para el caso común — la carga viene
 * arrastrada de la serie anterior, así que solo se toca si cambió.
 *
 * Una serie ya hecha no se edita acá: se destilda (que borra el registro) y se
 * vuelve a hacer. Editarla en el lugar daría a entender que se puede corregir
 * lo que ya se registró sin más, y ese registro es lo que alimenta la
 * adaptación.
 */

export interface SetRowProps {
  readonly index: number;
  /** La carga de ESTA serie. `null` si todavía no se anotó ninguna. */
  readonly load: LoadReading | null;
  readonly loadSpec: EquipmentLoadSpec | null;
  readonly onLoad: (load: LoadReading | null) => void;
  readonly targetReps: string;
  readonly done: boolean;
  readonly onToggle: () => void;
}

export function SetRow({ index, load, loadSpec, onLoad, targetReps, done, onToggle }: SetRowProps) {
  const editable = !done && carriesLoad(loadSpec);

  return (
    <motion.div
      layout
      transition={spring.settle}
      className={`flex w-full items-center gap-3 rounded-card border px-4 py-3 transition-colors duration-150 ${
        done ? 'border-brand/40 bg-brand/10 shadow-brand' : 'border-line bg-surface shadow-card'
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full border font-display text-sm font-semibold tabular-nums transition-colors ${
          done ? 'border-brand bg-brand/20 text-brand' : 'border-line-bright text-slate'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.span
              key="check"
              variants={checkPop}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <Check size={16} strokeWidth={3} aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span key="num" variants={checkPop} initial="hidden" animate="visible">
              {index + 1}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-2">
        {editable ? (
          <LoadInput
            load={load}
            loadSpec={loadSpec}
            onLoad={onLoad}
            ariaLabel={`Carga de la serie ${index + 1}`}
          />
        ) : (
          <span
            className={`font-display text-2xl font-semibold tabular-nums leading-none ${
              done ? 'text-brand' : 'text-ink'
            }`}
          >
            {textoDeCarga(load, loadSpec)}
          </span>
        )}
        <span className="shrink-0 text-sm text-slate">× {targetReps}</span>
      </span>

      <motion.button
        type="button"
        {...tappable}
        aria-pressed={done}
        aria-label={`Serie ${index + 1}, ${done ? 'hecha' : 'marcar como hecha'}`}
        onClick={() => {
          if (!done) haptic(hapticPattern.setDone);
          onToggle();
        }}
        className={`shrink-0 rounded-full border px-3 py-2 font-display text-[0.65rem] uppercase tracking-[0.14em] transition-colors ${
          done
            ? 'border-brand/40 text-brand'
            : 'border-line-bright text-slate hover:border-brand hover:text-brand'
        }`}
      >
        {done ? 'hecha' : 'listo'}
      </motion.button>
    </motion.div>
  );
}

/**
 * Qué mostrar cuando la carga no se está editando: lo anotado, o el motivo por
 * el que no hay nada que anotar. Nunca un cero inventado.
 */
function textoDeCarga(load: LoadReading | null, spec: EquipmentLoadSpec | null): string {
  if (load) return formatLoad(load);
  if (spec && !carriesLoad(spec)) return formatLoad({ value: null, unit: spec.unit });
  return '—';
}
