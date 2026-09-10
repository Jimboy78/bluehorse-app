/**
 * HABLARLE A LA BASE LOCAL SIN CLIENTE
 *
 * `psql` no está en el PATH de Windows, pero sí adentro del contenedor que
 * levanta `npm run db:start`. Esto es `docker exec` con el formato de salida ya
 * puesto para que se parsee sin ambigüedad.
 *
 * Va contra la base **local** a propósito y no acepta una URL: son consultas de
 * diagnóstico que leen tablas enteras, y apuntar eso a la nube por accidente es
 * justo el error que no se puede deshacer.
 */
import { execFileSync } from 'node:child_process';

const CONTENEDOR = 'supabase_db_bluehorse-app';
const SEPARADOR = String.fromCharCode(1);

export function baseArriba() {
  try {
    const salida = execFileSync('docker', ['ps', '--format', '{{.Names}}'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return salida.split('\n').some((n) => n.trim() === CONTENEDOR);
  } catch {
    return false;
  }
}

/**
 * Corre una consulta y devuelve las filas como objetos.
 *
 * `-A -F` (sin alinear, separador de campo el byte 0x01) en vez de un CSV:
 * los textos de la base traen comas, comillas y saltos de línea —los `rationale`
 * del ruleset, las notas de una sesión— y cualquier separador imprimible se
 * puede confundir con contenido. 0x01 no aparece en texto.
 */
export function consultar(sql) {
  const salida = execFileSync(
    'docker',
    [
      'exec',
      '-i',
      CONTENEDOR,
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-A',
      '-F',
      SEPARADOR,
      '-c',
      sql,
    ],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );

  const lineas = salida.split('\n').filter((l) => l.length > 0);
  if (lineas.length === 0) return [];

  const encabezado = lineas[0].split(SEPARADOR);
  const filas = [];
  for (const linea of lineas.slice(1)) {
    // psql cierra con "(N rows)", que no es una fila.
    if (/^\(\d+ rows?\)$/.test(linea)) break;
    const partes = linea.split(SEPARADOR);
    if (partes.length !== encabezado.length) continue;
    const fila = {};
    encabezado.forEach((col, i) => {
      fila[col] = partes[i] === '' ? null : partes[i];
    });
    filas.push(fila);
  }
  return filas;
}

/** Un entero de una consulta de una sola celda. */
export function contar(sql) {
  const filas = consultar(sql);
  if (filas.length === 0) return 0;
  return Number(Object.values(filas[0])[0] ?? 0);
}
