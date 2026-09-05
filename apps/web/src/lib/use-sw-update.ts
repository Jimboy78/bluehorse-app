import { registerSW } from 'virtual:pwa-register';
import { useSyncExternalStore } from 'react';

/**
 * AVISO DE VERSIÓN NUEVA
 *
 * El service worker está en `registerType: 'prompt'` a propósito: con
 * `autoUpdate` la app se recargaría sola, y hacerlo en medio de una serie le
 * borra a alguien lo que estaba cargando (ver trampas conocidas en CLAUDE.md).
 *
 * Pero "prompt" sin nadie que pregunte es peor: el service worker nuevo se
 * instala, queda esperando y no se activa nunca. En un teléfono con la PWA
 * instalada —que casi nunca se cierra del todo— un arreglo publicado podía no
 * llegarle jamás al socio.
 *
 * El registro va acá, a nivel de módulo, y `main.tsx` lo importa: igual que la
 * cola offline, es de toda la app y no de una pantalla. Metido adentro de un
 * componente, `/auth` e `/instalar` se quedaban sin registrar el service
 * worker — y justo `/instalar` es el destino del QR del gimnasio, la pantalla
 * cuyo único trabajo es que la app se instale.
 */

let needsRefresh = false;
const listeners = new Set<() => void>();

function emit(): void {
  needsRefresh = true;
  for (const listener of listeners) listener();
}

const updateSW = registerSW({ onNeedRefresh: emit });

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useServiceWorkerUpdate() {
  const pending = useSyncExternalStore(
    subscribe,
    () => needsRefresh,
    // En el servidor no hay service worker que actualizar.
    () => false,
  );

  return {
    needsRefresh: pending,
    /** Activa la versión nueva y recarga. Solo cuando la persona lo pide. */
    applyUpdate: () => updateSW(true),
  };
}
