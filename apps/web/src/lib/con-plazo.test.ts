import { describe, expect, it } from 'vitest';
import { conPlazo, PlazoVencido } from './con-plazo.ts';

describe('conPlazo', () => {
  it('deja pasar lo que responde a tiempo', async () => {
    await expect(conPlazo(Promise.resolve('ok'), 50)).resolves.toBe('ok');
  });

  it('deja pasar el error de lo que falla a tiempo', async () => {
    await expect(conPlazo(Promise.reject(new Error('caído')), 50)).rejects.toThrow('caído');
  });

  it('convierte en error lo que no vuelve nunca', async () => {
    // Sin esto TanStack la deja en `isPending` para siempre: `retry` no entra
    // porque no hay rechazo, y el guard de ruta no abre la app nunca.
    const nuncaVuelve = new Promise(() => {});
    await expect(conPlazo(nuncaVuelve, 20)).rejects.toBeInstanceOf(PlazoVencido);
  });

  it('el error dice cuánto esperó', async () => {
    await expect(conPlazo(new Promise(() => {}), 20)).rejects.toThrow('20 ms');
  });
});
