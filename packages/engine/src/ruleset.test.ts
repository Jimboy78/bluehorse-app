import { describe, expect, it } from 'vitest';
import { V0_PLACEHOLDER, V1_RESEARCH } from './index.ts';
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

/**
 * El contrato que sostiene el aviso de evidencia en pantalla: un bloque que no
 * es `high` tiene algo que explicar, y si no lo trae escrito el socio se queda
 * sin saberlo. Ver `docs/research/12-objetivo.md`.
 */
describe('notas de confianza por objetivo', () => {
  it('todo bloque que no sea de confianza alta trae su nota', () => {
    const sinNota = Object.entries(V1_RESEARCH.prescription)
      .filter(([, block]) => block !== undefined && block.confidence !== 'high')
      .filter(([, block]) => !block?.confidenceNote)
      .map(([goal]) => goal);

    expect(sinNota).toEqual([]);
  });

  // Se escribieron a propósito y un `!== 'low'` las escondía.
  it('las notas de los bloques medios existen y no están vacías', () => {
    for (const goal of ['cardio', 'recomposition'] as const) {
      const block = V1_RESEARCH.prescription[goal];
      expect(block?.confidence).toBe('medium');
      expect(block?.confidenceNote?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('un bloque de confianza alta no necesita nota', () => {
    expect(V1_RESEARCH.prescription.strength?.confidence).toBe('high');
  });
});

/**
 * LA PAUSA DEL QUE RECIÉN EMPIEZA (`docs/research/60`)
 *
 * El principiante descansaba más que el intermedio (210 s contra 180 en el
 * principal de fuerza) por un "×1,2" que `04` le atribuía a ACSM 2009, y ACSM
 * no dice eso. Grgic 2017 (23 estudios): en no entrenados alcanzan 60-120 s.
 * Singer 2024: en hipertrofia no se ve diferencia pasando de 90 s.
 */
describe('la pausa del principiante', () => {
  const slots = ['primary', 'secondary', 'isolation'] as const;
  const pausasDe = (goal: 'strength' | 'hypertrophy' | 'recomposition') => {
    const p = resolveParams(V1_RESEARCH, goal, 'beginner');
    return slots.map((s) => p[s].restSeconds);
  };

  // Solo en los multiarticulares, que es por donde entraba el ×1,2. El aislado
  // de hipertrofia queda en 90 s por decisión del dueño (19/09/2026: "90 s en
  // todos"), arriba de los 60 del nivel por defecto y dentro de lo que Singer
  // 2024 todavía ve rendir.
  it('en los multiarticulares nunca es más larga que la del nivel por defecto', () => {
    for (const goal of Object.keys(V1_RESEARCH.prescription) as (keyof Ruleset['prescription'])[]) {
      const base = V1_RESEARCH.prescription[goal]?.default;
      if (!base) continue;
      const principiante = resolveParams(V1_RESEARCH, goal, 'beginner');
      for (const s of ['primary', 'secondary'] as const) {
        expect(principiante[s].restSeconds, `${goal}.${s}`).toBeLessThanOrEqual(
          base[s].restSeconds,
        );
      }
    }
  });

  it('en fuerza queda en lo que alcanza a quien no entrenó (Grgic 2017: 60-120 s)', () => {
    for (const pausa of pausasDe('strength')) expect(pausa).toBeLessThanOrEqual(120);
  });

  it('en hipertrofia y recomposición no pasa de 90 s (Singer 2024)', () => {
    for (const pausa of [...pausasDe('hypertrophy'), ...pausasDe('recomposition')]) {
      expect(pausa).toBeLessThanOrEqual(90);
    }
  });
});
