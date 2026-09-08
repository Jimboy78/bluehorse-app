import type { EngineContext, PrescriptionEngine, Ruleset } from '@bh/engine';
import { createPlaceholderEngine, V1_RESEARCH } from '@bh/engine';

/**
 * Punto único donde la app se conecta con el motor.
 *
 * El ruleset activo es `v1-research`, curado desde `docs/research/`. El
 * provisorio (`V0_PLACEHOLDER`) sigue existiendo en el paquete para poder
 * comparar contra los planes que se generaron con él — cada plan guarda su
 * `rulesetVersion` — pero ya no es el que ve nadie.
 *
 * Cambiar de ruleset es cambiar esta línea y correr `npm run db:ruleset`. No
 * cambia una línea del motor ni de las pantallas: para eso está la separación.
 */
export const engine: PrescriptionEngine = createPlaceholderEngine();

export const activeRuleset: Ruleset = V1_RESEARCH;

/** `true` mientras los números que ve el usuario no salgan de la investigación. */
export const showsPlaceholderContent = activeRuleset.source === 'placeholder';

/**
 * El motor es puro: la hora y la semilla se le pasan desde acá, no las lee él.
 * La semilla se deriva del usuario para que su plan sea siempre el mismo.
 */
export function engineContext(userId: string, now = new Date()): EngineContext {
  return { now: now.toISOString(), seed: hash(userId) };
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
