import type { MatchDayState } from '@bh/domain';
import type { Ruleset } from './ruleset.ts';

/**
 * EL MOMENTO DEL PARTIDO, DEDUCIDO DE LA FECHA (`docs/research/65`)
 *
 * El socio declara un día fijo de partido (`user_goals.match_weekday`, ISO: 1
 * lunes … 7 domingo) y, cuando una semana cambia, la excepción de ese día
 * (`match_exceptions`): un partido que no es el fijo, o un fijo que no se
 * juega. De ahí y de la fecha de hoy sale el estado que ajusta la sesión
 * (`adjustSession`).
 *
 * Puro: la fecha llega como parámetro, en el día del gimnasio (`YYYY-MM-DD`).
 */

export interface PartidosDelSocio {
  /** 1 lunes … 7 domingo; `null` sin partido fijo. */
  readonly matchWeekday: number | null;
  /** Los días que se apartan del fijo: `plays` true suma un partido, false lo saca. */
  readonly excepciones: readonly { readonly day: string; readonly plays: boolean }[];
}

const DIA_MS = 86_400_000;

function aUtc(dia: string): number {
  const [y, m, d] = dia.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

function correrDias(dia: string, dias: number): string {
  return new Date(aUtc(dia) + dias * DIA_MS).toISOString().slice(0, 10);
}

/** 1 lunes … 7 domingo, sin depender de la zona de quien corre el código. */
function diaIso(dia: string): number {
  const d = new Date(aUtc(dia)).getUTCDay();
  return d === 0 ? 7 : d;
}

/** Si ese día hay partido: lo que diga la excepción, y si no hay, el día fijo. */
function juegaEse(dia: string, partidos: PartidosDelSocio): boolean {
  const excepcion = partidos.excepciones.find((e) => e.day === dia);
  if (excepcion) return excepcion.plays;
  return partidos.matchWeekday !== null && diaIso(dia) === partidos.matchWeekday;
}

/**
 * El estado de hoy. Cada estado del ruleset con `daysFromMatch` mira si hubo
 * (o hay) partido a esa distancia; si varios coinciden —dos partidos en la
 * semana—, gana el más restrictivo: el que menos deja en la pierna, después
 * arriba, después el que saca lo explosivo. Sin ninguno, el día normal.
 */
export function estadoDelDia(input: {
  readonly ruleset: Ruleset;
  readonly hoy: string;
  readonly partidos: PartidosDelSocio;
}): MatchDayState {
  const reglas = input.ruleset.sports?.matchDay;
  if (!reglas) return 'normal';
  const candidatos = (Object.entries(reglas) as [MatchDayState, Regla][])
    .filter(([, r]) => r.daysFromMatch !== null)
    .filter(([, r]) => juegaEse(correrDias(input.hoy, -(r.daysFromMatch ?? 0)), input.partidos))
    .sort(([, a], [, b]) => masRestrictivo(a, b));
  return candidatos[0]?.[0] ?? 'normal';
}

/**
 * Lo que hay que declarar para que hoy sea `estado` (`docs/research/65`): cada
 * día que miran los estados queda con partido solo si es el del estado
 * elegido. `plays: null` es "sin excepción": ese día ya es lo que tiene que ser
 * por el día fijo, y la excepción que hubiera se borra. Así una corrección
 * nunca deja una excepción de más que la semana siguiente haya que deshacer.
 */
export function excepcionesParaEstado(input: {
  readonly ruleset: Ruleset;
  readonly hoy: string;
  readonly matchWeekday: number | null;
  readonly estado: MatchDayState;
}): readonly { readonly day: string; readonly plays: boolean | null }[] {
  const reglas = input.ruleset.sports?.matchDay;
  if (!reglas) return [];
  const distancias = Object.values(reglas)
    .map((r) => r.daysFromMatch)
    .filter((d): d is number => d !== null);
  const elegida = reglas[input.estado].daysFromMatch;
  const fijo: PartidosDelSocio = { matchWeekday: input.matchWeekday, excepciones: [] };
  return [...new Set(distancias)]
    .sort((a, b) => b - a)
    .map((d) => {
      const day = correrDias(input.hoy, -d);
      const quiere = d === elegida;
      return { day, plays: quiere === juegaEse(day, fijo) ? null : quiere };
    });
}

type Regla = NonNullable<NonNullable<Ruleset['sports']>['matchDay']>[MatchDayState];

/**
 * Primero el que menos deja en la pierna, después arriba, después el que saca
 * lo explosivo. Si empatan en todo ("jugué ayer" y "juego mañana" piden lo
 * mismo), el más cercano al partido, y entre dos igual de cerca el de después:
 * el daño medido es el que deja el partido, no el que viene (`07`). Así el
 * resultado no depende del orden en que el ruleset declare los estados.
 */
function masRestrictivo(a: Regla, b: Regla): number {
  const da = a.daysFromMatch ?? 0;
  const db = b.daysFromMatch ?? 0;
  return (
    a.lowerBodyVolumeMultiplier - b.lowerBodyVolumeMultiplier ||
    a.upperBodyVolumeMultiplier - b.upperBodyVolumeMultiplier ||
    Number(b.avoidExplosive) - Number(a.avoidExplosive) ||
    Math.abs(da) - Math.abs(db) ||
    db - da
  );
}
