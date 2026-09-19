import { describe, expect, it } from 'vitest';
import { activeRuleset } from './engine.ts';
import { ETAPAS, pideDiaDePartido, temporadaYDia, tienePartidos } from './partido.ts';

describe('el día de partido se pide solo donde hay partidos (`docs/research/65`)', () => {
  const sports = activeRuleset.sports;
  if (!sports) throw new Error('el ruleset no trae deportes');

  it('tiene partidos lo que la categoría del ruleset dice, y nada más', () => {
    let con = 0;
    for (const s of sports.catalog) {
      const esperado = sports.categories[s.category]?.hasMatches === true;
      expect(tienePartidos(s.id), s.id).toBe(esperado);
      if (esperado) con += 1;
    }
    expect(con).toBeGreaterThan(0);
    expect(con).toBeLessThan(sports.catalog.length);
    expect(tienePartidos(null)).toBe(false);
    expect(tienePartidos('quidditch')).toBe(false);
  });

  it('se pide solo en temporada', () => {
    expect(pideDiaDePartido('futbol', 'in_season')).toBe(true);
    for (const fase of ['preseason', 'off_season', 'none'] as const) {
      expect(pideDiaDePartido('futbol', fase), fase).toBe(false);
    }
    expect(pideDiaDePartido('running', 'in_season')).toBe(false);
  });

  it('las etapas llevan el nombre del ruleset', () => {
    expect(ETAPAS.find((e) => e.id === 'in_season')?.label).toBe(
      sports.seasonPhases.in_season.label,
    );
  });

  it('limpia lo que no corresponde guardar', () => {
    expect(temporadaYDia({ sport: null, seasonPhase: 'in_season', matchWeekday: 6 })).toEqual({
      seasonPhase: 'none',
      matchWeekday: null,
    });
    expect(temporadaYDia({ sport: 'futbol', seasonPhase: undefined, matchWeekday: 6 })).toEqual({
      seasonPhase: 'none',
      matchWeekday: null,
    });
    expect(temporadaYDia({ sport: 'futbol', seasonPhase: 'in_season', matchWeekday: 6 })).toEqual({
      seasonPhase: 'in_season',
      matchWeekday: 6,
    });
  });
});
