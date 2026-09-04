/**
 * Generador pseudoaleatorio determinista (mulberry32).
 *
 * El motor no puede llamar a `Math.random()`: dos generaciones con el mismo
 * input tienen que dar exactamente el mismo plan, o no se puede testear ni
 * reproducir el plan de un usuario que reporta un problema.
 *
 * Se usa SOLO para desempatar entre opciones equivalentes.
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Desempate estable: ordena por clave y elige con la semilla. */
export function pickDeterministic<T>(items: readonly T[], rng: () => number): T | undefined {
  if (items.length === 0) return undefined;
  if (items.length === 1) return items[0];
  const index = Math.floor(rng() * items.length);
  return items[Math.min(index, items.length - 1)];
}
