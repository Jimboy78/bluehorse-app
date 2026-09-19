import type { MatchDayState } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { V1_RESEARCH } from './index.ts';
import { estadoDelDia, excepcionesParaEstado, type PartidosDelSocio } from './partido.ts';
import type { Ruleset } from './ruleset.ts';

// El 19/09/2026 es sábado (ISO 6); el 20 domingo (7); el 21 lunes (1).
const SABADO = 6;
const estado = (hoy: string, partidos: PartidosDelSocio, ruleset: Ruleset = V1_RESEARCH) =>
  estadoDelDia({ ruleset, hoy, partidos });
type Reglas = NonNullable<NonNullable<Ruleset['sports']>['matchDay']>;
function reglasDelDia(): Reglas {
  const r = V1_RESEARCH.sports?.matchDay;
  if (!r) throw new Error('el ruleset no trae matchDay');
  return r;
}
function conReglas(matchDay: Reglas): Ruleset {
  const sports = V1_RESEARCH.sports;
  if (!sports) throw new Error('el ruleset no trae sports');
  return { ...V1_RESEARCH, sports: { ...sports, matchDay } };
}

const fijo = (matchWeekday: number | null, excepciones: PartidosDelSocio['excepciones'] = []) => ({
  matchWeekday,
  excepciones,
});

describe('estadoDelDia (`docs/research/65`)', () => {
  it('el ruleset declara la distancia al partido de cada estado, y el normal no tiene', () => {
    const reglas = reglasDelDia();
    expect(reglas.normal.daysFromMatch).toBeNull();
    const conDistancia = Object.values(reglas).filter((r) => r.daysFromMatch !== null);
    expect(conDistancia.length).toBe(4);
    const distancias = conDistancia.map((r) => r.daysFromMatch);
    expect(new Set(distancias).size).toBe(distancias.length);
  });

  it('con partido fijo los sábados, la semana entera sale de la fecha', () => {
    const semana: [string, MatchDayState][] = [
      ['2026-09-14', 'two_days_after'], // lunes: el sábado 12 también se jugó
      ['2026-09-15', 'normal'],
      ['2026-09-16', 'normal'],
      ['2026-09-17', 'normal'], // jueves
      ['2026-09-18', 'day_before'], // viernes
      ['2026-09-19', 'match_day'], // sábado
      ['2026-09-20', 'day_after'], // domingo
      ['2026-09-21', 'two_days_after'], // lunes
      ['2026-09-22', 'normal'],
    ];
    for (const [hoy, esperado] of semana) expect(estado(hoy, fijo(SABADO)), hoy).toBe(esperado);
  });

  it('sin partido fijo ni excepciones, siempre normal', () => {
    for (const hoy of ['2026-09-18', '2026-09-19', '2026-09-20']) {
      expect(estado(hoy, fijo(null))).toBe('normal');
    }
  });

  it('una semana que no se juega saca el partido fijo y todo lo que colgaba de él', () => {
    const sinPartido = fijo(SABADO, [{ day: '2026-09-19', plays: false }]);
    for (const hoy of ['2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21']) {
      expect(estado(hoy, sinPartido), hoy).toBe('normal');
    }
    // La semana siguiente vuelve el fijo.
    expect(estado('2026-09-26', sinPartido)).toBe('match_day');
  });

  it('un partido corrido al domingo corre todos los estados con una sola corrección', () => {
    const corrido = fijo(SABADO, [
      { day: '2026-09-19', plays: false },
      { day: '2026-09-20', plays: true },
    ]);
    expect(estado('2026-09-18', corrido)).toBe('normal');
    expect(estado('2026-09-19', corrido)).toBe('day_before');
    expect(estado('2026-09-20', corrido)).toBe('match_day');
    expect(estado('2026-09-21', corrido)).toBe('day_after');
    expect(estado('2026-09-22', corrido)).toBe('two_days_after');
  });

  it('quien no tiene partido fijo declara el día y sale igual', () => {
    const suelto = fijo(null, [{ day: '2026-09-17', plays: true }]);
    expect(estado('2026-09-16', suelto)).toBe('day_before');
    expect(estado('2026-09-18', suelto)).toBe('day_after');
  });

  it('dos partidos cerca: gana el estado más restrictivo', () => {
    // Juega el sábado y el lunes: el domingo es "jugué ayer" y "juego mañana".
    const dos = fijo(SABADO, [{ day: '2026-09-21', plays: true }]);
    const reglas = reglasDelDia();
    const despues = reglas.day_after;
    const antes = reglas.day_before;
    const esperado =
      despues.lowerBodyVolumeMultiplier < antes.lowerBodyVolumeMultiplier ||
      (despues.lowerBodyVolumeMultiplier === antes.lowerBodyVolumeMultiplier &&
        despues.upperBodyVolumeMultiplier <= antes.upperBodyVolumeMultiplier)
        ? 'day_after'
        : 'day_before';
    // Hoy empatan en todo, y el empate va para "jugué ayer": el daño medido es el del partido.
    expect(estado('2026-09-20', dos)).toBe(esperado);
    // Y el día de un partido es el día del partido aunque ayer también se haya jugado.
    expect(estado('2026-09-21', dos)).toBe('match_day');
  });

  it('el desempate no depende del orden del ruleset', () => {
    const alReves = conReglas(
      Object.fromEntries(Object.entries(reglasDelDia()).reverse()) as Reglas,
    );
    const dos = fijo(SABADO, [{ day: '2026-09-21', plays: true }]);
    expect(estado('2026-09-20', dos, alReves)).toBe(estado('2026-09-20', dos));
  });

  it('las distancias salen del ruleset, no del código', () => {
    const reglas = reglasDelDia();
    const corrido = conReglas({
      ...reglas,
      day_before: { ...reglas.day_before, daysFromMatch: -2 },
    });
    // Con "juego mañana" a dos días, el jueves antes del sábado ya es day_before.
    expect(estado('2026-09-17', fijo(SABADO), corrido)).toBe('day_before');
    expect(estado('2026-09-18', fijo(SABADO), corrido)).toBe('normal');
  });

  it('corregir el día: lo que se declara hace que hoy sea el estado elegido', () => {
    const estados = Object.keys(reglasDelDia()) as MatchDayState[];
    let mirados = 0;
    for (const matchWeekday of [null, 1, 3, 6, 7]) {
      for (const hoy of ['2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20', '2026-09-21']) {
        for (const elegido of estados) {
          mirados += 1;
          const excepciones = excepcionesParaEstado({
            ruleset: V1_RESEARCH,
            hoy,
            matchWeekday,
            estado: elegido,
          }).flatMap((e) => (e.plays === null ? [] : [{ day: e.day, plays: e.plays }]));
          expect(
            estado(hoy, { matchWeekday, excepciones }),
            `${matchWeekday}/${hoy}/${elegido}`,
          ).toBe(elegido);
        }
      }
    }
    expect(mirados).toBeGreaterThan(100);
  });

  it('elegir lo que ya dice el día fijo no declara nada', () => {
    // Sábado fijo y hoy viernes: "juego mañana" ya es lo que sale solo.
    const cambios = excepcionesParaEstado({
      ruleset: V1_RESEARCH,
      hoy: '2026-09-18',
      matchWeekday: SABADO,
      estado: 'day_before',
    });
    expect(cambios.length).toBeGreaterThan(0);
    expect(cambios.every((c) => c.plays === null)).toBe(true);
  });
});
