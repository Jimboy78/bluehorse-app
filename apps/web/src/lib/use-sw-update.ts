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
 *
 * El navegador revisa si el service worker cambió en cada navegación real —
 * pero una PWA instalada, abierta una vez y usada por rutas del lado del
 * cliente (React Router, sin recargar la página), no genera ninguna
 * navegación real mientras se sigue usando. "Casi nunca se cierra del todo"
 * significa justo eso: puede quedar días con la misma pestaña de fondo, sin
 * que el navegador vuelva a mirar si hay una versión nueva. Por eso se pide
 * un chequeo cada una hora a mano (`registration.update()`), que es lo que
 * la documentación de `vite-plugin-pwa` recomienda para este caso — ni tan
 * seguido como para gastar red de más, ni tan poco como para que un arreglo
 * publicado tarde días en llegarle a alguien que dejó la app abierta.
 */

let needsRefresh = false;
const listeners = new Set<() => void>();

function emit(): void {
  needsRefresh = true;
  for (const listener of listeners) listener();
}

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

const updateSW = registerSW({
  onNeedRefresh: emit,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    setInterval(() => {
      // Sin señal (o el gimnasio queda en un subsuelo con wifi malo), el
      // pedido del script falla — es un chequeo de fondo, no algo que tenga
      // que avisarle nada a nadie ni reintentar más seguido; el próximo
      // intervalo ya vuelve a probar solo.
      registration.update().catch(() => {});
    }, UPDATE_CHECK_INTERVAL_MS);
  },
});

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
