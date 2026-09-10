import { useEffect, useState } from 'react';
import type { DocBlock } from '../components/DocBlocks.tsx';
import indice from '../content/docs-index.generated.json' with { type: 'json' };

/**
 * LOS DOCUMENTOS DE INVESTIGACIÓN
 *
 * `scripts/build-docs.mjs` escribe un JSON por documento en `content/docs/` y
 * un índice chico con títulos y resúmenes. Acá se leen los dos.
 *
 * **El índice se importa; los documentos no.** El índice pesa 3,7 KB
 * comprimido y se lee siempre. Los cuerpos suman unos 320 KB —el más grande
 * son 55 KB, 12 comprimido— y en un `import` normal Vite los metería en el
 * paquete de la pantalla: abrir uno bajaría los veintitrés. Con
 * `import.meta.glob` en modo perezoso cada uno queda en su propio pedazo y se
 * baja cuando alguien lo abre.
 *
 * Esto es una PWA que se usa en el gimnasio con datos móviles: 320 KB de notas
 * de investigación adentro del paquete inicial no se pagan con nada.
 */

export interface DocSummary {
  readonly id: string;
  readonly titulo: string;
  readonly resumen: string | null;
  /** Qué archivo de `docs/research/` es. Se muestra: es parte de blanquear de dónde sale. */
  readonly archivo: string;
  readonly bloques: number;
}

export interface DocContent {
  readonly id: string;
  readonly titulo: string;
  readonly bloques: readonly DocBlock[];
}

export const documentos: readonly DocSummary[] = indice.docs;

/** Cuándo se regeneró el catálogo desde `docs/research/`. */
export const generadoEl: string = indice.generatedAt;

const cuerpos = import.meta.glob<{ default: DocContent }>('../content/docs/*.generated.json');

/** La ruta del glob, que es la clave con la que se pide cada documento. */
function rutaDe(id: string): string {
  return `../content/docs/${id}.generated.json`;
}

export function existeDoc(id: string): boolean {
  return rutaDe(id) in cuerpos;
}

export type DocState =
  | { readonly kind: 'cargando' }
  | { readonly kind: 'listo'; readonly doc: DocContent }
  | { readonly kind: 'no-existe' }
  | { readonly kind: 'error' };

/**
 * El documento pedido, bajado cuando se abre.
 *
 * No usa TanStack Query a propósito: no hay servidor, no hay sesión, no hay
 * nada que revalidar. Es un pedazo de JavaScript que el navegador ya cachea
 * solo, y meterlo en la caché de queries agregaría una clave que nunca
 * invalida nada.
 */
export function useDoc(id: string | null): DocState {
  const [estado, setEstado] = useState<DocState>({ kind: 'cargando' });

  useEffect(() => {
    if (!id) {
      setEstado({ kind: 'no-existe' });
      return;
    }

    const cargar = cuerpos[rutaDe(id)];
    if (!cargar) {
      setEstado({ kind: 'no-existe' });
      return;
    }

    // Si se cambia de documento mientras el anterior viaja, la respuesta vieja
    // no puede pisar a la nueva.
    let vigente = true;
    setEstado({ kind: 'cargando' });

    cargar()
      .then((m) => {
        if (vigente) setEstado({ kind: 'listo', doc: m.default });
      })
      .catch(() => {
        if (vigente) setEstado({ kind: 'error' });
      });

    return () => {
      vigente = false;
    };
  }, [id]);

  return estado;
}
