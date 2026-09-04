import type { EngineContext, PrescriptionEngine, Ruleset } from '@bh/engine';
import { createPlaceholderEngine, V0_PLACEHOLDER } from '@bh/engine';

/**
 * Punto único donde la app se conecta con el motor.
 *
 * Hoy usa el ruleset provisorio que viene compilado. Cuando el contenido real
 * esté cargado en la base, esto pasa a leer el ruleset activo desde Supabase y
 * no cambia nada más de la app.
 */
export const engine: PrescriptionEngine = createPlaceholderEngine();

export const activeRuleset: Ruleset = V0_PLACEHOLDER;

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
