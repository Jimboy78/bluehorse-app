import type { Ruleset } from '@bh/engine';

/**
 * Cómo se lee el objetivo de un ítem, en la fila de la sesión y en cada serie.
 *
 * Antes la fila era siempre `{reps} reps · {carga}`, así que un bloque de
 * cardio decía "40 min reps · sin carga previa" y la zona —que el motor
 * prescribe y el ruleset describe— no aparecía en ninguna pantalla.
 */

export type CardioZone = NonNullable<Ruleset['cardio']>['zones'][number];

/** La zona tal como la describe el ruleset, o `null` si no hay zona o el ruleset no la define. */
export function zonaDe(
  zone: number | null,
  zones: readonly CardioZone[] | undefined,
): CardioZone | null {
  if (zone === null) return null;
  return zones?.find((z) => z.zone === zone) ?? null;
}

export interface ObjetivoItem {
  /** "6-12" o, en cardio, "40 min" / "4 × 4 min · 3 min suave". */
  readonly reps: string;
  readonly durationSeconds: number | null;
  readonly toFailure: boolean;
  readonly isUnilateral: boolean;
  readonly zone: CardioZone | null;
}

/** El objetivo completo, para la fila de la lista: "6-12 reps por lado", "40 min · zona 2, cómodo". */
export function objetivoDeLaFila(item: ObjetivoItem): string {
  if (item.durationSeconds !== null) {
    return item.zone
      ? `${item.reps} · zona ${item.zone.zone}, ${item.zone.label.toLowerCase()}`
      : item.reps;
  }
  const porLado = item.isUnilateral ? ' por lado' : '';
  if (item.toFailure) return `al fallo técnico${porLado}`;
  return `${item.reps} reps${porLado}`;
}

/** Lo que va después del "×" de cada serie: "6-12", "8 por lado", "al fallo". */
export function repsDeLaSerie(item: ObjetivoItem): string {
  const porLado = item.isUnilateral ? ' por lado' : '';
  if (item.toFailure) return `al fallo${porLado}`;
  return `${item.reps}${porLado}`;
}

export interface ResumenItem {
  readonly targetSets: number;
  readonly targetRepsMin: number;
  readonly targetRepsMax: number;
  readonly durationSeconds: number | null;
  readonly intervalRestSeconds: number | null;
  readonly toFailure: boolean;
  readonly isUnilateral: boolean;
  readonly zone: CardioZone | null;
  readonly pct1rm: { readonly min: number; readonly max: number } | null;
}

/**
 * La línea de un ítem en el editor del plan a mano: "4 × 5 · 80-85 % 1RM",
 * "3 × al fallo técnico", "35 min · zona 2, cómodo". Antes era siempre
 * "{series} × {reps}", y un bloque de cardio se leía "1 × 1".
 */
export function resumenDelItem(item: ResumenItem): string {
  if (item.durationSeconds !== null) {
    const minutos = Math.round(item.durationSeconds / 60);
    const base =
      item.targetSets > 1
        ? `${item.targetSets} × ${minutos} min${item.intervalRestSeconds ? ` · ${Math.round(item.intervalRestSeconds / 60)} min suave` : ''}`
        : `${minutos} min`;
    return item.zone ? `${base} · zona ${item.zone.zone}, ${item.zone.label.toLowerCase()}` : base;
  }
  const reps =
    item.targetRepsMin === item.targetRepsMax
      ? `${item.targetRepsMin}`
      : `${item.targetRepsMin}–${item.targetRepsMax}`;
  const porLado = item.isUnilateral ? ' por lado' : '';
  const objetivo = item.toFailure ? `al fallo técnico${porLado}` : `${reps}${porLado}`;
  const pct = item.pct1rm
    ? ` · ${item.pct1rm.min === item.pct1rm.max ? item.pct1rm.min : `${item.pct1rm.min}-${item.pct1rm.max}`} % 1RM`
    : '';
  return `${item.targetSets} × ${objetivo}${pct}`;
}
