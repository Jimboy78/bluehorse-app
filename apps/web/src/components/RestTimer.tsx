import { Minus, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { SetActual } from '../lib/mappers/session-log.ts';
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
  /** Repeticiones que pedía el plan. Es el valor por defecto: el caso común. */
  readonly repsTarget: number;
  /** RIR prescripto por el ruleset para esta serie, si lo hay. */
  readonly targetRir: number | null;
  /** Recibe cuánto descansó de verdad y qué pasó en la serie. */
  readonly onFinish: (actualSeconds: number, actual: SetActual) => void;
}

export function RestTimer({ prescribedSeconds, repsTarget, targetRir, onFinish }: RestTimerProps) {
  const [remaining, setRemaining] = useState(prescribedSeconds);
  const [reps, setReps] = useState(repsTarget);
  const [rir, setRir] = useState<number | null>(targetRir);
  const reduceMotion = useReducedMotion();
  const finishedRef = useRef(false);

  // Los valores viven en un ref además del estado: el efecto que dispara al
  // llegar a cero no debe re-armarse cada vez que el socio toca un botón.
  const actualRef = useRef<SetActual>({ reps: repsTarget, rir: targetRir });
  actualRef.current = { reps, rir };

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
      onFinish(prescribedSeconds, actualRef.current);
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

      <SetOutcome
        reps={reps}
        repsTarget={repsTarget}
        onReps={setReps}
        rir={rir}
        targetRir={targetRir}
        onRir={setRir}
      />

      <motion.button
        type="button"
        {...tappable}
        onClick={() => {
          if (finishedRef.current) return;
          finishedRef.current = true;
          haptic(hapticPattern.setDone);
          onFinish(elapsed, actualRef.current);
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

/**
 * Qué pasó en la serie que se acaba de terminar.
 *
 * Va acá y no en la lista de series a propósito: el descanso es tiempo muerto
 * — dos minutos parado al lado de la máquina — así que preguntar acá no le
 * cuesta un toque a nadie. Arranca con lo que pedía el plan, que es el caso
 * común: si salió como estaba escrito, no hay nada que tocar.
 *
 * Sin esto `set_logs` guardaba el objetivo del plan como si fuera el
 * resultado, y el motor comparaba el plan contra sí mismo: ninguna propuesta
 * de subir o bajar la carga podía dispararse nunca.
 */
function SetOutcome({
  reps,
  repsTarget,
  onReps,
  rir,
  targetRir,
  onRir,
}: {
  reps: number;
  repsTarget: number;
  onReps: (n: number) => void;
  rir: number | null;
  targetRir: number | null;
  onRir: (n: number) => void;
}) {
  return (
    <div className="flex w-full max-w-[22rem] flex-col gap-3 rounded-xl border border-line bg-navy px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate">
          Repeticiones
          {reps !== repsTarget && <span className="text-slate/70"> · plan {repsTarget}</span>}
        </span>
        <div className="flex items-center gap-1">
          <Stepper label="Una repetición menos" onClick={() => onReps(Math.max(0, reps - 1))}>
            <Minus size={14} aria-hidden="true" />
          </Stepper>
          <span className="min-w-8 text-center font-mono text-base font-semibold tabular-nums">
            {reps}
          </span>
          <Stepper label="Una repetición más" onClick={() => onReps(reps + 1)}>
            <Plus size={14} aria-hidden="true" />
          </Stepper>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-slate">¿Cuántas más te quedaban?</span>
        <div className="flex flex-wrap gap-1.5">
          {/* 0 a 4+ no es una prescripción: es el rango de respuestas que una
              persona puede dar. Cuánto RIR se busca, y desde cuál conviene
              subir la carga, sale del ruleset (`rirTarget`,
              `triggerRirAtLeast`), nunca de acá. */}
          {[0, 1, 2, 3, 4].map((n) => (
            <motion.button
              key={n}
              type="button"
              {...tappable}
              aria-pressed={rir === n}
              onClick={() => onRir(n)}
              className={`min-w-11 rounded-lg border px-3 py-2 font-mono text-sm font-semibold transition-colors ${
                rir === n
                  ? 'border-teal bg-teal/15 text-teal'
                  : 'border-line text-slate hover:border-teal/50'
              }`}
            >
              {n === 4 ? '4+' : n}
              {n === targetRir && (
                <span className="ml-1 align-middle text-[0.6rem] font-normal opacity-70">plan</span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stepper({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      {...tappable}
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border border-line text-slate transition-colors hover:border-teal hover:text-teal"
    >
      {children}
    </motion.button>
  );
}
