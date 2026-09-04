import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { checkPop, haptic, hapticPattern, spring, tappable } from '../lib/motion.ts';

/**
 * Una serie dentro de un ejercicio.
 *
 * El caso común es que la serie salga como estaba planificada, así que confirmar
 * cuesta un toque y el objetivo viene pre-cargado. Editar es la excepción, no el
 * camino principal: ahí es donde las apps de gimnasio pierden a la gente.
 */

export interface SetRowProps {
  readonly index: number;
  /** Lo que dice la máquina, ya formateado: "60 kg", "45 lb", "pin 7". */
  readonly targetLoad: string;
  readonly targetReps: string;
  readonly done: boolean;
  readonly onToggle: () => void;
}

export function SetRow({ index, targetLoad, targetReps, done, onToggle }: SetRowProps) {
  return (
    <motion.button
      type="button"
      layout
      {...tappable}
      onClick={() => {
        if (!done) haptic(hapticPattern.setDone);
        onToggle();
      }}
      transition={spring.settle}
      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left ${
        done ? 'border-teal/40 bg-teal/10' : 'border-line bg-navy-soft'
      }`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full border text-sm font-semibold tabular-nums ${
          done ? 'border-teal text-teal' : 'border-line text-slate'
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

      <span className="flex flex-1 items-baseline gap-2">
        <span
          className={`font-mono text-lg font-semibold tabular-nums ${done ? 'text-teal' : 'text-ink'}`}
        >
          {targetLoad}
        </span>
        <span className="text-sm text-slate">× {targetReps}</span>
      </span>

      <span className="text-xs uppercase tracking-[0.12em] text-slate">
        {done ? 'hecha' : 'tocá'}
      </span>
    </motion.button>
  );
}
