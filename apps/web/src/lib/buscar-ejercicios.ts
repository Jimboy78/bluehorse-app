import type { Exercise } from '@bh/domain';
import { MUSCLE_LABELS, PATTERN_LABELS } from '../components/ui/PatternIcon.tsx';

/**
 * BUSCAR UN EJERCICIO POR COMO LA GENTE LO LLAMA
 *
 * El catálogo tiene 58 nombres escritos por nosotros. Nadie los conoce. La
 * persona que quiere pedir un ejercicio escribe "dominadas" (ese sí está),
 * "patada de burro" (el catálogo dice "Patada de glúteo en máquina"), "bench
 * press", "jalón al pecho" (acá es "Dorsalera al pecho") o "pierna". Un
 * `includes()` contra el nombre encuentra el primero y ninguno de los otros
 * cuatro, y quien busca concluye que el gimnasio no lo tiene.
 *
 * Por eso la búsqueda va por capas, de la más confiable a la más floja, y cada
 * resultado dice por cuál entró: así el que busca ve *por qué* le ofrecemos eso
 * en vez de tener que adivinarlo.
 *
 *   1. el nombre exacto
 *   2. el nombre empieza con lo que escribió
 *   3. el nombre lo contiene
 *   4. están todas las palabras que escribió, en cualquier orden
 *   5. un sinónimo lleva a una palabra del nombre
 *   6. coincide el músculo o el patrón de movimiento
 *   7. está escrito parecido (una o dos letras de diferencia)
 *   8. lo que escribió es una expresión regular y matchea
 *
 * **Los sinónimos son idioma, no datos del gimnasio.** Que a las dominadas se
 * les diga "pull ups" no depende de qué máquinas haya en Arroyo Seco, así que
 * viven acá y no en `supabase/catalog/blue-horse.json`. Lo que sí es del
 * gimnasio —qué ejercicios existen, qué músculos mueven— sale del catálogo, y
 * esta función no lo toca: recibe la lista y solo la ordena.
 */

/**
 * Cómo le dice la gente a cada cosa → palabras que sí están en el catálogo.
 *
 * Incluye el inglés (mucha gente aprendió los nombres en inglés), el lunfardo
 * de gimnasio ("patada de burro", "pesa rusa", "lagartijas") y las variantes
 * regionales ("estocadas" y "desplantes" por zancadas). Un alias puede apuntar
 * a varias palabras: "pierna" lleva a todo el tren inferior.
 */
const SINONIMOS: Readonly<Record<string, readonly string[]>> = {
  // Tirón vertical
  dominadas: ['dominadas'],
  'pull up': ['dominadas'],
  'pull ups': ['dominadas'],
  pullup: ['dominadas'],
  pullups: ['dominadas'],
  jalon: ['dorsalera'],
  jalones: ['dorsalera'],
  'lat pulldown': ['dorsalera'],
  pulldown: ['dorsalera'],
  polea: ['dorsalera', 'polea'],
  // Tirón horizontal
  row: ['remo'],
  rows: ['remo'],
  'inverted row': ['remo invertido'],
  // Empuje horizontal
  'bench press': ['press banco', 'press banca'],
  banca: ['press banca', 'press banco'],
  pecho: ['press banco', 'press banca', 'press pecho', 'aperturas', 'cruce'],
  chest: ['press banco', 'press pecho'],
  'push up': ['flexiones'],
  'push ups': ['flexiones'],
  lagartijas: ['flexiones'],
  pechadas: ['flexiones'],
  // Empuje vertical
  'overhead press': ['press militar', 'press hombro'],
  'shoulder press': ['press hombro'],
  hombros: ['press hombro', 'elevaciones laterales', 'encogimientos'],
  shoulders: ['press hombro'],
  deltoides: ['press hombro', 'elevaciones laterales'],
  'lateral raise': ['elevaciones laterales'],
  // Sentadilla y pierna
  squat: ['sentadilla'],
  squats: ['sentadilla'],
  'leg press': ['prensa'],
  pierna: ['sentadilla', 'prensa', 'zancadas', 'extension cuadriceps', 'curl femoral'],
  piernas: ['sentadilla', 'prensa', 'zancadas'],
  legs: ['sentadilla', 'prensa'],
  cuadriceps: ['extension cuadriceps', 'sentadilla', 'prensa'],
  quads: ['extension cuadriceps', 'sentadilla'],
  'leg extension': ['extension cuadriceps'],
  'leg curl': ['curl femoral'],
  isquios: ['curl femoral', 'peso muerto rumano'],
  isquiotibiales: ['curl femoral', 'peso muerto rumano'],
  hamstrings: ['curl femoral', 'peso muerto rumano'],
  femorales: ['curl femoral'],
  estocadas: ['zancadas'],
  desplantes: ['zancadas'],
  lunges: ['zancadas'],
  'split squat': ['sentadilla bulgara'],
  'step up': ['subida cajon'],
  'box jump': ['salto cajon'],
  multipower: ['smith'],
  // Bisagra de cadera
  deadlift: ['peso muerto'],
  rdl: ['peso muerto rumano'],
  'romanian deadlift': ['peso muerto rumano'],
  'empuje de cadera': ['hip thrust'],
  'puente de gluteo': ['hip thrust'],
  'pesa rusa': ['kettlebell'],
  'good morning': ['hiperextensiones'],
  lumbares: ['hiperextensiones'],
  'banco romano': ['hiperextensiones'],
  // Glúteos
  'patada de burro': ['patada gluteo'],
  'patada burro': ['patada gluteo'],
  'glute kickback': ['patada gluteo'],
  kickback: ['patada gluteo'],
  cola: ['patada gluteo', 'hip thrust', 'extension gluteo'],
  gluteos: ['patada gluteo', 'hip thrust', 'extension gluteo'],
  glutes: ['patada gluteo', 'hip thrust'],
  // Brazos
  biceps: ['curl biceps', 'curl barra'],
  'bicep curl': ['curl biceps'],
  triceps: ['extension triceps'],
  'tricep extension': ['extension triceps'],
  'skull crusher': ['extension triceps'],
  // Espalda alta
  espalda: ['remo', 'dorsalera', 'dominadas'],
  back: ['remo', 'dorsalera'],
  dorsales: ['dorsalera', 'dominadas'],
  lats: ['dorsalera', 'dominadas'],
  trapecios: ['encogimientos'],
  shrugs: ['encogimientos'],
  traps: ['encogimientos'],
  // Pecho aislado
  flyes: ['aperturas', 'cruce'],
  'peck deck': ['aperturas'],
  mariposa: ['aperturas'],
  // Core
  abs: ['abdominales', 'plancha', 'rueda abdominal'],
  abdomen: ['abdominales', 'plancha'],
  core: ['abdominales', 'plancha', 'rueda abdominal'],
  plank: ['plancha'],
  'ab wheel': ['rueda abdominal'],
  // Pantorrillas
  pantorrillas: ['gemelos'],
  'calf raise': ['gemelos'],
  calves: ['gemelos'],
  // Hombro/rotadores
  manguito: ['rotacion externa'],
  'rotator cuff': ['rotacion externa'],
  // Cardio
  correr: ['caminata cinta'],
  cinta: ['caminata cinta'],
  treadmill: ['caminata cinta'],
  caminar: ['caminata cinta'],
  bici: ['bicicleta'],
  bike: ['bicicleta'],
  spinning: ['bicicleta'],
  elliptical: ['eliptico'],
  'stair climber': ['escaladora'],
  escalera: ['escaladora'],
  cardio: ['caminata cinta', 'bicicleta', 'eliptico', 'escaladora'],
  // Acarreo
  'farmer walk': ['caminata granjero'],
  'farmer carry': ['caminata granjero'],
};

/** Por qué entró un resultado. Se muestra, no se usa solo para ordenar. */
export type MotivoCoincidencia =
  | 'exacto'
  | 'empieza'
  | 'contiene'
  | 'palabras'
  | 'sinonimo'
  | 'musculo'
  | 'patron'
  | 'parecido'
  | 'regex';

export interface Coincidencia {
  readonly exercise: Exercise;
  readonly motivo: MotivoCoincidencia;
  /** Qué del ejercicio coincidió, para poder decirlo en pantalla. */
  readonly detalle: string;
}

/** El orden de confianza. Es el orden en que salen los resultados. */
const ORDEN: readonly MotivoCoincidencia[] = [
  'exacto',
  'empieza',
  'contiene',
  'palabras',
  'sinonimo',
  'musculo',
  'patron',
  'parecido',
  'regex',
];

/**
 * Sin acentos, sin mayúsculas, sin puntuación.
 *
 * Alguien que escribe rápido en el gimnasio no pone tildes, y "Extensión" y
 * "extension" tienen que ser la misma palabra. `NFD` separa la tilde de la
 * letra y el rango `̀-ͯ` la borra.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Distancia de edición, para aguantar un dedo que se fue de tecla.
 *
 * Solo se usa en palabras de cuatro letras o más: en palabras cortas una letra
 * de diferencia son dos palabras distintas ("remo" y "remos" pase, pero "curl"
 * y "cura" no).
 */
function distancia(a: string, b: string): number {
  if (a === b) return 0;
  // Si la diferencia de largo ya supera lo que vamos a tolerar, no hace falta
  // recorrer la matriz entera.
  if (Math.abs(a.length - b.length) > 2) return 99;

  let previa = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const actual = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      actual[j] = Math.min(
        (actual[j - 1] ?? 0) + 1,
        (previa[j] ?? 0) + 1,
        (previa[j - 1] ?? 0) + costo,
      );
    }
    previa = actual;
  }
  return previa[b.length] ?? 99;
}

/** Cuánto error se le perdona a una palabra según su largo. */
function tolerancia(palabra: string): number {
  if (palabra.length < 4) return 0;
  if (palabra.length <= 6) return 1;
  return 2;
}

/**
 * La consulta más lo que los sinónimos agregan.
 *
 * Se prueba la frase entera primero ("patada de burro" es un alias, "patada"
 * suelto no) y después palabra por palabra, así "bici cinta" encuentra las dos.
 */
function expandir(consulta: string): readonly string[] {
  const directo = SINONIMOS[consulta];
  const porPalabra = consulta.split(' ').flatMap((p) => SINONIMOS[p] ?? []);
  return [...new Set([...(directo ?? []), ...porPalabra])];
}

/**
 * Una expresión regular solo si la persona quiso escribir una.
 *
 * Sin este filtro, cualquier búsqueda sería también un regex y "press (banco)"
 * traería cosas raras. Se pide que tenga algún metacarácter y que compile;
 * si no compila, no es un error de la persona, es que estaba escribiendo texto.
 */
function comoRegex(consulta: string): RegExp | null {
  if (!/[\\^$.|?*+()[\]{}]/.test(consulta)) return null;
  try {
    return new RegExp(consulta, 'i');
  } catch {
    return null;
  }
}

/** Lo que hace falta saber de la consulta, calculado una sola vez. */
interface Consulta {
  readonly q: string;
  readonly tokens: readonly string[];
  readonly sinonimos: readonly string[];
  readonly regex: RegExp | null;
}

/**
 * Por qué capa entra este ejercicio, o `null` si no entra por ninguna.
 *
 * Va aparte del bucle porque son ocho capas y el bucle quedaba ilegible: es la
 * lista de criterios de la búsqueda, y se lee de arriba abajo como tal.
 */
function clasificar(
  ejercicio: Exercise,
  { q, tokens, sinonimos, regex }: Consulta,
): Omit<Coincidencia, 'exercise'> | null {
  const nombre = normalizar(ejercicio.name);
  const palabras = nombre.split(' ');

  if (nombre === q) return { motivo: 'exacto', detalle: ejercicio.name };
  if (nombre.startsWith(q)) return { motivo: 'empieza', detalle: ejercicio.name };
  if (nombre.includes(q)) return { motivo: 'contiene', detalle: ejercicio.name };
  if (tokens.every((t) => nombre.includes(t))) {
    return { motivo: 'palabras', detalle: ejercicio.name };
  }

  const porSinonimo = sinonimos.find((s) => s.split(' ').every((p) => nombre.includes(p)));
  if (porSinonimo) return { motivo: 'sinonimo', detalle: porSinonimo };

  const musculo = ejercicio.primaryMuscles.find((m) => coincideEtiqueta(q, MUSCLE_LABELS[m]));
  if (musculo) return { motivo: 'musculo', detalle: MUSCLE_LABELS[musculo] ?? musculo };

  if (coincideEtiqueta(q, PATTERN_LABELS[ejercicio.pattern])) {
    return { motivo: 'patron', detalle: PATTERN_LABELS[ejercicio.pattern] ?? ejercicio.pattern };
  }

  // Parecido: alcanza con que UNA palabra de lo que escribió se parezca a una
  // del nombre. Buscar "dominads" o "sentadila" tiene que llegar igual.
  const parecida = tokens.some((t) =>
    palabras.some((p) => distancia(t, p) <= Math.min(tolerancia(t), tolerancia(p))),
  );
  if (parecida) return { motivo: 'parecido', detalle: ejercicio.name };

  if (regex?.test(nombre)) return { motivo: 'regex', detalle: ejercicio.name };

  return null;
}

export function buscarEjercicios(
  consulta: string,
  ejercicios: readonly Exercise[],
): readonly Coincidencia[] {
  const q = normalizar(consulta);
  if (q.length === 0) return [];

  const criterios: Consulta = {
    q,
    tokens: q.split(' '),
    sinonimos: expandir(q),
    regex: comoRegex(consulta.trim()),
  };

  return ejercicios
    .flatMap((exercise) => {
      const como = clasificar(exercise, criterios);
      return como ? [{ exercise, ...como }] : [];
    })
    .sort((a, b) => {
      const porMotivo = ORDEN.indexOf(a.motivo) - ORDEN.indexOf(b.motivo);
      // Dentro del mismo motivo, alfabético: da un orden estable y previsible,
      // no el que traiga el catálogo.
      return porMotivo !== 0 ? porMotivo : a.exercise.name.localeCompare(b.exercise.name, 'es');
    });
}

/** Una etiqueta (músculo o patrón) coincide si la consulta la nombra. */
function coincideEtiqueta(q: string, etiqueta: string | undefined): boolean {
  if (!etiqueta) return false;
  const e = normalizar(etiqueta);
  return e === q || e.includes(q) || q.includes(e);
}
