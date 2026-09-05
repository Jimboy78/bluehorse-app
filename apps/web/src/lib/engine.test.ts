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
  it('el ruleset activo hoy es el placeholder', () => {
    expect(activeRuleset.source).toBe('placeholder');
    expect(showsPlaceholderContent).toBe(true);
  });
});
