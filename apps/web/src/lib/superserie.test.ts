import { describe, expect, it } from 'vitest';
import {
  companerosDeVuelta,
  proximoDeLaVuelta,
  siguienteDeLaVuelta,
  superserieDe,
  textoDelDescanso,
} from './superserie.ts';

const lunes = [
  { name: 'Sentadilla', supersetGroup: 1 },
  { name: 'Salto con vallas', supersetGroup: 1 },
  { name: 'Peso muerto rumano', supersetGroup: null },
  { name: 'Pogo jumps', supersetGroup: null },
];

describe('superserie', () => {
  it('el primero de la vuelta no dice "0s de descanso": dice con qué sigue', () => {
    expect(textoDelDescanso(lunes, 0, 0)).toBe('sin descanso, seguí con Salto con vallas');
  });

  it('el último de la vuelta descansa y vuelve al primero', () => {
    expect(textoDelDescanso(lunes, 1, 180)).toBe('180s de descanso y volvés a Sentadilla');
  });

  it('fuera de una superserie, el descanso de siempre', () => {
    expect(textoDelDescanso(lunes, 2, 120)).toBe('120s de descanso');
    expect(siguienteDeLaVuelta(lunes, 2)).toBeNull();
    expect(companerosDeVuelta(lunes, 2)).toEqual([]);
  });

  it('dos ejercicios sin grupo seguidos no son una vuelta', () => {
    expect(siguienteDeLaVuelta(lunes, 2)).toBeNull();
    expect(textoDelDescanso(lunes, 3, 120)).toBe('120s de descanso');
  });

  it('los compañeros de vuelta, sin el propio', () => {
    expect(companerosDeVuelta(lunes, 0)).toEqual(['Salto con vallas']);
    expect(companerosDeVuelta(lunes, 1)).toEqual(['Sentadilla']);
  });

  it('después de una serie se pasa al otro de la vuelta, y del último se vuelve al primero', () => {
    expect(proximoDeLaVuelta(lunes, 0)).toBe(1);
    expect(proximoDeLaVuelta(lunes, 1)).toBe(0);
    expect(proximoDeLaVuelta(lunes, 2)).toBeNull();
    expect(proximoDeLaVuelta(lunes, 3)).toBeNull();
  });

  it('superserieDe: null fuera de una vuelta', () => {
    expect(superserieDe(lunes, 2, 120)).toBeNull();
    expect(superserieDe(lunes, 0, 0)).toEqual({
      companeros: ['Salto con vallas'],
      siguiente: 'Salto con vallas',
      descanso: 'sin descanso, seguí con Salto con vallas',
    });
  });

  it('dos grupos distintos pegados no se mezclan', () => {
    const items = [
      { name: 'A', supersetGroup: 1 },
      { name: 'B', supersetGroup: 2 },
      { name: 'C', supersetGroup: 2 },
    ];
    expect(siguienteDeLaVuelta(items, 0)).toBeNull();
    expect(textoDelDescanso(items, 0, 90)).toBe('90s de descanso');
    expect(textoDelDescanso(items, 1, 0)).toBe('sin descanso, seguí con C');
  });
});
