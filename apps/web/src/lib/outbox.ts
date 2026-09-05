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

export type OutboxKind =
  | 'workout_log'
  | 'set_log'
  | 'set_log_delete'
  | 'personal_record'
  | 'proposal_response'
  | 'session_event';

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

export interface OutboxHealth {
  readonly pending: number;
  /** Cuántos ya fallaron al menos una vez: eso no es falta de señal. */
  readonly failing: number;
  /** El error del que más viene fallando, para saber por qué está trabado. */
  readonly worstError: string | null;
}

/**
 * Estado de la cola, no solo cuántos hay.
 *
 * Un ítem esperando señal y uno que falla por un bug se ven igual desde el
 * contador: los dos son "1 pendiente". Los distingue `attempts` — sin señal
 * `flush()` ni lo intenta, así que queda en 0. Con esto, una cola trabada por
 * un error real deja de parecerse a un backlog normal de gimnasio.
 */
export async function outboxHealth(): Promise<OutboxHealth> {
  const items = await db.pending.toArray();
  const failing = items.filter((i) => i.attempts > 0);
  const worst = failing.reduce<OutboxItem | null>(
    (peor, i) => (peor === null || i.attempts > peor.attempts ? i : peor),
    null,
  );
  return { pending: items.length, failing: failing.length, worstError: worst?.lastError ?? null };
}

/**
 * Saca una escritura de la cola si todavía no salió. Devuelve `true` si la
 * encontró: en ese caso nunca llegó al servidor y no hay nada que deshacer
 * del otro lado.
 *
 * Es la mitad barata de deshacer una serie. La otra mitad (encolar un borrado)
 * solo hace falta cuando esto devuelve `false`.
 */
export async function dequeue(clientId: string): Promise<boolean> {
  const deleted = await db.pending.where('clientId').equals(clientId).delete();
  return deleted > 0;
}

export type Sender = (item: OutboxItem) => Promise<void>;

/**
 * Qué guardar en `lastError`. Supabase no tira `Error`: tira un objeto plano
 * (`{ code, message, details, hint }`), y `String(ese objeto)` da
 * `"[object Object]"`. Con eso en la cola, una serie que nunca se pudo
 * guardar queda indistinguible de cualquier otra falla, y el único síntoma
 * visible es el contador de pendientes subiendo sin explicación.
 */
export function describeOutboxError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const { code, message, details } = error as Record<string, unknown>;
    const partes = [code, message, details].filter((p) => typeof p === 'string' && p.length > 0);
    if (partes.length > 0) return partes.join(' · ');
    try {
      return JSON.stringify(error);
    } catch {
      return 'Error desconocido al enviar la cola.';
    }
  }
  return String(error);
}

/**
 * Vacía la cola en orden de llegada. Intenta cada ítem aunque uno anterior
 * haya fallado — no corta al primer error.
 *
 * Antes cortaba entero al primer fallo, pensando en que una serie no puede
 * llegar antes que su sesión. Pero eso significa que UN ítem roto para
 * siempre (un bug real, no solo falta de señal) atasca la cola COMPLETA de
 * ese teléfono para siempre: nada de sesiones futuras, no relacionadas,
 * vuelve a sincronizar jamás. Seguir de largo no rompe el orden que importa:
 * si el `workout_log` de una serie todavía no llegó, esa serie en particular
 * vuelve a fallar (FK inexistente) y queda en cola para el próximo intento —
 * pero el resto de la cola, de otras sesiones, no se ve arrastrado.
 */
export async function flush(send: Sender): Promise<{ sent: number; failed: number }> {
  if (!navigator.onLine) return { sent: 0, failed: 0 };

  const items = await db.pending.orderBy('createdAt').toArray();
  let sent = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await send(item);
      await db.pending.delete(item.clientId);
      sent += 1;
    } catch (error) {
      await db.pending.update(item.clientId, {
        attempts: item.attempts + 1,
        lastError: describeOutboxError(error),
      });
      failed += 1;
    }
  }

  return { sent, failed };
}

/** Reintenta al recuperar la conexión. Se llama una vez, en el arranque. */
export function startAutoFlush(send: Sender): () => void {
  const handler = () => {
    void flush(send);
  };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
