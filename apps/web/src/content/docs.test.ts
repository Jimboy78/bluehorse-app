import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import indice from './docs-index.generated.json' with { type: 'json' };

/**
 * LA DOCUMENTACIÓN PUBLICADA CONTRA LA QUE EXISTE
 *
 * `scripts/build-docs.mjs` convierte `docs/research/*.md` en el catálogo que
 * lee la app. Como es un paso generado, se puede desincronizar en silencio: se
 * escribe un documento nuevo, nadie corre `npm run docs`, y la pantalla sigue
 * mostrando la lista vieja como si estuviera completa.
 *
 * Eso no es un archivo faltante: es la app diciendo "esta es toda la
 * investigación que usamos" con una lista que no lo es. Estos tests lo frenan.
 */

const ORIGEN = 'docs/research';
const CARPETA = 'apps/web/src/content/docs';

/** El que se deja afuera a propósito, con el motivo al lado. */
const NO_SE_PUBLICAN = new Map([
  [
    'PROMPTS.md',
    'Es el texto con el que se le encargó la búsqueda a los agentes, no algo que alguien vaya a ' +
      'leer para aprender. La auditoría sí se publica: es el documento que dice qué estaba mal.',
  ],
]);

function raizDelRepo(): string {
  // Los tests corren con la raíz del monorepo como cwd (ver vitest.config).
  return process.cwd().includes('apps') ? join(process.cwd(), '..', '..') : process.cwd();
}

const raiz = raizDelRepo();
const enDisco = readdirSync(join(raiz, ORIGEN)).filter((f) => f.endsWith('.md'));

describe('catálogo de documentación', () => {
  it('publica todos los documentos de investigación menos los declarados', () => {
    const esperados = enDisco.filter((f) => !NO_SE_PUBLICAN.has(f)).sort();
    const publicados = indice.docs.map((d) => d.archivo).sort();
    expect(publicados).toEqual(esperados);
  });

  it('lo que no se publica está declarado con su motivo', () => {
    for (const [archivo, motivo] of NO_SE_PUBLICAN) {
      expect(enDisco, `${archivo} ya no existe: sacalo de la lista`).toContain(archivo);
      expect(motivo.length).toBeGreaterThan(40);
    }
  });

  it('cada documento del índice tiene su archivo de contenido', () => {
    const cuerpos = new Set(readdirSync(join(raiz, CARPETA)));
    for (const doc of indice.docs) {
      expect(cuerpos, `falta el cuerpo de ${doc.id}`).toContain(`${doc.id}.generated.json`);
    }
  });

  it('no hay cuerpos sueltos de documentos que ya no están', () => {
    // Borrar un `.md` y no regenerar dejaría el cuerpo viejo accesible por URL
    // directa aunque no figure en la lista.
    const ids = new Set(indice.docs.map((d) => d.id));
    const sueltos = readdirSync(join(raiz, CARPETA))
      .map((f) => f.replace('.generated.json', ''))
      .filter((id) => !ids.has(id));
    expect(sueltos).toEqual([]);
  });

  it('ninguno queda sin título', () => {
    const sinTitulo = indice.docs.filter((d) => !d.titulo?.trim()).map((d) => d.archivo);
    expect(sinTitulo).toEqual([]);
  });

  it('ninguno queda vacío', () => {
    // Un documento con cero bloques se abriría en blanco: el parser cambió y
    // dejó de entender el archivo.
    const vacios = indice.docs.filter((d) => d.bloques === 0).map((d) => d.archivo);
    expect(vacios).toEqual([]);
  });

  it('los cuerpos no traen saltos de línea del margen del editor', () => {
    // Los documentos están escritos a 100 columnas. Si esos saltos llegaran al
    // JSON, la app cortaría los renglones donde los cortó el editor y no donde
    // termina la pantalla del teléfono.
    const conSaltos: string[] = [];
    for (const doc of indice.docs) {
      const crudo = readFileSync(join(raiz, CARPETA, `${doc.id}.generated.json`), 'utf8');
      // El JSON escapa un salto real como `\n`; adentro de un bloque de código
      // sí corresponde que estén.
      const cuerpo = JSON.parse(crudo) as { bloques: unknown[] };
      if (textoConSalto(cuerpo.bloques)) conSaltos.push(doc.archivo);
    }
    expect(conSaltos).toEqual([]);
  });
});

/** Busca un `\n` en cualquier tramo de texto, salteando los bloques de código. */
function textoConSalto(bloques: unknown[]): boolean {
  for (const raw of bloques) {
    const bloque = raw as {
      b?: string;
      spans?: { v?: string }[];
      bloques?: unknown[];
      items?: unknown[][];
      encabezado?: { v?: string }[][];
      filas?: { v?: string }[][][];
    };
    if (bloque.b === 'codigo') continue;
    if (bloque.spans?.some((s) => s.v?.includes('\n'))) return true;
    if (bloque.encabezado?.some((c) => c.some((s) => s.v?.includes('\n')))) return true;
    if (bloque.filas?.some((f) => f.some((c) => c.some((s) => s.v?.includes('\n'))))) return true;
    if (bloque.bloques && textoConSalto(bloque.bloques)) return true;
    if (bloque.items?.some((it) => textoConSalto(it))) return true;
  }
  return false;
}
