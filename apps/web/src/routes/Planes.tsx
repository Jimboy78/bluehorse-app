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
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Notice,
  SectionLabel,
  Skeleton,
} from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { GOAL_LABELS } from '../lib/labels.ts';
import { fadeUp, listContainer, listItem, spring, tappable } from '../lib/motion.ts';
import { onboardingUnavailable } from '../lib/onboarding.ts';
import type { PlanSessionSummary, PlanSummary } from '../lib/plan.ts';
import { useActivatePlan, useGeneratePlan, usePlanSessions, usePlans } from '../lib/plan.ts';

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

function templateLabel(plan: PlanSummary): string {
  return TEMPLATE_LABELS[plan.templateId] ?? plan.templateId;
}

export function Planes() {
  const { status } = useAuth();
  const plans = usePlans();
  const activate = useActivatePlan();

  const [openId, setOpenId] = useState<string | null>(null);
  const [asking, setAsking] = useState<PlanSummary | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleActivate(planId: string) {
    setAsking(null);
    setPendingId(planId);
    try {
      await activate.mutateAsync(planId);
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
}: {
  readonly authStatus: ReturnType<typeof useAuth>['status'];
  readonly plans: ReturnType<typeof usePlans>;
  readonly activo: PlanSummary | null;
  readonly guardados: readonly PlanSummary[];
  readonly openId: string | null;
  readonly pendingId: string | null;
  readonly onToggle: (id: string) => void;
  readonly onAsk: (plan: PlanSummary) => void;
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
  const generate = useGeneratePlan();

  return (
    <EmptyState
      icon={<Layers size={24} aria-hidden="true" />}
      title="Todavía no tenés ningún plan"
      action={
        <Button
          variant="primary"
          size="lg"
          disabled={generate.isPending || onboardingUnavailable}
          onClick={() => generate.mutate()}
        >
          {generate.isPending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          Generar mi plan
        </Button>
      }
    >
      Se arma con lo que cargaste en el onboarding y con el equipamiento real del gimnasio.
    </EmptyState>
  );
}

/**
 * Un plan. Cerrado muestra lo que se necesita para elegir entre dos; abierto,
 * la cola completa con los ejercicios de cada sesión.
 */
function PlanCard({
  plan,
  open,
  busy,
  onToggle,
  onActivate,
}: {
  readonly plan: PlanSummary;
  readonly open: boolean;
  readonly busy: boolean;
  readonly onToggle: () => void;
  /** `null` en el plan activo: no hay nada que activar. */
  readonly onActivate: (() => void) | null;
}) {
  const activo = plan.status === 'active';
  const porcentaje =
    plan.totalSessions === 0 ? 0 : (plan.completedSessions / plan.totalSessions) * 100;
  const terminado = plan.totalSessions > 0 && plan.completedSessions >= plan.totalSessions;

  return (
    <Card tone={activo ? 'brand' : 'default'} animate={false} className="overflow-hidden">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate font-display text-lg font-semibold uppercase leading-tight tracking-tight">
              {templateLabel(plan)}
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate">
              {plan.goal && <span className="text-brand">{GOAL_LABELS[plan.goal]}</span>}
              <span>desde {formatDate(plan.generatedAt)}</span>
            </p>
          </div>

          {activo ? (
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
