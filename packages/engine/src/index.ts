import type { Ruleset } from './ruleset.ts';
import { parseRuleset } from './ruleset.ts';
import rawV0 from './rulesets/v0-placeholder.json' with { type: 'json' };

export * from './contract.ts';
export { createPlaceholderEngine } from './placeholder-engine.ts';
export { createRng } from './rng.ts';
export * from './ruleset.ts';

/**
 * Ruleset provisorio del MVP. Validado al importarse: si el JSON está mal
 * formado, el proyecto no arranca en vez de generar planes sin sentido.
 *
 * Cuando esté el research: agregar `rulesets/v1-research.json` con
 * `source: "research"` y cambiar el ruleset activo desde la base.
 */
export const V0_PLACEHOLDER: Ruleset = parseRuleset(rawV0);
