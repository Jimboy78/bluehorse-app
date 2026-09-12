import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Exercise, MovementPattern, MuscleGroup } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { buscarEjercicios, normalizar } from './buscar-ejercicios.ts';

/**
 * EL BUSCADOR, CONTRA EL CATÁLOGO DE VERDAD
 *
 * Un fixture de cinco ejercicios inventados diría que el buscador anda y no
 * probaría nada: lo que hay que saber es si alguien parado en Blue Horse
 * escribiendo "patada de burro" encuentra la máquina que está a tres metros.
 * Por eso se lee `supabase/catalog/blue-horse.json`, que es el mismo archivo
 * que `db:catalog` sube a la base.
 *
 * Si mañana el catálogo cambia y un ejercicio deja de existir, estos tests se
 * caen — y está bien que se caigan: un sinónimo que apunta a algo que ya no
 * está es una búsqueda que no devuelve nada.
 */

/**
 * El catálogo, buscado hacia arriba desde donde se haya corrido vitest.
 *
 * Ni el cwd ni `import.meta.url` sirven solos: vitest corre este archivo con el
 * workspace de la web como raíz y transformado, así que `import.meta.url` no
 * es una URL `file:`. Subir hasta encontrarlo funciona desde cualquiera de los
 * dos, y si no está, lo dice con la ruta que miró en vez de fallar con un
 * ENOENT de un directorio que nadie pidió.
 */
function rutaDelCatalogo(): string {
  let dir = resolve(process.cwd());
  for (let i = 0; i < 6; i += 1) {
    const candidato = join(dir, 'supabase', 'catalog', 'blue-horse.json');
    if (existsSync(candidato)) return candidato;
    dir = dirname(dir);
  }
  throw new Error(`no se encontró supabase/catalog/blue-horse.json desde ${process.cwd()}`);
}

interface FilaCatalogo {
  readonly name: string;
  readonly pattern: MovementPattern;
  readonly primaryMuscles: readonly MuscleGroup[];
}

const CATALOGO: readonly Exercise[] = (
  JSON.parse(readFileSync(rutaDelCatalogo(), 'utf-8')) as {
    exercises: readonly FilaCatalogo[];
  }
).exercises.map((fila, i) => ({
  id: `ex-${i}`,
  gymId: 'gym',
  name: fila.name,
  pattern: fila.pattern,
  primaryMuscles: fila.primaryMuscles,
  secondaryMuscles: [],
  modality: 'reps_weight',
  isCompound: true,
  isUnilateral: false,
  isExplosive: false,
  skillLevel: 'beginner',
  cues: null,
  equipmentIds: [],
}));

/** El primer resultado, que es el que la gente va a tocar. */
function primero(consulta: string): string | undefined {
  return buscarEjercicios(consulta, CATALOGO)[0]?.exercise.name;
}

function nombres(consulta: string): readonly string[] {
  return buscarEjercicios(consulta, CATALOGO).map((c) => c.exercise.name);
}

describe('buscarEjercicios', () => {
  it('el catálogo de verdad está donde el test cree', () => {
    // Sin esto, un archivo movido dejaría todo el resto midiendo una lista vacía.
    expect(CATALOGO.length).toBeGreaterThan(50);
  });

  it('encuentra lo que se escribe tal cual', () => {
    expect(primero('dominadas')).toBe('Dominadas');
    expect(primero('plancha')).toBe('Plancha');
  });

  it('no le importan las tildes ni las mayúsculas', () => {
    expect(primero('ELÍPTICO')).toBe('Elíptico');
    expect(primero('eliptico')).toBe('Elíptico');
    expect(primero('extension de cuadriceps')).toBe('Extensión de cuádriceps');
  });

  it('entiende el nombre de gimnasio, no solo el del catálogo', () => {
    // El caso que pidió el dueño: nadie dice "Patada de glúteo en máquina".
    expect(nombres('patada de burro')).toContain('Patada de glúteo en máquina');
    expect(nombres('pesa rusa')).toContain('Swing con kettlebell');
    expect(nombres('lagartijas')).toContain('Flexiones de brazos');
    expect(nombres('banco romano')).toContain('Hiperextensiones');
  });

  it('entiende el inglés', () => {
    expect(nombres('bench press')).toContain('Press de banco');
    expect(nombres('deadlift')).toContain('Peso muerto');
    expect(nombres('pull ups')).toContain('Dominadas');
    expect(nombres('lat pulldown')).toContain('Dorsalera al pecho');
    expect(nombres('leg press')).toContain('Prensa de piernas');
    expect(nombres('calf raise')).toContain('Gemelos sentado');
    expect(nombres('farmer walk')).toContain('Caminata del granjero');
  });

  it('aguanta un dedo que se fue de tecla', () => {
    expect(nombres('dominads')).toContain('Dominadas');
    expect(nombres('sentadila')).toContain('Sentadilla');
    expect(nombres('bicicletta')).toContain('Bicicleta fija');
  });

  it('busca por zona del cuerpo y trae varias', () => {
    const espalda = nombres('espalda');
    expect(espalda).toContain('Dorsalera al pecho');
    expect(espalda).toContain('Remo sentado');
    expect(espalda.length).toBeGreaterThan(2);

    const cardio = nombres('cardio');
    expect(cardio).toContain('Caminata en cinta');
    expect(cardio).toContain('Bicicleta fija');
    expect(cardio).toContain('Elíptico');
  });

  it('acepta una expresión regular cuando se escribe una', () => {
    const resultados = nombres('^press.*mancuernas$');
    expect(resultados).toContain('Press de hombro con mancuernas');
    expect(resultados).toContain('Press de banca con mancuernas');
    expect(resultados).not.toContain('Dominadas');
  });

  it('un regex roto no rompe la búsqueda', () => {
    // Alguien escribiendo "press (banco" no cometió un error: está escribiendo
    // texto. Tirar una excepción acá le rompería la pantalla.
    expect(() => buscarEjercicios('press (banco', CATALOGO)).not.toThrow();
    expect(() => buscarEjercicios('[', CATALOGO)).not.toThrow();
  });

  it('lo más confiable sale primero', () => {
    // "sentadilla" es el nombre exacto de un ejercicio y aparece adentro de
    // otros cinco. El exacto va arriba, no el que el catálogo puso primero.
    expect(primero('sentadilla')).toBe('Sentadilla');
    expect(nombres('sentadilla').length).toBeGreaterThan(4);
  });

  it('cada resultado dice por qué entró', () => {
    const [primera] = buscarEjercicios('patada de burro', CATALOGO);
    expect(primera?.motivo).toBe('sinonimo');
    expect(primera?.detalle).toBe('patada gluteo');

    expect(buscarEjercicios('dominadas', CATALOGO)[0]?.motivo).toBe('exacto');
  });

  it('una búsqueda vacía no devuelve el catálogo entero', () => {
    // El error clásico: el campo arranca vacío y la pantalla muestra los 58.
    expect(buscarEjercicios('', CATALOGO)).toHaveLength(0);
    expect(buscarEjercicios('   ', CATALOGO)).toHaveLength(0);
  });

  /**
   * El orden es la mitad del producto: quien busca mira los tres primeros.
   *
   * Acá antes había un test de "no repite un ejercicio". Después de sacar el
   * `Map` de deduplicación —cada ejercicio se clasifica una sola vez, así que
   * repetir dejó de ser posible— ese test pasaba sin poder fallar nunca, que es
   * peor que no tenerlo. Esto sí puede fallar: basta con que alguien cambie el
   * criterio de orden.
   */
  it('nunca aparece una coincidencia floja arriba de una fuerte', () => {
    const ORDEN = [
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
    let medidos = 0;

    for (const consulta of ['pierna', 'espalda', 'press', 'curl', 'sentadilla', 'cardio']) {
      const motivos = buscarEjercicios(consulta, CATALOGO).map((c) => ORDEN.indexOf(c.motivo));
      if (motivos.length < 2) continue;
      medidos += 1;
      expect(
        [...motivos].sort((a, b) => a - b),
        `"${consulta}" salió desordenado`,
      ).toEqual(motivos);
    }

    // Si todas las consultas devolvieran un solo resultado, lo de arriba no
    // mira nada.
    expect(medidos, 'ninguna consulta trajo más de un resultado').toBeGreaterThan(3);
  });

  it('normalizar deja solo letras, números y espacios', () => {
    expect(normalizar('  Extensión   de TRÍCEPS en polea! ')).toBe('extension de triceps en polea');
  });
});

/**
 * Cada sinónimo tiene que llegar a algo que exista.
 *
 * Es el modo en que esta tabla se pudre: alguien renombra "Dorsalera al pecho"
 * en el catálogo y los cuatro alias que apuntaban ahí dejan de encontrar nada,
 * en silencio. La búsqueda no falla — devuelve cero resultados, que en pantalla
 * se lee como "el gimnasio no lo tiene".
 */
describe('la tabla de sinónimos no apunta al vacío', () => {
  const ALIAS = [
    'dominadas',
    'pull ups',
    'jalon',
    'lat pulldown',
    'row',
    'bench press',
    'banca',
    'pecho',
    'push ups',
    'lagartijas',
    'shoulder press',
    'hombros',
    'lateral raise',
    'squat',
    'leg press',
    'pierna',
    'cuadriceps',
    'leg extension',
    'leg curl',
    'isquios',
    'estocadas',
    'lunges',
    'split squat',
    'step up',
    'box jump',
    'multipower',
    'deadlift',
    'rdl',
    'empuje de cadera',
    'pesa rusa',
    'good morning',
    'lumbares',
    'patada de burro',
    'glute kickback',
    'gluteos',
    'biceps',
    'triceps',
    'espalda',
    'dorsales',
    'trapecios',
    'shrugs',
    'flyes',
    'mariposa',
    'abs',
    'core',
    'plank',
    'ab wheel',
    'pantorrillas',
    'calf raise',
    'manguito',
    'rotator cuff',
    'correr',
    'cinta',
    'bici',
    'spinning',
    'elliptical',
    'escalera',
    'cardio',
    'farmer walk',
  ] as const;

  it.each(ALIAS)('"%s" encuentra algo', (alias) => {
    expect(buscarEjercicios(alias, CATALOGO).length, `"${alias}" no encontró nada`).toBeGreaterThan(
      0,
    );
  });
});
