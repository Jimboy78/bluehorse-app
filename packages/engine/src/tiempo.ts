import type { Equipment, Exercise, ExperienceLevel, Id, MuscleGroup } from '@bh/domain';
import { esDeBloque } from './contexto.ts';
import type { SessionItemBlueprint } from './contract.ts';
import type { Ruleset, SlotRole } from './ruleset.ts';

/**
 * LOS MINUTOS ARMAN LA SESIÓN (`docs/research/59`)
 *
 * Hasta acá el motor armaba la misma sesión declararas 15 minutos o 120, y solo
 * avisaba. Medido: las sesiones iban de 21 a 74 minutos según objetivo, nivel y
 * edad, y la sensibilidad de los minutos en el barrido era 0 %.
 *
 * Se estima cuánto dura cada sesión con lo que tardaron sesiones reales y, si no
 * entra, se achica en el orden que decidió el dueño: pausa, pares, aislados,
 * series y, recién al final, los bloques de contexto. Lo que se mantiene siempre
 * son los multiarticulares: es el mínimo de Iversen 2021.
 */

export type TimeConfig = NonNullable<Ruleset['sessionTime']>;
type Cambio = keyof TimeConfig['changes'];

/**
 * El orden en que se recorta, decidido por el dueño (19/09/2026): primero lo
 * que no cambia el estímulo (pausa, pares), después lo accesorio y al final el
 * volumen. El cardio continuo, recién después de las series (T4c, `61`): es la
 * dosis del objetivo cardio, y su piso es semanal. Los bloques del contexto van
 * últimos: los puso una razón del socio.
 */
const ORDEN: readonly Cambio[] = ['rest', 'pairs', 'isolation', 'sets', 'cardio', 'blocks'];

/** Cuánto dura una sesión, en segundos: cada serie más su pausa. */
export function segundosDeSesion(
  items: readonly SessionItemBlueprint[],
  cfg: TimeConfig | undefined,
): number {
  return items.reduce((total, i) => {
    const trabajo = i.targetDurationSeconds ?? cfg?.secondsPerSet ?? 0;
    const pausa = i.targetIntervalRestSeconds ?? i.restSeconds;
    return total + i.targetSets * (trabajo + pausa);
  }, 0);
}

export interface SesionAAjustar {
  readonly label: string;
  readonly items: readonly SessionItemBlueprint[];
  /** El rol de cada ejercicio que entró por un slot de la plantilla. */
  readonly roles: ReadonlyMap<Id, SlotRole>;
}

interface AjusteDeTiempo {
  readonly sesiones: SessionItemBlueprint[][];
  readonly cambios: readonly Cambio[];
  /** Las que aun achicadas no entran, con su duración estimada en minutos. */
  readonly excedidas: readonly { readonly label: string; readonly minutos: number }[];
}

interface Entrada {
  readonly sesiones: readonly SesionAAjustar[];
  readonly cfg: TimeConfig;
  readonly minutos: number;
  readonly level: ExperienceLevel;
  /**
   * Cuántas veces sale cada sesión de la plantilla en la semana que mide el
   * aviso de volumen. Con menos días que sesiones, el promedio de la rotación:
   * con una vez por semana y dos sesiones, 0,5.
   */
  readonly vecesPorSemana: readonly number[];
  /** Las series semanales mínimas del objetivo (`weeklyVolume.minSetsPerMuscle`). */
  readonly pisoSemanal: number;
  readonly exerciseById: ReadonlyMap<Id, Exercise>;
  readonly equipmentById: ReadonlyMap<Id, Equipment>;
}

type Item = SessionItemBlueprint;

/** Un ítem de fuerza común: ni del bloque, ni del par explosivo, ni por tiempo. */
function esDeFuerza(item: Item, exercise: Exercise | undefined): boolean {
  if (!exercise || item.targetDurationSeconds !== null) return false;
  if (esDeBloque(exercise)) return false;
  return !exercise.isExplosive;
}

/** Del par explosivo (`docs/research/37`): tiene su propia pausa, medida. */
function esDelParExplosivo(item: Item, items: readonly Item[], byId: Entrada['exerciseById']) {
  if (item.supersetGroup === null) return false;
  return items.some(
    (o) => o.supersetGroup === item.supersetGroup && byId.get(o.exerciseId)?.isExplosive === true,
  );
}

/**
 * Ajusta todas las sesiones de la plantilla a los minutos declarados.
 *
 * Cada paso corre sobre **todas** las sesiones antes del siguiente. Las series
 * se cuentan por semana, y si una sesión llegaba a bajar series antes de que
 * otra sacara sus aislados, contaba series que después se iban: medido en el
 * barrido, la sentadilla quedaba en 1 serie semanal porque la sesión A contó
 * los aductores de la B.
 */
export function ajustarAlTiempo(e: Entrada): AjusteDeTiempo {
  const limite = e.minutos * 60;
  const cabe = (items: readonly Item[]) => segundosDeSesion(items, e.cfg) <= limite;
  const cambios = new Set<Cambio>();
  const semanal = seriesPorSemana(e);
  const sesiones = e.sesiones.map((s) => [...s.items]);

  const pasos: Record<Cambio, (xs: Item[], k: number) => Item[]> = {
    rest: (xs) => acortarPausas(xs, e),
    pairs: (xs) => juntarDeADos(xs, e, cabe),
    isolation: (xs, k) => sacarAislados(xs, e, cabe, semanal, e.vecesPorSemana[k] ?? 1),
    sets: (xs, k) =>
      sacarSeries(
        xs,
        e.sesiones[k]?.roles ?? new Map(),
        e,
        cabe,
        semanal,
        e.vecesPorSemana[k] ?? 1,
      ),
    cardio: (xs) => acortarCardio(xs, limite, e.cfg),
    blocks: (xs) => achicarBloques(xs, e, cabe),
  };
  for (const cambio of ORDEN) {
    sesiones.forEach((items, k) => {
      if (cabe(items)) return;
      const antes = JSON.stringify(items);
      const despues = pasos[cambio](items, k);
      sesiones[k] = despues;
      if (JSON.stringify(despues) !== antes) cambios.add(cambio);
    });
  }

  const excedidas = sesiones.flatMap((items, k) => {
    const seg = segundosDeSesion(items, e.cfg);
    const label = e.sesiones[k]?.label ?? '';
    return seg > limite ? [{ label, minutos: Math.ceil(seg / 60) }] : [];
  });
  return {
    sesiones: sesiones.map((items) =>
      items.map((it, i) => (it.orderIndex === i ? it : { ...it, orderIndex: i })),
    ),
    cambios: ORDEN.filter((c) => cambios.has(c)),
    excedidas,
  };
}

// ------------------------------------------------------------------ 1. pausa

/**
 * La pausa baja hasta el piso del nivel, nunca sube. Solo en la fuerza que se
 * regula por RIR: la potencia se regula por la calidad de cada repetición y el
 * par explosivo tiene su pausa medida (Freitas 2017).
 */
function acortarPausas(items: Item[], e: Entrada): Item[] {
  const piso = e.cfg.restFloorSeconds[e.level];
  if (piso === undefined) return items;
  return items.map((it) => {
    const ex = e.exerciseById.get(it.exerciseId);
    if (!esDeFuerza(it, ex) || it.targetRir === null || it.supersetGroup !== null) return it;
    return it.restSeconds > piso ? { ...it, restSeconds: piso } : it;
  });
}

// ------------------------------------------------------------------ 2. de a dos

function puedeIrDeADos(it: Item, e: Entrada): boolean {
  const ex = e.exerciseById.get(it.exerciseId);
  // Ya de a dos, incluido el par explosivo: ese tiene su pausa medida (`37`).
  if (!ex || !esDeFuerza(it, ex) || it.supersetGroup !== null) return false;
  // Iversen 2021: no con los multiarticulares de peso libre, sea cual sea su
  // lugar en la sesión. Un remo con barra de secundario también es pesado.
  const categoria = it.equipmentId ? e.equipmentById.get(it.equipmentId)?.category : undefined;
  return !(ex.isCompound && categoria !== undefined && e.cfg.noPairEquipment.includes(categoria));
}

function sinMusculoEnComun(a: Exercise, b: Exercise): boolean {
  return !a.primaryMuscles.some((m) => b.primaryMuscles.includes(m));
}

/** El próximo par: primero antagonistas, después cualquiera sin músculo en común. */
function proximoPar(items: readonly Item[], e: Entrada): readonly [number, number] | null {
  const libres = items
    .map((it, i) => ({ it, i, ex: e.exerciseById.get(it.exerciseId) }))
    .filter((x) => x.ex && puedeIrDeADos(x.it, e));
  const pares: [number, number][] = [];
  for (const a of libres) {
    for (const b of libres) {
      if (b.i <= a.i || !a.ex || !b.ex || !sinMusculoEnComun(a.ex, b.ex)) continue;
      pares.push([a.i, b.i]);
    }
  }
  const esAntagonista = ([a, b]: [number, number]) => {
    const pa = e.exerciseById.get(items[a]?.exerciseId ?? '')?.pattern;
    const pb = e.exerciseById.get(items[b]?.exerciseId ?? '')?.pattern;
    return e.cfg.antagonists.some(([x, y]) => (pa === x && pb === y) || (pa === y && pb === x));
  };
  return pares.find(esAntagonista) ?? pares[0] ?? null;
}

/**
 * De a dos, una serie de cada uno sin pausa y la pausa al cerrar la vuelta
 * (Iversen 2021). El segundo se corre al lado del primero.
 */
function juntarDeADos(items: Item[], e: Entrada, cabe: (xs: readonly Item[]) => boolean): Item[] {
  let out = items;
  let grupo = Math.max(0, ...out.map((i) => i.supersetGroup ?? 0));
  while (!cabe(out)) {
    const par = proximoPar(out, e);
    if (!par) break;
    const [ia, ib] = par;
    const a = out[ia];
    const b = out[ib];
    if (!a || !b) break;
    grupo += 1;
    const primero = { ...a, restSeconds: e.cfg.pairIntraRestSeconds, supersetGroup: grupo };
    const segundo = {
      ...b,
      restSeconds: Math.max(a.restSeconds, b.restSeconds),
      supersetGroup: grupo,
    };
    const resto = out.filter((_, i) => i !== ia && i !== ib);
    const donde = out.slice(0, ia).filter((_, i) => i !== ib).length;
    out = [...resto.slice(0, donde), primero, segundo, ...resto.slice(donde)];
  }
  return out;
}

/** Sacar un ítem; si iba de a dos, el compañero vuelve a ir solo con la pausa de la vuelta. */
function sacar(items: readonly Item[], i: number): Item[] {
  const it = items[i];
  if (!it) return [...items];
  return items
    .filter((_, j) => j !== i)
    .map((o) =>
      it.supersetGroup !== null && o.supersetGroup === it.supersetGroup
        ? { ...o, supersetGroup: null, restSeconds: Math.max(o.restSeconds, it.restSeconds) }
        : o,
    );
}

// ------------------------------------------------------------------ 3. aislados

function sacarAislados(
  items: Item[],
  e: Entrada,
  cabe: (xs: readonly Item[]) => boolean,
  semanal: Map<MuscleGroup, number>,
  veces: number,
): Item[] {
  let out = items;
  for (let i = out.length - 1; i >= 0 && !cabe(out); i--) {
    const it = out[i];
    const ex = it ? e.exerciseById.get(it.exerciseId) : undefined;
    if (!it || !ex || !esDeFuerza(it, ex) || ex.isCompound) continue;
    if (esDelParExplosivo(it, out, e.exerciseById)) continue;
    descontar(semanal, ex.primaryMuscles, it.targetSets * veces);
    out = sacar(out, i);
  }
  return out;
}

// ------------------------------------------------------------------ 4. series

/** Las series de fuerza por músculo en una semana, como las cuenta el aviso de volumen. */
/**
 * Series por semana de cada músculo principal. Cuando se llega a bajar series
 * ya no quedan aislados en esa sesión (el paso 3 los saca todos antes), así
 * que el piso siempre cae sobre músculos que el plan trabaja con
 * multiarticulares: los mismos que mira el aviso de volumen.
 */
function seriesPorSemana(e: Entrada): Map<MuscleGroup, number> {
  const out = new Map<MuscleGroup, number>();
  e.sesiones.forEach((s, k) => {
    const veces = e.vecesPorSemana[k] ?? 1;
    for (const it of s.items) {
      const ex = e.exerciseById.get(it.exerciseId);
      if (!esDeFuerza(it, ex) || !ex) continue;
      for (const m of ex.primaryMuscles) out.set(m, (out.get(m) ?? 0) + it.targetSets * veces);
    }
  });
  return out;
}

function descontar(semanal: Map<MuscleGroup, number>, muscles: readonly MuscleGroup[], n: number) {
  for (const m of muscles) semanal.set(m, (semanal.get(m) ?? 0) - n);
}

/**
 * De a una serie: primero al que más tiene, y entre iguales al secundario. Sacar
 * primero de los secundarios dejaba 5 series de sentadilla y 1 de remo. No baja
 * de una serie ni deja un músculo por debajo del mínimo semanal.
 */
function sacarSeries(
  items: Item[],
  roles: SesionAAjustar['roles'],
  e: Entrada,
  cabe: (xs: readonly Item[]) => boolean,
  semanal: Map<MuscleGroup, number>,
  veces: number,
): Item[] {
  const out = [...items];
  const peso = (r: SlotRole | undefined) => (r === 'primary' ? 1 : 0);
  while (!cabe(out)) {
    const candidatos = out
      .map((it, i) => ({ it, i, ex: e.exerciseById.get(it.exerciseId) }))
      .filter(({ it, ex }) => {
        if (!ex || !esDeFuerza(it, ex) || it.targetSets <= 1) return false;
        if (esDelParExplosivo(it, out, e.exerciseById)) return false;
        return ex.primaryMuscles.every((m) => (semanal.get(m) ?? 0) - veces >= e.pisoSemanal);
      })
      .sort(
        (a, b) =>
          b.it.targetSets - a.it.targetSets ||
          peso(roles.get(a.it.exerciseId)) - peso(roles.get(b.it.exerciseId)) ||
          b.i - a.i,
      );
    const elegido = candidatos[0];
    if (!elegido?.ex) break;
    out[elegido.i] = { ...elegido.it, targetSets: elegido.it.targetSets - 1 };
    descontar(semanal, elegido.ex.primaryMuscles, veces);
  }
  return out;
}

// ------------------------------------------------------------------ 5. cardio

/** Un tramo continuo: una sola serie por tiempo, sin vueltas. */
export function esContinuo(item: Item): boolean {
  return item.targetDurationSeconds !== null && item.targetIntervalRestSeconds === null;
}

/**
 * El cardio continuo se acorta a lo que queda de la sesión, en minutos
 * enteros. No tiene piso por sesión: para la salud cualquier tramo suma
 * (Jakicic 2019), y lo que se pierde se mira en la semana (`weeklyMinimum`).
 * Nunca baja de un minuto: un tramo de cero no es cardio, es sacarlo.
 */
function acortarCardio(items: Item[], limite: number, cfg: TimeConfig): Item[] {
  const out = [...items];
  for (let i = out.length - 1; i >= 0; i--) {
    const it = out[i];
    if (!it || !esContinuo(it) || it.targetDurationSeconds === null) continue;
    const resto = segundosDeSesion(
      out.filter((_, j) => j !== i),
      cfg,
    );
    const minutos = Math.max(1, Math.floor((limite - resto) / 60));
    if (minutos * 60 < it.targetDurationSeconds) {
      out[i] = { ...it, targetDurationSeconds: minutos * 60 };
    }
  }
  return out;
}

// ------------------------------------------------------------------ 6. bloques

/**
 * Lo último: primero el explosivo del par (el levantamiento queda solo, con la
 * pausa de la vuelta), después los ejercicios de bloque de más, desde el final.
 * De cada bloque queda siempre uno.
 */
function achicarBloques(items: Item[], e: Entrada, cabe: (xs: readonly Item[]) => boolean): Item[] {
  let out = items;
  for (let i = out.length - 1; i >= 0 && !cabe(out); i--) {
    const ex = e.exerciseById.get(out[i]?.exerciseId ?? '');
    if (ex?.isExplosive && out[i]?.supersetGroup !== null) out = sacar(out, i);
  }
  for (let i = out.length - 1; i >= 0 && !cabe(out); i--) {
    const ex = e.exerciseById.get(out[i]?.exerciseId ?? '');
    if (!ex || !esDeBloque(ex)) continue;
    const grupo = grupoDeBloque(ex);
    const delBloque = out.filter((o) => {
      const otro = e.exerciseById.get(o.exerciseId);
      return otro !== undefined && esDeBloque(otro) && grupoDeBloque(otro) === grupo;
    }).length;
    if (delBloque > 1) out = sacar(out, i);
  }
  return out;
}

/** A qué bloque pertenece: su programa de prevención, o si no su patrón. */
function grupoDeBloque(ex: Exercise): string {
  return ex.prevents[0] ?? ex.pattern;
}
