#!/usr/bin/env node
/**
 * Sube el ruleset a la base y lo deja activo.
 *
 * El JSON del paquete `@bh/engine` es la única fuente de verdad del contenido:
 * este script lo copia a la tabla `rulesets` para que la app pueda leerlo desde
 * ahí sin duplicar los números en un archivo .sql.
 *
 *   node scripts/push-ruleset.mjs [ruta-al-json]
 *
 * Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno (nunca en .env
 * del cliente: escribir rulesets es una operación de administración).
 */
import { readFile } from 'node:fs/promises';
import { argv, env, exit } from 'node:process';
import { createClient } from '@supabase/supabase-js';

const file =
  argv[2] ?? new URL('../packages/engine/src/rulesets/v0-placeholder.json', import.meta.url);
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  console.error('Para la base local, los imprime `npm run db:start`.');
  exit(1);
}

const content = JSON.parse(await readFile(file, 'utf8'));

if (!content.version || !content.source) {
  console.error('El archivo no parece un ruleset: le faltan "version" o "source".');
  exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error: deactivateError } = await supabase
  .from('rulesets')
  .update({ is_active: false })
  .eq('is_active', true);

if (deactivateError) {
  console.error('No se pudo desactivar el ruleset anterior:', deactivateError.message);
  exit(1);
}

const { error } = await supabase.from('rulesets').upsert({
  version: content.version,
  source: content.source,
  content,
  is_active: true,
  notes: Array.isArray(content.notes) ? content.notes.join(' ') : null,
});

if (error) {
  console.error('No se pudo subir el ruleset:', error.message);
  exit(1);
}

console.log(`Ruleset ${content.version} (${content.source}) activo.`);
if (content.source === 'placeholder') {
  console.warn('Atención: es contenido provisorio. No lo pongas frente a un socio del gimnasio.');
}
