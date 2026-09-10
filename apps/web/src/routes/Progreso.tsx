import type { AdaptationProposal, LoadUnit } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import { ArrowRight, Check, ChevronRight, Compass, History, Repeat, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { AppShell } from '../components/AppShell.tsx';
import { MisDatos } from '../components/MisDatos.tsx';
import { MisPlanes } from '../components/MisPlanes.tsx';
import { Progreso as ProgresoBody } from '../components/Progreso.tsx';
import { SyncNotice } from '../components/SyncNotice.tsx';
import { Card, SectionLabel, Skeleton } from '../components/ui/index.ts';
import { useProposalHistory } from '../lib/adaptation.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { GYM_TZ } from '../lib/gym-time.ts';
import { fadeUp, listContainer, listItem } from '../lib/motion.ts';
import { useSubstitutionInsights } from '../lib/substitution-insights.ts';

/**
 * Pantalla "Progreso": la contracara de "Hoy" — lo que ya se hizo, no lo que
 * falta hacer. El contenido real vive en `components/Progreso.tsx`.
 *
 * Ya no lleva botón de "volver": las dos secciones son pares y se cambia
 * entre ellas por la barra de abajo del `AppShell`, no entrando y saliendo.
 */
export function Progreso() {
  return (
    <AppShell>
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1"
      >
        <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand">
          Tu progreso
        </p>
        <h1 className="font-display text-[2.6rem] font-semibold uppercase leading-[0.95] tracking-tight">
          Lo que ya hiciste
        </h1>
      </motion.header>

      {/* Antes que cualquier número: si algo quedó en la cola offline, todo
          lo que sigue está incompleto y hay que decirlo primero. */}
      <SyncNotice />

      {/* Los datos del cuerpo antes que el historial: son lo único de esta
          pantalla que se puede actualizar hoy mismo, sin haber entrenado. */}
      <MisDatos />
      <MisPlanes />
      <ExplorarLink />
      <ProgresoBody />
      <SubstitutionInsightsSection />
      <ProposalHistorySection />
    </AppShell>
  );
}

/**
 * Qué sustituís más seguido. `session_events` graba cada cambio desde que
 * existe "Cambiar ejercicio" (`logSubstitution`), pero hasta acá nadie lo
 * leía. Si algo se repite mucho, suele decir algo: una máquina siempre
 * ocupada a cierta hora, o un ejercicio que en la práctica no funciona.
 */
function SubstitutionInsightsSection() {
  const { status } = useAuth();
  const insights = useSubstitutionInsights();

  // La query está `enabled: status === 'signed-in'`: sin este chequeo, con
  // Supabase sin configurar (`status === 'unconfigured'`) queda deshabilitada
  // para siempre y `isPending` nunca se resuelve — la trampa que ya documenta
  // CLAUDE.md, y que acá `!insights.data` disimulaba (siempre "sin datos",
  // nunca un spinner colgado) sin dejar de ser el mismo bug de fondo.
  if (status !== 'signed-in' || !insights.data || insights.data.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel icon={<Repeat size={13} aria-hidden="true" />}>Lo que más cambiás</SectionLabel>
      <Card className="flex flex-col divide-y divide-line/70 p-0">
        {insights.data.map((insight) => (
          <div
            key={insight.exerciseId}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <span className="truncate text-sm">{insight.exerciseName}</span>
            <span className="shrink-0 font-display text-xs font-semibold tabular-nums text-slate-dim">
              {insight.count} {insight.count === 1 ? 'vez' : 'veces'}
            </span>
          </div>
        ))}
      </Card>
    </section>
  );
}

/**
 * Entrada a `/explorar`. `engine.findSubstitutes()` recorre todo el catálogo
 * por patrón y músculos compartidos, y hasta hace poco solo se podía activar
 * desde "Cambiar ejercicio" en Hoy — que exige estar en medio de un
 * entrenamiento. Esto lo deja a mano para cuando la curiosidad no coincide
 * con estar parado frente a una máquina.
 */
function ExplorarLink() {
  return (
    <Link to="/explorar" className="block">
      <Card
        className="flex items-center gap-3 transition-colors hover:border-brand/40"
        animate={false}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
          <Compass size={18} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold text-ink">Explorar el catálogo</p>
          <p className="truncate text-xs text-slate">
            Qué hay para cada músculo, y de qué otra forma se puede hacer
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-slate-dim" aria-hidden="true" />
      </Card>
    </Link>
  );
}

function formatResolvedDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

/**
 * Lo que el motor propuso y qué se hizo con eso. El comentario de
 * `07_adaptation.sql` dice que `adaptation_proposals` sirve para "medir si el
 * motor acierta antes de venderlo" — hasta acá esa fila se escribía, se
 * resolvía, y desaparecía de la vista de cualquiera que no supiera leer
 * Postgres. `reasonText` ya viene en castellano con el ejercicio incluido
 * (regla dura 4), así que se muestra tal cual, sin resolver `target_ref`.
 */
function ProposalHistorySection() {
  const { status } = useAuth();
  const history = useProposalHistory();

  // Chequear `status` ANTES que `isPending`: la query está deshabilitada
  // (`enabled: status === 'signed-in'`) mientras no haya sesión, y una query
  // deshabilitada se queda en `isPending: true` para siempre — sin este
  // chequeo, con Supabase sin configurar esta sección mostraba un esqueleto
  // de carga que nunca se resolvía. Regla ya documentada en CLAUDE.md,
  // repetida acá por no aplicarla también a las secciones nuevas.
  if (status !== 'signed-in') return null;

  if (history.isPending) {
    return (
      <section className="flex flex-col gap-2.5">
        <SectionLabel icon={<History size={13} aria-hidden="true" />}>
          Ajustes del motor
        </SectionLabel>
        <Skeleton className="h-14 w-full" />
      </section>
    );
  }

  // Nadie propuso nada todavía (plan recién generado, o sin sesiones
  // suficientes) — mismo criterio que el historial de molestias: "nunca hubo
  // una propuesta" no es una afirmación que valga la pena dejar siempre
  // visible en una pantalla que ya tiene bastante.
  if (history.isError || !history.data || history.data.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel icon={<History size={13} aria-hidden="true" />}>Ajustes del motor</SectionLabel>
      <motion.ul
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1.5"
      >
        {history.data.map((proposal) => (
          <motion.li key={proposal.id} variants={listItem}>
            <ProposalHistoryRow proposal={proposal} />
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

function ProposalHistoryRow({ proposal }: { proposal: AdaptationProposal }) {
  const accepted = proposal.status === 'accepted';
  const hasLoadChange = proposal.fromValue !== null && proposal.toValue !== null;

  return (
    <Card animate={false} className="flex items-start gap-3 px-4 py-3">
      <span
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
          accepted ? 'bg-brand/15 text-brand' : 'bg-slate/15 text-slate-dim'
        }`}
        title={accepted ? 'Aceptada' : 'Rechazada'}
      >
        {accepted ? <Check size={13} aria-hidden="true" /> : <X size={13} aria-hidden="true" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm leading-relaxed text-ink">{proposal.reasonText}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-dim">
          {hasLoadChange && (
            <span className="flex items-center gap-1.5 font-mono tabular-nums">
              <span className="line-through decoration-slate-dim/60">
                {showValue(proposal.fromValue, proposal.loadUnit)}
              </span>
              <ArrowRight size={11} aria-hidden="true" />
              {showValue(proposal.toValue, proposal.loadUnit)}
            </span>
          )}
          {proposal.resolvedAt && <span>{formatResolvedDate(proposal.resolvedAt)}</span>}
        </div>
      </div>
    </Card>
  );
}

/**
 * Mismo criterio que `showValue` de `components/Proposals.tsx`: los valores
 * de una propuesta son texto genérico, "20" para una carga o "60%" para un
 * deload. Con unidad se muestra como lo muestra la máquina; sin unidad
 * (deload) se muestra tal cual — poner un `?? 'kg'` acá haría que "60%" se
 * lea "60 kg", una unidad que la propuesta nunca tuvo.
 */
function showValue(value: string | null, unit: LoadUnit | null): string {
  if (value === null) return '';
  if (unit === null) return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : formatLoad({ value: n, unit });
}
