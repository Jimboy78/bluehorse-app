import type { EquipmentLoadSpec, LoadReading } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import { Minus, Plus } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { finDelDescanso, useCuentaRegresiva } from '../lib/descanso.ts';
import type { SetActual } from '../lib/mappers/session-log.ts';
import { duration, ease, haptic, hapticPattern, spring, tappable } from '../lib/motion.ts';
import { carriesLoad, LoadInput } from './LoadInput.tsx';
import { Button, Chip } from './ui/index.ts';

/**
 * Cronómetro de descanso entre series.
 *
 * Es la pantalla que más se mira en toda la app: aparece decenas de veces por
 * sesión y se lee de reojo, a un metro, con el teléfono apoyado en la máquina.
 * Por eso el número es enorme y el anillo comunica el progreso sin leer nada.
 *
 * El anillo va en degradé y con un halo detrás: sobre negro, un trazo plano de
 * 9 px a un metro de distancia se pierde, y el halo es lo que hace que el
 * estado (descansando / se acaba / listo) se lea sin enfocar la vista.
 *
 * Cortar antes NO es un error: se registra el descanso real como dato.
 */

const RADIUS = 78;
const STROKE = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Las tres caras del cronómetro. Salen de una tabla y no de ternarios anidados
 * dentro del JSX: son tres estados de una misma cosa, y escritos como
 * `isDone ? a : isFinishing ? b : c` había que leer el orden de las condiciones
 * para saber qué se ve cuándo.
 */
type RestPhase = 'resting' | 'finishing' | 'done';

const PHASE = {
  resting: {
    halo: 'bg-brand/20',
    digits: 'text-ink',
    ring: 'url(#rest-ring-brand)',
    caption: 'descanso',
  },
  finishing: {
    halo: 'bg-orange/45',
    digits: 'text-orange',
    ring: 'url(#rest-ring-warm)',
    caption: 'descanso',
  },
  done: {
    halo: 'bg-brand/40',
    digits: 'text-brand',
    ring: 'url(#rest-ring-brand)',
    caption: 'a la próxima',
  },
} as const satisfies Record<RestPhase, Record<string, string>>;

/** Los últimos cinco segundos son su propia fase: es cuando hay que mirar. */
function restPhase(remaining: number): RestPhase {
  if (remaining === 0) return 'done';
  return remaining <= 5 ? 'finishing' : 'resting';
}

interface RestTimerProps {
  /**
   * Cardio: entre vueltas no hay repeticiones, RIR ni carga que anotar; los
   * minutos se anotan en la fila de cada vuelta.
   */
  readonly cardio?: boolean;
  /** Descanso prescripto por el motor, en segundos. */
  readonly prescribedSeconds: number;
  /**
   * En una superserie, el ejercicio que sigue sin pausa. Con descanso 0 no hay
   * cuenta regresiva que termine sola: la pantalla queda para anotar la serie
   * y el botón dice a dónde se va.
   */
  readonly siguiente?: string | null;
  /** Repeticiones que pedía el plan: la referencia "plan N" al cambiarlas. */
  readonly repsTarget: number;
  /** RIR prescripto por el ruleset para esta serie, si lo hay. */
  readonly targetRir: number | null;
  /** La carga con la que se anotó la serie. Referencia "plan N" al cambiarla. */
  readonly targetLoad: LoadReading | null;
  /** Cómo carga la estación: define el escalón real y si se puede escalonar. */
  readonly loadSpec: EquipmentLoadSpec | null;
  /**
   * Cuándo arrancó el descanso. Viene de afuera y no del montaje: el descanso
   * sigue corriendo con esta pantalla cerrada (`lib/descanso.ts`), y al volver
   * tiene que mostrar lo que queda, no empezar de nuevo.
   */
  readonly startedAt: number;
  /** Lo que se llevaba anotado de la serie, por si se salió y se volvió. */
  readonly inicial: SetActual;
  /** Cada cambio de lo anotado, para que sobreviva a salir de la pantalla. */
  readonly onCambio: (actual: SetActual) => void;
  /**
   * El ejercicio que viene, cuando esta era la última serie del actual. Es el
   * rato en que uno quiere ir a acomodarse a la máquina siguiente.
   * En superserie no se muestra: ahí el botón ya dice con qué se sigue.
   */
  readonly despues?: {
    readonly id: string;
    readonly nombre: string;
    readonly sector: string | null;
  } | null;
  readonly onVerDespues?: (id: string) => void;
  /** Recibe cuánto descansó de verdad y qué pasó en la serie. */
  readonly onFinish: (actualSeconds: number, actual: SetActual) => void;
}

export function RestTimer({
  cardio = false,
  prescribedSeconds,
  siguiente = null,
  repsTarget,
  targetRir,
  targetLoad,
  loadSpec,
  startedAt,
  inicial,
  onCambio,
  despues = null,
  onVerDespues,
  onFinish,
}: RestTimerProps) {
  // Contra el reloj, no contra los ticks: ver `useCuentaRegresiva`.
  const remaining = useCuentaRegresiva(finDelDescanso({ startedAt, prescribedSeconds }));
  const [reps, setReps] = useState(inicial.reps);
  const [rir, setRir] = useState<number | null>(inicial.rir);
  const [load, setLoad] = useState<LoadReading | null>(inicial.load);
  const finishedRef = useRef(false);

  // Los valores viven en un ref además del estado: el efecto que dispara al
  // llegar a cero no debe re-armarse cada vez que el socio toca un botón.
  const actualRef = useRef<SetActual>(inicial);
  actualRef.current = { reps, rir, load, durationSeconds: null };

  // biome-ignore lint/correctness/useExhaustiveDependencies: avisa solo cuando cambia lo anotado.
  useEffect(() => {
    onCambio({ reps, rir, load, durationSeconds: null });
  }, [reps, rir, load]);

  // Sin descanso (el primero de una superserie) la cuenta llega a cero apenas
  // arranca, y terminar solo cerraba la pantalla antes de poder anotar
  // repeticiones y reserva: la serie quedaba con el objetivo del plan y sin
  // RIR, que es justo lo que necesita el máximo estimado. El cardio sí sigue
  // de largo: sus minutos se anotan en la fila, no acá.
  const sinPausa = prescribedSeconds === 0 && !cardio;

  useEffect(() => {
    if (remaining === 0 && !finishedRef.current && !sinPausa) {
      finishedRef.current = true;
      haptic(hapticPattern.timerFinished);
      onFinish(prescribedSeconds, actualRef.current);
    }
  }, [remaining, prescribedSeconds, onFinish, sinPausa]);

  const elapsed = prescribedSeconds - remaining;
  const progress = prescribedSeconds === 0 ? 1 : elapsed / prescribedSeconds;
  const phase = restPhase(remaining);
  const isDone = phase === 'done';

  return (
    <div className="flex flex-col items-center gap-6">
      {!sinPausa && <RestDial remaining={remaining} progress={progress} phase={phase} />}
      {/* Arriba, al lado del reloj: es lo que se mira de reojo mientras se
          descansa la última serie, y más abajo la tapaba la navegación. */}
      {despues && !siguiente && (
        <button
          type="button"
          onClick={() => onVerDespues?.(despues.id)}
          className="flex w-full max-w-[22rem] items-center justify-between gap-3 rounded-card border border-brand/35 bg-brand/[0.07] px-4 py-3 text-left transition-colors hover:border-brand/60"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-display text-[0.6rem] uppercase tracking-[0.16em] text-brand">
              Después va
            </span>
            <span className="truncate font-semibold text-ink">{despues.nombre}</span>
            {despues.sector && <span className="text-xs text-slate">{despues.sector}</span>}
          </span>
          <span className="shrink-0 text-xs font-semibold text-brand">Ver</span>
        </button>
      )}

      {!cardio && (
        <SetOutcome
          load={load}
          targetLoad={targetLoad}
          loadSpec={loadSpec}
          onLoad={setLoad}
          reps={reps}
          repsTarget={repsTarget}
          onReps={setReps}
          rir={rir}
          targetRir={targetRir}
          onRir={setRir}
        />
      )}

      <div className="flex flex-col items-center gap-2.5">
        <Button
          variant={isDone ? 'primary' : 'secondary'}
          size="lg"
          className="px-8"
          onClick={() => {
            if (finishedRef.current) return;
            finishedRef.current = true;
            haptic(hapticPattern.setDone);
            onFinish(elapsed, actualRef.current);
          }}
        >
          {textoDelBoton(isDone, siguiente)}
        </Button>

        {!isDone && !sinPausa && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: duration.quick, ease: ease.out, delay: 0.4 }}
            className="max-w-[26ch] text-center text-xs leading-relaxed text-slate-dim"
          >
            Si arrancás antes, queda registrado cuánto descansaste de verdad.
          </motion.p>
        )}
      </div>
    </div>
  );
}

function textoDelBoton(isDone: boolean, siguiente: string | null): string {
  if (siguiente) return `Seguir con ${siguiente}`;
  return isDone ? 'Seguir' : 'Estoy listo';
}

/**
 * El anillo, el halo y los dígitos.
 *
 * Es lo único que se mira de reojo, a un metro, con el teléfono apoyado en la
 * máquina: por eso el número es enorme y el halo comunica el estado sin que
 * haya que enfocar la vista.
 */
function RestDial({
  remaining,
  progress,
  phase,
}: {
  remaining: number;
  progress: number;
  phase: RestPhase;
}) {
  const reduceMotion = useReducedMotion();
  const look = PHASE[phase];
  const pulses = phase === 'finishing' && !reduceMotion;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="relative grid place-items-center">
      {/* El halo toma el color del estado y late en los últimos cinco
          segundos: es lo que se percibe con el teléfono en el piso. */}
      <motion.span
        aria-hidden="true"
        animate={pulses ? { opacity: [0.4, 0.85, 0.4] } : { opacity: 0.55 }}
        transition={
          pulses
            ? { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }
            : { duration: duration.quick }
        }
        className={`absolute size-40 rounded-full blur-2xl ${look.halo}`}
      />

      <svg
        width={(RADIUS + STROKE) * 2}
        height={(RADIUS + STROKE) * 2}
        viewBox={`0 0 ${(RADIUS + STROKE) * 2} ${(RADIUS + STROKE) * 2}`}
        className="relative -rotate-90"
        role="img"
        aria-label={`Quedan ${remaining} segundos de descanso`}
      >
        <defs>
          <linearGradient id="rest-ring-brand" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#abe6f8" />
            <stop offset="1" stopColor="#3f7fc4" />
          </linearGradient>
          <linearGradient id="rest-ring-warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0a03c" />
            <stop offset="1" stopColor="#f2622e" />
          </linearGradient>
        </defs>
        <circle
          cx={RADIUS + STROKE}
          cy={RADIUS + STROKE}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={RADIUS + STROKE}
          cy={RADIUS + STROKE}
          r={RADIUS}
          fill="none"
          stroke={look.ring}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
          transition={{ duration: reduceMotion ? 0 : 1, ease: 'linear' }}
        />
      </svg>

      <div className="absolute flex flex-col items-center gap-1">
        <motion.span
          key={remaining}
          initial={reduceMotion ? false : { scale: pulses ? 1.14 : 1, opacity: 0.75 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring.pop}
          className={`font-display text-6xl font-semibold tabular-nums leading-none ${look.digits}`}
        >
          {minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : seconds}
        </motion.span>
        <span className="font-display text-[0.65rem] uppercase tracking-[0.24em] text-slate">
          {look.caption}
        </span>
      </div>
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
  load,
  targetLoad,
  loadSpec,
  onLoad,
  reps,
  repsTarget,
  onReps,
  rir,
  targetRir,
  onRir,
}: {
  load: LoadReading | null;
  targetLoad: LoadReading | null;
  loadSpec: EquipmentLoadSpec | null;
  onLoad: (l: LoadReading | null) => void;
  reps: number;
  repsTarget: number;
  onReps: (n: number) => void;
  rir: number | null;
  targetRir: number | null;
  onRir: (n: number) => void;
}) {
  return (
    <div className="flex w-full max-w-[22rem] flex-col divide-y divide-line/70 rounded-card border border-line bg-navy">
      {carriesLoad(loadSpec) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <OutcomeLabel
            label="Carga"
            plan={
              targetLoad?.value !== load?.value && targetLoad?.value != null
                ? `plan ${formatLoad(targetLoad)}`
                : null
            }
          />
          <LoadInput load={load} loadSpec={loadSpec} onLoad={onLoad} ariaLabel="Carga usada" />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <OutcomeLabel
          label="Repeticiones"
          plan={reps !== repsTarget ? `plan ${repsTarget}` : null}
        />
        <div className="flex items-center gap-1.5">
          <Stepper label="Una repetición menos" onClick={() => onReps(Math.max(0, reps - 1))}>
            <Minus size={15} aria-hidden="true" />
          </Stepper>
          <span className="min-w-9 text-center font-display text-lg font-semibold tabular-nums">
            {reps}
          </span>
          <Stepper label="Una repetición más" onClick={() => onReps(reps + 1)}>
            <Plus size={15} aria-hidden="true" />
          </Stepper>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-4 py-3">
        <span className="text-xs text-slate">¿Cuántas repeticiones más te quedaban?</span>
        <div className="flex flex-wrap gap-1.5">
          {/* 0 a 4+ no es una prescripción: es el rango de respuestas que una
              persona puede dar. Cuánto RIR se busca, y desde cuál conviene
              subir la carga, sale del ruleset (`rirTarget`,
              `triggerRirAtLeast`), nunca de acá. */}
          {[0, 1, 2, 3, 4].map((n) => (
            <Chip
              key={n}
              selected={rir === n}
              onClick={() => onRir(n)}
              className="min-w-11 font-display text-sm"
            >
              {n === 4 ? '4+' : n}
              {n === targetRir && (
                <span className="text-[0.6rem] font-normal tracking-wide opacity-70">plan</span>
              )}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Etiqueta de una fila del resultado, con el valor del plan si se cambió. */
function OutcomeLabel({ label, plan }: { label: string; plan: string | null }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">{label}</span>
      {plan && <span className="font-mono text-[0.65rem] text-slate-dim">{plan}</span>}
    </span>
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
      className="grid size-10 place-items-center rounded-xl border border-line bg-surface-2 text-slate transition-colors hover:border-brand hover:text-brand"
    >
      {children}
    </motion.button>
  );
}
