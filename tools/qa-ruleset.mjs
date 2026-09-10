/**
 * EL RULESET CONTRA SÍ MISMO
 *
 * La regla 3 dice que ningún número de entrenamiento vive en el código. El
 * corolario incómodo es que el ruleset se vuelve un archivo de 150 claves donde
 * una que sobra no molesta a nadie y una que falta rompe en silencio.
 *
 * Dos preguntas, las dos difíciles de contestar leyendo:
 *
 *   `qa ruleset`         ¿alguien consume cada clave? ¿qué confianza declara cada bloque?
 *   `qa diff v0 v1`      ¿qué cambia de verdad entre dos versiones?
 *
 * El diff es el que pediste para pulir: comparar dos JSON con los ojos es cómo
 * se cuelan los cambios de un número que nadie quiso tocar. Acá sale una lista
 * de qué se agregó, qué se fue y qué cambió de valor, con el camino completo.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chequeo, hallazgo } from './lib/reporte.mjs';

/**
 * `fileURLToPath` y no `.pathname`: la carpeta del proyecto se llama
 * "Projects J", con un espacio, y `.pathname` lo devuelve como `%20`. La ruta
 * resultante no existe y el error que tira (`ENOENT` con `%20` adentro) no dice
 * en ningún lado que el problema sea el espacio.
 */
const RAIZ = fileURLToPath(new URL('..', import.meta.url));

export function rutaDeRuleset(nombre) {
  if (nombre.includes('/') || nombre.endsWith('.json')) return nombre;
  return `${RAIZ}packages/engine/src/rulesets/${nombre}.json`;
}

export function leerRuleset(nombre) {
  return JSON.parse(readFileSync(rutaDeRuleset(nombre), 'utf8'));
}

/** Aplana un objeto a `camino → valor`. Los arrays quedan enteros: `[85, 100]` es un rango, no dos claves. */
function aplanar(obj, prefijo = '', salida = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const camino = prefijo ? `${prefijo}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      aplanar(v, camino, salida);
    } else {
      salida.set(camino, v);
    }
  }
  return salida;
}

function mostrar(v) {
  if (Array.isArray(v)) {
    const dentro = v.map((x) =>
      typeof x === 'string' && x.length > 24 ? `${x.slice(0, 21)}…` : x,
    );
    const texto = dentro.join('–');
    return `[${texto.length > 60 ? `${dentro.length} elementos` : texto}]`;
  }
  if (typeof v === 'string' && v.length > 40) return `${v.slice(0, 37)}…`;
  return String(v);
}

/**
 * Los caminos que son prosa y no prescripción.
 *
 * Un diff de rulesets tiene que mostrar **números que cambiaron**: 3 series
 * pasaron a 4, el RIR bajó de 2 a 1. Las notas explicativas cambian de párrafo
 * entero en cada curaduría, y volcarlas tapa exactamente lo que se vino a
 * mirar — la primera corrida imprimió las dos listas de `notes` completas, unas
 * cuarenta líneas, con seis cambios de número abajo.
 *
 * Se cuentan igual, y `--prosa` las muestra.
 */
const ES_PROSA = /(^|\.)(notes?|confidenceNote|rationale|source|description|label)(\.|$)/;

/**
 * Qué cambia entre dos rulesets.
 *
 * Los caminos que solo existen de un lado se reportan aparte de los que
 * cambiaron de valor: agregar una clave y cambiar un número son errores
 * distintos —el primero puede ser una función nueva sin consumir, el segundo es
 * una prescripción distinta para el socio—.
 */
/**
 * Junta hallazgos salteando la prosa, y lleva la cuenta de lo salteado.
 *
 * Existe para que `correlDiff` no tenga que repetir el `if (es prosa) contar,
 * si no agregar` en los tres recorridos: con eso adentro, la función pasaba de
 * la complejidad 15 que permite el linter.
 */
function juntador(prosa) {
  let omitidas = 0;
  return {
    agregar(lista, camino, detalle) {
      if (!prosa && ES_PROSA.test(camino)) omitidas++;
      else lista.push(hallazgo(camino, null, detalle));
    },
    get omitidas() {
      return omitidas;
    },
  };
}

export function correrDiff(nombreA, nombreB, { prosa = false } = {}) {
  const a = aplanar(leerRuleset(nombreA));
  const b = aplanar(leerRuleset(nombreB));

  const soloA = [];
  const soloB = [];
  const cambiados = [];
  const junta = juntador(prosa);

  for (const [camino, valor] of a) {
    if (!b.has(camino)) {
      junta.agregar(soloA, camino, mostrar(valor));
    } else if (JSON.stringify(b.get(camino)) !== JSON.stringify(valor)) {
      junta.agregar(cambiados, camino, `${mostrar(valor)} → ${mostrar(b.get(camino))}`);
    }
  }
  for (const camino of b.keys()) {
    if (!a.has(camino)) junta.agregar(soloB, camino, mostrar(b.get(camino)));
  }
  const prosaOmitida = junta.omitidas;

  const sufijo = prosaOmitida > 0 ? ` (+${prosaOmitida} de prosa, --prosa para verlas)` : '';
  return [
    chequeo(`solo en ${nombreA}`, a.size, soloA),
    chequeo(`solo en ${nombreB}`, b.size, soloB),
    chequeo(`cambió de valor${sufijo}`, a.size, cambiados),
  ];
}

/**
 * Los valores de los enums del dominio, que el ruleset usa como **claves**.
 *
 * El motor no los escribe nunca: entra por `params.byLevel[level]` o
 * `sports.matchDay[input.state]`, con el valor que viene del socio. Buscarlos
 * como texto en el código da cero y parecen claves muertas — la primera corrida
 * marcó ocho así, entre ellas `beginner` y `endurance`, que son de los caminos
 * más transitados que hay.
 *
 * Es la misma trampa que `loadMultiplier`, que también pareció muerta y se
 * consume vía `detrainingMultiplier`. Una clave "sin consumir" se verifica
 * antes de tocarla.
 */
function valoresDeEnums() {
  let fuente = '';
  try {
    fuente = readFileSync(`${RAIZ}packages/domain/src/enums.ts`, 'utf8');
  } catch {
    return new Set();
  }
  const valores = new Set();
  for (const m of fuente.matchAll(/'([a-z][a-z0-9_]*)'/g)) valores.add(m[1]);
  return valores;
}

/** Las claves del ruleset que ningún archivo del motor nombra. */
export function correrConsumo(nombre = 'v1-research') {
  const ruleset = leerRuleset(nombre);
  const dinamicas = valoresDeEnums();
  const fuente = ['ruleset.ts', 'placeholder-engine.ts', 'contract.ts', 'rng.ts']
    .map((f) => {
      try {
        return readFileSync(`${RAIZ}packages/engine/src/${f}`, 'utf8');
      } catch {
        return '';
      }
    })
    .join('\n');

  // Solo la última parte del camino: el motor escribe `params.deload.stallSessions`,
  // no el camino entero desde la raíz.
  const claves = new Set();
  for (const camino of aplanar(ruleset).keys()) {
    for (const parte of camino.split('.')) {
      if (/^[a-z][A-Za-z0-9]*$/.test(parte)) claves.add(parte);
    }
  }

  const sinConsumir = [];
  let porEnum = 0;
  for (const clave of claves) {
    const re = new RegExp(`\\b${clave}\\b`, 'g');
    if (re.test(fuente)) continue;
    if (dinamicas.has(clave)) porEnum++;
    else sinConsumir.push(hallazgo(clave));
  }

  const sufijo = porEnum > 0 ? ` (${porEnum} son valores de enum, entran por clave dinámica)` : '';
  return [chequeo(`claves de ${nombre} que el motor no nombra${sufijo}`, claves.size, sinConsumir)];
}

/**
 * Qué confianza declara cada bloque (regla 4).
 *
 * No es un chequeo de error: es la foto que hay que poder sacar sin abrir el
 * JSON. Un bloque `low` no está mal — está mal que nadie sepa que es `low`.
 */
export function correrConfianza(nombre = 'v1-research') {
  const ruleset = leerRuleset(nombre);
  const bloques = [];

  function caminar(obj, camino = '') {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return;
    if (typeof obj.confidence === 'string') bloques.push({ camino, nivel: obj.confidence });
    for (const [k, v] of Object.entries(obj)) caminar(v, camino ? `${camino}.${k}` : k);
  }
  caminar(ruleset);

  const flojos = bloques
    .filter((b) => b.nivel === 'low')
    .map((b) => hallazgo(b.camino, null, 'avisa en pantalla'));

  const medios = bloques.filter((b) => b.nivel === 'medium').length;
  const altos = bloques.filter((b) => b.nivel === 'high').length;

  return [
    chequeo(
      `bloques con evidencia floja — ${altos} sólidos, ${medios} limitados`,
      bloques.length,
      flojos,
    ),
  ];
}
