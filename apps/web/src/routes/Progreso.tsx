import type { AdaptationProposal } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import { ArrowRight, Check, ChevronRight, Compass, History, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { AppShell } from '../components/AppShell.tsx';
import { MisDatos } from '../components/MisDatos.tsx';
import { MisPlanes } from '../components/MisPlanes.tsx';
import { Progreso as ProgresoBody } from '../components/Progreso.tsx';
import { Card, SectionLabel, Skeleton } from '../components/ui/index.ts';
import { useProposalHistory } from '../lib/adaptation.ts';
import { fadeUp, listContainer, listItem } from '../lib/motion.ts';

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

      {/* Los datos del cuerpo antes que el historial: son lo único de esta
          pantalla que se puede actualizar hoy mismo, sin haber entrenado. */}
      <MisDatos />
      <MisPlanes />
      <ExplorarLink />
      <ProgresoBody />
      <ProposalHistorySection />
    </AppShell>
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

const GYM_TZ = 'America/Argentina/Buenos_Aires';

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
  const history = useProposalHistory();

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
                {formatLoad({ value: Number(proposal.fromValue), unit: proposal.loadUnit ?? 'kg' })}
              </span>
              <ArrowRight size={11} aria-hidden="true" />
              {formatLoad({ value: Number(proposal.toValue), unit: proposal.loadUnit ?? 'kg' })}
            </span>
          )}
          {proposal.resolvedAt && <span>{formatResolvedDate(proposal.resolvedAt)}</span>}
        </div>
      </div>
    </Card>
  );
}
