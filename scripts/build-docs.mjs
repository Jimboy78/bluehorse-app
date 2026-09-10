#!/usr/bin/env node
/**
 * LA INVESTIGACIÓN, LEÍBLE DESDE LA APP
 *
 * Blue Horse dice que los números de sus planes salen de investigación. La
 * pantalla de evidencia ya muestra los papers; esto muestra **lo que
 * escribimos nosotros al leerlos**: qué se tomó de cada uno, qué se descartó,
 * dónde la evidencia no alcanzaba y qué se decidió igual.
 *
 * Los documentos van **como están**, sin reescribir para que suenen mejor. Son
 * notas de trabajo, con lenguaje técnico y con los errores que se encontraron
 * escritos al lado — incluidas tres citas fabricadas por los agentes de
 * investigación. Maquillarlos sería lo contrario de mostrarlos.
 *
 * ## Por qué bloques y no HTML
 *
 * `marked` acá se usa solo para **partir** el markdown (`marked.lexer`), no
 * para generar HTML. La app recibe una estructura de bloques y los dibuja con
 * sus propios componentes: eso evita `dangerouslySetInnerHTML` y deja que cada
 * tipo de bloque use la tipografía de la app en vez de estilos genéricos.
 * `marked` queda como dependencia de desarrollo — no viaja al navegador.
 *
 * ## Por qué un archivo por documento
 *
 * Son 190 KB de markdown. En un solo JSON, abrir un documento bajaría los
 * veintitrés. Cada uno va a su archivo y la app los carga cuando se abren; el
 * índice, que es lo único que se lee siempre, pesa unos pocos KB.
 *
 * Uso: `npm run docs`
 */

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { marked } from 'marked';

const ORIGEN = 'docs/research';
const DESTINO = 'apps/web/src/content';
const CARPETA_DOCS = join(DESTINO, 'docs');

/**
 * `PROMPTS.md` queda afuera: es el texto con el que se le encargó la búsqueda
 * a los agentes, no algo que alguien vaya a leer para aprender. Todo lo demás
 * entra, **incluida la auditoría** — es el documento que dice qué estaba mal,
 * y sacarlo sería justo lo contrario de blanquear.
 */
const EXCLUIDOS = new Set(['PROMPTS.md']);

/** Los que no empiezan con número, con la posición que les toca en la lista. */
const SIN_NUMERO = {
  'README.md': { id: 'metodo', orden: 0 },
  'AUDITORIA-MOTOR.md': { id: 'auditoria', orden: 99 },
};

/**
 * Títulos escritos a mano para los documentos que no tienen uno usable.
 *
 * Los cinco primeros son de la tanda inicial de investigación, que salió con
 * la estructura de encabezados que le dio el modelo: `01` a `03` no tienen
 * ningún `#`, y `04` y `05` tienen cuatro y cinco, uno por sección. En los dos
 * casos no hay un encabezado que sirva de título, y usar el nombre del archivo
 * dejaba "03-progresion-descarga" como título en pantalla.
 *
 * La alternativa era editarles el encabezado a los documentos. No se hace: son
 * el texto tal como se recibió, y esta pantalla existe para mostrarlos así.
 */
const TITULOS_A_MANO = {
  '01-fuerza-hipertrofia-potencia.md': 'Fuerza, hipertrofia y potencia',
  '02-cardio-resistencia-recomposicion.md': 'Cardio, resistencia y recomposición',
  '03-progresion-descarga.md': 'Progresión de carga y descargas',
  '04-individualizacion-seguridad.md': 'Individualización y seguridad',
  '05-seguridad-reforzada.md': 'Seguridad: cribado, alarmas y poblaciones especiales',
};

// ------------------------------------------------------------------ inline

/**
 * Un tramo de texto con su forma. Los nombres van en castellano igual que el
 * resto de lo que la app dibuja: esto lo consume un componente de React, no
 * una librería de markdown.
 */
function spans(tokens) {
  const salida = [];

  for (const tk of tokens ?? []) {
    switch (tk.type) {
      case 'text':
      case 'escape':
        // Un `text` con hijos es un contenedor (pasa dentro de las celdas de
        // tabla y de los ítems de lista): se baja un nivel en vez de tomar el
        // texto crudo, que traería los asteriscos sin interpretar.
        if (tk.tokens?.length) salida.push(...spans(tk.tokens));
        else salida.push({ t: 'texto', v: blando(tk.text) });
        break;
      case 'strong':
        salida.push({ t: 'fuerte', v: plano(tk.tokens) });
        break;
      case 'em':
        salida.push({ t: 'enfasis', v: plano(tk.tokens) });
        break;
      case 'codespan':
        salida.push({ t: 'codigo', v: tk.text });
        break;
      case 'del':
        salida.push({ t: 'tachado', v: plano(tk.tokens) });
        break;
      case 'link':
        salida.push({ t: 'enlace', v: plano(tk.tokens), href: tk.href });
        break;
      case 'br':
        salida.push({ t: 'salto' });
        break;
      case 'space':
        break;
      default:
        if (tk.tokens?.length) salida.push(...spans(tk.tokens));
        else if (tk.text) salida.push({ t: 'texto', v: blando(tk.text) });
    }
  }

  return salida;
}

/** El texto sin formato de un grupo de tokens. Para negrita, cursiva y enlaces. */
function plano(tokens) {
  return blando(
    (tokens ?? []).map((tk) => (tk.tokens?.length ? plano(tk.tokens) : (tk.text ?? ''))).join(''),
  );
}

/**
 * Los documentos están escritos con el margen a 100 columnas, así que casi
 * toda oración larga trae saltos de línea en el medio. En markdown eso es un
 * espacio, no un salto — y guardarlos tal cual haría que la app cortara los
 * renglones donde los cortó el editor de texto, no donde termina la pantalla
 * del teléfono. Un salto de verdad se escribe con dos espacios al final y
 * `marked` lo devuelve como token `br`, que sí se conserva.
 */
function blando(texto) {
  return texto.replace(/\s*\n\s*/g, ' ');
}

// ------------------------------------------------------------------ bloques

function bloques(tokens) {
  const salida = [];

  for (const tk of tokens ?? []) {
    const bloque = unBloque(tk);
    if (bloque) salida.push(bloque);
  }

  return salida;
}

function unBloque(tk) {
  switch (tk.type) {
    case 'heading':
      return { b: 'titulo', nivel: tk.depth, spans: spans(tk.tokens) };
    case 'paragraph':
      return { b: 'parrafo', spans: spans(tk.tokens) };
    case 'blockquote':
      // Las citas son los fragmentos textuales de los papers: es el bloque que
      // más importa que se distinga del resto.
      return { b: 'cita', bloques: bloques(tk.tokens) };
    case 'list':
      return {
        b: 'lista',
        ordenada: !!tk.ordered,
        items: tk.items.map((it) => bloques(it.tokens)),
      };
    case 'table':
      return {
        b: 'tabla',
        encabezado: tk.header.map((c) => spans(c.tokens)),
        filas: tk.rows.map((fila) => fila.map((c) => spans(c.tokens))),
      };
    case 'code':
      return { b: 'codigo', texto: tk.text };
    case 'hr':
      return { b: 'separador' };
    case 'text':
      // Aparece dentro de los ítems de lista sueltos.
      return { b: 'parrafo', spans: spans(tk.tokens ?? [{ type: 'text', text: tk.text }]) };
    default:
      return null;
  }
}

// ------------------------------------------------------------------ armado

/**
 * El título del documento, y si ese encabezado hay que sacarlo del cuerpo.
 *
 * Solo cuenta como título un `#` que sea **el único** del archivo. Con varios
 * —pasa en `04` y `05`, que tienen uno por sección— el primero no es el título
 * del documento sino el de su primera parte, y quedaría anunciando algo que no
 * es. Ahí el título sale de `TITULOS_A_MANO` y ningún encabezado se saca.
 */
function tituloDe(archivo, bs) {
  const escrito = TITULOS_A_MANO[archivo];
  if (escrito) return { titulo: escrito, quitarH1: false };

  const h1 = bs.filter((b) => b.b === 'titulo' && b.nivel === 1);
  if (h1.length === 1) return { titulo: textoDe(h1[0].spans), quitarH1: true };

  // Sin título usable y sin uno escrito a mano: se frena. Publicar el nombre
  // del archivo como título es lo que estaba mal antes, y en silencio.
  throw new Error(
    `${archivo} no tiene un título usable (${h1.length} encabezados de nivel 1). ` +
      'Agregale uno a TITULOS_A_MANO en scripts/build-docs.mjs.',
  );
}

/**
 * La línea que se muestra en el índice: el primer párrafo con algo de
 * sustancia. Los documentos de la auditoría arrancan con una línea corta de
 * fecha ("Auditoría del 9 de septiembre, hueco 6 de 6") que no dice de qué
 * trata, así que se saltea lo muy corto.
 */
function resumenDe(bs) {
  const parrafo = bs.find((b) => b.b === 'parrafo' && textoDe(b.spans).length > 90);
  if (!parrafo) return null;
  const texto = textoDe(parrafo.spans);
  return texto.length > 240 ? `${texto.slice(0, 237).trimEnd()}…` : texto;
}

function textoDe(sp) {
  return sp
    .map((s) => (s.t === 'salto' ? ' ' : (s.v ?? '')))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function metaDe(archivo, bs) {
  const { titulo, quitarH1 } = tituloDe(archivo, bs);
  const fijo = SIN_NUMERO[archivo];
  if (fijo) return { id: fijo.id, orden: fijo.orden, titulo, quitarH1 };

  return {
    id: archivo.replace(/\.md$/, ''),
    orden: Number.parseInt(archivo.slice(0, 2), 10),
    titulo,
    quitarH1,
  };
}

function main() {
  const archivos = readdirSync(ORIGEN)
    .filter((f) => f.endsWith('.md') && !EXCLUIDOS.has(f))
    .sort();

  rmSync(CARPETA_DOCS, { recursive: true, force: true });
  mkdirSync(CARPETA_DOCS, { recursive: true });

  const indice = [];

  for (const archivo of archivos) {
    const crudo = readFileSync(join(ORIGEN, archivo), 'utf8');
    const bs = bloques(marked.lexer(crudo));
    const { id, orden, titulo, quitarH1 } = metaDe(archivo, bs);

    // El H1 que se usó de título no se guarda con el cuerpo: la pantalla ya lo
    // dibuja arriba, y dejarlo adentro lo mostraría dos veces. Los documentos
    // con varios encabezados de nivel 1 los conservan todos: ahí ninguno es el
    // título, son las secciones.
    const cuerpo = quitarH1 ? bs.filter((b) => !(b.b === 'titulo' && b.nivel === 1)) : bs;

    writeFileSync(
      join(CARPETA_DOCS, `${id}.generated.json`),
      // Sin sangria: son ~490 KB entre los veintitres y esto no se lee a mano,
      // se lee regenerando el archivo.
      `${JSON.stringify({ id, titulo, bloques: cuerpo })}\n`,
    );

    indice.push({
      id,
      orden,
      titulo,
      resumen: resumenDe(cuerpo),
      archivo,
      bloques: cuerpo.length,
    });
  }

  indice.sort((a, b) => a.orden - b.orden);
  writeFileSync(
    join(DESTINO, 'docs-index.generated.json'),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), docs: indice }, null, 1)}\n`,
  );

  const sinResumen = indice.filter((d) => !d.resumen).map((d) => d.archivo);
  console.log(`${indice.length} documentos escritos en ${CARPETA_DOCS}`);
  if (sinResumen.length > 0) console.log(`Sin resumen: ${sinResumen.join(', ')}`);
}

main();
