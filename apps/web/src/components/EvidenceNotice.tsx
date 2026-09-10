import type { Goal } from '@bh/domain';
import { ArrowRight, ChevronDown, Info } from 'lucide-react';
import { useId, useState } from 'react';
import { Link } from 'react-router';
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
 *
 * **Por qué el detalle va plegado.** Las notas van de 279 a 432 caracteres y
 * esto vive arriba de todo en la pantalla de inicio. Medido en el navegador a
 * ancho de iPhone 12, con la nota de `cardio` (la más larga): abierto son
 * 326 px de los ~690 útiles, el **47 % de la pantalla**, todos los días, con un
 * texto que ya se leyó. Plegado son 70 px, el 10 %.
 *
 * Lo que se pliega es la explicación; el encabezado que avisa que la evidencia
 * es floja queda siempre a la vista, que es lo que la regla dura 4 exige.
 * Esconder la advertencia sería otra cosa.
 *
 * Y el desplegable no es el único lugar donde vive la nota: abajo del texto va
 * el enlace a `/evidencia`, apuntando a este objetivo, donde está la misma nota
 * con espacio y los papers debajo. Un aviso que solo se puede leer en dos
 * renglones apretados arriba del plan no es evidencia mostrada, es evidencia
 * mencionada.
 */
export function EvidenceNotice({ goal }: { readonly goal: Goal | null }) {
  const [abierto, setAbierto] = useState(false);
  const detalleId = useId();

  if (!goal) return null;
  const block = activeRuleset.prescription[goal];
  if (!block?.confidenceNote) return null;

  const floja = block.confidence === 'low';
  return (
    <Notice tone={floja ? 'warn' : 'info'} icon={<Info size={16} aria-hidden="true" />}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls={detalleId}
        className="flex w-full items-center gap-1.5 text-left"
      >
        <strong className="font-semibold">
          {floja ? 'Sobre este objetivo:' : 'Cómo se arma este objetivo:'}
        </strong>
        <span className="text-ink-muted">{abierto ? 'ocultar' : 'ver por qué'}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`ml-auto shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}
        />
      </button>
      <div id={detalleId} hidden={!abierto} className="mt-1.5 flex flex-col gap-2">
        <p>{block.confidenceNote}</p>
        <Link
          to={`/evidencia?objetivo=${goal}`}
          className="flex items-center gap-1.5 self-start text-xs font-semibold text-brand underline-offset-4 hover:underline"
        >
          Ver las fuentes de este objetivo
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </Notice>
  );
}
