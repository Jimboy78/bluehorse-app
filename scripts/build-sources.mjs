/**
 * CATÁLOGO DE FUENTES, ARMADO DESDE LA INVESTIGACIÓN
 *
 * Recorre `docs/research/`, junta cada DOI citado, y resuelve título, autores,
 * año y revista contra Crossref. El resultado va a
 * `apps/web/src/content/sources.json`, que es lo que muestra la pantalla de
 * "En qué se basa".
 *
 * Por qué se genera y no se escribe a mano: los títulos y los autores son
 * justamente lo que un modelo inventa sin querer. Esta auditoría encontró tres
 * citas fabricadas y seis con autoría equivocada en una sola tanda de
 * investigación (ver la nota al pie de `17`, `18` y `20`). Resolver contra
 * Crossref hace que un DOI que no existe **falle acá** en vez de llegar a la
 * pantalla con un título verosímil al lado.
 *
 * Uso: node scripts/build-sources.mjs
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { exit } from 'node:process';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const researchDir = join(raiz, 'docs', 'research');
// `.generated.` para que el formateador lo deje en paz: es un artefacto, y su
// forma la decide este script, no biome (ver `biome.json`).
const salida = join(raiz, 'apps', 'web', 'src', 'content', 'sources.generated.json');

/** De qué habla cada documento, para agrupar en pantalla. */
const TEMAS = {
  '01': 'Fuerza, hipertrofia y potencia',
  '02': 'Cardio y resistencia',
  '03': 'Progresión y descarga',
  '04': 'Individualización y seguridad',
  '05': 'Seguridad',
  '06': 'Deporte y temporada',
  '07': 'Días de partido',
  '08': 'Edad',
  '09': 'Dolor y lesiones',
  10: 'Nivel de experiencia',
  11: 'Frecuencia semanal',
  12: 'Objetivo',
  13: 'Cardio e interferencia',
  14: 'Volver después de una pausa',
  15: 'Punto de partida',
  16: 'Tiempo bajo tensión',
  17: 'Lesión aguda',
  18: 'Énfasis excéntrico',
  19: 'Desentrenamiento aeróbico',
  20: 'Arranque sin test',
  21: 'Fragilidad',
  22: 'Carga de potencia',
  23: 'Resistencia muscular',
  24: 'Cobertura muscular',
  25: 'Cobertura del catalogo',
  26: 'ACSM 2026',
  27: 'Zonas sin regla',
  28: 'Lo que el socio lee',
  29: 'Intensidad sin leer',
};

// El `]` y el `(` cierran un enlace de markdown: sin ellos, un DOI escrito como
// `[10.1234/x](https://…)` se llevaba puesta la mitad de la URL.
const DOI_RE = /10\.\d{4,5}\/[^\s)\]`,;"']+/g;

/**
 * Las notas al pie donde se documentan las citas que NO entraron.
 *
 * Cada documento de la segunda vuelta cierra con una sección que dice qué citó
 * mal el informe de investigación: un DOI que resuelve a otro paper, una
 * autoría inventada. Esos DOIs están escritos ahí justamente para dejar
 * constancia de que se descartaron — publicarlos como fuentes de la app sería
 * el error opuesto y peor.
 */
const SECCION_DESCARTADAS = '## Nota sobre las fuentes';

function limpiar(doi) {
  return (
    doi
      // `~~` cierra un tachado de markdown y `/pdf` es la cola de una URL de
      // editorial: ninguno de los dos es parte del DOI.
      .replace(/~+$/, '')
      .replace(/\/(pdf|full|abstract)$/, '')
      .replace(/[.,;:]+$/, '')
  );
}

const excluidas = new Set();

/** Los DOIs de un documento, partidos entre los que respaldan y los descartados. */
function doisDe(texto) {
  const corte = texto.indexOf(SECCION_DESCARTADAS);
  const cuerpo = corte === -1 ? texto : texto.slice(0, corte);
  const pie = corte === -1 ? '' : texto.slice(corte);
  return {
    vivos: (cuerpo.match(DOI_RE) ?? []).map(limpiar),
    descartados: (pie.match(DOI_RE) ?? []).map(limpiar),
  };
}

function recolectar() {
  const porDoi = new Map();

  for (const archivo of readdirSync(researchDir).filter((f) => f.endsWith('.md'))) {
    // Un documento numerado sin entrada en TEMAS se salteaba en silencio: sus
    // DOIs no llegaban a `/evidencia` y el resumen final igual decía "51
    // resueltas", el mismo número de antes. La única señal era que el conteo no
    // se movía, que es justo lo que nadie mira. Ahora frena.
    const tema = TEMAS[archivo.slice(0, 2)];
    if (!tema) {
      if (/^\d\d-/.test(archivo)) {
        console.error(`Falta el tema de "${archivo}" en TEMAS (scripts/build-sources.mjs).`);
        console.error('Sin eso sus fuentes no aparecen en /evidencia.');
        exit(1);
      }
      continue;
    }

    const { vivos, descartados } = doisDe(readFileSync(join(researchDir, archivo), 'utf8'));

    for (const doi of vivos) {
      if (!porDoi.has(doi)) porDoi.set(doi, { doi, temas: new Set(), documentos: new Set() });
      porDoi.get(doi).temas.add(tema);
      porDoi.get(doi).documentos.add(archivo);
    }
    for (const doi of descartados) excluidas.add(doi);
  }

  // Una cita descartada en un documento no vale como fuente aunque otro la
  // mencione al pasar.
  for (const doi of excluidas) porDoi.delete(doi);

  return [...porDoi.values()];
}

/** Crossref devuelve entidades HTML crudas en títulos y revistas. */
function decodificar(texto) {
  if (!texto) return texto;
  return texto
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<\/?[a-z][^>]*>/gi, '');
}

/** Varias editoriales mandan los apellidos en mayúsculas. */
function apellido(nombre) {
  if (nombre !== nombre.toUpperCase()) return nombre;
  return nombre
    .toLowerCase()
    .replace(/(^|[\s'-])([a-záéíóúñ])/g, (_, sep, letra) => sep + letra.toUpperCase());
}

async function resolver(doi) {
  const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'blue-horse-app/1.0 (mailto:hola@bh)' },
  });
  if (!res.ok) return null;

  const { message } = await res.json();
  const autores = (message.author ?? [])
    .map((a) => a.family)
    .filter(Boolean)
    .map(apellido);
  return {
    title: decodificar((message.title ?? [])[0]) ?? null,
    authors: autores.slice(0, 3),
    moreAuthors: Math.max(0, autores.length - 3),
    year: (message.issued?.['date-parts'] ?? [[]])[0][0] ?? null,
    journal: decodificar((message['container-title'] ?? [])[0]) ?? null,
    type: message.type ?? null,
  };
}

const entradas = recolectar();
console.log(`${entradas.length} DOIs citados en docs/research/`);

const resueltas = [];
const fallidas = [];

for (const entrada of entradas) {
  const meta = await resolver(entrada.doi);
  if (!meta?.title) {
    fallidas.push(entrada.doi);
    console.warn(`  ✗ no resuelve: ${entrada.doi}`);
    continue;
  }
  resueltas.push({
    doi: entrada.doi,
    ...meta,
    temas: [...entrada.temas].sort(),
    documentos: [...entrada.documentos].sort(),
  });
  console.log(`  ✓ ${entrada.doi} — ${meta.title.slice(0, 60)}`);
  // Crossref pide no golpear en paralelo desde un script.
  await new Promise((r) => setTimeout(r, 120));
}

resueltas.sort((a, b) => (a.temas[0] ?? '').localeCompare(b.temas[0] ?? '', 'es'));

mkdirSync(dirname(salida), { recursive: true });
writeFileSync(
  salida,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString().slice(0, 10),
      resolved: resueltas.length,
      unresolved: fallidas,
      sources: resueltas,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

console.log(`\n${resueltas.length} resueltas, ${fallidas.length} sin resolver → ${salida}`);
if (fallidas.length > 0) {
  console.log('Sin resolver:', fallidas.join(', '));
}
