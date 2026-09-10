import {
  Activity,
  AlertCircle,
  Ban,
  BookOpen,
  Cake,
  Calendar,
  ChevronRight,
  Download,
  Dumbbell,
  FileText,
  HeartPulse,
  Mail,
  MapPin,
  Pencil,
  Ruler,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  User,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/AppShell.tsx';
import { BodyMetricsForm } from '../components/BodyMetricsForm.tsx';
import { ProfileForm } from '../components/ProfileForm.tsx';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Notice,
  SectionLabel,
  Skeleton,
} from '../components/ui/index.ts';
import catalogo from '../content/sources.generated.json' with { type: 'json' };
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useBodyMetrics, useRecordBodyMetric } from '../lib/body-metrics.ts';
import { documentos } from '../lib/docs.ts';
import { GYM_TZ } from '../lib/gym-time.ts';
import { useScreeningState } from '../lib/health-screening.ts';
import {
  BODY_REGION_LABELS,
  CONSTRAINT_TYPE_LABELS,
  EXPERIENCE_LABELS,
  GOAL_LABELS,
  SEX_LABELS,
} from '../lib/labels.ts';
import { breathing, fadeUp, listContainer, listItem, spring, tappable } from '../lib/motion.ts';
import { countByRegion, usePainHistory } from '../lib/pain-history.ts';
import type { ConstraintDetail } from '../lib/profile.ts';
import {
  useClearConstraint,
  useConstraints,
  useProfileDetail,
  useUpdateProfile,
} from '../lib/profile.ts';
import { isStandaloneDisplay } from '../lib/use-install-prompt.ts';

/** Cuántas fuentes hay, para no escribir un número que se desactualice solo. */
const SOURCE_COUNT = catalogo.sources.length;
const DOC_COUNT = documentos.length;

/**
 * TU PERFIL
 *
 * Todo lo que la app sabe de vos, en un solo lugar. Hasta acá estaba
 * repartido y no había forma de verlo junto: el rol lo mostraba el panel de
 * staff, el objetivo lo mostraba de reojo el aviso de evidencia floja, el peso
 * y la altura vivían en Progreso, y las molestias y ejercicios descartados no
 * se veían en ningún lado después de cargarlos.
 *
 * Es de solo lectura salvo dos cosas: dar de baja una molestia vigente (queda
 * en el historial, no se borra) y el peso/altura, que se cargan desde acá con
 * el mismo formulario de Progreso — ver `MisDatos`.
 */
export function Perfil() {
  const { status } = useAuth();
  const profile = useProfileDetail();

  return (
    <AppShell>
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-start justify-between gap-3"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand">
            Tu cuenta
          </p>
          <h1 className="font-display text-[2.6rem] font-semibold uppercase leading-[0.95] tracking-tight">
            Tu perfil
          </h1>
        </div>
        <InstallButton />
      </motion.header>

      <PerfilBody authStatus={status} profile={profile} />
    </AppShell>
  );
}

function PerfilBody({
  authStatus,
  profile,
}: {
  readonly authStatus: ReturnType<typeof useAuth>['status'];
  readonly profile: ReturnType<typeof useProfileDetail>;
}) {
  if (authStatus !== 'signed-in') {
    return (
      <EmptyState icon={<User size={24} aria-hidden="true" />} title="Sin sesión">
        {authStatus === 'unconfigured'
          ? 'Supabase no está configurado: no se puede leer tu perfil todavía.'
          : 'Iniciá sesión para ver tu perfil.'}
      </EmptyState>
    );
  }

  if (profile.isPending) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
        <span className="sr-only">Cargando tu perfil…</span>
      </div>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <Notice tone="error" role="alert" icon={<AlertCircle size={16} aria-hidden="true" />}>
        No se pudo leer tu perfil. Revisá tu conexión y probá de nuevo.
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <IdentityCard profile={profile.data} />
      <GoalCard profile={profile.data} />
      <PersonalDataCard profile={profile.data} />
      <HealthCard />
      <ConstraintsSection />
      <PainHistorySection />
      <EvidenceLink />
      <DocsLink />
    </div>
  );
}

/**
 * La puerta a "En qué se basa tu plan".
 *
 * Va al final del perfil y no en la barra de navegación: no es una pantalla que
 * se visite todos los días, es la que se busca cuando alguien duda de un número
 * que le propuso la app. Ahí es donde tiene que estar a mano.
 */
function EvidenceLink() {
  return (
    <Link
      to="/evidencia"
      className="group flex items-center gap-3 rounded-card border border-line bg-surface p-4 transition-colors hover:border-brand"
    >
      <BookOpen size={18} aria-hidden="true" className="shrink-0 text-brand" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-sm font-semibold uppercase tracking-tight text-ink">
          En qué se basa tu plan
        </span>
        <span className="text-xs text-slate">
          Las {SOURCE_COUNT} fuentes que usa la app, con enlace a cada trabajo.
        </span>
      </span>
      <ChevronRight
        size={16}
        aria-hidden="true"
        className="shrink-0 text-slate transition-colors group-hover:text-brand"
      />
    </Link>
  );
}

/**
 * La puerta a la documentación de investigación.
 *
 * Va debajo de la de evidencia y no adentro: son dos preguntas distintas.
 * "¿De dónde salen estos números?" la contesta la lista de papers. "¿Qué
 * leyeron ustedes en esos papers y qué decidieron?" la contestan los
 * documentos, que es donde también están escritos los huecos que quedaron sin
 * cerrar.
 */
function DocsLink() {
  return (
    <Link
      to="/documentacion"
      className="group flex items-center gap-3 rounded-card border border-line bg-surface p-4 transition-colors hover:border-brand"
    >
      <FileText size={18} aria-hidden="true" className="shrink-0 text-brand" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-sm font-semibold uppercase tracking-tight text-ink">
          Cómo se arman los planes
        </span>
        <span className="text-xs text-slate">
          Los {DOC_COUNT} documentos de investigación, enteros y sin retocar.
        </span>
      </span>
      <ChevronRight
        size={16}
        aria-hidden="true"
        className="shrink-0 text-slate transition-colors group-hover:text-brand"
      />
    </Link>
  );
}

/**
 * El botón de instalar, en el encabezado.
 *
 * Es el destino al que apunta la pista que deja la invitación al cerrarse
 * ("cuando quieras, la tenés en Perfil"), así que tiene que estar donde la
 * vista cae primero al entrar a la pantalla — no cuatro tarjetas más abajo.
 *
 * Late despacio porque nadie viene a Perfil buscando instalar la app: el
 * movimiento es lo que hace que se note sin ocupar el lugar de lo que la
 * persona sí vino a mirar. Se queda quieto para quien pidió menos movimiento.
 *
 * Ya instalada, desaparece: `isStandaloneDisplay()` alcanza, no hace falta
 * escuchar `beforeinstallprompt` acá — el paso a paso por plataforma lo
 * resuelve `/instalar`, que ya existe.
 */
function InstallButton() {
  const reduceMotion = useReducedMotion();

  if (isStandaloneDisplay()) return null;

  return (
    <motion.div
      // Spread y no `animate={undefined}`: con `exactOptionalPropertyTypes`,
      // pasar `undefined` explícito no es lo mismo que no pasar la prop.
      {...(reduceMotion ? {} : { animate: breathing })}
      className="shrink-0"
      style={{ transformOrigin: 'center' }}
    >
      <Link
        to="/instalar"
        aria-label="Instalar la app"
        title="Instalar la app"
        className="grid size-11 place-items-center rounded-full border border-brand/40 bg-brand/10 text-brand transition-colors hover:border-brand hover:bg-brand/20"
      >
        <Download size={18} aria-hidden="true" />
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------- identidad

function IdentityCard({
  profile,
}: {
  readonly profile: NonNullable<ReturnType<typeof useProfileDetail>['data']>;
}) {
  const initial = profile.displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <Card tone="brand" className="flex items-center gap-4 p-5">
      <span className="grid size-16 shrink-0 place-items-center rounded-full border border-brand/30 bg-brand/15 font-display text-2xl font-semibold text-brand">
        {initial}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-display text-xl font-semibold uppercase leading-tight tracking-tight">
          {profile.displayName}
        </p>
        {profile.email && (
          <p className="flex items-center gap-1.5 truncate text-xs text-slate">
            <Mail size={12} className="shrink-0" aria-hidden="true" />
            {profile.email}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {profile.role !== 'member' && (
            <span className="rounded-full bg-brand/20 px-2 py-0.5 font-display text-[0.6rem] font-medium uppercase tracking-[0.12em] text-brand">
              {profile.role === 'admin' ? 'Administrador' : 'Staff'}
            </span>
          )}
          {profile.gym && (
            <span className="flex items-center gap-1 text-[0.65rem] text-slate-dim">
              <MapPin size={11} aria-hidden="true" />
              {profile.gym.name}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ------------------------------------------------------------------ objetivo

function GoalCard({
  profile,
}: {
  readonly profile: NonNullable<ReturnType<typeof useProfileDetail>['data']>;
}) {
  const goal = profile.goal;

  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel icon={<Target size={13} className="text-brand" aria-hidden="true" />}>
        Tu objetivo
      </SectionLabel>
      {goal ? (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
              <Sparkles size={17} aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="font-display text-lg font-semibold uppercase leading-tight tracking-tight">
                {GOAL_LABELS[goal.goal]}
              </p>
              {goal.sport && <p className="text-xs text-slate">Deporte: {goal.sport}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-line/60 pt-3">
            <Stat label="Sesiones/semana" value={String(goal.sessionsPerWeekTarget)} />
            <Stat label="Minutos/sesión" value={String(goal.sessionMinutesTarget)} />
          </div>
        </Card>
      ) : (
        <EmptyState icon={<Target size={20} aria-hidden="true" />} title="Sin objetivo cargado">
          Completá el onboarding para que el motor sepa qué armarte.
        </EmptyState>
      )}
    </section>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-[0.6rem] uppercase tracking-[0.14em] text-slate">
        {label}
      </span>
      <span className="font-display text-lg font-semibold tabular-nums leading-none text-ink">
        {value}
      </span>
    </div>
  );
}

// ------------------------------------------------------------- datos físicos

/** Peso y altura, o los huecos que dejan si nunca se cargaron. */
function BodyStats({
  pending,
  latest,
}: {
  readonly pending: boolean;
  readonly latest: { weightKg: number | null; heightCm: number | null } | null;
}) {
  if (pending) {
    return (
      <>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </>
    );
  }

  return (
    <>
      <IconStat
        icon={<Scale size={14} aria-hidden="true" />}
        label="Peso"
        value={latest?.weightKg == null ? '—' : `${latest.weightKg} kg`}
      />
      <IconStat
        icon={<Ruler size={14} aria-hidden="true" />}
        label="Altura"
        value={latest?.heightCm == null ? '—' : `${Math.round(latest.heightCm)} cm`}
      />
    </>
  );
}

function PersonalDataCard({
  profile,
}: {
  readonly profile: NonNullable<ReturnType<typeof useProfileDetail>['data']>;
}) {
  const metrics = useBodyMetrics();
  const record = useRecordBodyMetric();
  const updateProfile = useUpdateProfile();
  const latest = metrics.data?.latest;
  // Dos formularios distintos porque son dos gestos distintos: el peso se
  // vuelve a medir (agrega una fila al historial) y el perfil se corrige
  // (pisa la fila que ya está). Un solo formulario con todo mezclado invitaría
  // a "confirmar" un peso viejo cada vez que alguien cambia su nombre.
  const [editing, setEditing] = useState<'none' | 'metrics' | 'profile'>('none');

  async function handleSubmit(input: { weightKg: number | null; heightCm: number | null }) {
    await record.mutateAsync(input);
    setEditing('none');
  }

  async function handleProfileSubmit(edit: Parameters<typeof updateProfile.mutateAsync>[0]) {
    await updateProfile.mutateAsync(edit);
    setEditing('none');
  }

  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel icon={<User size={13} aria-hidden="true" />}>Tus datos</SectionLabel>
      <Card className="flex flex-col gap-3 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <IconStat
            icon={<Cake size={14} aria-hidden="true" />}
            label="Edad"
            value={profile.age !== null ? `${profile.age} años` : '—'}
          />
          <IconStat
            icon={<Dumbbell size={14} aria-hidden="true" />}
            label="Nivel"
            value={EXPERIENCE_LABELS[profile.experienceLevel]}
          />
          <IconStat
            icon={<User size={14} aria-hidden="true" />}
            label="Sexo"
            value={SEX_LABELS[profile.sex]}
          />
          <IconStat
            icon={<Calendar size={14} aria-hidden="true" />}
            label="Socio desde"
            value={formatDate(profile.memberSince)}
          />
          <BodyStats pending={metrics.isPending} latest={latest ?? null} />
        </div>

        {/* Editar acá y no mandando a Progreso. El texto que había antes
            ("actualizar peso y altura en Progreso") era un viaje a una
            pantalla que, si nunca habías cargado una medición, no mostraba
            ningún formulario: `MisDatos` se ocultaba entero sin datos. O sea
            que quien no cargó peso y altura en el onboarding no tenía ninguna
            forma de cargarlos después, en toda la app. */}
        {editing === 'none' && (
          <div className="flex flex-wrap items-center gap-2 border-t border-line/60 pt-3">
            <span className="min-w-0 flex-1 text-[0.7rem] text-slate-dim">
              {latest
                ? 'Tu peso cambia: podés volver a medirte'
                : 'Todavía no cargaste peso ni altura'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setEditing('metrics')}>
              <Scale size={14} aria-hidden="true" />
              {latest ? 'Pesarme' : 'Cargar peso'}
            </Button>
            <motion.button
              type="button"
              {...tappable}
              onClick={() => setEditing('profile')}
              aria-label="Editar mis datos"
              title="Editar nombre, fecha de nacimiento, sexo y nivel"
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-slate transition-colors hover:border-brand hover:text-brand"
            >
              <Pencil size={14} aria-hidden="true" />
            </motion.button>
          </div>
        )}

        <AnimatePresence initial={false}>
          {editing !== 'none' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring.settle}
              className="overflow-hidden"
            >
              {editing === 'metrics' ? (
                <BodyMetricsForm
                  currentHeightCm={latest?.heightCm ?? null}
                  busy={record.isPending}
                  onCancel={() => setEditing('none')}
                  onSubmit={(input) => void handleSubmit(input)}
                />
              ) : (
                <ProfileForm
                  current={{
                    displayName: profile.displayName,
                    birthDate: profile.birthDate,
                    sex: profile.sex,
                    experienceLevel: profile.experienceLevel,
                  }}
                  busy={updateProfile.isPending}
                  onCancel={() => setEditing('none')}
                  onSubmit={(edit) => void handleProfileSubmit(edit)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {record.isError && (
          <Notice tone="error" role="alert">
            No se pudo guardar la medición. Probá de nuevo.
          </Notice>
        )}
        {updateProfile.isError && (
          <Notice tone="error" role="alert">
            No se pudieron guardar tus datos. Probá de nuevo.
          </Notice>
        )}
      </Card>
    </section>
  );
}

function IconStat({
  icon,
  label,
  value,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1 font-display text-[0.6rem] uppercase tracking-[0.14em] text-slate">
        {icon}
        {label}
      </span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

// --------------------------------------------------------------------- salud

/**
 * Estado del cribado de salud (PAR-Q+). Es de solo lectura acá — el cribado
 * no se puede editar ni siquiera por su dueño (regla dura, ver 08_rls.sql):
 * cada respuesta queda como fue, para que el registro de "en su momento dijo
 * que sí a esto" no se pueda reescribir.
 */
function HealthCard() {
  const screening = useScreeningState();

  if (!screening.data?.required) return null;

  const cleared = screening.data.cleared;

  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel icon={<HeartPulse size={13} aria-hidden="true" />}>
        Cribado de salud
      </SectionLabel>
      <Card tone={cleared ? 'default' : 'warn'} className="flex items-center gap-3 p-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl border ${
            cleared
              ? 'border-brand/25 bg-brand/10 text-brand'
              : 'border-amber/35 bg-amber/10 text-amber'
          }`}
        >
          {cleared ? (
            <ShieldCheck size={18} aria-hidden="true" />
          ) : (
            <ShieldAlert size={18} aria-hidden="true" />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-semibold text-ink">
            {cleared ? 'Podés entrenar sin restricciones' : 'Necesita autorización médica'}
          </p>
          <p className="text-xs text-slate">
            {cleared
              ? 'Respondiste el cuestionario y no marcaste ninguna alerta.'
              : 'Respondiste algo que pide el visto bueno de un médico antes de seguir.'}
          </p>
        </div>
      </Card>
      <p className="px-1 text-[0.65rem] leading-relaxed text-slate-dim">
        <Shield size={10} className="mr-1 inline" aria-hidden="true" />
        Cada respuesta queda guardada tal como la diste: ni vos ni el staff pueden reescribirla. Si
        cambió algo, se responde de nuevo y queda como la vigente.
      </p>
    </section>
  );
}

// ---------------------------------------------------------- restricciones

/**
 * Molestias vigentes y ejercicios/máquinas descartados. Es lo único que el
 * motor esquiva sin que se vea en ningún otro lado de la app — "no me lo
 * propongas más" se toca en un segundo en la previa del plan, y hasta ahora no
 * había forma de volver a ver esa lista ni de deshacerla si fue un error.
 */
function ConstraintsSection() {
  const constraints = useConstraints();
  const clear = useClearConstraint();
  const [asking, setAsking] = useState<ConstraintDetail | null>(null);

  async function handleClear() {
    if (!asking) return;
    const id = asking.id;
    setAsking(null);
    await clear.mutateAsync(id);
  }

  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel icon={<Ban size={13} aria-hidden="true" />}>
        Molestias y ejercicios descartados
      </SectionLabel>

      {constraints.isPending && (
        <div role="status" className="flex flex-col gap-1.5">
          <Skeleton className="h-14 w-full" />
          <span className="sr-only">Cargando…</span>
        </div>
      )}

      {constraints.isError && (
        <Notice tone="error" role="alert" icon={<AlertCircle size={15} aria-hidden="true" />}>
          No se pudieron leer tus restricciones.
        </Notice>
      )}

      {constraints.data && constraints.data.length === 0 && (
        <Card tone="nested" className="px-4 py-3.5 text-sm text-slate">
          No tenés ninguna molestia vigente ni ejercicios descartados.
        </Card>
      )}

      {constraints.data && constraints.data.length > 0 && (
        <motion.ul
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2"
        >
          {constraints.data.map((constraint) => (
            <motion.li key={constraint.id} variants={listItem}>
              <ConstraintRow
                constraint={constraint}
                busy={clear.isPending}
                onClear={() => setAsking(constraint)}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}

      <ConfirmDialog
        open={asking !== null}
        icon={<Trash2 size={18} aria-hidden="true" />}
        title="¿Dar de baja esta restricción?"
        confirmLabel="Dar de baja"
        confirmVariant="danger"
        busy={clear.isPending}
        onCancel={() => setAsking(null)}
        onConfirm={() => void handleClear()}
      >
        El motor va a volver a considerar
        {asking?.targetName ? ` ${asking.targetName}` : ' esta zona'} en tus próximos planes.
      </ConfirmDialog>
    </section>
  );
}

function ConstraintRow({
  constraint,
  busy,
  onClear,
}: {
  readonly constraint: ConstraintDetail;
  readonly busy: boolean;
  readonly onClear: () => void;
}) {
  const isPain = constraint.type === 'injury' || constraint.type === 'pain';

  return (
    <Card tone="warn" className="flex items-start gap-3 p-3.5">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-amber/35 bg-amber/10 text-amber">
        <Ban size={14} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm font-semibold text-ink">
          {isPain && constraint.bodyRegion
            ? BODY_REGION_LABELS[constraint.bodyRegion as keyof typeof BODY_REGION_LABELS]
            : (constraint.targetName ?? CONSTRAINT_TYPE_LABELS[constraint.type])}
        </p>
        <p className="text-xs text-slate">
          {CONSTRAINT_TYPE_LABELS[constraint.type]}
          {isPain && ` · intensidad ${constraint.severity}/5`}
          {' · desde '}
          {formatDate(constraint.since)}
        </p>
        {constraint.note && <p className="text-xs text-slate-dim">{constraint.note}</p>}
      </div>
      <Button variant="ghost" size="sm" disabled={busy} onClick={onClear} className="shrink-0">
        Dar de baja
      </Button>
    </Card>
  );
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Identidad estable por punto, mismo criterio que `SetDots` en `Hoy.tsx`: la posición no alcanza como clave de React. */
function severityDots(severity: number): { id: string; filled: boolean }[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: `punto-${i + 1}`,
    filled: i < severity,
  }));
}

// ---------------------------------------------------------- historial de molestias

/**
 * Lo que se reportó al cerrar sesiones, sesión a sesión — distinto de
 * `ConstraintsSection` arriba, que es lo VIGENTE (lo que el motor esquiva
 * ahora). Esto es el historial completo: hasta acá se escribía al cerrar una
 * sesión y no se volvía a ver en ningún lado, ni siquiera por quien lo
 * reportó.
 *
 * La cuenta por zona es la parte que importa más que la lista: una molestia
 * reportada una vez no dice nada por sí sola, pero la misma zona repetida
 * varias veces en las últimas reportadas es justo la señal que alguien
 * necesita para decidir si vale la pena ver a un médico — y esa señal no se
 * ve mirando las filas sueltas del cierre de cada sesión.
 */
function PainHistorySection() {
  const history = usePainHistory();

  if (history.isPending) {
    return (
      <section className="flex flex-col gap-2.5">
        <SectionLabel icon={<Activity size={13} aria-hidden="true" />}>
          Historial de molestias
        </SectionLabel>
        <Skeleton className="h-14 w-full" />
      </section>
    );
  }

  // Sin nada reportado nunca, la sección no suma nada — a diferencia de
  // `ConstraintsSection`, que sí muestra su estado vacío porque confirma que
  // el motor no está esquivando nada (una afirmación). Acá "nunca reportaste
  // nada" no es una afirmación que valga la pena hacer siempre visible.
  if (history.isError || !history.data || history.data.length === 0) return null;

  const counts = countByRegion(history.data);
  const repeated = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);

  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel icon={<Activity size={13} aria-hidden="true" />}>
        Historial de molestias
      </SectionLabel>

      {repeated.length > 0 && (
        <Notice tone="warn" icon={<AlertCircle size={15} aria-hidden="true" />}>
          {repeated.length === 1 && repeated[0] ? (
            <>
              Reportaste <strong className="text-ink">{BODY_REGION_LABELS[repeated[0][0]]}</strong>{' '}
              {repeated[0][1]} veces en tus últimas {history.data.length} sesiones con molestia. Si
              se repite, vale la pena que lo veas con un médico.
            </>
          ) : (
            <>
              Varias zonas se repiten en tus últimas sesiones con molestia:{' '}
              {repeated.map(([region, count], i) => (
                <span key={region}>
                  {i > 0 && ', '}
                  <strong className="text-ink">{BODY_REGION_LABELS[region]}</strong> ({count})
                </span>
              ))}
              . Si se repite, vale la pena que lo veas con un médico.
            </>
          )}
        </Notice>
      )}

      <motion.ul
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1.5"
      >
        {history.data.map((report) => (
          <motion.li
            key={report.id}
            variants={listItem}
            className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-navy px-3.5 py-3"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold text-ink">
                {BODY_REGION_LABELS[report.bodyRegion]}
              </span>
              <span className="text-[0.65rem] text-slate-dim">{formatDate(report.reportedAt)}</span>
            </span>
            {/* Los mismos cinco puntos que en el cierre de sesión: intensidad
                del 1 al 5, sin volver a inventar una escala distinta acá. */}
            <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
              {severityDots(report.severity).map((dot) => (
                <span
                  key={dot.id}
                  className={`size-1.5 rounded-full ${dot.filled ? 'bg-orange' : 'bg-line-bright'}`}
                />
              ))}
            </span>
            <span className="sr-only">Intensidad {report.severity} de 5</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
