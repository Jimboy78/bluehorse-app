import { useEffect, useState } from 'react';
import { isStandaloneDisplay } from './use-install-prompt.ts';

/**
 * CUÁNDO OFRECER LA INSTALACIÓN, Y QUÉ PASA AL CERRARLA
 *
 * Tres estados, en un solo sentido:
 *
 *   oculto → hoja → pista → oculto
 *
 * `hoja` es la invitación. `pista` es lo que queda después de cerrarla: un
 * aviso corto que dice a dónde se fue el botón, con la pestaña "Perfil"
 * encendida mientras dura. Sin ese paso, cerrar la hoja convierte un "ahora
 * no" en "no la encuentro nunca más", que es lo que pasa con casi todos los
 * banners de instalación.
 *
 * Se ofrece una sola vez: la decisión queda guardada en `localStorage`. Un
 * cartel que vuelve en cada visita no convence a nadie, molesta.
 *
 * `localStorage` puede tirar excepción (modo privado, cookies bloqueadas) y
 * puede volver vacío en otro dispositivo. Las dos cosas fallan hacia el mismo
 * lado seguro: si no se puede leer, se asume que no se ofreció todavía; si no
 * se puede escribir, la invitación vuelve la próxima vez. Molesto, no roto.
 */

const DISMISSED_KEY = 'bh-install-invite-dismissed';

/** Cuánto esperar antes de subir la hoja, para no aparecer sobre la pantalla a medio pintar. */
const SHOW_DELAY_MS = 1400;

/** Cuánto queda la pista con la pestaña encendida. Alcanza para leerla sin tapar la app. */
const HINT_MS = 4500;

export type InvitePhase = 'hidden' | 'sheet' | 'hint';

export function readInstallDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markInstallDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // Sin storage la invitación va a volver la próxima vez. Preferible a
    // romper la pantalla por no poder anotar una preferencia.
  }
}

/**
 * `true` si corresponde ofrecer la instalación. Separada del hook para poder
 * probar la decisión sin renderizar nada.
 */
export function shouldInvite({
  standalone,
  dismissed,
}: {
  readonly standalone: boolean;
  readonly dismissed: boolean;
}): boolean {
  // Ya instalada: no hay nada que ofrecer, y ofrecerlo igual haría dudar de
  // que esté instalada.
  if (standalone) return false;
  return !dismissed;
}

export function useInstallInvite(): {
  readonly phase: InvitePhase;
  readonly dismiss: () => void;
} {
  const [phase, setPhase] = useState<InvitePhase>('hidden');

  useEffect(() => {
    if (!shouldInvite({ standalone: isStandaloneDisplay(), dismissed: readInstallDismissed() })) {
      return;
    }
    const id = setTimeout(() => setPhase('sheet'), SHOW_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (phase !== 'hint') return;
    const id = setTimeout(() => setPhase('hidden'), HINT_MS);
    return () => clearTimeout(id);
  }, [phase]);

  function dismiss() {
    markInstallDismissed();
    setPhase('hint');
  }

  return { phase, dismiss };
}
