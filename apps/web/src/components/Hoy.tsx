import { AlertCircle, Dumbbell, Loader2, MapPin, Trophy } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { celebratePersonalRecord } from '../lib/celebrate.ts';
import { fadeUp, listContainer, listItem, screen, tappable } from '../lib/motion.ts';
import { onboardingUnavailable } from '../lib/onboarding.ts';
import { useActivePlan, useGeneratePlan } from '../lib/plan.ts';
import { useSessionLog } from '../lib/session-log.ts';
import { RestTimer } from './RestTimer.tsx';
import { SetRow } from './SetRow.tsx';

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

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [seriesHechas, setSeriesHechas] = useState<number[]>([]);
  const [restingIndex, setRestingIndex] = useState<number | null>(null);

  const activePlanSessionId = plan.data?.kind === 'active' ? plan.data.session.planSessionId : '';
  const { markSetDone } = useSessionLog(user?.id, activePlanSessionId);

  if (status !== 'signed-in' || plan.isPending || plan.isError || plan.data?.kind !== 'active') {
    return <PlanStateMessage authStatus={status} plan={plan} />;
  }

  const session = plan.data.session;
  const item = session.items.find((i) => i.id === activeItemId);

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

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {item ? (
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
                onClick={() => {
                  setActiveItemId(null);
                  setSeriesHechas([]);
                  setRestingIndex(null);
                }}
                className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-slate"
              >
                Volver
              </motion.button>
            </div>

            <p className="rounded-lg bg-navy-soft px-3.5 py-2.5 text-xs text-slate">
              {item.rationale}
            </p>

            {restingIndex !== null ? (
              <motion.div
                key="timer"
                {...screen}
                className="rounded-2xl border border-line bg-navy-soft px-4 py-8"
              >
                <RestTimer prescribedSeconds={item.restSeconds} onFinish={handleRestFinish} />
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
                      onToggle={() => markDone(i)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
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
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        {...tappable}
        onClick={celebratePersonalRecord}
        className="flex items-center justify-center gap-2.5 rounded-xl border border-orange/40 bg-orange/10 px-4 py-3.5 text-sm font-semibold text-orange"
      >
        <Trophy size={16} aria-hidden="true" />
        Probar celebración de récord
      </motion.button>
    </div>
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
      <div className="grid place-items-center py-16">
        <div className="size-6 animate-spin rounded-full border-2 border-line border-t-teal" />
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
        <p className="flex items-center gap-1.5 text-xs text-orange">
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
