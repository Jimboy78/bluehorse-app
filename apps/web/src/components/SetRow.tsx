import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { checkPop, haptic, hapticPattern, spring, tappable } from '../lib/motion.ts';

/**
 * Una serie dentro de un ejercicio.
 *
 * El caso común es que la serie salga como estaba planificada, así que confirmar
 * cuesta un toque y el objetivo viene pre-cargado. Editar es la excepción, no el
 * camino principal: ahí es donde las apps de gimnasio pierden a la gente.
 *
 * La carga va en la condensada y grande: es el único dato que se busca con la
 * vista mientras se acomoda el pin de la máquina, a un brazo de distancia.
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
      aria-pressed={done}
      aria-label={`Serie ${index + 1}: ${targetLoad} × ${targetReps}, ${done ? 'hecha' : 'marcar como hecha'}`}
      onClick={() => {
        if (!done) haptic(hapticPattern.setDone);
        onToggle();
      }}
      transition={spring.settle}
      className={`flex w-full items-center gap-4 rounded-card border px-4 py-4 text-left transition-colors duration-150 ${
        done
          ? 'border-brand/40 bg-brand/10 shadow-brand'
          : 'border-line bg-surface shadow-card hover:border-line-bright'
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

      <span className="flex flex-1 items-baseline gap-2">
        <span
          className={`font-display text-2xl font-semibold tabular-nums leading-none ${
            done ? 'text-brand' : 'text-ink'
          }`}
        >
          {targetLoad}
        </span>
        <span className="text-sm text-slate">× {targetReps}</span>
      </span>

      <span
        className={`font-display text-[0.65rem] uppercase tracking-[0.18em] ${
          done ? 'text-brand' : 'text-slate-dim'
        }`}
      >
        {done ? 'hecha' : 'tocá'}
      </span>
    </motion.button>
  );
}
