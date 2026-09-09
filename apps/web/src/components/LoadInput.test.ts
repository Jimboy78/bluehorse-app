import { describe, expect, it } from 'vitest';
import { carriesLoad } from './LoadInput.tsx';

/**
 * El bug que motivó esta función: el editor de carga estaba escondido detrás
 * de `canStep`, que necesita `load_increment`. En las 58 estaciones reales de
 * Blue Horse ese campo está en `null` (falta medirlo in situ), así que en toda
 * estación de discos o peso libre no había forma de anotar el peso — todas
 * las series quedaban en "sin carga previa" para siempre.
 *
 * "¿Se puede escalonar?" y "¿hay una carga que anotar?" son preguntas
 * distintas: la primera necesita el escalón, la segunda solo la unidad.
 */
describe('carriesLoad', () => {
  it('sin spec de carga, no hay nada que anotar', () => {
    expect(carriesLoad(null)).toBe(false);
  });

  it('peso corporal y sin carga no llevan número: pedirlo sería inventarlo', () => {
    expect(carriesLoad({ unit: 'bodyweight' })).toBe(false);
    expect(carriesLoad({ unit: 'none' })).toBe(false);
  });

  it('una estación de discos SIN escalón cargado igual lleva carga', () => {
    // El caso exacto del catálogo real: `load_increment` en null. Antes esto
    // hacía desaparecer el campo entero.
    expect(carriesLoad({ unit: 'plates_kg' })).toBe(true);
    expect(carriesLoad({ unit: 'kg' })).toBe(true);
    expect(carriesLoad({ unit: 'lb' })).toBe(true);
  });

  it('una selectorizada lleva carga (el nivel de pin)', () => {
    expect(carriesLoad({ unit: 'stack_level' })).toBe(true);
  });

  it('el escalón no cambia la respuesta: es otra pregunta', () => {
    expect(carriesLoad({ unit: 'kg', increment: 2.5 })).toBe(true);
    expect(carriesLoad({ unit: 'kg' })).toBe(true);
  });
});
