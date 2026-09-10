import {
  AlertCircle,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Info,
  Layers,
  Loader2,
  PauseCircle,
  PenLine,
  PlayCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { AppShell } from '../components/AppShell.tsx';
import {
  Button,
  buttonClass,
  Card,
  ConfirmDialog,
  EmptyState,
  fieldClass,
  Notice,
  SectionLabel,
  Skeleton,
} from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { GOAL_LABELS } from '../lib/labels.ts';
import { useCreateManualPlan } from '../lib/manual-plan.ts';
import { fadeUp, listContainer, listItem, spring, tappable } from '../lib/motion.ts';
import { onboardingUnavailable } from '../lib/onboarding.ts';
import type { PlanSessionSummary, PlanSummary } from '../lib/plan.ts';
import {
  useActivatePlan,
  useDeactivatePlan,
  useDeletePlan,
  useGeneratePlan,
  usePlanSessions,
  usePlans,
} from '../lib/plan.ts';

/**
 * TUS PLANES
 *
 * Antes esto era media pantalla escondida abajo de Progreso, y solo aparecía si
 * había dos planes o más. Con uno solo no se veía nada: no había forma de saber
 * cuál estaba activo, con qué objetivo se había armado, ni qué venía después.
 *
 * La regla dura sigue igual — un plan `active` por socio, garantizado por un
 * índice único en la base. Lo que esta pantalla agrega es poder VER cuál es, y
 * cambiarlo sin perder los otros: "guardado" y "activo" son el mismo plan en
 * distinto estado, no dos cosas distintas.
 */

const TEMPLATE_LABELS: Record<string, string> = {
  full_body_ab: 'Cuerpo completo A/B',
  upper_lower: 'Torso / pierna',
  cardio_base: 'Base aeróbica',
};

const GYM_TZ = 'America/Argentina/Buenos_Aires';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * Cómo se armó. Los planes a mano no salieron de ningún template, así que no
 * hay nada que traducir: lo dice el origen.
 */
function templateLabel(plan: PlanSummary): string {
  if (plan.origin === 'manual') return 'Armado por vos';
  return plan.templateId ? (TEMPLATE_LABELS[plan.templateId] ?? plan.templateId) : 'Del motor';
}

/**
 * Cómo se llama este plan en pantalla: el nombre que le puso el socio, o el
 * del template si no le puso ninguno (los planes generados antes de que se
 * pudiera nombrarlos, y el de quien no quiso escribir nada).
 */
function planLabel(plan: PlanSummary): string {
  return plan.name ?? templateLabel(plan);
}

export function Planes() {
  const { status } = useAuth();
  const plans = usePlans();
  const activate = useActivatePlan();

  const deactivate = useDeactivatePlan();
  const remove = useDeletePlan();

  const [openId, setOpenId] = useState<string | null>(null);
  const [asking, setAsking] = useState<PlanSummary | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pausing, setPausing] = useState<PlanSummary | null>(null);
  const [deleting, setDeleting] = useState<PlanSummary | null>(null);
  /** Lo que escribió para confirmar el borrado. Tiene que coincidir con el nombre. */
  const [typed, setTyped] = useState('');

  async function handleActivate(planId: string) {
    setAsking(null);
    setPendingId(planId);
    try {
      await activate.mutateAsync(planId);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDeactivate(planId: string) {
    setPausing(null);
    setPendingId(planId);
    try {
      await deactivate.mutateAsync(planId);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(planId: string) {
    setPendingId(planId);
    try {
      await remove.mutateAsync(planId);
      setDeleting(null);
      setTyped('');
    } finally {
      setPendingId(null);
    }
  }

  const activo = plans.data?.find((p) => p.status === 'active') ?? null;
  const guardados = plans.data?.filter((p) => p.status !== 'active') ?? [];

  return (
    <AppShell>
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1"
      >
        <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand">
          Tu entrenamiento
        </p>
        <h1 className="font-display text-[2.6rem] font-semibold uppercase leading-[0.95] tracking-tight">
          Tus planes
        </h1>
      </motion.header>

      <PlanesBody
        authStatus={status}
        plans={plans}
        activo={activo}
        guardados={guardados}
        openId={openId}
        pendingId={pendingId}
        onToggle={(id) => setOpenId(openId === id ? null : id)}
        onAsk={setAsking}
        onPause={setPausing}
        onDelete={(plan) => {
          setTyped('');
          setDeleting(plan);
        }}
      />

      {activate.isError && (
        <Notice tone="error" role="alert" icon={<AlertCircle size={15} aria-hidden="true" />}>
          No se pudo cambiar de plan. Probá de nuevo.
        </Notice>
      )}

      <ConfirmDialog
        open={asking !== null}
        icon={<PlayCircle size={18} aria-hidden="true" />}
        title="¿Cambiar el plan de hoy?"
        confirmLabel="Retomar este"
        cancelLabel="Dejarlo así"
        busy={pendingId !== null}
        onCancel={() => setAsking(null)}
        onConfirm={() => asking && void handleActivate(asking.id)}
      >
        {asking && (
          <>
            Vas a retomar <strong className="text-ink">{templateLabel(asking)}</strong> donde lo
            dejaste ({asking.completedSessions}/{asking.totalSessions} sesiones).
            {activo && (
              <>
                {' '}
                <strong className="text-ink">{templateLabel(activo)}</strong> queda guardado: podés
                volver cuando quieras, no se pierde nada.
              </>
            )}
          </>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={pausing !== null}
        icon={<PauseCircle size={18} aria-hidden="true" />}
        title="¿Pausar este plan?"
        confirmLabel="Pausarlo"
        cancelLabel="Seguir con él"
        busy={pendingId !== null}
        onCancel={() => setPausing(null)}
        onConfirm={() => pausing && void handleDeactivate(pausing.id)}
      >
        {pausing && (
          <>
            <strong className="text-ink">{planLabel(pausing)}</strong> pasa a guardados y te quedás
            sin plan activo: "Hoy" no te va a proponer nada hasta que retomes este o armes otro. No
            se pierde nada — sigue donde lo dejaste ({pausing.completedSessions}/
            {pausing.totalSessions} sesiones).
          </>
        )}
      </ConfirmDialog>

      {/* Borrar pide escribir el nombre. No es fricción por fricción: es la
          única acción de la app que destruye algo que no se puede rehacer, y
          escribir el nombre obliga a mirar CUÁL se está borrando — que es
          justo lo que falla cuando hay tres planes parecidos en la lista. */}
      <ConfirmDialog
        open={deleting !== null}
        icon={<Trash2 size={18} aria-hidden="true" />}
        title="¿Borrar este plan?"
        confirmLabel="Borrarlo"
        confirmVariant="danger"
        cancelLabel="No, dejalo"
        busy={pendingId !== null}
        confirmDisabled={deleting === null || typed.trim() !== planLabel(deleting)}
        onCancel={() => {
          setDeleting(null);
          setTyped('');
        }}
        onConfirm={() => deleting && void handleDelete(deleting.id)}
      >
        {deleting && (
          <span className="flex flex-col gap-3 text-left">
            <span>
              Se borra el plan con sus sesiones. Lo que entrenaste no se pierde: las series siguen
              en tu historial.
              {deleting.completedSessions > 0 && (
                <>
                  {' '}
                  Pero dejan de poder compararse contra lo que este plan proponía, y esa comparación
                  es de donde el motor saca los ajustes de carga.
                </>
              )}
            </span>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-slate">
                Escribí <strong className="text-ink">{planLabel(deleting)}</strong> para confirmar
              </span>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                placeholder={planLabel(deleting)}
                className={fieldClass}
              />
            </label>
          </span>
        )}
      </ConfirmDialog>

      {(deactivate.isError || remove.isError) && (
        <Notice tone="error" role="alert" icon={<AlertCircle size={15} aria-hidden="true" />}>
          No se pudo completar la acción sobre el plan. Probá de nuevo.
        </Notice>
      )}
    </AppShell>
  );
}

/**
 * El cuerpo de la pantalla, aparte para que `Planes` no acumule ramas. El
 * estado de sesión se chequea ANTES que `isPending`: sin sesión la query queda
 * deshabilitada y `isPending` no resuelve nunca (CLAUDE.md, trampas conocidas).
 */
function PlanesBody({
  authStatus,
  plans,
  activo,
  guardados,
  openId,
  pendingId,
  onToggle,
  onAsk,
  onPause,
  onDelete,
}: {
  readonly authStatus: ReturnType<typeof useAuth>['status'];
  readonly plans: ReturnType<typeof usePlans>;
  readonly activo: PlanSummary | null;
  readonly guardados: readonly PlanSummary[];
  readonly openId: string | null;
  readonly pendingId: string | null;
  readonly onToggle: (id: string) => void;
  readonly onAsk: (plan: PlanSummary) => void;
  readonly onPause: (plan: PlanSummary) => void;
  readonly onDelete: (plan: PlanSummary) => void;
}) {
  if (authStatus !== 'signed-in') {
    return (
      <EmptyState icon={<Layers size={24} aria-hidden="true" />} title="Sin sesión">
        {authStatus === 'unconfigured'
          ? 'Supabase no está configurado: no se pueden leer tus planes todavía.'
          : 'Iniciá sesión para ver tus planes.'}
      </EmptyState>
    );
  }

  if (plans.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-20 w-full" />
        <span className="sr-only">Cargando tus planes…</span>
      </div>
    );
  }

  if (plans.isError) {
    return (
      <Notice tone="error" role="alert" icon={<AlertCircle size={16} aria-hidden="true" />}>
        No se pudieron leer tus planes. Revisá tu conexión y probá de nuevo.
      </Notice>
    );
  }

  if (!plans.data || plans.data.length === 0) return <SinPlanes />;

  return (
    <div className="flex flex-col gap-6">
      {/* Armar otro sin tener que terminar el que está en curso: es la misma
          acción que ofrece la pantalla vacía, disponible siempre. El que
          estaba activo pasa a guardados, no se pierde. */}
      <section className="flex flex-col gap-2.5">
        <NuevoPlan hayActivo={activo !== null} />
      </section>

      {activo && (
        <section className="flex flex-col gap-2.5">
          <SectionLabel icon={<Sparkles size={13} className="text-brand" aria-hidden="true" />}>
            El de hoy
          </SectionLabel>
          <PlanCard
            plan={activo}
            open={openId === activo.id}
            busy={false}
            onToggle={() => onToggle(activo.id)}
            onActivate={null}
            onPause={() => onPause(activo)}
            onDelete={() => onDelete(activo)}
          />
        </section>
      )}

      {guardados.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <SectionLabel icon={<Layers size={13} aria-hidden="true" />}>
            {guardados.length === 1 ? 'Guardado' : `Guardados (${guardados.length})`}
          </SectionLabel>
          <p className="-mt-1 px-1 text-xs leading-relaxed text-slate">
            No se pierden. Retomar uno lo pone como el de hoy y guarda el que estaba activo, cada
            uno en la sesión donde lo dejaste.
          </p>
          <motion.ul
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2.5"
          >
            {guardados.map((plan) => (
              <motion.li key={plan.id} variants={listItem}>
                <PlanCard
                  plan={plan}
                  open={openId === plan.id}
                  busy={pendingId === plan.id}
                  onToggle={() => onToggle(plan.id)}
                  onActivate={() => onAsk(plan)}
                  onPause={() => onPause(plan)}
                  onDelete={() => onDelete(plan)}
                />
              </motion.li>
            ))}
          </motion.ul>
        </section>
      )}
    </div>
  );
}

/** Todavía no generó ninguno. Mismo llamado a la acción que "Hoy". */
function SinPlanes() {
  return (
    <EmptyState
      icon={<Layers size={24} aria-hidden="true" />}
      title="Todavía no tenés ningún plan"
      action={<NuevoPlan />}
    >
      Se arma con lo que cargaste en el onboarding y con el equipamiento real del gimnasio.
    </EmptyState>
  );
}

/**
 * Armar un plan nuevo, con nombre.
 *
 * El nombre es opcional a propósito: quien solo quiere entrenar toca el botón
 * y listo. Sirve cuando hay varios guardados — "cuerpo completo A/B" tres
 * veces en la lista no distingue nada, y encima es el nombre que hay que
 * escribir para borrar uno.
 *
 * Lo que el plan contiene no se elige acá: sale del motor, del objetivo del
 * onboarding y del equipamiento real. Poner un nombre no cambia ni un número
 * del entrenamiento.
 */
function NuevoPlan({ hayActivo = false }: { readonly hayActivo?: boolean }) {
  const generate = useGeneratePlan();
  const crearManual = useCreateManualPlan();
  const navigate = useNavigate();
  const [modo, setModo] = useState<'cerrado' | 'motor' | 'mano'>('cerrado');
  const [nombre, setNombre] = useState('');

  const trabajando = generate.isPending || crearManual.isPending;

  if (modo === 'cerrado') {
    return <DosCaminos hayActivo={hayActivo} trabajando={trabajando} onElegir={setModo} />;
  }

  const manual = modo === 'mano';

  async function crear() {
    if (manual) {
      const id = await crearManual.mutateAsync(nombre.trim());
      void navigate(`/planes/${id}/armar`);
      return;
    }
    generate.mutate(nombre.trim() || null);
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2.5">
      <label className="flex flex-col gap-1.5 text-left">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
          {/* En el plan a mano el nombre es lo único que lo distingue: no hay
              template al que caer si queda vacío. */}
          Nombre {manual ? '' : '(opcional)'}
        </span>
        <input
          type="text"
          value={nombre}
          maxLength={60}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={manual ? 'Mi rutina' : 'Potencia en piernas'}
          className={fieldClass}
        />
      </label>

      {manual ? (
        <p className="text-left text-xs leading-relaxed text-slate">
          Vas a armar los días vos, uno por vez. Empieza vacío y queda guardado: podés cargar hoy un
          día y el resto cuando quieras. Los números los elegís vos, no salen del motor.
        </p>
      ) : (
        hayActivo && (
          <p className="text-left text-xs leading-relaxed text-slate">
            El nuevo pasa a ser el de hoy y el que tenías queda guardado, en la sesión donde lo
            dejaste. Las cargas que ya venías usando se arrastran al nuevo.
          </p>
        )
      )}
      <div className="flex gap-2">
        <Button variant="quiet" size="md" disabled={trabajando} onClick={() => setModo('cerrado')}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          disabled={trabajando || (manual ? !nombre.trim() : onboardingUnavailable)}
          onClick={() => void crear()}
        >
          {trabajando && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          {manual ? 'Empezar a armarlo' : 'Armarlo'}
        </Button>
      </div>
      {(generate.isError || crearManual.isError) && (
        <Notice tone="error" role="alert">
          No se pudo armar el plan. Probá de nuevo.
        </Notice>
      )}
    </div>
  );
}

/**
 * Las dos formas de tener un plan, una al lado de la otra.
 *
 * El camino a mano no está escondido detrás del otro ni en un menú: son dos
 * maneras distintas de armar un plan, no una opción avanzada de la primera.
 */
function DosCaminos({
  hayActivo,
  trabajando,
  onElegir,
}: {
  readonly hayActivo: boolean;
  readonly trabajando: boolean;
  readonly onElegir: (modo: 'motor' | 'mano') => void;
}) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Button
        variant={hayActivo ? 'ghost' : 'primary'}
        size={hayActivo ? 'md' : 'lg'}
        className={hayActivo ? 'self-start' : ''}
        disabled={trabajando || onboardingUnavailable}
        onClick={() => onElegir('motor')}
      >
        <Sparkles size={16} aria-hidden="true" />
        {hayActivo ? 'Armar otro con el motor' : 'Que me lo arme la app'}
      </Button>
      <Button
        variant="ghost"
        size="md"
        className="self-start"
        disabled={trabajando}
        onClick={() => onElegir('mano')}
      >
        <PenLine size={15} aria-hidden="true" />
        Armarlo yo, día por día
      </Button>
    </div>
  );
}

/**
 * Un plan. Cerrado muestra lo que se necesita para elegir entre dos; abierto,
 * la cola completa con los ejercicios de cada sesión.
 */
/** Nombre, objetivo y el botón de retomar (o el sello de activo). */
function PlanCardHeader({
  plan,
  busy,
  onActivate,
}: {
  readonly plan: PlanSummary;
  readonly busy: boolean;
  readonly onActivate: (() => void) | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-display text-lg font-semibold uppercase leading-tight tracking-tight">
          {planLabel(plan)}
        </p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate">
          {plan.goal && <span className="text-brand">{GOAL_LABELS[plan.goal]}</span>}
          {/* Con nombre propio, el template pasa a ser el subtítulo: dos
              planes que se llaman distinto pueden ser el mismo armado. */}
          {plan.name && <span className="text-slate-dim">{templateLabel(plan)}</span>}
          <span>desde {formatDate(plan.generatedAt)}</span>
        </p>
      </div>

      {plan.status === 'active' ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 font-display text-[0.6rem] font-medium uppercase tracking-[0.14em] text-brand">
          <CheckCircle2 size={12} aria-hidden="true" />
          Activo
        </span>
      ) : (
        <Button variant="ghost" size="sm" disabled={busy} onClick={onActivate ?? undefined}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <PlayCircle size={15} aria-hidden="true" />
          )}
          Retomar
        </Button>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  open,
  busy,
  onToggle,
  onActivate,
  onPause,
  onDelete,
}: {
  readonly plan: PlanSummary;
  readonly open: boolean;
  readonly busy: boolean;
  readonly onToggle: () => void;
  /** `null` en el plan activo: no hay nada que activar. */
  readonly onActivate: (() => void) | null;
  readonly onPause: () => void;
  readonly onDelete: () => void;
}) {
  const activo = plan.status === 'active';
  const porcentaje =
    plan.totalSessions === 0 ? 0 : (plan.completedSessions / plan.totalSessions) * 100;
  const terminado = plan.totalSessions > 0 && plan.completedSessions >= plan.totalSessions;

  return (
    <Card tone={activo ? 'brand' : 'default'} animate={false} className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4">
        <PlanCardHeader plan={plan} busy={busy} onActivate={onActivate} />

        {/* Por sesiones y no por series: acá la pregunta es cuánto falta del
            plan, no cuánto falta de hoy. */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-display text-[0.65rem] uppercase tracking-[0.16em] text-slate">
              {terminado ? 'Completado' : (plan.nextSessionLabel ?? 'Sin sesiones pendientes')}
            </span>
            <span className="font-display text-xs font-semibold tabular-nums text-ink">
              {plan.completedSessions}
              <span className="text-slate-dim">/{plan.totalSessions} sesiones</span>
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${porcentaje}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              className="h-full rounded-full bg-gradient-to-r from-brand-deep via-brand to-brand-bright"
            />
          </div>
        </div>

        {/* Lo que el motor avisó al armar este plan. Antes se veía una sola
            vez, en la vista previa, y se perdía para siempre — acá queda a
            mano mientras el plan siga guardado. */}
        {plan.warnings.length > 0 && (
          <p className="flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-amber">
            <Info size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{plan.warnings.join(' ')}</span>
          </p>
        )}

        {/* Pausar y borrar juntos y en gris: son las dos salidas del plan, y
            ninguna de las dos es lo que la persona vino a hacer acá. */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Un plan a mano se sigue editando después de creado: agregar el
              día de mañana es el uso normal, no una corrección. */}
          {plan.origin === 'manual' && (
            <Link to={`/planes/${plan.id}/armar`} className={buttonClass('ghost', 'sm')}>
              <PenLine size={13} aria-hidden="true" />
              Editar los días
            </Link>
          )}
          {activo && (
            <Button variant="ghost" size="sm" disabled={busy} onClick={onPause}>
              <PauseCircle size={14} aria-hidden="true" />
              Pausar
            </Button>
          )}
          <Button variant="ghost" size="sm" disabled={busy} onClick={onDelete}>
            <Trash2 size={13} aria-hidden="true" />
            Borrar
          </Button>
        </div>

        <motion.button
          type="button"
          {...tappable}
          onClick={onToggle}
          aria-expanded={open}
          className="flex w-fit items-center gap-1.5 self-start rounded-full border border-line px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-slate transition-colors hover:border-brand/50 hover:text-brand"
        >
          {open ? 'Ocultar sesiones' : 'Ver las sesiones'}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring.settle}>
            <ChevronDown size={13} aria-hidden="true" />
          </motion.span>
        </motion.button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.settle}
            className="overflow-hidden"
          >
            <SessionList planId={plan.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/** La cola del plan. Se pide recién al abrirlo. */
function SessionList({ planId }: { readonly planId: string }) {
  const sessions = usePlanSessions(planId);

  if (sessions.isPending) {
    return (
      <div role="status" className="flex flex-col gap-1.5 border-t border-line/60 p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <span className="sr-only">Cargando las sesiones…</span>
      </div>
    );
  }

  if (sessions.isError || !sessions.data || sessions.data.length === 0) {
    return (
      <p className="border-t border-line/60 px-4 py-3 text-xs text-slate">
        No se pudieron leer las sesiones de este plan.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-px border-t border-line/60 bg-line/40">
      {sessions.data.map((session) => (
        <li key={session.id} className="bg-surface">
          <SessionRow session={session} />
        </li>
      ))}
    </ul>
  );
}

function SessionRow({ session }: { readonly session: PlanSessionSummary }) {
  const hecha = session.status === 'completed';

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span
        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border font-display text-xs font-semibold tabular-nums ${
          hecha ? 'border-brand/40 bg-brand/15 text-brand' : 'border-line bg-navy text-slate-dim'
        }`}
      >
        {hecha ? (
          <Check size={14} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          session.sequenceIndex + 1
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold leading-tight">
          {session.label}
          <span className="font-normal text-xs text-slate">{session.focus}</span>
        </p>
        {/* Los ejercicios en una línea y separados por punto: es una referencia
            para reconocer la sesión, no la pantalla donde se entrena. */}
        <p className="truncate text-[0.65rem] text-slate-dim">
          {session.exercises.join(' · ') || 'Sin ejercicios cargados'}
        </p>
        <p className="flex items-center gap-1 text-[0.65rem] text-slate-dim">
          {hecha && session.completedAt ? (
            <>
              <CalendarCheck size={10} aria-hidden="true" />
              {formatDate(session.completedAt)}
            </>
          ) : (
            <>
              <Clock size={10} aria-hidden="true" />
              {session.estimatedMinutes} min
            </>
          )}
        </p>
      </div>
    </div>
  );
}
