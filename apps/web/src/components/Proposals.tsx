import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { usePendingProposals, useResolveProposal } from '../lib/adaptation.ts';
import { showsPlaceholderContent } from '../lib/engine.ts';
import { fadeUp, listContainer, listItem, tappable } from '../lib/motion.ts';

/**
 * "El motor propone, el usuario confirma" — nunca al revés. Aceptar una
 * propuesta de carga la aplica a las sesiones pendientes del plan; el resto
 * de las propuestas (deload) solo quedan resueltas, sin tocar números
 * todavía (ver `useResolveProposal`).
 */
export function Proposals() {
  const proposals = usePendingProposals();
  const resolve = useResolveProposal();

  if (!proposals.data || proposals.data.length === 0) return null;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-2.5"
    >
      <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
        <Sparkles size={13} className="text-teal" aria-hidden="true" />
        Propuestas del motor
      </h2>
      <AnimatePresence initial={false}>
        <motion.ul
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2"
        >
          {proposals.data.map((proposal) => (
            <motion.li
              key={proposal.id}
              variants={listItem}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-2.5 rounded-xl border border-line bg-navy-soft p-4"
            >
              <p className="text-sm">{proposal.reasonText}</p>
              {proposal.fromValue !== null && proposal.toValue !== null && (
                <p className="flex items-center gap-1.5 font-mono text-xs text-slate">
                  {proposal.fromValue}
                  <ArrowRight size={11} aria-hidden="true" />
                  <span className="text-teal">{proposal.toValue}</span>
                </p>
              )}
              {showsPlaceholderContent && (
                <p className="text-[0.65rem] uppercase tracking-wide text-amber">
                  ruleset provisorio
                </p>
              )}
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  {...tappable}
                  disabled={resolve.isPending}
                  onClick={() => resolve.mutate({ proposal, accept: true })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-xs font-semibold text-navy disabled:opacity-50"
                >
                  <Check size={13} aria-hidden="true" />
                  Aceptar
                </motion.button>
                <motion.button
                  type="button"
                  {...tappable}
                  disabled={resolve.isPending}
                  onClick={() => resolve.mutate({ proposal, accept: false })}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-slate disabled:opacity-50"
                >
                  <X size={13} aria-hidden="true" />
                  Rechazar
                </motion.button>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </motion.section>
  );
}
