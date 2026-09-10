import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { type OutboxHealth, outboxHealth } from './outbox.ts';

/**
 * QUÉ TAN AL DÍA ESTÁ LO QUE SE VE
 *
 * "Progreso" lee `set_logs` y `workout_logs` del servidor. La cola offline
 * vive en el teléfono. Cuando hay algo en la cola las dos cosas no dicen lo
 * mismo, y la pantalla mostraba la versión del servidor sin aclarar nada: la
 * persona entrenaba en el subsuelo sin señal, subía, entraba a Progreso y
 * veía la racha cortada, el volumen de la semana sin la sesión de recién y
 * ningún récord nuevo. Los datos estaban en su teléfono todo el tiempo.
 *
 * Callarse eso es el mismo problema que presentar una fila de consenso con la
 * cara de un metaanálisis: no es un número equivocado, es un número
 * incompleto presentado como completo (regla dura 4). Hasta acá el único
 * lugar donde se veía la cola era el panel "Estado del esqueleto", que solo
 * existe en desarrollo, y el aviso al cerrar sesión — o sea, en ningún lado
 * para quien entrena.
 *
 * Dos estados distintos, no uno:
 *
 * - **Esperando señal**: nadie intentó mandarlo todavía (`attempts === 0`).
 *   `flush()` ni lo prueba sin conexión. Se arregla solo.
 * - **Trabado**: ya falló al menos una vez. Eso no es falta de señal, es un
 *   error real, y NO se arregla solo esperando. Ahí sí hay algo que decir y
 *   algo que ofrecer.
 */

export type SyncState =
  | { readonly kind: 'al-dia' }
  | { readonly kind: 'esperando'; readonly pendientes: number }
  | {
      readonly kind: 'trabado';
      readonly pendientes: number;
      readonly fallando: number;
      readonly error: string | null;
    };

export const AL_DIA: SyncState = { kind: 'al-dia' };

/** El estado de la cola → lo que corresponde decir. Exportada para test. */
export function estadoDeSincronia(health: OutboxHealth | undefined): SyncState {
  if (!health || health.pending === 0) return AL_DIA;
  if (health.failing > 0) {
    return {
      kind: 'trabado',
      pendientes: health.pending,
      fallando: health.failing,
      error: health.worstError,
    };
  }
  return { kind: 'esperando', pendientes: health.pending };
}

/** "1 serie" / "3 series". Sin esto el aviso decía "1 series". */
export function seriesPendientes(n: number): string {
  return n === 1 ? '1 serie' : `${n} series`;
}

/**
 * La cola de este socio, mirada cada pocos segundos.
 *
 * `refetchInterval` y no una invalidación: la cola la cambian cosas que no
 * pasan por TanStack Query (el `flush()` automático al volver la señal, el
 * listener de `visibilitychange`), así que no hay ningún punto del código
 * desde donde avisarle. Es IndexedDB local: consultarlo cada 3 segundos no
 * toca la red ni gasta batería de forma medible.
 */
export function useSyncState(): SyncState {
  const { user, status } = useAuth();

  const health = useQuery<OutboxHealth>({
    queryKey: ['outbox-health', user?.id],
    // La trampa de CLAUDE.md: sin este chequeo la query queda deshabilitada y
    // `isPending` no resuelve nunca. Acá no colgaría una pantalla (se lee
    // `data`, no `isPending`), pero el chequeo va igual para que nadie lo
    // "arregle" después mirando el estado de carga.
    enabled: status === 'signed-in' && !!user,
    queryFn: () => outboxHealth(user?.id as string),
    refetchInterval: 3000,
    retry: false,
  });

  if (status !== 'signed-in') return AL_DIA;
  return estadoDeSincronia(health.data);
}
