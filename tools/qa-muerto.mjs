/**
 * CÓDIGO Y DATOS QUE ESTÁN PERO NO SE USAN
 *
 * Biome ya avisa de variables y parámetros sin usar. Lo que no ve es la capa de
 * arriba: una columna que existe en el esquema y nadie lee, un `export` que
 * ningún archivo importa, un archivo que nadie carga.
 *
 * Las tres trampas que hicieron falsos positivos la primera vez, y cómo se
 * resuelven acá:
 *
 * 1. **`database.types.ts` menciona cada columna de la base**, porque se genera
 *    desde el esquema. Incluirlo daba cero columnas muertas. Se excluye.
 * 2. **Las rutas se cargan con `import()` dinámico**, sin `from`, así que
 *    buscando solo imports estáticos aparecían trece rutas "huérfanas". Se
 *    busca la cadena del archivo en cualquier comilla.
 * 3. **Los tests no los importa nadie**: los corre vitest. Se excluyen.
 *
 * Lo que reporta NO se borra solo. Una columna sin usar puede ser un dato que
 * todavía no se muestra (`pre_sleep` es readiness que el motor podría leer) o
 * puede ser peso muerto, y esa diferencia no la decide una herramienta.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chequeo, hallazgo } from './lib/reporte.mjs';

/** Ver la nota en `qa-ruleset.mjs`: el espacio de "Projects J" rompe `.pathname`. */
const RAIZ = fileURLToPath(new URL('..', import.meta.url));

/** La ruta como se escribe en el proyecto, para poder pegarla y saltar al archivo. */
function corta(p) {
  return p.replace(/\\/g, '/').replace(RAIZ.replace(/\\/g, '/'), '');
}

const IGNORAR_DIR = new Set(['node_modules', 'dist', '.git', 'coverage']);
const GENERADOS = /\.generated\.|database\.types\.ts$/;

function archivos(base, exts = ['.ts', '.tsx']) {
  const out = [];
  function caminar(dir) {
    let entradas;
    try {
      entradas = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entradas) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) {
        if (!IGNORAR_DIR.has(e)) caminar(p);
      } else if (exts.some((x) => e.endsWith(x))) {
        out.push(p.replace(/\\/g, '/'));
      }
    }
  }
  caminar(join(RAIZ, base));
  return out;
}

function leerTodo(paths) {
  const mapa = new Map();
  for (const p of paths) mapa.set(p, readFileSync(p, 'utf8'));
  return mapa;
}

function cuentaDe(texto, palabra) {
  const re = new RegExp(`\\b${palabra.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
  return (texto.match(re) ?? []).length;
}

/** Columnas del esquema declarativo que ningún archivo de la app nombra. */
function columnasMuertas() {
  const esquemas = archivos('supabase/schemas', ['.sql']);
  const codigo = archivos('apps/web/src').concat(archivos('packages'));
  const texto = [...leerTodo(codigo.filter((f) => !GENERADOS.test(f))).values()].join('\n');

  const hallazgos = [];
  let miradas = 0;

  for (const ruta of esquemas) {
    const sql = readFileSync(ruta, 'utf8');
    const bloques = sql.matchAll(/create table (\w+)\s*\(([\s\S]*?)\n\);/g);
    for (const [, tabla, cuerpo] of bloques) {
      const usaLaTabla = cuentaDe(texto, tabla) > 0;
      const columnas = [...cuerpo.matchAll(/^\s{2}(\w+)\s+[a-z]/gm)].map((m) => m[1]);
      miradas += columnas.length;

      if (!usaLaTabla) {
        hallazgos.push(
          hallazgo(`tabla ${tabla} entera`, ruta.split('/').pop(), `${columnas.length} columnas`),
        );
        continue;
      }
      for (const col of columnas) {
        const camel = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        if (cuentaDe(texto, col) === 0 && (camel === col || cuentaDe(texto, camel) === 0)) {
          hallazgos.push(hallazgo(`${tabla}.${col}`, ruta.split('/').pop()));
        }
      }
    }
  }
  return chequeo('columnas del esquema sin usar', miradas, hallazgos);
}

/** Cuántas veces lo nombra algún archivo que no sea el suyo. Corta apenas encuentra uno. */
function usosAfuera(codigo, propio, nombre) {
  for (const [ruta, txt] of codigo) {
    if (ruta === propio) continue;
    if (cuentaDe(txt, nombre) > 0) return 1;
  }
  return 0;
}

/** `export`s que ningún OTRO archivo menciona. Los barriles usan `export *`, así que el conteo vale. */
function exportsMuertos() {
  const paths = archivos('apps/web/src')
    .concat(archivos('packages'))
    .filter((f) => !GENERADOS.test(f));
  const codigo = leerTodo(paths);

  /**
   * Dos hallazgos distintos, porque el arreglo es distinto:
   *
   * - `nadie`: no lo usa ni su propio archivo → sobra, se borra.
   * - `exportadoDeMas`: el código sirve, lo que sobra es la palabra `export`.
   *
   * Juntos daban 83 hallazgos indistinguibles, con `SetRowProps` —el tipo de
   * las props de su propio componente— al lado de código que de verdad sobra.
   */
  const hallazgos = { nadie: [], exportadoDeMas: [] };
  let miradas = 0;

  for (const [ruta, txt] of codigo) {
    if (ruta.includes('.test.')) continue;
    const nombres = [
      ...txt.matchAll(
        /^export\s+(?:async\s+)?(?:const|function|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm,
      ),
    ];
    miradas += nombres.length;

    for (const [, nombre] of nombres) {
      if (usosAfuera(codigo, ruta, nombre) > 0) continue;

      // Menos la línea de la declaración: lo que queda es uso real adentro.
      const adentro = cuentaDe(txt, nombre) - 1;
      (adentro > 0 ? hallazgos.exportadoDeMas : hallazgos.nadie).push(
        hallazgo(nombre, corta(ruta)),
      );
    }
  }

  return [
    chequeo('exports que no usa nadie', miradas, hallazgos.nadie),
    chequeo('exportado de más (solo se usa adentro)', miradas, hallazgos.exportadoDeMas),
  ];
}

/** Archivos que ninguna cadena de import menciona — contando los `import()` de las rutas. */
function archivosHuerfanos() {
  const paths = archivos('apps/web/src').concat(archivos('packages'));
  const texto = [...leerTodo(paths).values()].join('\n');
  const RAICES = ['main.tsx'];

  const hallazgos = [];
  const mirados = paths.filter((p) => {
    const base = p.split('/').pop();
    return !base.includes('.test.') && !base.endsWith('.d.ts') && !RAICES.includes(base);
  });

  for (const p of mirados) {
    const base = p.split('/').pop();
    const sinExt = base.replace(/\.tsx?$/, '');
    // Solo cuenta si el nombre está en posición de import: después de `from`, de
    // un `import(...)` o de un `export ... from`. Antes alcanzaba con que
    // apareciera en **cualquier** string entrecomillado, y eso dejaba ciego al
    // chequeo justo para los archivos con nombre de palabra común, que es casi
    // todo `lib/`. Medido sobre `goal.ts`: se declaraba usado a sí mismo dos
    // veces, primero por `queryKey: ['active-goal', ...]` y después por
    // `.select('goal')`, y su nombre no aparecía en ningún import del proyecto.
    const nombre = sinExt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b(?:from|import)\\s*\\(?\\s*['"](?:[^'"]*/)?${nombre}(\\.tsx?)?['"]`);
    if (!re.test(texto)) hallazgos.push(hallazgo(base, corta(p)));
  }
  return chequeo('archivos que nadie importa', mirados.length, hallazgos);
}

/** Los nombres de columna que pide cada `.select('...')` de un archivo. */
function* columnasDeLosSelects(txt) {
  for (const m of txt.matchAll(/\.select\(\s*'([^']+)'/g)) {
    // Los embebidos `tabla!inner(col, col)` se sacan: sus columnas se leen anidadas.
    const plano = m[1].replace(/\w+!?\w*\([^)]*\)/g, ' ');
    for (const col of plano.split(',')) {
      const limpia = col.trim();
      if (limpia && limpia !== '*' && !limpia.includes(':')) yield limpia;
    }
  }
}

/** Columnas pedidas en un `.select()` y nunca leídas del resultado. */
function selectsSinLeer() {
  const paths = archivos('apps/web/src').filter((f) => !GENERADOS.test(f) && !f.includes('.test.'));
  const codigo = leerTodo(paths);
  const texto = [...codigo.values()].join('\n');

  const pedidas = new Map();
  for (const [ruta, txt] of codigo) {
    for (const col of columnasDeLosSelects(txt)) {
      if (!pedidas.has(col)) pedidas.set(col, new Set());
      pedidas.get(col).add(ruta);
    }
  }

  const hallazgos = [];
  for (const [col, donde] of pedidas) {
    const camel = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    // Aparece tantas veces como selects la piden = solo el select, nadie la lee.
    if (cuentaDe(texto, col) <= donde.size && (camel === col || cuentaDe(texto, camel) === 0)) {
      hallazgos.push(hallazgo(col, [...donde][0]));
    }
  }
  return chequeo('columnas pedidas y no leídas', pedidas.size, hallazgos);
}

/**
 * Tipos de objeto anotados inline sobre un destructurado: `({ a }: { a: X })`.
 *
 * Se busca `}: {` y se avanza **balanceando llaves** hasta cerrar. Con un
 * `[\s\S]*?\n\}\)` no alcanza: en un componente de una línea —
 * `function Tramo({ span }: { readonly span: Span })` — ese patrón sigue
 * buscando el cierre y se come el JSX de abajo hasta el próximo `})`, así que
 * devuelve los `case` del switch como si fueran campos.
 */
function tiposInline(txt) {
  const out = [];
  for (const m of txt.matchAll(/\}:\s*\{/g)) {
    let i = m.index + m[0].length;
    let prof = 1;
    while (i < txt.length && prof > 0) {
      if (txt[i] === '{') prof += 1;
      else if (txt[i] === '}') prof -= 1;
      i += 1;
    }
    if (prof === 0) out.push(txt.slice(m.index + m[0].length, i - 1));
  }
  return out;
}

/** Los campos de primer nivel de un cuerpo de tipo. Lo anidado no cuenta. */
function camposDe(cuerpo) {
  const plano = cuerpo.replace(/\{[^{}]*\}/g, '');
  return [...plano.matchAll(/(?:^|[;,{]|\n)\s*(?:readonly\s+)?(\w+)\??\s*:/g)].map((m) => m[1]);
}

/**
 * Campos de props que ningún archivo lee.
 *
 * Mira las dos formas de declararlas. Antes solo miraba los tipos con nombre
 * terminado en `Props`, y de esos hay **7 en toda la app**: los otros 114 sitios
 * las anotan inline sobre el destructurado. Medido: 33 campos mirados contra 349
 * que quedaban afuera, o sea menos del 9 % — y el chequeo imprimía ese 33 como
 * si fuera la cobertura.
 *
 * El criterio es el mismo para las dos: un campo que aparece una sola vez en
 * todo el proyecto está declarado y no lo lee nadie. Para las inline eso
 * significa que no está ni en el destructurado; si está ahí y no se usa, lo
 * agarra Biome (`noUnusedVariables`), que es más preciso que contar palabras.
 *
 * Límite conocido: el conteo es por palabra sobre el corpus entero, así que un
 * campo con nombre de palabra común (`label`, `value`, `id`) nunca se va a
 * marcar, porque otro archivo lo nombra por su cuenta. Verificado plantando los
 * tres: solo salta el de nombre único. Es un falso negativo, no un falso
 * positivo: lo que reporta es cierto, lo que calla puede no serlo.
 */
/** Los grupos de campos que un archivo declara, por tipo nombrado y por inline. */
function camposDeclarados(txt) {
  const grupos = [];
  for (const [, tipo, cuerpo] of txt.matchAll(
    /(?:interface|type)\s+(\w*Props)\b[^{]*\{([\s\S]*?)\n\}/g,
  )) {
    grupos.push({
      etiqueta: (campo) => `${tipo}.${campo}`,
      campos: [...cuerpo.matchAll(/^\s*(?:readonly\s+)?(\w+)\??\s*:/gm)].map((m) => m[1]),
    });
  }
  for (const cuerpo of tiposInline(txt)) {
    grupos.push({ etiqueta: (campo) => campo, campos: camposDe(cuerpo) });
  }
  return grupos;
}

function propsMuertas() {
  const paths = archivos('apps/web/src').filter((f) => !GENERADOS.test(f) && !f.includes('.test.'));
  const codigo = leerTodo(paths);
  const texto = [...codigo.values()].join('\n');

  const hallazgos = [];
  let miradas = 0;

  for (const [ruta, txt] of codigo) {
    for (const { etiqueta, campos } of camposDeclarados(txt)) {
      miradas += campos.length;
      for (const campo of campos) {
        if (cuentaDe(texto, campo) <= 1) hallazgos.push(hallazgo(etiqueta(campo), ruta));
      }
    }
  }
  return chequeo('props declaradas y no leídas', miradas, hallazgos);
}

export function correrMuerto() {
  return [
    columnasMuertas(),
    ...exportsMuertos(),
    archivosHuerfanos(),
    selectsSinLeer(),
    propsMuertas(),
  ];
}
