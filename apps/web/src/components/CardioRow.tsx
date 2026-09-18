import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { haptic, hapticPattern, spring, tappable } from '../lib/motion.ts';

/**
 * Un bloque de cardio (o una vuelta de intervalos) dentro de un ejercicio.
 *
 * Va por minutos, no por repeticiones: antes era un `SetRow` que decía
 * "× 40 min" al lado de un campo de carga, y al darlo por hecho se registraba
 * una repetición y ninguna duración. Los minutos vienen del plan y se tocan
 * solo si se hizo otra cosa — lo que se registra es lo que pasó (regla dura 7).
 */
export function CardioRow({
  index,
  label,
  minutes,
  onMinutes,
  done,
  onToggle,
}: {
  index: number;
  /** "Bloque" o "Vuelta 2". */
  label: string;
  minutes: number;
  onMinutes: (minutes: number) => void;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      transition={spring.settle}
      className={`flex w-full items-center gap-3 rounded-card border px-4 py-3 transition-colors duration-150 ${
        done ? 'border-brand/40 bg-brand/10 shadow-brand' : 'border-line bg-surface shadow-card'
      }`}
    >
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full border font-display text-sm font-semibold tabular-nums ${
          done ? 'border-brand bg-brand/20 text-brand' : 'border-line-bright text-slate'
        }`}
      >
        {done ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : index + 1}
      </span>

      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-sm text-slate">{label}</span>
        {done ? (
          <span className="font-display text-2xl font-semibold tabular-nums leading-none text-brand">
            {minutes}
          </span>
        ) : (
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            value={minutes}
            aria-label={`Minutos de ${label.toLowerCase()}`}
            onChange={(e) => {
              const valor = Number(e.target.value);
              if (Number.isFinite(valor) && valor > 0) onMinutes(Math.round(valor));
            }}
            className="w-16 rounded-lg border border-line bg-surface-2 py-1.5 text-center font-display text-lg font-semibold tabular-nums outline-none transition-colors focus:border-brand"
          />
        )}
        <span className="shrink-0 text-sm text-slate">min</span>
      </span>

      <motion.button
        type="button"
        {...tappable}
        aria-pressed={done}
        aria-label={`${label}, ${done ? 'hecho' : 'marcar como hecho'}`}
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
        {done ? 'hecho' : 'listo'}
      </motion.button>
    </motion.div>
  );
}
