#!/usr/bin/env node
/**
 * Frena el error más caro y más fácil de cometer: subir una credencial.
 * Se corre en pre-commit sobre los archivos staged.
 *
 * Está en Node y no en shell a propósito: los hooks tienen que correr igual en
 * Windows, en Mac y en el CI.
 */
import { readFile } from 'node:fs/promises';
import { argv, exit } from 'node:process';

/**
 * Buscamos VALORES, no menciones: media docena de archivos nombran
 * `service_role` justamente para explicar que no se usa. Nombrar una
 * credencial es correcto; pegarla, no.
 */
const PATTERNS = [
  { name: 'JWT embebido (clave de Supabase)', re: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\./ },
  { name: 'clave de API en vivo', re: /\bsk_live_[A-Za-z0-9]{8,}/ },
  { name: 'clave privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    name: 'secreto asignado en el código',
    re: /(SERVICE_ROLE|SECRET|PASSWORD|ACCESS_TOKEN)[A-Z_]*\s*[:=]\s*['"][A-Za-z0-9/+_-]{16,}['"]/i,
  },
];

// El propio checker nombra los patrones para poder explicarlos.
const ALLOWLIST = [/scripts[/\\]check-secrets\.mjs$/];

const files = argv.slice(2).filter((f) => !ALLOWLIST.some((re) => re.test(f)));
const hits = [];

for (const file of files) {
  let content;
  try {
    content = await readFile(file, 'utf8');
  } catch {
    continue; // borrado o binario: no es asunto de este chequeo
  }
  for (const { name, re } of PATTERNS) {
    if (re.test(content)) hits.push(`${file}: ${name}`);
  }
}

if (hits.length > 0) {
  console.error('Hay algo que parece una credencial en los archivos staged:\n');
  for (const hit of hits) console.error(`  ${hit}`);
  console.error('\nSacala del commit. Si es un falso positivo, agregá el archivo a ALLOWLIST.');
  exit(1);
}
