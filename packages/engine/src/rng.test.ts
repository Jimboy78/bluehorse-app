import { describe, expect, it } from 'vitest';
import { createRng, pickDeterministic } from './rng.ts';

describe('createRng', () => {
  it('misma semilla, misma secuencia — es lo que hace reproducible un plan', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('semillas distintas dan secuencias distintas', () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a()).not.toBe(b());
  });

  it('siempre devuelve un número en [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 200; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('acepta semilla 0 sin romperse', () => {
    const rng = createRng(0);
    expect(Number.isFinite(rng())).toBe(true);
  });
});

describe('pickDeterministic', () => {
  it('sin opciones, undefined', () => {
    expect(pickDeterministic([], () => 0.5)).toBeUndefined();
  });

  it('una sola opción, la devuelve sin consultar el rng', () => {
    expect(
      pickDeterministic(['único'], () => {
        throw new Error('no debería llamarse');
      }),
    ).toBe('único');
  });

  it('elige el índice que corresponde al valor del rng', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(pickDeterministic(items, () => 0)).toBe('a');
    expect(pickDeterministic(items, () => 0.26)).toBe('b'); // floor(0.26*4)=1
    expect(pickDeterministic(items, () => 0.99)).toBe('d'); // floor(0.99*4)=3
  });

  it('un rng que devolviera 1 no se va de rango (clamp al último ítem)', () => {
    const items = ['a', 'b', 'c'];
    expect(pickDeterministic(items, () => 1)).toBe('c');
  });

  it('misma semilla y mismos ítems, mismo resultado siempre', () => {
    const items = ['squat', 'lunge', 'hinge'];
    const first = pickDeterministic(items, createRng(123));
    const second = pickDeterministic(items, createRng(123));
    expect(first).toBe(second);
  });
});
