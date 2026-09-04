import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { duration, ease, haptic, hapticPattern, spring, tappable } from '../lib/motion.ts';

/**
 * Cronómetro de descanso entre series.
 *
 * Es la pantalla que más se mira en toda la app: aparece decenas de veces por
 * sesión y se lee de reojo, a un metro, con el teléfono apoyado en la máquina.
 * Por eso el número es enorme y el anillo comunica el progreso sin leer nada.
 *
 * Cortar antes NO es un error: se registra el descanso real como dato.
 */

const RADIUS = 74;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RestTimerProps {
  /** Descanso prescripto por el motor, en segundos. */
  readonly prescribedSeconds: number;
  /** Recibe cuánto descansó de verdad, haya esperado o no. */
  readonly onFinish: (actualSeconds: number) => void;
}

export function RestTimer({ prescribedSeconds, onFinish }: RestTimerProps) {
  const [remaining, setRemaining] = useState(prescribedSeconds);
  const reduceMotion = useReducedMotion();
  const finishedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining === 0 && !finishedRef.current) {
      finishedRef.current = true;
      haptic(hapticPattern.timerFinished);
      onFinish(prescribedSeconds);
    }
  }, [remaining, prescribedSeconds, onFinish]);

  const elapsed = prescribedSeconds - remaining;
  const progress = prescribedSeconds === 0 ? 1 : elapsed / prescribedSeconds;
  const isFinishing = remaining <= 5 && remaining > 0;
  const isDone = remaining === 0;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative grid place-items-center">
        <svg
          width={(RADIUS + STROKE) * 2}
          height={(RADIUS + STROKE) * 2}
          viewBox={`0 0 ${(RADIUS + STROKE) * 2} ${(RADIUS + STROKE) * 2}`}
          className="-rotate-90"
          role="img"
          aria-label={`Quedan ${remaining} segundos de descanso`}
        >
          <circle
            cx={RADIUS + STROKE}
            cy={RADIUS + STROKE}
            r={RADIUS}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={RADIUS + STROKE}
            cy={RADIUS + STROKE}
            r={RADIUS}
            fill="none"
            stroke={isDone ? 'var(--color-teal)' : 'var(--color-orange)'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
            transition={{ duration: reduceMotion ? 0 : 1, ease: 'linear' }}
          />
        </svg>

        <div className="absolute flex flex-col items-center">
          <motion.span
            key={remaining}
            initial={reduceMotion ? false : { scale: isFinishing ? 1.14 : 1, opacity: 0.75 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring.pop}
            className={`font-mono text-5xl font-bold tabular-nums ${
              isDone ? 'text-teal' : isFinishing ? 'text-orange' : 'text-ink'
            }`}
          >
            {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : seconds}
          </motion.span>
          <span className="text-xs uppercase tracking-[0.16em] text-slate">
            {isDone ? 'a la próxima serie' : 'descanso'}
          </span>
        </div>
      </div>

      <motion.button
        type="button"
        {...tappable}
        onClick={() => {
          if (finishedRef.current) return;
          finishedRef.current = true;
          haptic(hapticPattern.setDone);
          onFinish(elapsed);
        }}
        className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-slate transition-colors hover:border-teal hover:text-teal"
      >
        {isDone ? 'Seguir' : 'Estoy listo'}
      </motion.button>

      {!isDone && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: duration.quick, ease: ease.out, delay: 0.4 }}
          className="max-w-[24ch] text-center text-xs text-slate"
        >
          Si arrancás antes, queda registrado cuánto descansaste de verdad.
        </motion.p>
      )}
    </div>
  );
}
