import type { AdaptationProposal, LoadUnit } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import { AlertCircle, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { usePendingProposals, useResolveProposal } from '../lib/adaptation.ts';
import { showsPlaceholderContent } from '../lib/engine.ts';
import { fadeUp, listContainer, listItem } from '../lib/motion.ts';
import { Button, Card, Notice, SectionLabel, Spinner } from './ui/index.ts';

/**
 * "El motor propone, el usuario confirma" — nunca al revés. Aceptar una
 * propuesta de carga la aplica a las sesiones pendientes del plan; el resto
 * de las propuestas (deload) solo quedan resueltas, sin tocar números
 * todavía (ver `useResolveProposal`).
 *
 * Las tarjetas van con el borde de la marca y no con el gris de las demás: es
 * lo único en toda la pantalla que le pide una decisión a la persona, y llega
 * sin avisar arriba del entrenamiento del día.
 */
export function Proposals() {
  const proposals = usePendingProposals();
  const resolve = useResolveProposal();
  // Cuál se está resolviendo, para que el anillo salga en el botón que se
  // tocó. Antes los dos quedaban deshabilitados y ninguno decía nada: con
  // señal mala eso son tres segundos en los que parece que no pasó nada.
  const [resolving, setResolving] = useState<{ id: string; accept: boolean } | null>(null);
  // A diferencia de set_logs/session_events, resolver una propuesta escribe
  // directo (`useResolveProposal`), sin pasar por la cola offline — el motivo
  // está en su propio comentario: "aplicar" un load_increase también mueve
  // plan_session_items, y ese combo no encaja en el modelo simple de "una
  // fila, reintentar" que usa el resto de la cola. Sin conexión, el clic
  // fallaba y no pasaba nada en pantalla: ni error, ni pista de por qué
  // seguía ahí. Con señal mala en el gimnasio (el caso que justifica que la
  // cola exista) esto se veía todo el tiempo.
  const [failedId, setFailedId] = useState<string | null>(null);

  function handleResolve(proposal: AdaptationProposal, accept: boolean) {
    setResolving({ id: proposal.id, accept });
    setFailedId(null);
    resolve.mutate(
      { proposal, accept },
      {
        onError: () => setFailedId(proposal.id),
        onSettled: () => setResolving(null),
      },
    );
  }

  // Que el motor falle no puede verse igual que "no tiene nada para
  // proponer". Un zod roto en el historial dejaba esta pantalla en blanco y
  // la adaptación entera desaparecía sin que nadie se enterara.
  if (proposals.isError) {
    return (
      <Notice tone="warn" role="alert" icon={<AlertCircle size={16} aria-hidden="true" />}>
        No se pudieron revisar tus ajustes esta vez. Tu entrenamiento sigue igual; probá de nuevo
        más tarde.
      </Notice>
    );
  }

  if (!proposals.data || proposals.data.length === 0) return null;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-2.5"
    >
      <SectionLabel icon={<Sparkles size={13} className="text-brand" aria-hidden="true" />}>
        Propuestas del motor
      </SectionLabel>
      <AnimatePresence initial={false}>
        <motion.ul
          variants={listContainer}
          initial="hidden"
          animate="visible"
          aria-live="polite"
          className="flex flex-col gap-2"
        >
          {proposals.data.map((proposal) => (
            <motion.li key={proposal.id} variants={listItem} exit={{ opacity: 0, height: 0 }}>
              <Card tone="brand" animate={false} className="flex flex-col gap-3 p-4">
                <p className="text-sm leading-relaxed">{proposal.reasonText}</p>

                {proposal.fromValue !== null && proposal.toValue !== null && (
                  <p className="flex items-center gap-2 font-display text-lg font-semibold tabular-nums">
                    <span className="text-slate-dim line-through decoration-slate-dim/60">
                      {showValue(proposal.fromValue, proposal.loadUnit)}
                    </span>
                    <ArrowRight size={14} className="text-slate" aria-hidden="true" />
                    <span className="text-brand">
                      {showValue(proposal.toValue, proposal.loadUnit)}
                    </span>
                  </p>
                )}

                {showsPlaceholderContent && (
                  <p className="font-display text-[0.6rem] uppercase tracking-[0.18em] text-amber">
                    ruleset provisorio
                  </p>
                )}

                {failedId === proposal.id && (
                  <p role="alert" className="flex items-center gap-1.5 text-xs text-orange">
                    <AlertCircle size={13} aria-hidden="true" />
                    No se pudo guardar. Revisá tu conexión y probá de nuevo.
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    disabled={resolve.isPending}
                    onClick={() => handleResolve(proposal, true)}
                  >
                    {resolving?.id === proposal.id && resolving.accept ? (
                      <Spinner size={15} />
                    ) : (
                      <Check size={15} aria-hidden="true" />
                    )}
                    Aceptar
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    className="flex-1"
                    disabled={resolve.isPending}
                    onClick={() => handleResolve(proposal, false)}
                  >
                    {resolving?.id === proposal.id && !resolving.accept ? (
                      <Spinner size={15} />
                    ) : (
                      <X size={15} aria-hidden="true" />
                    )}
                    Rechazar
                  </Button>
                </div>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </motion.section>
  );
}

/**
 * Los valores de una propuesta son texto genérico: una de carga guarda "20",
 * un deload guarda "60%". Cuando hay unidad se muestra como lo muestra la
 * máquina — con coma decimal y el kg al lado, igual que en todo el resto de
 * la app (regla dura 5). Sin unidad se muestra tal cual vino.
 */
function showValue(value: string | null, unit: LoadUnit | null): string {
  if (value === null) return '';
  if (unit === null) return value;
  const n = Number(value);
  return Number.isNaN(n) ? value : formatLoad({ value: n, unit });
}
