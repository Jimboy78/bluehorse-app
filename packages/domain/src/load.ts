import type { LoadUnit } from './enums.ts';

/**
 * Carga: cómo se lee, cómo se guarda y cómo se compara.
 *
 * Regla dura 5 (CLAUDE.md): al usuario se le muestra SIEMPRE lo que dice la máquina.
 * El kg normalizado existe solo para gráficos y comparaciones, y puede no existir.
 */

/** Factor exacto por definición internacional de la libra avoirdupois. */
export const LB_TO_KG = 0.453_592_37;

/** Lo que el usuario lee en la estación y lo que se guarda en `set_logs`. */
export interface LoadReading {
  /** `null` para peso corporal o estaciones sin carga (colchoneta, TRX). */
  readonly value: number | null;
  readonly unit: LoadUnit;
}

/** Cómo carga una estación concreta del gimnasio. Sale del catálogo. */
export interface EquipmentLoadSpec {
  readonly unit: LoadUnit;
  readonly min?: number;
  readonly max?: number;
  /** Escalón mínimo real de la estación: 2.5 kg de disco, 5 lb de placa, 1 nivel de pin. */
  readonly increment?: number;
  /** Para `stack_level`: kg reales de cada nivel. Índice 0 = nivel 1. */
  readonly stackKg?: readonly number[];
  /** Para estaciones con discos: peso del carro, barra o plataforma, en kg. */
  readonly baseWeightKg?: number;
}

/**
 * Convierte a kg para poder graficar y comparar entre estaciones.
 *
 * Devuelve `null` cuando la conversión no se puede hacer sin inventar un número:
 * un pin sin tabla de kg cargada, una banda elástica, o peso corporal.
 * Ese `null` es un resultado válido y hay que propagarlo, no reemplazarlo por 0.
 */
export function toKg(reading: LoadReading, spec?: EquipmentLoadSpec): number | null {
  const { value, unit } = reading;
  if (value === null || !Number.isFinite(value)) return null;

  switch (unit) {
    case 'kg':
      return value;
    case 'lb':
      return round2(value * LB_TO_KG);
    case 'plates_kg':
      return round2(value + (spec?.baseWeightKg ?? 0));
    case 'plates_lb':
      return round2(value * LB_TO_KG + (spec?.baseWeightKg ?? 0));
    case 'stack_level': {
      const table = spec?.stackKg;
      if (!table || value < 1 || value > table.length) return null;
      return table[value - 1] ?? null;
    }
    case 'band':
    case 'bodyweight':
    case 'none':
      return null;
    default: {
      const _exhaustive: never = unit;
      return _exhaustive;
    }
  }
}

/** Texto que ve el usuario. Nunca convertido: es lo que está escrito en la máquina. */
export function formatLoad(reading: LoadReading, locale = 'es-AR'): string {
  const { value, unit } = reading;

  if (unit === 'bodyweight') return 'peso corporal';
  if (unit === 'none') return 'sin carga';
  if (value === null) return '—';

  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);

  switch (unit) {
    case 'kg':
    case 'plates_kg':
      return `${n} kg`;
    case 'lb':
    case 'plates_lb':
      return `${n} lb`;
    case 'stack_level':
      return `pin ${n}`;
    case 'band':
      return `banda ${n}`;
    default:
      return n;
  }
}

/**
 * El sufijo de la unidad, para ponerlo al lado de un número editable.
 * Mismo vocabulario que `formatLoad`, en un solo lugar: si mañana "pin"
 * pasa a llamarse otra cosa, cambia acá y en ningún otro lado.
 */
export function loadUnitLabel(unit: LoadUnit): string {
  switch (unit) {
    case 'kg':
    case 'plates_kg':
      return 'kg';
    case 'lb':
    case 'plates_lb':
      return 'lb';
    case 'stack_level':
      return 'pin';
    case 'band':
      return 'banda';
    case 'bodyweight':
      return 'peso corporal';
    case 'none':
      return 'sin carga';
    default:
      return '';
  }
}

/**
 * Ajusta un valor al escalón real de la estación y lo recorta al rango físico.
 * Sin esto el motor propone 63.7 kg en una máquina que sube de a 5.
 */
export function snapToEquipment(value: number, spec: EquipmentLoadSpec): number {
  const step = spec.increment && spec.increment > 0 ? spec.increment : null;
  let out = step ? Math.round(value / step) * step : value;
  if (spec.min !== undefined) out = Math.max(out, spec.min);
  if (spec.max !== undefined) out = Math.min(out, spec.max);
  return round2(out);
}

/**
 * Siguiente carga a proponer, expresada en la unidad de la estación.
 *
 * `stepPct` viene del ruleset, nunca de acá: este módulo solo sabe de fierros y
 * de aritmética. En estaciones de pin el porcentaje se ignora y se sube de a un
 * nivel, porque no existe medio pin.
 */
export function nextLoad(
  current: LoadReading,
  spec: EquipmentLoadSpec,
  stepPct: number,
): number | null {
  if (current.value === null) return null;

  if (spec.unit === 'stack_level') {
    const levels = spec.stackKg?.length;
    const next = current.value + 1;
    if (levels !== undefined && next > levels) return null;
    return next;
  }

  const target = current.value * (1 + stepPct / 100);
  const snapped = snapToEquipment(target, spec);
  // Si el escalón es más grande que el aumento pedido, subimos un escalón igual:
  // quedarse en el mismo número no es una progresión.
  if (snapped <= current.value && spec.increment) {
    return snapToEquipment(current.value + spec.increment, spec);
  }
  return snapped;
}

/**
 * Un escalón real para arriba o para abajo, para cuando la persona corrige a
 * mano la carga que efectivamente usó.
 *
 * No es progresión: acá no hay porcentaje ninguno, y por eso no toma nada del
 * ruleset. En una estación de pin se mueve un nivel, porque no existe medio
 * pin; en discos o mancuernas, un `increment` de los de verdad.
 *
 * Devuelve `null` cuando la estación no dice de cuánto es su escalón: mover
 * "un poco" sin saber cuánto sería inventar un número que la máquina nunca
 * mostró.
 */
export function stepLoad(
  current: number | null,
  spec: EquipmentLoadSpec,
  direction: 1 | -1,
): number | null {
  if (spec.unit === 'stack_level') {
    const levels = spec.stackKg?.length;
    const next = (current ?? 0) + direction;
    if (next < 1) return 1;
    if (levels !== undefined && next > levels) return levels;
    return next;
  }

  const step = spec.increment && spec.increment > 0 ? spec.increment : null;
  if (step === null) return null;
  if (current === null) return snapToEquipment(spec.min ?? step, spec);
  return snapToEquipment(current + direction * step, spec);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
