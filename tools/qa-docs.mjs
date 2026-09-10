/**
 * EL RULESET CONTRA LA INVESTIGACIÓN QUE DICE SEGUIR
 *
 * El ruleset `v1-research` se curó a mano desde `docs/research/`. "A mano"
 * quiere decir que alguien leyó una tabla y escribió el número en un JSON, y
 * eso se puede equivocar de dos formas que no dejan rastro: copiar mal un
 * número, o cambiar el JSON después sin volver a la tabla.
 *
 * Las tablas de la investigación tienen forma fija:
 *
 *   | **Hypertrophy – primary: reps** | 6–12 | Guías clásicas… | ALTO |
 *
 * Eso mapea a `prescription.hypertrophy.default.primary.repsMin/repsMax`. Este
 * chequeo hace ese mapeo para cada fila que puede, y avisa cuando el ruleset
 * dice otra cosa que el documento.
 *
 * Lo que NO hace es opinar sobre la investigación: si la tabla dice 4 series y
 * el ruleset dice 4 series, está bien aunque el paper detrás sea flojo. Para
 * eso está el nivel de confianza, que se reporta aparte.
 *
 * Una diferencia no siempre es un error. El propio ruleset documenta al menos
 * una desviación deliberada: fuerza avanzada usa 4 series en el principal y no
 * 5 —el tope del rango— porque con 5 y tres sesiones semanales, glúteos y
 * dorsales pasaban el techo de 15 series semanales que la misma investigación
 * marca. Por eso la salida dice "el documento dice X, el ruleset dice Y", y la
 * decide una persona.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chequeo, hallazgo } from './lib/reporte.mjs';
import { leerRuleset } from './qa-ruleset.mjs';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DOCS = join(RAIZ, 'docs', 'research');

/** Los objetivos como los escribe la investigación → como se llaman en el ruleset. */
const OBJETIVOS = {
  strength: 'strength',
  hypertrophy: 'hypertrophy',
  power: 'power',
  endurance: 'endurance',
  cardio: 'cardio',
  recomposition: 'recomposition',
  recomposición: 'recomposition',
  resistencia: 'endurance',
};

const RANURAS = new Set(['primary', 'secondary', 'isolation']);

/**
 * Cómo se llama cada parámetro en la tabla → la clave del ruleset.
 *
 * Las tablas no son uniformes: "sets", "sets por ejercicio" y "series" son el
 * mismo parámetro escrito por tres agentes distintos. Se normaliza acá en vez
 * de pedirle consistencia retroactiva a veintiún documentos.
 */
function claveDelParametro(texto) {
  const t = texto.toLowerCase().trim();
  if (/^(sets|series)( por ejercicio)?$/.test(t)) return 'sets';
  if (/^(reps|repeticiones)/.test(t)) return 'reps';
  if (/^rir/.test(t)) return 'rirTarget';
  if (/^descanso/.test(t)) return 'restSeconds';
  if (/^intensidad/.test(t)) return 'intensityPct1RM';
  return null;
}

/**
 * Los números de una celda, en orden de aparición.
 *
 * Las celdas mezclan el valor con su rango y sus unidades: "180 segundos
 * (3 min; rango 120–240)". El valor prescripto es **el primero**; lo de los
 * paréntesis es el rango que la evidencia admite, y se usa para no marcar
 * como error una diferencia que cae adentro de ese rango.
 */
function numerosDe(celda) {
  const limpia = celda.replace(/[–—]/g, '-');
  // Sin signo: "1–5 repeticiones" se normaliza a "1-5", y un `-?\d+` leía eso
  // como 1 y −5. Ninguna prescripción es negativa, así que el guion siempre
  // separa, nunca resta.
  return [...limpia.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));
}

/** El rango que la celda declara entre paréntesis, si declara alguno. */
function rangoDe(celda) {
  const m = celda.replace(/[–—]/g, '-').match(/rango\s*(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)/i);
  return m ? [Number(m[1].replace(',', '.')), Number(m[2].replace(',', '.'))] : null;
}

/** Una fila de tabla convertida en `{objetivo, ranura, parametro}`, o `null` si no es de las nuestras. */
function interpretarFila(linea, archivo) {
  if (!linea.startsWith('| **')) return null;

  const celdas = linea.split('|').map((c) => c.trim());
  const titulo = (celdas[1] ?? '').replace(/\*\*/g, '');
  const m = titulo.replace(/[–—]/g, '-').match(/^(\w+)\s*-\s*(\w+):\s*(.+)$/);
  if (!m) return null;

  const objetivo = OBJETIVOS[m[1].toLowerCase()];
  const ranura = m[2].toLowerCase();
  const parametro = claveDelParametro(m[3]);
  if (!objetivo || !RANURAS.has(ranura) || !parametro) return null;

  return {
    archivo,
    objetivo,
    ranura,
    parametro,
    celda: celdas[2] ?? '',
    confianza: (celdas[4] ?? '').toUpperCase(),
  };
}

/** Las filas `| **Goal – slot: param** | valor | … | CONFIANZA |` de todos los documentos. */
function filasDocumentadas() {
  const filas = [];
  for (const archivo of readdirSync(DOCS).filter((f) => f.endsWith('.md'))) {
    const texto = readFileSync(join(DOCS, archivo), 'utf8');
    for (const linea of texto.split('\n')) {
      const fila = interpretarFila(linea, archivo);
      if (fila) filas.push(fila);
    }
  }
  return filas;
}

/** El bloque del ruleset para ese objetivo y esa ranura. `byLevel` no se mira: la tabla es el default. */
function delRuleset(ruleset, objetivo, ranura) {
  return ruleset.prescription?.[objetivo]?.default?.[ranura] ?? null;
}

/** Compara una fila documentada contra el ruleset. Devuelve el hallazgo, o `null` si coinciden. */
function comparar(fila, ruleset) {
  const bloque = delRuleset(ruleset, fila.objetivo, fila.ranura);
  if (!bloque) {
    return hallazgo(
      `${fila.objetivo}.${fila.ranura}`,
      fila.archivo,
      'el ruleset no tiene ese bloque',
    );
  }

  const documentados = numerosDe(fila.celda);
  if (documentados.length === 0) return null;

  const donde = `${fila.objetivo}.${fila.ranura}.${fila.parametro}`;

  // Los que son un par (reps mín/máx, intensidad mín/máx) se comparan de a dos.
  if (fila.parametro === 'reps') {
    return comparaPar(donde, fila, [bloque.repsMin, bloque.repsMax], documentados.slice(0, 2));
  }
  if (fila.parametro === 'intensityPct1RM') {
    return comparaPar(donde, fila, bloque.intensityPct1RM ?? [], documentados.slice(0, 2));
  }

  const enElRuleset = bloque[fila.parametro];
  if (enElRuleset === undefined) return null;

  const documentado = documentados[0];
  if (enElRuleset === documentado) return null;

  // Adentro del rango que la propia tabla admite: es una eleccion, no un error.
  const rango = rangoDe(fila.celda);
  const adentro = rango && enElRuleset >= rango[0] && enElRuleset <= rango[1];
  return hallazgo(
    donde,
    fila.archivo,
    `doc ${documentado}, ruleset ${enElRuleset}${adentro ? ` (dentro del rango ${rango[0]}-${rango[1]})` : ''}`,
  );
}

function comparaPar(donde, fila, enElRuleset, documentados) {
  if (documentados.length < 2 || enElRuleset.length < 2) return null;
  const [a, b] = enElRuleset;
  const [da, db] = documentados;
  if (a === da && b === db) return null;
  return hallazgo(donde, fila.archivo, `doc ${da}-${db}, ruleset ${a}-${b}`);
}

/**
 * DOCUMENTOS QUE PRESCRIBEN Y NO CITAN NADA
 *
 * `qa docs` compara el ruleset contra la tabla, y puede dar 100 % de
 * coincidencia sobre una tabla que no cita ninguna fuente. Eso es peor que una
 * diferencia: es una transcripción fiel de algo que no se puede verificar.
 *
 * Medido: `01-fuerza-hipertrofia-potencia.md` tiene **51 filas de tabla y cero
 * DOIs**, y es el documento que respalda las 36 prescripciones centrales —cada
 * serie, repetición, RIR y descanso de fuerza, hipertrofia y potencia—. Su
 * línea de "Fuentes" es prosa terminada en "etc.", aunque afirma citar
 * "autor, año, publicación y DOI/PMID". `05-seguridad-reforzada.md` está
 * igual, con 21 filas y ninguna cita.
 *
 * La consecuencia es de la regla dura 4 y se ve en pantalla:
 * `scripts/build-sources.mjs` arma `/evidencia` resolviendo los DOIs citados,
 * así que un socio que entra a comprobar de dónde sale su plan encuentra 51
 * papers y **ninguno** detrás de sus series y repeticiones.
 *
 * El DOI se busca en el texto entero y no solo en las tablas: en los
 * documentos que sí citan, la referencia va en un bloque `>` debajo de la
 * tabla, no adentro de la celda.
 */
function documentosSinCitar() {
  const hallazgos = [];
  let mirados = 0;

  for (const archivo of readdirSync(DOCS).filter((f) => /^\d/.test(f) && f.endsWith('.md'))) {
    const texto = readFileSync(join(DOCS, archivo), 'utf8');
    const filas = texto.split('\n').filter((l) => l.startsWith('| **')).length;
    if (filas === 0) continue;

    mirados++;
    const dois = new Set(texto.match(/10\.\d{4,9}\/[^\s)"',]+/g) ?? []);
    if (dois.size === 0) {
      hallazgos.push(hallazgo(archivo, null, `${filas} filas de tabla, ninguna fuente citada`));
    }
  }
  return chequeo('documentos que prescriben sin citar ninguna fuente', mirados, hallazgos);
}

export function correrContraDocs(nombre = 'v1-research') {
  const ruleset = leerRuleset(nombre);
  const filas = filasDocumentadas();

  const fuera = [];
  const dentroDelRango = [];

  for (const fila of filas) {
    const h = comparar(fila, ruleset);
    if (!h) continue;
    // Una diferencia que cae adentro del rango de la evidencia es una decisión
    // tomada, no un error de transcripción. Se listan aparte para que las que
    // sí son sospechosas no queden sepultadas entre ellas.
    (h.detalle?.includes('dentro del rango') ? dentroDelRango : fuera).push(h);
  }

  const flojas = filas
    .filter((f) => f.confianza.startsWith('BAJ') || f.confianza.startsWith('LOW'))
    .map((f) => hallazgo(`${f.objetivo}.${f.ranura}.${f.parametro}`, f.archivo, 'evidencia BAJA'));

  /**
   * Objetivos que el ruleset prescribe y ninguna tabla respalda.
   *
   * Solo `01-fuerza-hipertrofia-potencia.md` usa la convención
   * `| **Goal – slot: param** | valor |`. Los otros veinte documentos tienen
   * tablas de otra forma, o prosa. Para `endurance`, `cardio` y
   * `recomposition` eso significa que sus números salieron de un texto y no de
   * una fila comparable — que es exactamente lo que dicen las notas del
   * ruleset ("la investigación cubre resistencia aeróbica, no el trabajo de
   * sala con repeticiones altas").
   *
   * No es un error. Es la diferencia entre "verificado contra una tabla" y
   * "derivado de un texto", y tiene que estar a la vista y no descubrirse cada
   * vez que alguien pregunta de dónde sale un número.
   */
  const conTabla = new Set(filas.map((f) => f.objetivo));
  const sinRespaldo = Object.keys(ruleset.prescription ?? {})
    .filter((goal) => !conTabla.has(goal))
    .map((goal) => hallazgo(goal, null, 'sus números salen de prosa, no de una tabla comparable'));

  return [
    chequeo('el ruleset dice otra cosa que el documento', filas.length, fuera),
    chequeo('elegido dentro del rango de la evidencia', filas.length, dentroDelRango),
    documentosSinCitar(),
    chequeo('parámetros con evidencia declarada BAJA', filas.length, flojas),
    chequeo(
      'objetivos sin tabla que verificar',
      Object.keys(ruleset.prescription ?? {}).length,
      sinRespaldo,
    ),
  ];
}
