import { useCallback, useEffect, useState } from 'react';

/**
 * LOS EJERCICIOS QUE EL SOCIO QUIERE VER PRIMERO
 *
 * La lista de récords y la de evolución crecen con el catálogo: 58 estaciones
 * dan una columna que no se recorre con el pulgar. Anclar dos o tres es lo que
 * convierte esa lista en un tablero.
 *
 * Vive en `localStorage` y no en la base **a propósito**: es una preferencia de
 * cómo mirar la pantalla, no un dato del socio. No cambia el plan, no alimenta
 * al motor, y si se pierde al cambiar de teléfono lo único que pasa es que la
 * lista vuelve a estar ordenada como al principio. Meterlo en Postgres sería
 * una tabla, una política de RLS y un `gym_id` (regla dura 5) para guardar
 * "este me interesa".
 *
 * Todo lectura y escritura va en `try/catch`: en una ventana privada, con las
 * cookies bloqueadas o durante la captura de una miniatura, el acceso a
 * `localStorage` puede tirar excepción.
 */

const KEY = 'bh.pinned-exercises';

/** Cuántos se pueden anclar. Más que esto y el tablero vuelve a ser una lista. */
export const MAX_PINNED = 3;

function leer(): string[] {
  try {
    const crudo = localStorage.getItem(KEY);
    if (!crudo) return [];
    const parsed: unknown = JSON.parse(crudo);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_PINNED);
  } catch {
    return [];
  }
}

function escribir(ids: readonly string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // Sin almacenamiento la preferencia dura lo que dura la pantalla, que es
    // mejor que romper la pantalla.
  }
}

export function usePinnedExercises() {
  const [pinned, setPinned] = useState<readonly string[]>([]);

  // La primera lectura va en un efecto y no en `useState(leer)`: así el primer
  // render es igual en el servidor y en el cliente, y una excepción del
  // almacenamiento no cae durante la construcción del componente.
  useEffect(() => {
    setPinned(leer());
  }, []);

  const toggle = useCallback((id: string) => {
    setPinned((actual) => {
      const proximo = actual.includes(id)
        ? actual.filter((x) => x !== id)
        : [id, ...actual].slice(0, MAX_PINNED);
      escribir(proximo);
      return proximo;
    });
  }, []);

  const isPinned = useCallback((id: string) => pinned.includes(id), [pinned]);

  return { pinned, toggle, isPinned, isFull: pinned.length >= MAX_PINNED };
}
