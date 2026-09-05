import type { SubstituteOption } from '@bh/engine';
import { AlertCircle, Dumbbell, Loader2, MapPin, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { fadeUp, listContainer, listItem, screen, tappable } from '../lib/motion.ts';
import { onboardingUnavailable, useProfileStatus } from '../lib/onboarding.ts';
import type { ActiveSessionItem } from '../lib/plan.ts';
import { useActivePlan, useGeneratePlan } from '../lib/plan.ts';
import { useSessionLog } from '../lib/session-log.ts';
import { RestTimer } from './RestTimer.tsx';
import { SessionClose } from './SessionClose.tsx';
import { SetRow } from './SetRow.tsx';
import { SubstitutePicker } from './SubstitutePicker.tsx';

/** Lo que reemplaza a un ítem cuando su estación estaba ocupada. Los objetivos
 * (series, reps, descanso) siguen siendo los de la prescripción original —
 * solo cambia qué ejercicio/estación se usó de verdad. */
interface Substitution {
  readonly exerciseId: string;
  readonly equipmentId: string | null;
  readonly name: string;
  readonly sector: string;
}

/**
 * La pantalla "Hoy" real: lee el plan que ya está guardado en la base
 * (`useActivePlan`), no vuelve a correr el motor en cada render.
 *
 * Marcar una serie escribe a `set_logs` (vía la cola offline, `useSessionLog`)
 * recién cuando el cronómetro de descanso termina — ahí es cuando se sabe el
 * descanso real. Deshacer una serie ya registrada no borra ese registro: es
 * una simplificación conocida, no un olvido.
 */
export function Hoy() {
  const { status, user } = useAuth();
  const plan = useActivePlan();

  const profile = useProfileStatus();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [seriesHechas, setSeriesHechas] = useState<number[]>([]);
  const [restingIndex, setRestingIndex] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [showingSubstitutes, setShowingSubstitutes] = useState(false);
  const [substitutions, setSubstitutions] = useState<Record<string, Substitution>>({});

  const activePlanSessionId = plan.data?.kind === 'active' ? plan.data.session.planSessionId : '';
  const { markSetDone, logSubstitution, workoutLogId } = useSessionLog(
    user?.id,
    activePlanSessionId,
  );

  if (status !== 'signed-in' || plan.isPending || plan.isError || plan.data?.kind !== 'active') {
    return <PlanStateMessage authStatus={status} plan={plan} />;
  }

  const session = plan.data.session;
  const original = session.items.find((i) => i.id === activeItemId);
  const substitution = original ? substitutions[original.id] : undefined;
  // Los objetivos (series, reps, descanso) son los de la prescripción
  // original; solo la identidad del ejercicio/estación cambia si se sustituyó.
  const item: ActiveSessionItem | undefined =
    original && substitution
      ? {
          ...original,
          exerciseId: substitution.exerciseId,
          equipmentId: substitution.equipmentId,
          name: substitution.name,
          sector: substitution.sector,
        }
      : original;

  function markDone(indice: number) {
    setSeriesHechas((previas) =>
      previas.includes(indice) ? previas.filter((i) => i !== indice) : [...previas, indice],
    );
    if (!seriesHechas.includes(indice)) setRestingIndex(indice);
  }

  async function handleRestFinish(actualSeconds: number) {
    if (item && restingIndex !== null) {
      await markSetDone(item, restingIndex, actualSeconds);
    }
    setRestingIndex(null);
  }

  async function handlePickSubstitute(option: SubstituteOption, name: string, sector: string) {
    if (!original) return;
    setSubstitutions((prev) => ({
      ...prev,
      [original.id]: {
        exerciseId: option.exerciseId,
        equipmentId: option.equipmentId,
        name,
        sector,
      },
    }));
    setShowingSubstitutes(false);
    await logSubstitution(
      original.id,
      original.exerciseId,
      option.exerciseId,
      original.equipmentId,
      option.equipmentId,
    );
  }

  if (closing) {
    return (
      <SessionClose
        planSessionId={session.planSessionId}
        workoutLogId={workoutLogId}
        onClosed={() => setClosing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {item ? (
          <ExerciseDetail
            item={item}
            original={original}
            userId={user?.id}
            gymId={profile.data?.gymId ?? null}
            showingSubstitutes={showingSubstitutes}
            restingIndex={restingIndex}
            seriesHechas={seriesHechas}
            onBack={() => {
              setActiveItemId(null);
              setSeriesHechas([]);
              setRestingIndex(null);
              setShowingSubstitutes(false);
            }}
            onShowSubstitutes={() => setShowingSubstitutes(true)}
            onPickSubstitute={handlePickSubstitute}
            onCancelSubstitutes={() => setShowingSubstitutes(false)}
            onRestFinish={handleRestFinish}
            onToggleSet={markDone}
          />
        ) : (
          <motion.section key="lista" {...screen} className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold tracking-tight">Hoy te toca</h2>
            <p className="text-xs text-slate">{session.focus}</p>

            <motion.ul
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2.5"
            >
              {session.items.map((sessionItem, i) => (
                <motion.li key={sessionItem.id} variants={listItem}>
                  <motion.button
                    type="button"
                    {...tappable}
                    onClick={() => setActiveItemId(sessionItem.id)}
                    className="flex w-full items-center gap-3.5 rounded-xl border border-line bg-navy-soft px-4 py-3.5 text-left"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy text-teal">
                      <Dumbbell size={18} aria-hidden="true" />
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="font-semibold">{sessionItem.name}</span>
                      <span className="font-mono text-xs text-slate">
                        {sessionItem.sets} × {sessionItem.reps} · {sessionItem.load}
                      </span>
                    </span>
                    {i === 0 && (
                      <span className="rounded-full border border-teal/40 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-teal">
                        sugerido
                      </span>
                    )}
                  </motion.button>
                </motion.li>
              ))}
            </motion.ul>

            <p className="text-xs text-slate">
              El orden es una sugerencia: tocá el que esté libre. Si una máquina está ocupada, la
              app te ofrece un reemplazo equivalente.
            </p>

            <motion.button
              type="button"
              {...tappable}
              onClick={() => setClosing(true)}
              className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-slate"
            >
              Terminar sesión
            </motion.button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Vista de detalle de un ejercicio: series, cronómetro de descanso, o el
 * selector de sustitución — según qué esté pasando en ese momento. Aparte de
 * `Hoy` para no acumular ramas en un solo componente.
 */
function ExerciseDetail({
  item,
  original,
  userId,
  gymId,
  showingSubstitutes,
  restingIndex,
  seriesHechas,
  onBack,
  onShowSubstitutes,
  onPickSubstitute,
  onCancelSubstitutes,
  onRestFinish,
  onToggleSet,
}: {
  item: ActiveSessionItem;
  original: ActiveSessionItem | undefined;
  userId: string | undefined;
  gymId: string | null;
  showingSubstitutes: boolean;
  restingIndex: number | null;
  seriesHechas: number[];
  onBack: () => void;
  onShowSubstitutes: () => void;
  onPickSubstitute: (option: SubstituteOption, name: string, sector: string) => void;
  onCancelSubstitutes: () => void;
  onRestFinish: (actualSeconds: number) => void;
  onToggleSet: (indice: number) => void;
}) {
  return (
    <motion.section key="detalle" {...screen} className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">{item.name}</h2>
          <p className="flex items-center gap-1.5 text-sm text-slate">
            <MapPin size={14} aria-hidden="true" />
            {item.sector}
          </p>
        </div>
        <motion.button
          type="button"
          {...tappable}
          onClick={onBack}
          className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-slate"
        >
          Volver
        </motion.button>
      </div>

      <p className="rounded-lg bg-navy-soft px-3.5 py-2.5 text-xs text-slate">{item.rationale}</p>

      {!showingSubstitutes && restingIndex === null && (
        <motion.button
          type="button"
          {...tappable}
          onClick={onShowSubstitutes}
          className="self-start rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-slate"
        >
          Máquina ocupada
        </motion.button>
      )}

      {showingSubstitutes && original ? (
        <SubstitutePicker
          userId={userId}
          gymId={gymId}
          exerciseId={original.exerciseId}
          equipmentId={original.equipmentId}
          onPick={onPickSubstitute}
          onCancel={onCancelSubstitutes}
        />
      ) : restingIndex !== null ? (
        <motion.div
          key="timer"
          {...screen}
          className="rounded-2xl border border-line bg-navy-soft px-4 py-8"
        >
          <RestTimer prescribedSeconds={item.restSeconds} onFinish={onRestFinish} />
        </motion.div>
      ) : (
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2.5"
        >
          {seriesDe(item).map(({ id, numero: i }) => (
            <motion.div key={id} variants={listItem}>
              <SetRow
                index={i}
                targetLoad={item.load}
                targetReps={item.reps}
                done={seriesHechas.includes(i)}
                onToggle={() => onToggleSet(i)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.section>
  );
}

/**
 * Todo lo que no sea "hay una sesión pendiente para mostrar": sin sesión, sin
 * config, cargando, con error, sin plan generado, o cola completa. Aparte de
 * `Hoy` para no acumular ramas en un solo componente.
 */
function PlanStateMessage({
  authStatus,
  plan,
}: {
  authStatus: ReturnType<typeof useAuth>['status'];
  plan: ReturnType<typeof useActivePlan>;
}) {
  const generatePlan = useGeneratePlan();

  // Sin Supabase configurado (o sin sesión) la query de `useActivePlan` queda
  // deshabilitada y `isPending` se queda en `true` para siempre — se chequea
  // el estado de auth ANTES que `isPending`, mismo criterio que RequireX.
  if (authStatus !== 'signed-in') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-navy-soft px-6 py-10 text-center">
        <Dumbbell size={28} className="text-slate" aria-hidden="true" />
        <p className="text-sm text-slate">
          {authStatus === 'unconfigured'
            ? 'Supabase no está configurado: no se puede leer ni generar el plan todavía.'
            : 'Iniciá sesión para ver tu plan.'}
        </p>
      </div>
    );
  }

  if (plan.isPending) {
    return (
      <div role="status" className="grid place-items-center py-16">
        <div
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-2 border-line border-t-teal"
        />
        <span className="sr-only">Cargando tu plan…</span>
      </div>
    );
  }

  if (plan.data?.kind === 'queue-empty') {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-2 rounded-xl border border-line bg-navy-soft px-6 py-10 text-center"
      >
        <Trophy size={28} className="text-teal" aria-hidden="true" />
        <p className="font-semibold">Completaste toda la cola generada.</p>
        <p className="text-sm text-slate">
          Todavía no hay una forma de pedir más sesiones — llega pronto.
        </p>
      </motion.div>
    );
  }

  // plan.isError o plan.data?.kind === 'no-plan': mismo llamado a la acción.
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center gap-4 rounded-xl border border-line bg-navy-soft px-6 py-10 text-center"
    >
      <Dumbbell size={28} className="text-teal" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">Todavía no tenés un plan generado.</p>
        <p className="text-sm text-slate">
          {plan.isError
            ? 'No se pudo consultar tu plan. Revisá tu conexión y probá de nuevo.'
            : 'Generalo con lo que ya cargaste en el onboarding.'}
        </p>
      </div>
      <motion.button
        type="button"
        {...tappable}
        disabled={generatePlan.isPending || onboardingUnavailable}
        onClick={() => generatePlan.mutate()}
        className="flex items-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-navy disabled:opacity-50"
      >
        {generatePlan.isPending && (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        )}
        Generar mi plan
      </motion.button>
      {generatePlan.isError && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-orange">
          <AlertCircle size={13} aria-hidden="true" />
          No se pudo generar. Probá de nuevo en un momento.
        </p>
      )}
    </motion.div>
  );
}

/** Identidad estable por serie: la posición no alcanza como clave de React. */
function seriesDe(item: { id: string; sets: number }) {
  return Array.from({ length: item.sets }, (_, numero) => ({
    id: `${item.id}-serie-${numero + 1}`,
    numero,
  }));
}
