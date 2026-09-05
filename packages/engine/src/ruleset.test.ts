import { describe, expect, it } from 'vitest';
import { V0_PLACEHOLDER } from './index.ts';
import { isPlaceholder, parseRuleset, type Ruleset, resolveParams } from './ruleset.ts';

/**
 * `resolveParams` es el mecanismo por el que el ruleset ajusta la
 * prescripción por nivel de experiencia (rule dura 2 de CLAUDE.md: ningún
 * número de entrenamiento vive en el código). No tenía ningún test directo
 * ni indirecto — un bug acá rompería en silencio la personalización por
 * nivel sin que nada lo detecte.
 */
describe('resolveParams', () => {
  it('sin override de nivel, devuelve el default del objetivo', () => {
    const params = resolveParams(V0_PLACEHOLDER, 'hypertrophy', 'advanced');
    expect(params).toEqual(V0_PLACEHOLDER.prescription.hypertrophy?.default);
  });

  it('con override parcial, pisa solo los bloques que nombra y hereda el resto del default', () => {
    const params = resolveParams(V0_PLACEHOLDER, 'hypertrophy', 'beginner');
    const block = V0_PLACEHOLDER.prescription.hypertrophy;
    const override = block?.byLevel?.beginner;
    expect(override?.primary).toBeDefined();

    // Los bloques que el override nombra ganan...
    expect(params.primary).toEqual(override?.primary);
    expect(params.secondary).toEqual(override?.secondary);
    expect(params.progression).toEqual(override?.progression);
    // ...los que NO nombra (regression, deload) caen al default, no quedan undefined.
    expect(override?.regression).toBeUndefined();
    expect(override?.deload).toBeUndefined();
    expect(params.regression).toEqual(block?.default.regression);
    expect(params.deload).toEqual(block?.default.deload);
  });

  it('un nivel sin byLevel definido cae entero al default', () => {
    const params = resolveParams(V0_PLACEHOLDER, 'strength', 'novice');
    expect(params).toEqual(V0_PLACEHOLDER.prescription.strength?.default);
  });

  it('tira error si el ruleset no define el objetivo pedido, en vez de inventar una prescripción', () => {
    // Objeto deliberadamente inválido (sin todos los objetivos): el runtime
    // check es justamente lo que se prueba acá, no la forma en TS.
    const stripped = { ...V0_PLACEHOLDER, prescription: {} } as unknown as Ruleset;
    expect(() => resolveParams(stripped, 'hypertrophy', 'beginner')).toThrow(/hypertrophy/);
  });
});

describe('parseRuleset / isPlaceholder', () => {
  it('acepta el ruleset placeholder real tal cual está en el repo', () => {
    expect(() => parseRuleset(V0_PLACEHOLDER)).not.toThrow();
  });

  it('rechaza un ruleset que no cumple el esquema', () => {
    expect(() => parseRuleset({ version: 'x' })).toThrow();
  });

  it('isPlaceholder distingue source', () => {
    expect(isPlaceholder(V0_PLACEHOLDER)).toBe(true);
    expect(isPlaceholder({ ...V0_PLACEHOLDER, source: 'research' })).toBe(false);
  });
});
