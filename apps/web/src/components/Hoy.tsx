import type { LoadReading } from '@bh/domain';
import type { SubstituteOption } from '@bh/engine';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Dumbbell,
  Flag,
  Loader2,
  MapPin,
  Repeat2,
  Trophy,
  Undo2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import type { SetActual } from '../lib/mappers/session-log.ts';
import { checkPop, fadeUp, listContainer, listItem, screen, tappable } from '../lib/motion.ts';
import { onboardingUnavailable, useProfileStatus } from '../lib/onboarding.ts';
import type { ActiveSessionItem } from '../lib/plan.ts';
import { useActivePlan, useGeneratePlan, useRequestNextPlan } from '../lib/plan.ts';
import { useSessionLog } from '../lib/session-log.ts';
import { useRestoredSession } from '../lib/session-restore.ts';
import { carriesLoad } from './LoadInput.tsx';
import { RestTimer } from './RestTimer.tsx';
import { SessionClose } from './SessionClose.tsx';
import { SetRow } from './SetRow.tsx';
import { SubstitutePicker } from './SubstitutePicker.tsx';
import { UltimaVez } from './UltimaVez.tsx';
import {
  Button,
  buttonClass,
  Card,
  ConfirmDialog,
  EmptyState,
  muscleSummary,
  PATTERN_LABELS,
  PatternIcon,
  Skeleton,
} from './ui/index.ts';

/** Lo que reemplaza a un ítem cuando su estación estaba ocupada. Los objetivos
 * (series, reps, descanso) siguen siendo los de la prescripción original —
 * solo cambia qué ejercicio/estación se usó de verdad. */
interface Substitution {
  readonly exerciseId: string;
  readonly equipmentId: string | null;
  readonly name: string;
  readonly sector: string | null;
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
  // Por ejercicio, no una lista sola: en el gimnasio se vuelve a la lista todo
  // el tiempo (a ver qué máquina está libre) y las series que ya hiciste no se
  // pueden borrar por salir de la pantalla.
  const [hechasPorItem, setHechasPorItem] = useState<Record<string, number[]>>({});
  // La carga con la que se está trabajando hoy, por ejercicio. Arranca en lo
  // que propuso el motor (`targetLoad`) y se puede anotar ANTES de la primera
  // serie: en la primera sesión de cualquier estación no hay baseline, así que
  // el plan llega sin número y no había dónde escribirlo hasta el descanso.
  const [cargaPorItem, setCargaPorItem] = useState<Record<string, LoadReading | null>>({});
  /**
   * La carga anotada de cada serie, por `itemId:setIndex`. Encima de
   * `cargaPorItem`, que es el punto de partida del ejercicio (lo del plan, o
   * lo que se venía usando según la sesión reconstruida).
   *
   * Una serie sin valor propio hereda el de la anterior: en la práctica se
   * anota una vez y las que siguen arrastran, salvo que se cambie el peso —
   * que es justo lo que antes no se podía registrar, porque el número era uno
   * solo para todo el ejercicio.
   */
  const [cargaPorSerie, setCargaPorSerie] = useState<Record<string, LoadReading | null>>({});
  const [restingIndex, setRestingIndex] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [showingSubstitutes, setShowingSubstitutes] = useState(false);
  const [substitutions, setSubstitutions] = useState<Record<string, Substitution>>({});
  // Destildar una serie ya registrada borra el registro: se pregunta antes.
  const [undoing, setUndoing] = useState<number | null>(null);
  const [endingEarly, setEndingEarly] = useState(false);

  const activePlanSessionId = plan.data?.kind === 'active' ? plan.data.session.planSessionId : '';
  const restored = useRestoredSession(user?.id, activePlanSessionId);
  const { markSetDone, undoSetDone, logSubstitution, workoutLogId } = useSessionLog(
    user?.id,
    activePlanSessionId,
    restored.data,
  );

  // Reconstruye en pantalla lo que ya está registrado en la base. Se hace una
  // vez por sesión: después manda lo que la persona va tocando, no la query.
  const [restoredFor, setRestoredFor] = useState<string | null>(null);
  if (restored.data && restoredFor !== activePlanSessionId) {
    setRestoredFor(activePlanSessionId);
    setHechasPorItem(restored.data.doneByItem);
    // La carga también: sin esto, volver a la sesión reseteaba el número al
    // del plan (nulo en la primera sesión de cualquier estación) y la serie
    // siguiente se registraba sin carga, con el dato sentado en la base.
    setCargaPorItem(restored.data.loadByItem);
    // Y la de cada serie: sin esto, dos series hechas con pesos distintos
    // volvían las dos con el de la última.
    setCargaPorSerie(restored.data.loadBySet);
  }

  if (status !== 'signed-in' || plan.isPending || plan.isError || plan.data?.kind !== 'active') {
    return <PlanStateMessage authStatus={status} plan={plan} />;
  }

  // Un día sin ningún ejercicio. El motor no puede armar uno así, pero en un
  // plan a mano es el estado normal justo después de agregar el día: se
  // agrega, se cierra la app, y al otro día "Hoy" tocaba ese. Antes acá se
  // dibujaba la sesión igual — "SERIES DE HOY 0/0", la lista vacía, el aviso
  // de que se puede sustituir una máquina que no existe, y "Terminar sesión"
  // como única salida. Medido en el navegador con un día vacío: cero filas y
  // ningún camino hacia adelante.
  if (plan.data.session.items.length === 0) {
    return (
      <DiaVacio
        planId={plan.data.planId}
        focus={plan.data.session.focus}
        manual={plan.data.planOrigin === 'manual'}
      />
    );
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
          // El `rationale` del motor nombra al ejercicio original ("Press de
          // pecho en máquina va primero…"): dejarlo tal cual después de
          // sustituir muestra un consejo sobre un ejercicio que ya no es este.
          rationale: `Reemplaza a ${original.name}: mismo patrón de movimiento, mismos objetivos de series y repeticiones.`,
        }
      : original;

  const seriesHechas = activeItemId ? (hechasPorItem[activeItemId] ?? []) : [];

  function markDone(indice: number) {
    if (!activeItemId || !item) return;
    const previas = hechasPorItem[activeItemId] ?? [];
    if (previas.includes(indice)) {
      // Destildar borra el registro, no solo el tilde: si no, una serie
      // marcada por error sigue contando en Progreso y alimentando la
      // adaptación como si se hubiera hecho. Justamente porque borra, se
      // pregunta: es lo único de esta pantalla que no se puede deshacer.
      setUndoing(indice);
      return;
    }
    setHechasPorItem((mapa) => ({ ...mapa, [activeItemId]: [...previas, indice] }));
    setRestingIndex(indice);
  }

  function confirmUndo() {
    if (undoing === null || !activeItemId || !item) return;
    const indice = undoing;
    setUndoing(null);
    setHechasPorItem((mapa) => ({
      ...mapa,
      [activeItemId]: (mapa[activeItemId] ?? []).filter((i) => i !== indice),
    }));
    void undoSetDone(item, indice);
    if (restingIndex === indice) setRestingIndex(null);
  }

  async function handleRestFinish(actualSeconds: number, actual: SetActual) {
    if (item && restingIndex !== null) {
      // Lo que se registró manda sobre lo que se había anotado antes. En el
      // descanso se puede corregir la carga (es el momento en que se sabe con
      // qué se hizo de verdad), y sin esto la fila seguía mostrando el número
      // de antes: la base decía 65 y la pantalla 60, y la serie siguiente
      // heredaba el equivocado.
      const key = `${item.id}:${restingIndex}`;
      setCargaPorSerie((mapa) => ({ ...mapa, [key]: actual.load }));
      await markSetDone(item, restingIndex, actualSeconds, actual);
    }
    setRestingIndex(null);
  }

  async function handlePickSubstitute(
    option: SubstituteOption,
    name: string,
    sector: string | null,
  ) {
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

  const seriesTotales = session.items.reduce((total, i) => total + i.sets, 0);
  const seriesCompletas = session.items.reduce(
    (total, i) => total + Math.min((hechasPorItem[i.id] ?? []).length, i.sets),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {item ? (
          <ExerciseDetail
            item={item}
            original={original}
            userId={user?.id}
            gymId={profile.data?.gymId ?? null}
            workoutLogId={workoutLogId}
            showingSubstitutes={showingSubstitutes}
            restingIndex={restingIndex}
            seriesHechas={seriesHechas}
            cargaDeSerie={(setIndex) =>
              cargaDeSerie(
                cargaPorSerie,
                cargaPorItem[item.id] ?? item.targetLoad,
                item.id,
                setIndex,
              )
            }
            onCargaSerie={(setIndex, load) =>
              setCargaPorSerie((mapa) => ({ ...mapa, [`${item.id}:${setIndex}`]: load }))
            }
            onBack={() => {
              setActiveItemId(null);
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
          <motion.section key="lista" {...screen} className="flex flex-col gap-5">
            <SessionHero
              focus={session.focus}
              seriesCompletas={seriesCompletas}
              seriesTotales={seriesTotales}
            />

            <motion.ul
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2.5"
            >
              {session.items.map((sessionItem, i) => (
                <SessionItemRow
                  key={sessionItem.id}
                  item={sessionItem}
                  substitution={substitutions[sessionItem.id]}
                  hechas={(hechasPorItem[sessionItem.id] ?? []).length}
                  // "Sugerido" es el primero que todavía no terminaste, no el
                  // primero de la lista: si ese ya está hecho, sugerirlo confunde.
                  sugerido={
                    session.items.findIndex(
                      (otro) => (hechasPorItem[otro.id] ?? []).length < otro.sets,
                    ) === i
                  }
                  onOpen={() => setActiveItemId(sessionItem.id)}
                />
              ))}
            </motion.ul>

            <p className="px-1 text-xs leading-relaxed text-slate">
              El orden es una sugerencia: tocá el que esté libre. Si una máquina está ocupada, la
              app te ofrece un reemplazo equivalente.
            </p>

            <Button
              variant="ghost"
              size="lg"
              onClick={() =>
                seriesCompletas < seriesTotales ? setEndingEarly(true) : setClosing(true)
              }
            >
              Terminar sesión
            </Button>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Terminar con series sin hacer marca la sesión como completada y hace
          avanzar la cola: la próxima vez toca la siguiente, no esta. No es
          reversible desde ninguna pantalla, así que se avisa. */}
      <ConfirmDialog
        open={endingEarly}
        icon={<Flag size={18} aria-hidden="true" />}
        title="Todavía te faltan series"
        confirmLabel="Terminar igual"
        cancelLabel="Seguir entrenando"
        onCancel={() => setEndingEarly(false)}
        onConfirm={() => {
          setEndingEarly(false);
          setClosing(true);
        }}
      >
        Llevás {seriesCompletas} de {seriesTotales}. Si terminás ahora, la sesión queda cerrada con
        lo que hiciste y la próxima vez te toca la siguiente de la cola.
      </ConfirmDialog>

      <ConfirmDialog
        open={undoing !== null}
        icon={<Undo2 size={18} aria-hidden="true" />}
        title="¿Desmarcar esta serie?"
        confirmLabel="Desmarcar"
        confirmVariant="danger"
        onCancel={() => setUndoing(null)}
        onConfirm={confirmUndo}
      >
        Se borra el registro de esa serie. Deja de contar en tu progreso y de alimentar los ajustes
        de carga.
      </ConfirmDialog>
    </div>
  );
}

/**
 * El encabezado de la sesión del día.
 *
 * La barra de progreso es por series y no por ejercicios a propósito: con
 * cinco ejercicios, contar por ejercicio hace que la barra no se mueva
 * durante las tres series de cada uno — justo el rato en que la persona más
 * quiere ver que avanzó.
 */
function SessionHero({
  focus,
  seriesCompletas,
  seriesTotales,
}: {
  focus: string;
  seriesCompletas: number;
  seriesTotales: number;
}) {
  const porcentaje = seriesTotales === 0 ? 0 : (seriesCompletas / seriesTotales) * 100;
  const terminada = seriesTotales > 0 && seriesCompletas >= seriesTotales;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand">
          Blue Horse · Arroyo Seco
        </p>
        <h1 className="font-display text-[2.6rem] font-semibold uppercase leading-[0.95] tracking-tight">
          Hoy te toca
        </h1>
        <p className="text-sm text-slate">{focus}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xs font-medium uppercase tracking-[0.18em] text-slate">
            {terminada ? 'Sesión completa' : 'Series de hoy'}
          </span>
          <span className="font-display text-sm font-semibold tabular-nums text-ink">
            {seriesCompletas}
            <span className="text-slate-dim">/{seriesTotales}</span>
          </span>
        </div>
        {/* `h-1.5` y no una barra gorda: es un indicador de fondo, no el
            contenido. El degradé va de izquierda a derecha para que el avance
            se lea como movimiento aunque el porcentaje sea bajo. */}
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${porcentaje}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            className="h-full rounded-full bg-gradient-to-r from-brand-deep via-brand to-brand-bright"
          />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Una fila de la lista de "Hoy te toca". Aparte de `Hoy` para que la pantalla
 * no acumule ramas: la fila cambia según si el ejercicio se sustituyó y según
 * cuántas series lleva hechas.
 */
function SessionItemRow({
  item,
  substitution,
  hechas,
  sugerido,
  onOpen,
}: {
  item: ActiveSessionItem;
  substitution: Substitution | undefined;
  hechas: number;
  sugerido: boolean;
  onOpen: () => void;
}) {
  const completo = hechas >= item.sets;
  const musculos = muscleSummary(item.primaryMuscles);

  return (
    <motion.li variants={listItem}>
      <motion.button
        type="button"
        {...tappable}
        onClick={onOpen}
        className={`flex w-full items-center gap-3.5 rounded-card border px-4 py-3.5 text-left transition-colors duration-150 ${
          completo
            ? 'border-brand/35 bg-brand/[0.07]'
            : sugerido
              ? 'border-brand/45 bg-surface shadow-brand'
              : 'border-line bg-surface shadow-card hover:border-line-bright'
        }`}
      >
        {/* El ícono sale del patrón de movimiento, no es siempre la misma
            mancuerna: con cinco filas idénticas no servía para nada, y en el
            gimnasio la lista se mira de reojo para encontrar "el de piernas"
            sin leer. Al completarse, el patrón deja lugar al tilde — ahí lo
            que importa ya no es qué ejercicio es, sino que está hecho. */}
        <span
          className={`grid size-11 shrink-0 place-items-center rounded-xl border transition-colors duration-200 ${
            completo
              ? 'border-brand/40 bg-brand/15 text-brand'
              : sugerido
                ? 'border-brand/40 bg-gradient-to-b from-brand/25 to-brand/5 text-brand'
                : 'border-line bg-navy text-slate'
          }`}
          title={PATTERN_LABELS[item.pattern]}
        >
          <AnimatePresence mode="wait" initial={false}>
            {completo ? (
              <motion.span key="hecho" variants={checkPop} initial="hidden" animate="visible">
                <Check size={19} strokeWidth={2.5} aria-hidden="true" />
              </motion.span>
            ) : (
              <motion.span
                key="patron"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PatternIcon pattern={item.pattern} size={19} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        {/* El nombre se queda con todo el ancho de la fila: con la chapita
            "sugerido" al costado, en un teléfono "Peso muerto rumano" partía
            en dos líneas y esa tarjeta quedaba 40px más alta que las demás. */}
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-semibold leading-tight">{substitution?.name ?? item.name}</span>
            {sugerido && !completo && (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 font-display text-[0.6rem] font-medium uppercase tracking-[0.14em] text-brand">
                empezá por acá
              </span>
            )}
          </span>
          <span className="flex items-center gap-2.5">
            <SetDots total={item.sets} done={hechas} />
            <span className="font-mono text-xs text-slate">
              {item.reps} reps · {item.load}
            </span>
          </span>
          {/* Qué músculo se trabaja: sin esto, "Remo sentado" y "Jalón al
              pecho" son dos nombres y no dos cosas distintas para quien
              recién empieza. */}
          {musculos && (
            <span className="text-[0.65rem] leading-none text-slate-dim">{musculos}</span>
          )}
          {substitution && (
            <span className="flex items-center gap-1 text-[0.65rem] text-slate-dim">
              <Repeat2 size={11} aria-hidden="true" />
              reemplaza a {item.name}
            </span>
          )}
        </span>
        <ChevronRight
          size={16}
          className={completo ? 'shrink-0 text-brand/60' : 'shrink-0 text-slate-dim'}
          aria-hidden="true"
        />
      </motion.button>
    </motion.li>
  );
}

/**
 * Cuántas series de este ejercicio llevás, sin leer un número. Tres puntos y
 * dos llenos se entienden de un vistazo; "2/3" hay que leerlo.
 */
function SetDots({ total, done }: { total: number; done: number }) {
  // Identidad estable por punto, mismo criterio que `seriesDe`: la posición
  // no alcanza como clave de React.
  const puntos = Array.from({ length: total }, (_, i) => ({
    id: `punto-${i + 1}`,
    lleno: i < done,
  }));

  return (
    <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
      {puntos.map((punto) => (
        <span
          key={punto.id}
          className={`size-1.5 rounded-full ${punto.lleno ? 'bg-brand' : 'bg-line-bright'}`}
        />
      ))}
    </span>
  );
}

/**
 * Qué carga mostrar en cada serie.
 *
 * "Sin carga previa" (el texto que traía `item.load` desde el plan) decía dos
 * cosas distintas con las mismas palabras: en una prensa significaba "todavía
 * no sé con cuánto trabajás", y en una dominada o una colchoneta significaba
 * "acá no hay peso que anotar". La primera es algo que la persona puede
 * resolver ahora mismo; la segunda no, y pedirle un número sería inventarlo.
 */
/**
 * Con cuánto va esta serie: lo que se anotó para ella, o lo que arrastra de
 * la anterior, o el punto de partida del ejercicio.
 *
 * Se camina para atrás en vez de guardar un valor por serie de entrada porque
 * "no anotado" y "anotado en blanco" son cosas distintas: borrar el campo de
 * la serie 3 tiene que dejarla vacía, no volver a copiar la 2 encima.
 */
function cargaDeSerie(
  porSerie: Record<string, LoadReading | null>,
  base: LoadReading | null,
  itemId: string,
  setIndex: number,
): LoadReading | null {
  for (let i = setIndex; i >= 0; i -= 1) {
    const key = `${itemId}:${i}`;
    if (key in porSerie) return porSerie[key] ?? null;
  }
  return base;
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
  workoutLogId,
  showingSubstitutes,
  restingIndex,
  seriesHechas,
  cargaDeSerie: cargaDe,
  onCargaSerie,
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
  /** El registro de HOY, para no contar la sesión en curso como "la vez pasada". */
  workoutLogId: string | null;
  showingSubstitutes: boolean;
  restingIndex: number | null;
  seriesHechas: number[];
  /** Con cuánto se está trabajando hoy: lo del plan, o lo que la persona anotó. */
  /** Con cuánto va cada serie, resuelto arriba (lo propio, lo heredado o lo del plan). */
  cargaDeSerie: (setIndex: number) => LoadReading | null;
  onCargaSerie: (setIndex: number, load: LoadReading | null) => void;
  onBack: () => void;
  onShowSubstitutes: () => void;
  onPickSubstitute: (option: SubstituteOption, name: string, sector: string | null) => void;
  onCancelSubstitutes: () => void;
  onRestFinish: (actualSeconds: number, actual: SetActual) => void;
  onToggleSet: (indice: number) => void;
}) {
  return (
    <motion.section key="detalle" {...screen} className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <motion.button
          type="button"
          {...tappable}
          onClick={onBack}
          className="flex w-fit items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-slate transition-colors hover:border-line-bright hover:text-ink"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Volver a la sesión
        </motion.button>
        {/* `min-w-0` para que el nombre pueda achicarse: sin eso un ejercicio
            de nombre largo desborda la tarjeta. */}
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
            <PatternIcon pattern={item.pattern} size={20} />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="font-display text-3xl font-semibold uppercase leading-[1.05] tracking-tight">
              {item.name}
            </h2>
            {/* La ubicación solo si el catálogo la tiene: repetir "sin
                ubicación" ocupa el lugar de un dato sin ser uno. */}
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate">
              {item.sector && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-brand" aria-hidden="true" />
                  {item.sector}
                </span>
              )}
              <span className="text-slate-dim">{PATTERN_LABELS[item.pattern]}</span>
            </p>
          </div>
        </div>
      </div>

      {/* La barra de la marca al costado convierte el consejo del motor en una
          cita, no en otro párrafo gris más de la pantalla.

          En un plan armado a mano no hay nada que citar: el ejercicio lo
          eligió la persona. Ahí el bloque no se dibuja — antes quedaba la
          barra azul al costado de un párrafo vacío, con cara de cita del
          motor y sin motor detrás. */}
      {item.rationale && (
        <p className="border-l-2 border-brand/50 bg-surface/60 py-2.5 pl-3.5 pr-3 text-sm leading-relaxed text-slate">
          {item.rationale}
        </p>
      )}

      {/* "Máquina ocupada" antes: el nombre daba a entender que este botón
          solo servía para ese caso puntual, cuando en realidad recorre TODO
          el catálogo por patrón y músculos compartidos (`findSubstitutes()`),
          no solo máquinas libres. "Cambiar ejercicio" es lo que hace de
          verdad — sirve tanto para la estación ocupada como para "che, ¿esto
          lo puedo hacer de otra forma?" un día cualquiera. */}
      {!showingSubstitutes && restingIndex === null && (
        <Button variant="ghost" size="sm" className="self-start" onClick={onShowSubstitutes}>
          <Repeat2 size={13} aria-hidden="true" />
          Cambiar ejercicio
        </Button>
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
        <motion.div key="timer" {...screen}>
          <Card animate={false} className="px-4 py-8">
            <RestTimer
              prescribedSeconds={item.restSeconds}
              repsTarget={item.repsTarget}
              targetRir={item.targetRir}
              targetLoad={cargaDe(restingIndex)}
              loadSpec={item.equipmentLoadSpec}
              onFinish={onRestFinish}
            />
          </Card>
        </motion.div>
      ) : (
        <motion.div
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2.5"
        >
          {/* Lo que el plan propone está arriba; esto es lo que pasó la vez
              pasada. Dos cosas distintas, mostradas como dos cosas distintas
              (regla dura 7). */}
          <UltimaVez exerciseId={item.exerciseId} workoutLogId={workoutLogId} />

          {/* Cada serie con su carga: se anota ANTES de hacerla, ahí mismo.
              En la primera sesión de cualquier estación el plan llega sin
              número (no hay con qué calcularlo sin inventarlo), y hasta hace
              poco el único lugar donde se podía escribir era el descanso — o
              sea, después. La de cada serie arrastra de la anterior, así que
              el caso común sigue siendo anotar una vez. */}
          {carriesLoad(item.equipmentLoadSpec) && (
            <p className="px-1 text-[0.7rem] leading-relaxed text-slate-dim">
              Anotá con cuánto hacés cada serie. La que sigue arranca con lo mismo, y la cambiás
              solo si movés el peso.
            </p>
          )}

          {seriesDe(item).map(({ id, numero: i }) => (
            <motion.div key={id} variants={listItem}>
              <SetRow
                index={i}
                load={cargaDe(i)}
                loadSpec={item.equipmentLoadSpec}
                onLoad={(load) => onCargaSerie(i, load)}
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
 * El día que toca no tiene ningún ejercicio cargado.
 *
 * Solo pasa en los planes armados a mano, y no es un error: es un día que se
 * creó y quedó a medio llenar. La salida es terminar de cargarlo, así que el
 * botón lleva ahí y no a "terminar la sesión" —marcar como hecho un día en el
 * que no se entrenó ensucia el historial para siempre.
 */
function DiaVacio({
  planId,
  focus,
  manual,
}: {
  readonly planId: string;
  readonly focus: string;
  readonly manual: boolean;
}) {
  return (
    <EmptyState
      icon={<Dumbbell size={24} aria-hidden="true" />}
      title={`“${focus}” está vacío`}
      action={
        manual ? (
          <Link to={`/planes/${planId}/armar`} className={buttonClass('primary', 'lg')}>
            Cargarle ejercicios
          </Link>
        ) : (
          <Link to="/planes" className={buttonClass('primary', 'lg')}>
            Ver tus planes
          </Link>
        )
      }
    >
      {manual
        ? 'Creaste el día pero todavía no le pusiste ningún ejercicio. Agregale los que vayas a hacer y volvé acá.'
        : 'Este día del plan quedó sin ejercicios. Revisalo desde tus planes.'}
    </EmptyState>
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
      <EmptyState icon={<Dumbbell size={24} aria-hidden="true" />} title="Sin sesión">
        {authStatus === 'unconfigured'
          ? 'Supabase no está configurado: no se puede leer ni generar el plan todavía.'
          : 'Iniciá sesión para ver tu plan.'}
      </EmptyState>
    );
  }

  if (plan.isPending) {
    return <SessionSkeleton />;
  }

  if (plan.data?.kind === 'queue-empty') {
    return <QueueDone />;
  }

  // plan.isError o plan.data?.kind === 'no-plan': mismo llamado a la acción.
  return (
    <EmptyState
      icon={<Dumbbell size={24} aria-hidden="true" />}
      title="Todavía no tenés un plan"
      action={
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="primary"
            size="lg"
            disabled={generatePlan.isPending || onboardingUnavailable}
            onClick={() => generatePlan.mutate()}
          >
            {generatePlan.isPending && (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            )}
            Generar mi plan
          </Button>
          {generatePlan.isError && (
            <p role="alert" className="flex items-center gap-1.5 text-xs text-orange">
              <AlertCircle size={13} aria-hidden="true" />
              No se pudo generar. Probá de nuevo en un momento.
            </p>
          )}
        </div>
      }
    >
      {plan.isError
        ? 'No se pudo consultar tu plan. Revisá tu conexión y probá de nuevo.'
        : 'Generalo con lo que ya cargaste en el onboarding.'}
    </EmptyState>
  );
}

/**
 * La forma de la sesión mientras se lee de la base, en vez de un spinner
 * centrado: al llegar los datos la pantalla no salta, porque los bloques ya
 * están donde van a estar los ejercicios.
 */
function SessionSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-1.5 w-full" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-[4.75rem] w-full" />
        <Skeleton className="h-[4.75rem] w-full" />
        <Skeleton className="h-[4.75rem] w-full" />
      </div>
      <span className="sr-only">Cargando tu plan…</span>
    </div>
  );
}

/** Identidad estable por serie: la posición no alcanza como clave de React. */
function seriesDe(item: { id: string; sets: number }) {
  return Array.from({ length: item.sets }, (_, numero) => ({
    id: `${item.id}-serie-${numero + 1}`,
    numero,
  }));
}

/**
 * Terminaste todas las sesiones del plan. Antes esto era un callejón: te
 * felicitaba y no ofrecía nada. Ahora se pide el plan siguiente, que arranca
 * con las cargas donde quedó el anterior.
 */
function QueueDone() {
  const nextPlan = useRequestNextPlan();
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setError(null);
    try {
      await nextPlan.mutateAsync();
    } catch {
      setError('No se pudieron generar las próximas sesiones. Probá de nuevo en un momento.');
    }
  }

  return (
    <EmptyState
      icon={<Trophy size={24} aria-hidden="true" />}
      title="Completaste toda la cola"
      action={
        <div className="flex flex-col items-center gap-2">
          <Button variant="primary" size="lg" disabled={nextPlan.isPending} onClick={handleRequest}>
            {nextPlan.isPending && (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            )}
            Pedir las próximas sesiones
          </Button>
          {error && (
            <p role="alert" className="text-xs text-orange">
              {error}
            </p>
          )}
        </div>
      }
    >
      Las próximas arrancan con las cargas donde las dejaste.
    </EmptyState>
  );
}
