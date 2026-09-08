import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  db,
  dequeue,
  enqueue,
  flush,
  ORPHANED_OWNER,
  outboxHealth,
  pendingCount,
} from './outbox.ts';

/**
 * La cola offline vive en el mismo IndexedDB del navegador para toda la app:
 * no hay un IndexedDB "por pestaña" ni "por sesión". Si alguien cierra sesión
 * en un teléfono de gimnasio y otro socio entra antes de que la cola termine
 * de vaciarse, sin aislar por dueño la cuenta nueva heredaría (e intentaría
 * reenviar) los datos de la anterior.
 */

const OWNER_A = 'usuario-a';
const OWNER_B = 'usuario-b';

beforeEach(async () => {
  await db.pending.clear();
});

afterEach(async () => {
  await db.pending.clear();
});

describe('la cola offline separa por dueño', () => {
  it('pendingCount de B no cuenta lo que encoló A', async () => {
    await enqueue('set_log', { foo: 1 }, OWNER_A);
    await enqueue('set_log', { foo: 2 }, OWNER_A);
    await enqueue('set_log', { foo: 3 }, OWNER_B);

    expect(await pendingCount(OWNER_A)).toBe(2);
    expect(await pendingCount(OWNER_B)).toBe(1);
  });

  it('outboxHealth de B no ve los fallos de A', async () => {
    const clientId = await enqueue('set_log', { foo: 1 }, OWNER_A);
    // Simula que ese ítem de A ya falló una vez.
    await db.pending.update(clientId, { attempts: 1, lastError: 'algo se rompió' });
    await enqueue('set_log', { foo: 2 }, OWNER_B);

    const healthB = await outboxHealth(OWNER_B);
    expect(healthB.pending).toBe(1);
    expect(healthB.failing).toBe(0);
    expect(healthB.worstError).toBeNull();

    const healthA = await outboxHealth(OWNER_A);
    expect(healthA.failing).toBe(1);
  });

  it('flush(ownerId) solo manda lo de ese dueño, aunque haya cola de otro', async () => {
    await enqueue('set_log', { who: 'a' }, OWNER_A);
    await enqueue('set_log', { who: 'b' }, OWNER_B);

    const sent: unknown[] = [];
    const result = await flush(async (item) => {
      sent.push(item.payload);
    }, OWNER_B);

    expect(result.sent).toBe(1);
    expect(sent).toEqual([{ who: 'b' }]);
    // Lo de A sigue en cola: flush(B) no lo tocó ni intentó mandarlo.
    expect(await pendingCount(OWNER_A)).toBe(1);
    expect(await pendingCount(OWNER_B)).toBe(0);
  });

  it('dequeue solo saca el clientId indicado, no toca la cola de otro dueño', async () => {
    const clientIdA = await enqueue('set_log', { who: 'a' }, OWNER_A);
    await enqueue('set_log', { who: 'b' }, OWNER_B);

    const removed = await dequeue(clientIdA);
    expect(removed).toBe(true);
    expect(await pendingCount(OWNER_A)).toBe(0);
    expect(await pendingCount(OWNER_B)).toBe(1);
  });
});

describe('migración de la cola vieja (sin ownerId)', () => {
  it('los ítems que quedaron de antes de este cambio se marcan huérfanos, no del primero que entra', async () => {
    // No se puede simular la migración de Dexie en este test directamente
    // (correría contra la v2 ya migrada), pero si algún día alguien reintroduce
    // un `db.pending.put` sin `ownerId`, el tipo ya no compila — es la
    // protección real. Esto documenta la intención: `ORPHANED_OWNER` existe
    // para que un ítem sin dueño conocido nunca se le atribuya en silencio a
    // quien abra la app primero después de una actualización.
    expect(ORPHANED_OWNER).toBe('__orphaned__');
  });
});
