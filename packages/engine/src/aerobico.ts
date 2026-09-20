import type { SessionItemBlueprint } from './contract.ts';
import type { Ruleset } from './ruleset.ts';

/**
 * EL CARDIO DE LA SEMANA
 *
 * El piso del cardio es semanal (OMS 2020, `docs/research/61`): se cuentan los
 * minutos de trabajo de cada sesión por las veces que sale en la semana, cada
 * uno con el peso de su zona. Lo suave no suma, lo moderado vale uno y lo
 * vigoroso vale `vigorousWeight`. La pausa de los intervalos no cuenta.
 */

type Item = SessionItemBlueprint;
type Zonas = NonNullable<Ruleset['cardio']>['zones'];

/** Cuánto vale un minuto de cada zona, en minutos moderados. */
export function pesoDeZona(zonas: Zonas, vigorousWeight: number) {
  const vale = { light: 0, moderate: 1, vigorous: vigorousWeight };
  return (zona: number | null): number => {
    const z = zonas.find((x) => x.zone === zona);
    return z ? vale[z.whoIntensity] : 0;
  };
}

/** Minutos moderados de la semana. */
export function minutosDeLaSemana(
  sesiones: readonly (readonly Item[])[],
  vecesPorSemana: readonly number[],
  peso: (zona: number | null) => number,
): number {
  return sesiones.reduce(
    (total, items, k) =>
      total +
      (vecesPorSemana[k] ?? 0) *
        items.reduce(
          (t, i) =>
            t + (i.targetSets * (i.targetDurationSeconds ?? 0) * peso(i.targetIntensityZone)) / 60,
          0,
        ),
    0,
  );
}

/**
 * Cuántos minutos sumar a cada sesión para cubrir `faltan` minutos semanales,
 * sin pasar los `libres` de ninguna (`docs/research/68`).
 *
 * Primero las sesiones con menos lugar: toman lo que les tocaría repartiendo
 * parejo, o todo lo que tienen si es menos, y lo que no pudieron se lo llevan
 * las que tienen más. Así el tramo queda lo más parejo posible entre sesiones
 * y la semana llega a la meta siempre que el tiempo total alcance.
 *
 * Sale en minutos enteros: nunca un tramo de fracción de minuto.
 */
export function repartirAerobico(input: {
  readonly faltan: number;
  readonly libres: readonly number[];
  readonly vecesPorSemana: readonly number[];
}): number[] {
  const { libres, vecesPorSemana } = input;
  const out = libres.map(() => 0);
  const orden = libres
    .map((libre, k) => ({ libre, k, veces: vecesPorSemana[k] ?? 0 }))
    .filter((s) => s.veces > 0 && s.libre >= 1)
    .sort((a, b) => a.libre - b.libre || a.k - b.k);
  let faltan = input.faltan;
  let vecesRestantes = orden.reduce((t, s) => t + s.veces, 0);
  for (const s of orden) {
    if (faltan <= 0) break;
    const parejo = Math.ceil(faltan / vecesRestantes);
    const minutos = Math.min(Math.floor(s.libre), parejo);
    out[s.k] = minutos;
    faltan -= s.veces * minutos;
    vecesRestantes -= s.veces;
  }
  return out;
}
