import type { EntityTable } from 'dexie';
import Dexie from 'dexie';

/**
 * COLA DE ESCRITURAS OFFLINE
 *
 * En el gimnasio la señal se corta. Lo que el usuario marca se guarda primero
 * acá y se envía cuando hay red. Como una sesión la escribe un solo teléfono,
 * no hay conflictos que resolver: alcanza con una cola y una clave de
 * idempotencia. No hace falta sincronización bidireccional.
 */

export type OutboxKind = 'workout_log' | 'set_log' | 'proposal_response' | 'session_event';

export interface OutboxItem {
  /** Clave de idempotencia generada en el cliente. El servidor descarta repetidos. */
  clientId: string;
  kind: OutboxKind;
  payload: unknown;
  createdAt: number;
  attempts: number;
  lastError: string | null;
}

class OutboxDb extends Dexie {
  pending!: EntityTable<OutboxItem, 'clientId'>;

  constructor() {
    super('bluehorse-outbox');
    this.version(1).stores({ pending: 'clientId, kind, createdAt' });
  }
}

export const db = new OutboxDb();

export function newClientId(): string {
  return crypto.randomUUID();
}

/** Encola una escritura. Devuelve el clientId para poder referenciarla. */
export async function enqueue(kind: OutboxKind, payload: unknown, clientId = newClientId()) {
  await db.pending.put({
    clientId,
    kind,
    payload,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
  });
  return clientId;
}

export function pendingCount(): Promise<number> {
  return db.pending.count();
}

export type Sender = (item: OutboxItem) => Promise<void>;

/**
 * Vacía la cola en orden de llegada. Un fallo detiene el envío y deja el resto
 * en cola: reintentar en orden importa (una serie no puede llegar antes que la
 * sesión que la contiene).
 */
export async function flush(send: Sender): Promise<{ sent: number; failed: number }> {
  if (!navigator.onLine) return { sent: 0, failed: 0 };

  const items = await db.pending.orderBy('createdAt').toArray();
  let sent = 0;

  for (const item of items) {
    try {
      await send(item);
      await db.pending.delete(item.clientId);
      sent += 1;
    } catch (error) {
      await db.pending.update(item.clientId, {
        attempts: item.attempts + 1,
        lastError: error instanceof Error ? error.message : String(error),
      });
      return { sent, failed: items.length - sent };
    }
  }

  return { sent, failed: 0 };
}

/** Reintenta al recuperar la conexión. Se llama una vez, en el arranque. */
export function startAutoFlush(send: Sender): () => void {
  const handler = () => {
    void flush(send);
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
