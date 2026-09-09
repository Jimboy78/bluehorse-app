import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, enqueue, startAutoFlush } from './outbox.ts';

/**
 * `startAutoFlush` reintenta la cola en dos momentos, no uno: cuando vuelve
 * la señal (`online`) y cuando la app se vuelve a ver (`visibilitychange` →
 * `visible`). El segundo cubre el caso que el primero no puede: la app se
 * cerró del todo (el sistema la mató por memoria, se quedó sin batería) sin
 * señal, y se reabrió ya conectada — ahí la conexión nunca "vuelve" durante
 * esta carga de página, así que `online` no tiene nada que disparar.
 */

const OWNER = 'socio-de-prueba';

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { value, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(async () => {
  await db.pending.clear();
  setOnline(true);
  setVisibility('visible');
});

afterEach(async () => {
  await db.pending.clear();
});

describe('startAutoFlush', () => {
  it('reintenta la cola cuando la pestaña vuelve a estar visible', async () => {
    setVisibility('hidden');
    await enqueue('set_log', { foo: 1 }, OWNER);

    const send = vi.fn().mockResolvedValue(undefined);
    const stop = startAutoFlush(send, () => OWNER);

    // Estando oculta, nada la manda todavía: nadie disparó `visible` ni `online`.
    await new Promise((r) => setTimeout(r, 0));
    expect(send).not.toHaveBeenCalled();

    // Reabrir la app (o volver de segundo plano) sin que la conexión haya
    // cambiado: es exactamente el caso que `online` no cubre.
    setVisibility('visible');
    await new Promise((r) => setTimeout(r, 0));

    expect(send).toHaveBeenCalledTimes(1);
    expect(await db.pending.count()).toBe(0);

    stop();
  });

  it('sigue reintentando también al volver la señal (online), no solo al reabrirse', async () => {
    await enqueue('set_log', { foo: 1 }, OWNER);
    const send = vi.fn().mockResolvedValue(undefined);
    const stop = startAutoFlush(send, () => OWNER);

    window.dispatchEvent(new Event('online'));
    await new Promise((r) => setTimeout(r, 0));

    expect(send).toHaveBeenCalledTimes(1);
    stop();
  });

  it('no manda nada si la pestaña se vuelve visible sin que haya nadie con sesión', async () => {
    await enqueue('set_log', { foo: 1 }, OWNER);
    const send = vi.fn().mockResolvedValue(undefined);
    // `getOwnerId` devuelve null: nadie inició sesión todavía (arranque de la
    // app, antes de que `AuthProvider` resuelva quién es).
    const stop = startAutoFlush(send, () => null);

    setVisibility('hidden');
    setVisibility('visible');
    await new Promise((r) => setTimeout(r, 0));

    expect(send).not.toHaveBeenCalled();
    stop();
  });

  it('deja de escuchar los dos eventos después de llamar al `stop`', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const stop = startAutoFlush(send, () => OWNER);
    stop();

    await enqueue('set_log', { foo: 1 }, OWNER);
    window.dispatchEvent(new Event('online'));
    setVisibility('hidden');
    setVisibility('visible');
    await new Promise((r) => setTimeout(r, 0));

    expect(send).not.toHaveBeenCalled();
  });
});
