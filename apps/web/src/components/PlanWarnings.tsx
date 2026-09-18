import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * Cuántos avisos del plan se ven de entrada.
 *
 * Un plan traía en promedio 6,7 avisos y hasta 14 (`docs/research/38`), y
 * catorce párrafos arriba de un plan compiten con el plan mismo. El motor ya
 * los devuelve ordenados —primero cuándo consultar, cómo volver, qué falta
 * cubrir; después por qué el plan es como es—, así que acá solo se corta.
 * Ninguno se borra: el resto queda a un toque.
 */
export const AVISOS_VISIBLES = 2;

export function splitWarnings(warnings: readonly string[]): {
  visibles: readonly string[];
  resto: readonly string[];
} {
  return {
    visibles: warnings.slice(0, AVISOS_VISIBLES),
    resto: warnings.slice(AVISOS_VISIBLES),
  };
}

/** Los avisos del plan: los primeros a la vista, el resto detrás de "ver más". */
export function PlanWarnings({ warnings }: { warnings: readonly string[] }) {
  const [abierto, setAbierto] = useState(false);
  const { visibles, resto } = splitWarnings(warnings);
  const lista = abierto ? warnings : visibles;

  return (
    <span className="flex flex-col gap-1">
      {lista.map((warning) => (
        <span key={warning}>{warning}</span>
      ))}
      {resto.length > 0 && (
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          className="mt-1 flex items-center gap-1.5 self-start text-xs text-slate transition-colors hover:text-brand"
        >
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
          />
          {abierto
            ? 'Ver menos'
            : resto.length === 1
              ? 'Ver 1 aviso más'
              : `Ver ${resto.length} avisos más`}
        </button>
      )}
    </span>
  );
}
