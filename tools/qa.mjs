#!/usr/bin/env node
/**
 * HERRAMIENTAS DE DIAGNÓSTICO
 *
 *   npm run qa              todo lo que no necesita Docker
 *   npm run qa base         invariantes de las reglas duras contra la base local
 *   npm run qa muerto       columnas, exports, archivos y props que están y no se usan
 *   npm run qa ruleset      claves sin consumir y qué confianza declara cada bloque
 *   npm run qa diff a b     qué cambia entre dos rulesets
 *   npm run qa gym-id       tablas de negocio sin gym_id (regla 5)
 *   npm run qa motor        el motor sobre una matriz de socios sintéticos
 *
 * Con `--json` cualquiera de ellos devuelve una línea de JSON en vez de texto.
 *
 * Por qué existen: cada una de estas preguntas se contestó a mano al menos una
 * vez, escribiendo un script de una sola vida. La de la base encontró una serie
 * duplicada que leyendo código no se veía; la de datos muertos encontró que
 * `database.types.ts` —1506 líneas generadas— no lo importaba nadie, así que el
 * cliente de Supabase aceptaba nombres de tabla inventados.
 *
 * La regla de la salida es que **solo se imprime lo que está mal**. Un barrido
 * que mira 22 tablas y no encuentra nada son dos renglones.
 */
import { argv, exit } from 'node:process';
import { imprimir } from './lib/reporte.mjs';
import { correrBase, correrGymId } from './qa-base.mjs';
import { correrContraDocs } from './qa-docs.mjs';
import { correrMotorDiff } from './qa-motor.mjs';
import { correrMuerto } from './qa-muerto.mjs';
import { correrConfianza, correrConsumo, correrDiff } from './qa-ruleset.mjs';

const BANDERAS = new Set(['--json', '--prosa', '--todo']);
const args = argv.slice(2).filter((a) => !BANDERAS.has(a));
const json = argv.includes('--json');
const prosa = argv.includes('--prosa');
const comando = args[0] ?? 'todo';

function ayuda() {
  console.log(
    [
      'Uso: npm run qa [comando] [--json]',
      '',
      '  (sin comando)   muerto + ruleset  (no necesita Docker)',
      '  base            invariantes de las reglas duras contra la base local',
      '  muerto          columnas, exports, archivos y props sin usar',
      '  ruleset [ver]   claves sin consumir y confianza por bloque',
      '  diff <a> <b>    qué cambia entre dos rulesets',
      '  gym-id          tablas de negocio sin gym_id (regla 5)',
      '  motor           el motor sobre una matriz de socios sintéticos',
      '  todo-con-base   todo, incluyendo lo que necesita Docker',
    ].join('\n'),
  );
}

let titulo;
let chequeos;

switch (comando) {
  case 'base':
    titulo = 'Invariantes de la base';
    chequeos = correrBase();
    break;

  case 'muerto':
    titulo = 'Datos y código sin usar';
    chequeos = correrMuerto();
    break;

  case 'ruleset':
    titulo = `Ruleset ${args[1] ?? 'v1-research'}`;
    chequeos = [...correrConsumo(args[1]), ...correrConfianza(args[1])];
    break;

  case 'diff': {
    if (!args[1] || !args[2]) {
      console.error(
        'Faltan las dos versiones. Ejemplo: npm run qa diff v0-placeholder v1-research',
      );
      exit(1);
    }
    titulo = `${args[1]} → ${args[2]}`;
    chequeos = correrDiff(args[1], args[2], { prosa });
    break;
  }

  case 'docs':
    titulo = 'El ruleset contra la investigacion';
    chequeos = correrContraDocs(args[1]);
    break;

  case 'gym-id':
    titulo = 'Regla 5: gym_id en toda tabla de negocio';
    chequeos = correrGymId();
    break;

  case 'motor':
    // La matriz corre bajo vitest porque el motor es TypeScript y Node 22.3 no
    // lo importa sin transpilar. Se delega en vez de duplicar la explicación.
    console.log('La matriz del motor corre bajo vitest:\n');
    console.log('  npx vitest run --project tools');
    console.log('\nEscribe tools/reportes/motor-<ruleset>.json.');
    console.log('Para comparar dos corridas:\n');
    console.log('  npm run qa motor-diff tools/reportes/a.json tools/reportes/b.json');
    exit(0);
    break;

  case 'motor-diff':
    if (!args[1] || !args[2]) {
      console.error('Faltan los dos reportes. Generalos con `npx vitest run --project tools`.');
      exit(1);
    }
    titulo = 'Qué cambió en los planes';
    chequeos = correrMotorDiff(args[1], args[2]);
    break;

  case 'todo':
    titulo = 'Diagnóstico';
    chequeos = [...correrMuerto(), ...correrConsumo(), ...correrConfianza(), ...correrContraDocs()];
    break;

  case 'todo-con-base':
    titulo = 'Diagnóstico completo';
    chequeos = [
      ...correrMuerto(),
      ...correrConsumo(),
      ...correrConfianza(),
      ...correrBase(),
      ...correrGymId(),
    ];
    break;

  default:
    ayuda();
    exit(comando === '--help' || comando === 'ayuda' ? 0 : 1);
}

exit(imprimir(titulo, chequeos, { json }));
