import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * DOS CONSULTAS NO PUEDEN COMPARTIR CLAVE
 *
 * TanStack Query guarda por clave, no por función. Si dos `useQuery` usan la
 * misma clave con datos de distinta forma, la que lee segunda recibe lo que
 * guardó la primera. Pasó: "Cambiar de día" en Hoy guardaba sesiones sin
 * `exercises` bajo `['plan-sessions', …]`, y "Ver las sesiones" en Planes leía
 * esa caché y rompía la pantalla con un `.join` sobre `undefined`. Cada hook
 * andaba bien solo; los tests de cada uno, verdes.
 */

const RAIZ = join(__dirname, '..');

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return /\.tsx?$/.test(nombre) && !/\.test\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

// El prefijo literal de la clave: `['health', 'supabase']` y `['health', 'outbox']`
// son dos claves distintas; `['plan-sessions', user, plan]` con dos formas, una sola.
const DEFINICION = /useQuery(?:<[^>]*>)?\(\{\s*queryKey:\s*\[\s*'([^']+)'(?:\s*,\s*'([^']+)')?/g;

describe('claves de TanStack Query', () => {
  const porClave = new Map<string, string[]>();
  for (const ruta of archivos(RAIZ)) {
    for (const m of readFileSync(ruta, 'utf8').matchAll(DEFINICION)) {
      const clave = m[2] ? `${m[1]}/${m[2]}` : (m[1] as string);
      porClave.set(clave, [...(porClave.get(clave) ?? []), ruta.slice(RAIZ.length)]);
    }
  }

  it('encuentra las consultas de la app (si no ve ninguna, el patrón quedó viejo)', () => {
    expect(porClave.size).toBeGreaterThan(10);
  });

  it('cada clave la define una sola consulta', () => {
    const repetidas = [...porClave].filter(([, donde]) => donde.length > 1);
    expect(repetidas).toEqual([]);
  });
});
