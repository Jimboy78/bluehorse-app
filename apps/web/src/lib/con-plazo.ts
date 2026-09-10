/**
 * UNA LECTURA QUE NO VUELVE NUNCA
 *
 * Una promesa que no resuelve ni rechaza es peor que un error: TanStack Query
 * la deja en `isPending` para siempre, `retry` no entra (no hay rechazo que
 * reintentar) y la pantalla se queda en el esqueleto. Si esa pantalla es un
 * guard de ruta, la app entera no abre.
 *
 * Pasa de verdad, y no hace falta un bug para provocarlo: con el servidor
 * inalcanzable, supabase-js espera a renovar el token antes de mandar la
 * consulta, y esa espera puede no terminar. Medido con Supabase apagado: más
 * de un minuto en "Cargando…" en la raíz de la app, sin un error en la
 * consola. Un `fetch` suelto contra el mismo servidor fallaba en dos
 * segundos — o sea, la red respondía enseguida; lo que no volvía era la
 * biblioteca.
 *
 * `conPlazo` le pone un final: pasado el plazo, rechaza. A partir de ahí es un
 * error como cualquier otro, y las pantallas ya saben mostrar un error.
 */

export class PlazoVencido extends Error {
  constructor(ms: number) {
    super(`La consulta no respondió en ${ms} ms.`);
    this.name = 'PlazoVencido';
  }
}

/**
 * Cuánto se espera una lectura antes de darla por perdida. No es un número de
 * entrenamiento (regla dura 3): es cuánto tolera mirar un spinner alguien
 * parado al lado de una máquina.
 */
export const PLAZO_DE_LECTURA_MS = 8000;

export function conPlazo<T>(promesa: PromiseLike<T>, ms = PLAZO_DE_LECTURA_MS): Promise<T> {
  return new Promise<T>((resolver, rechazar) => {
    const corte = setTimeout(() => rechazar(new PlazoVencido(ms)), ms);
    promesa.then(
      (valor) => {
        clearTimeout(corte);
        resolver(valor);
      },
      (error: unknown) => {
        clearTimeout(corte);
        rechazar(error);
      },
    );
  });
}
