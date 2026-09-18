import { type EquipmentLoadSpec, LB_TO_KG, type LoadReading, snapToEquipment } from './load.ts';

/**
 * EL MÁXIMO ESTIMADO, PARA TRADUCIR "80 % 1RM" A LO QUE DICE LA MÁQUINA
 *
 * La app no hace test de 1RM (se prescribe sin supervisión, `05`), así que el
 * máximo se estima de lo que el socio ya levantó: Epley sobre las repeticiones
 * que la serie tenía hasta el fallo, que son las hechas más las que dijo que le
 * quedaban (RIR).
 *
 * Los dos límites salen del ruleset (`oneRepMax`), no de acá:
 * - hasta cuántas repeticiones al fallo vale una ecuación lineal (Reynolds
 *   2006: "no more than 10 repetitions"), y
 * - hasta qué RIR el RIR es confiable (Refalo 2024 / Remmert 2023, en
 *   `docs/research/20`: cerca del fallo el error es menor a una repetición).
 *
 * El 30 de Epley no es un número de entrenamiento: es la fórmula, como el
 * factor de la libra.
 *
 * Se trabaja en la masa TOTAL, en la unidad de la estación: el porcentaje es
 * del levantamiento, no de los discos. En una estación de discos sin el peso
 * de la barra cargado eso no se puede saber, y la respuesta es `null` — el 80 %
 * de los discos no es el 80 % de la sentadilla.
 */

const EPLEY = 30;

export interface OneRepMaxParams {
  readonly maxRepsToFailure: number;
  readonly maxRir: number;
}

export interface SerieParaEstimar {
  readonly load: LoadReading;
  readonly reps: number | null;
  readonly rir: number | null;
  readonly isWarmup: boolean;
  readonly completedAt: string;
  /** El entrenamiento al que pertenece: "la sesión más reciente" se agrupa por esto, no por día. */
  readonly workoutLogId: string;
}

export interface MaximoEstimado {
  /** Masa total, en kg o en lb según la estación. */
  readonly total: number;
  readonly desde: SerieParaEstimar;
}

/** Por qué no hay número, para decírselo al socio en términos de qué hacer. */
export type SinMaximo = 'unidad' | 'barra' | 'sin-series';

/** La masa total que se levantó, en la unidad de masa de la estación. */
export function masaTotal(value: number, spec: EquipmentLoadSpec): number | null {
  switch (spec.unit) {
    case 'kg':
    case 'lb':
      return value;
    case 'plates_kg':
      return spec.baseWeightKg === undefined ? null : value + spec.baseWeightKg;
    case 'plates_lb':
      return spec.baseWeightKg === undefined ? null : value + spec.baseWeightKg / LB_TO_KG;
    default:
      return null;
  }
}

/** Lo contrario: de masa total a lo que se escribe en la estación, al escalón real. */
function desdeMasaTotal(total: number, spec: EquipmentLoadSpec): number | null {
  const conDiscos = spec.unit === 'plates_kg' || spec.unit === 'plates_lb';
  if (conDiscos && spec.baseWeightKg === undefined) return null;
  const barra = conDiscos ? (spec.baseWeightKg as number) : 0;
  const base = spec.unit === 'plates_lb' ? barra / LB_TO_KG : barra;
  return snapToEquipment(Math.max(0, total - base), spec);
}

/** Qué impide calcular en esta estación, o `null` si se puede. */
export function impedimento(spec: EquipmentLoadSpec | null): SinMaximo | null {
  if (!spec) return 'unidad';
  if (spec.unit === 'plates_kg' || spec.unit === 'plates_lb') {
    return spec.baseWeightKg === undefined ? 'barra' : null;
  }
  return spec.unit === 'kg' || spec.unit === 'lb' ? null : 'unidad';
}

/**
 * El máximo estimado de la sesión más reciente que tenga alguna serie válida.
 *
 * La más reciente y no la mejor de la historia: la fuerza cambia, y un máximo
 * de hace tres meses le pondría a alguien que volvió de un parate una carga que
 * hoy no mueve. Dentro de esa sesión, la mejor estimación.
 */
export function estimarMaximo(
  series: readonly SerieParaEstimar[],
  spec: EquipmentLoadSpec,
  params: OneRepMaxParams,
): MaximoEstimado | null {
  const validas = series
    .filter(
      (s) =>
        !s.isWarmup &&
        s.load.unit === spec.unit &&
        s.load.value !== null &&
        s.reps !== null &&
        s.reps > 0 &&
        s.rir !== null &&
        s.rir <= params.maxRir &&
        s.reps + s.rir <= params.maxRepsToFailure,
    )
    .map((s) => {
      const total = masaTotal(s.load.value as number, spec);
      const alFallo = (s.reps as number) + (s.rir as number);
      return total === null ? null : { total: total * (1 + alFallo / EPLEY), desde: s };
    })
    .filter((e): e is MaximoEstimado => e !== null);
  if (validas.length === 0) return null;

  // Por instante y por entrenamiento: agrupar por día obliga a decidir la zona
  // horaria, y una sesión de las 22 de acá ya es otro día en UTC.
  const masReciente = validas.reduce((a, b) =>
    Date.parse(b.desde.completedAt) > Date.parse(a.desde.completedAt) ? b : a,
  );
  const deEsaSesion = validas.filter(
    (e) => e.desde.workoutLogId === masReciente.desde.workoutLogId,
  );
  return deEsaSesion.reduce((a, b) => (b.total > a.total ? b : a));
}

/** "80-85 %" de ese máximo, escrito como lo lee la estación. */
export function cargaParaPorcentaje(
  maximo: number,
  pct: { readonly min: number; readonly max: number },
  spec: EquipmentLoadSpec,
): { readonly min: number; readonly max: number } | null {
  const min = desdeMasaTotal((maximo * pct.min) / 100, spec);
  const max = desdeMasaTotal((maximo * pct.max) / 100, spec);
  return min === null || max === null ? null : { min, max };
}
