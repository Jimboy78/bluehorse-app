import type { Goal } from '@bh/domain';
import { Info } from 'lucide-react';
import { activeRuleset } from '../lib/engine.ts';
import { Notice } from './ui/index.ts';

/**
 * Lo que el ruleset tiene para decir sobre el objetivo elegido.
 *
 * La investigación no es pareja: fuerza e hipertrofia tienen metaanálisis
 * detrás; potencia y resistencia muscular en sala tienen consenso y poco más.
 * Mostrar las dos cosas con la misma cara sería mentir por omisión.
 *
 * Antes esto solo aparecía con `confidence: 'low'`, y así quedaban escondidas
 * las notas de `cardio` y `recomposition`, que son `medium` y dicen cosas que
 * cambian lo que el socio espera del plan — que los números de recomposición
 * son los de hipertrofia y que la diferencia la hace la dieta, por ejemplo. La
 * regla dura 4 pide que lo flojo avise; no pide que lo demás se calle cuando
 * tiene algo escrito. Ver `docs/research/12-objetivo.md`.
 */
export function EvidenceNotice({ goal }: { readonly goal: Goal | null }) {
  if (!goal) return null;
  const block = activeRuleset.prescription[goal];
  if (!block?.confidenceNote) return null;

  const floja = block.confidence === 'low';
  return (
    <Notice tone={floja ? 'warn' : 'info'} icon={<Info size={16} aria-hidden="true" />}>
      <strong className="font-semibold">
        {floja ? 'Sobre este objetivo:' : 'Cómo se arma este objetivo:'}
      </strong>{' '}
      {block.confidenceNote}
    </Notice>
  );
}
