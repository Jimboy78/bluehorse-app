import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { V1_RESEARCH } from './index.ts';

/**
 * Contenido del ruleset que no lee nadie.
 *
 * Apareció cuatro veces en la auditoría del motor: `referIf`, `redFlags`,
 * `specialPopulations` e `interference` — y `severityScale`, que se agregó en la
 * misma iteración donde se denunció el patrón. Escribir un bloque en el ruleset
 * es más barato que conectarlo, y hasta acá nada avisaba cuando quedaba
 * desconectado. Un bloque escrito y muerto es peor que uno ausente: aparenta una
 * cobertura que la app no entrega, y nadie va a buscar lo que cree que ya está.
 *
 * Este test recorre las claves de contenido del ruleset activo y busca cada una
 * en el código que debería consumirla. La deuda que ya existía está listada
 * abajo; lo que este test impide es que la lista crezca en silencio.
 *
 * Ver `docs/research/13-cardio-e-interferencia.md`.
 */
describe('bloques del ruleset sin consumir', () => {
  /**
   * Deuda declarada, no diseño. Cada línea es contenido escrito que el socio
   * nunca ve. Conectar uno significa borrarlo de acá.
   */
  const DEUDA = new Set([
    // Qué hacer ante cada bandera roja. Muere con `redFlags`, que ya estaba acá.
    'action',
    'clearedMessage',
    'hrPercentMax',
    /**
     * Las 36 bandas de %1RM del ruleset, curadas desde `01` y `02`, que no
     * llegan a ninguna pantalla.
     *
     * Estuvo viva en esta lista desde siempre y nadie la vio, porque el motor
     * **escribe** la clave una vez —en el ajuste por edad— y el chequeo de
     * arriba era `codigo.includes(k)`. Nombrarla no es leerla; por eso ahora hay
     * un segundo chequeo que pide un acceso a propiedad.
     *
     * Conectarla no es una decisión libre: prescribir por %1RM necesita un 1RM,
     * o sea `user_baselines`, que se leen y nunca se escriben. Es la decisión de
     * producto número 3 y bloquea a esta. Ver `29-la-intensidad-que-nadie-lee.md`.
     */
    'intensityPct1RM',
    'keepLoad',
    'nprs',
    'optimalSetsPerMuscle',
    'redFlags',
    'requiresClearance',
    'rotationWeeks',
    'sessionsPerMusclePerWeek',
    'severityScale',
    'specialPopulations',
  ]);

  /**
   * Claves que se leen sin que se vea un acceso a propiedad.
   *
   * El chequeo de "solo escritas" busca `algo.clave` o una desestructuración. Lo
   * que no ve es una clave que se alcanza por índice dinámico o que se consume
   * recorriendo el objeto, y esas hay que anotarlas acá con el motivo.
   */
  const soloEscritas_permitidas = new Set<string>([
    // `sessionTime.changes`: el motor las alcanza por índice (`cfg.changes[c]`),
    // y `tiempo.ts` tipa cada paso con `Record<Cambio, …>`, así que una clave
    // sin paso no compila.
    'blocks',
    'pairs',
  ]);

  /** Claves que son estructura o texto suelto, no un campo que el motor consulte. */
  const ESTRUCTURALES = new Set([
    'label',
    'note',
    'id',
    'text',
    'confidence',
    'confidenceNote',
    'version',
    'source',
    'notes',
  ]);

  function clavesDe(valor: unknown, salida = new Set<string>()): Set<string> {
    if (Array.isArray(valor)) {
      // Alcanza con mirar las primeras entradas: son homogéneas por esquema.
      for (const item of valor.slice(0, 3)) clavesDe(item, salida);
    } else if (valor !== null && typeof valor === 'object') {
      for (const [k, v] of Object.entries(valor)) {
        salida.add(k);
        clavesDe(v, salida);
      }
    }
    return salida;
  }

  const esFuente = (nombre: string) => /\.tsx?$/.test(nombre) && !nombre.includes('.test.');

  function fuentes(dir: string): string[] {
    return readdirSync(dir).flatMap((entrada) => {
      const p = join(dir, entrada);
      if (statSync(p).isDirectory()) return entrada === 'node_modules' ? [] : fuentes(p);
      return esFuente(entrada) ? [p] : [];
    });
  }

  it('ninguna clave nueva del ruleset queda sin consumir', () => {
    const raiz = join(import.meta.dirname, '..', '..', '..');
    const archivos = [
      ...fuentes(join(raiz, 'packages', 'engine', 'src')),
      // El dominio también lee del ruleset cuando se le pasa un bloque entero
      // (`estimarMaximo` recibe `oneRepMax` y lee `maxRir`).
      ...fuentes(join(raiz, 'packages', 'domain', 'src')),
      ...fuentes(join(raiz, 'apps', 'web', 'src')),
    ];
    // El esquema zod nombra todas las claves por definición: si contara, ninguna
    // daría nunca por muerta.
    const codigo = archivos
      .filter((p) => !p.endsWith(join('engine', 'src', 'ruleset.ts')))
      .map((p) => readFileSync(p, 'utf8'))
      .join('\n');
    // `ruleset.ts` también consume, pero solo fuera de las líneas del esquema.
    const esquema = readFileSync(join(raiz, 'packages', 'engine', 'src', 'ruleset.ts'), 'utf8')
      .split('\n')
      .filter((linea) => !/:\s*z\.|^\s*z\./.test(linea))
      .join('\n');

    // Los valores de enum del dominio (`day_after`, `in_season`, …) son claves
    // del ruleset pero el motor las alcanza por índice, no por nombre literal:
    // buscarlas en el código las daría por muertas siempre.
    const enums = new Set(
      readFileSync(join(raiz, 'packages', 'domain', 'src', 'enums.ts'), 'utf8').match(
        /'[a-z_]+'/g,
      ) ?? [],
    );

    // Se lee el JSON crudo, no `V1_RESEARCH`: zod descarta en silencio las
    // claves que no están en el esquema, y una clave escrita que el parseo tira
    // es aún más invisible que una que llega y nadie usa.
    const crudo: unknown = JSON.parse(
      readFileSync(join(raiz, 'packages', 'engine', 'src', 'rulesets', 'v1-research.json'), 'utf8'),
    );

    const candidatas = [...clavesDe(crudo)]
      .filter((k) => !ESTRUCTURALES.has(k) && k.length > 3)
      .filter((k) => !DEUDA.has(k) && !enums.has(`'${k}'`));

    const sinConsumir = candidatas
      .filter((k) => !codigo.includes(k) && !esquema.includes(k))
      .sort();

    expect(sinConsumir).toEqual([]);

    // Nombrar una clave no es leerla. `intensityPct1RM` pasó este test durante
    // toda su vida porque el motor la **escribe** una vez, en el ajuste por
    // edad, y `includes` no distingue un lado del otro del `=`. Son 36 bandas
    // curadas desde la investigación que no llegan a ninguna pantalla.
    //
    // Una lectura se ve: es un acceso a propiedad, o una desestructuración.
    // Escribirla es `clave:` dentro de un objeto que se arma, y eso solo.
    const todo = `${codigo}\n${esquema}`;
    const seLee = (k: string) =>
      new RegExp(`\\.\\s*${k}\\b|\\[['"\`]${k}['"\`]\\]`).test(todo) ||
      new RegExp(`\\{[^{}]*\\b${k}\\b[^{}]*\\}\\s*=[^=]`).test(todo);

    const soloEscritas = candidatas.filter((k) => !soloEscritas_permitidas.has(k) && !seLee(k));
    expect(soloEscritas.sort()).toEqual([]);
  });

  it('la deuda listada sigue siendo deuda: si algo se conectó, hay que sacarlo de la lista', () => {
    const presentes = clavesDe(V1_RESEARCH);
    const yaNoEstan = [...DEUDA].filter((k) => !presentes.has(k));
    expect(yaNoEstan).toEqual([]);
  });

  /**
   * La otra forma de estar muerto: la clave se lee, pero una entrada no.
   *
   * El barrido de arriba busca cada **clave** del ruleset en el código, y eso
   * deja pasar un catálogo con entradas que nadie referencia. `cardio.sessions`
   * se lee —`cardioPrescription` la recorre— así que la clave pasa el chequeo,
   * pero cada sesión se alcanza solo si algún slot de alguna plantilla la nombra
   * por `cardioSessionId`, y eso nadie lo verificaba.
   *
   * Encontrado así: `continuo_largo_z2`, la sesión de 60 minutos en zona 2, está
   * escrita con su zona y su duración y **ninguna plantilla la referencia**. Las
   * otras dos sí (`continuo_z2` en "Continuo", `intervalos_4x4` en
   * "Intervalos"), lo que hace el hueco más difícil de ver: el bloque funciona,
   * solo que una de sus tres entradas no existe para nadie.
   */
  it('cada sesión de cardio es alcanzable desde alguna plantilla', () => {
    const definidas = (V1_RESEARCH.cardio?.sessions ?? []).map((s) => s.id);
    const referenciadas = new Set(
      V1_RESEARCH.templates.flatMap((t) =>
        t.sessions.flatMap((s) =>
          s.slots.flatMap((sl) => (sl.cardioSessionId ? [sl.cardioSessionId] : [])),
        ),
      ),
    );

    // Verde y vacío no sirve: sin sesiones definidas no habría nada que mirar.
    expect(definidas.length).toBeGreaterThan(0);

    const inalcanzables = definidas.filter((id) => !referenciadas.has(id));
    expect(
      inalcanzables,
      'hay sesiones de cardio escritas que ninguna plantilla referencia',
    ).toEqual(['continuo_largo_z2']);
  });

  /** Y al revés: una plantilla no puede apuntar a una sesión que no existe. */
  it('ninguna plantilla referencia una sesión de cardio inexistente', () => {
    const definidas = new Set((V1_RESEARCH.cardio?.sessions ?? []).map((s) => s.id));
    const colgadas = V1_RESEARCH.templates.flatMap((t) =>
      t.sessions.flatMap((s) =>
        s.slots.flatMap((sl) =>
          sl.cardioSessionId && !definidas.has(sl.cardioSessionId)
            ? [`${t.id}/${s.label}: ${sl.cardioSessionId}`]
            : [],
        ),
      ),
    );
    expect(colgadas).toEqual([]);
  });
});

/**
 * EL ID ES PARA EL MOTOR, EL LABEL ES PARA EL SOCIO
 *
 * `sports.catalog` tiene las dos cosas en la misma entrada, y hasta hace poco
 * eso no importaba: el onboarding guardaba texto libre y el label no se mostraba
 * en ninguna pantalla. Ahora el paso 1 es una lista hecha con estos labels y el
 * perfil los lee de acá, así que son texto visible y les corresponde la
 * convención de texto visible — castellano con tildes.
 *
 * Los ids no: son la clave con la que el motor busca (`catalog.find`) y lo que
 * viaja a `user_goals.sport`. Si un id llevara tilde, cualquier lugar que lo
 * escriba a mano —una URL, un script de carga, una consulta— tiene una forma
 * silenciosa de fallar, porque el motor no encuentra y sigue sin deporte.
 */
describe('el catálogo de deportes', () => {
  const catalogo = V1_RESEARCH.sports?.catalog ?? [];

  it('tiene deportes', () => {
    expect(catalogo.length).toBeGreaterThan(5);
  });

  it('los ids son ascii en minúscula, para que se puedan escribir a mano', () => {
    const raros = catalogo.filter((d) => !/^[a-z0-9_]+$/.test(d.id)).map((d) => d.id);
    expect(raros).toEqual([]);
  });

  it('no hay dos deportes con el mismo id ni con el mismo nombre', () => {
    expect(new Set(catalogo.map((d) => d.id)).size).toBe(catalogo.length);
    expect(new Set(catalogo.map((d) => d.label)).size).toBe(catalogo.length);
  });

  it('ningún label es el id con otro nombre', () => {
    // Un label igual a su id es un label que nadie escribió: el socio termina
    // leyendo el identificador. Ya pasó cuatro veces en este proyecto con
    // objetivos, músculos, zonas y patrones.
    const sinTraducir = catalogo.filter((d) => d.label === d.id).map((d) => d.id);
    expect(sinTraducir).toEqual([]);
  });

  it('las palabras que en castellano llevan tilde la llevan', () => {
    // No se puede revisar la ortografía de un label arbitrario, pero sí se puede
    // fijar que ninguno sea la forma sin tilde de una palabra que la lleva. Esta
    // lista salió de leer los 26: siete estaban sin tilde, incluido "Futbol",
    // que es el deporte más probable del gimnasio.
    const sinTilde = ['Futbol', 'Padel', 'Voley', 'Basquet', 'Beisbol', 'Natacion', 'Triatlon'];
    const mal = catalogo.filter((d) => sinTilde.includes(d.label)).map((d) => d.label);
    expect(mal).toEqual([]);
  });
});
