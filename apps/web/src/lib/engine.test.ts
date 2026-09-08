import { describe, expect, it } from 'vitest';
import { activeRuleset, engineContext, showsPlaceholderContent } from './engine.ts';

describe('engineContext', () => {
  it('la misma persona siempre saca la misma semilla — el plan tiene que ser reproducible', () => {
    const a = engineContext('usuario-1');
    const b = engineContext('usuario-1');
    expect(a.seed).toBe(b.seed);
  });

  it('personas distintas sacan semillas distintas', () => {
    const a = engineContext('usuario-1');
    const b = engineContext('usuario-2');
    expect(a.seed).not.toBe(b.seed);
  });

  it('la semilla es siempre un entero no negativo', () => {
    for (const id of ['a', 'usuario-largo-con-guiones-y-números-123', '', '🐴']) {
      const { seed } = engineContext(id);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
    }
  });

  it('usa el `now` que se le pasa en vez de leer el reloj del sistema', () => {
    const fixed = new Date('2026-01-01T00:00:00.000Z');
    expect(engineContext('usuario-1', fixed).now).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('activeRuleset / showsPlaceholderContent', () => {
  it('el ruleset activo sale de la investigación, no del placeholder', () => {
    expect(activeRuleset.source).toBe('research');
    expect(showsPlaceholderContent).toBe(false);
  });

  it('trae el bloque de seguridad: sin él la app no puede hacer el cribado', () => {
    expect(activeRuleset.safety?.screening.questions.length).toBeGreaterThan(0);
    expect(activeRuleset.safety?.painRules.length).toBeGreaterThan(0);
    expect(activeRuleset.safety?.disclaimer).toBeTruthy();
  });

  it('cubre los seis objetivos, cada uno con su nivel de confianza declarado', () => {
    for (const goal of [
      'strength',
      'hypertrophy',
      'power',
      'cardio',
      'endurance',
      'recomposition',
    ] as const) {
      expect(activeRuleset.prescription[goal]?.confidence).toBeTruthy();
    }
  });

  it('los bloques de evidencia floja explican por qué lo son', () => {
    // Mostrar una fila de confianza BAJA con la misma cara que una ALTA sería
    // mentir por omisión. Si es floja, tiene que decir en qué.
    for (const block of Object.values(activeRuleset.prescription)) {
      if (block?.confidence === 'low') expect(block.confidenceNote).toBeTruthy();
    }
  });

  it('el cardio se prescribe por zonas, no forzado a series y repeticiones', () => {
    expect(activeRuleset.cardio?.zones.length).toBeGreaterThan(0);
    expect(activeRuleset.cardio?.sessions.length).toBeGreaterThan(0);
  });
});
