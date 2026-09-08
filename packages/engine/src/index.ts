import type { Ruleset } from './ruleset.ts';
import { parseRuleset } from './ruleset.ts';
import rawV0 from './rulesets/v0-placeholder.json' with { type: 'json' };
import rawV1 from './rulesets/v1-research.json' with { type: 'json' };

export * from './contract.ts';
export { createPlaceholderEngine } from './placeholder-engine.ts';
export { createRng } from './rng.ts';
export * from './ruleset.ts';

/**
 * Ruleset provisorio del MVP. Se conserva para poder comparar contra los planes
 * que se generaron con él: cada plan guarda su `rulesetVersion`.
 */
export const V0_PLACEHOLDER: Ruleset = parseRuleset(rawV0);

/**
 * Contenido curado desde `docs/research/`. Validado al importarse: si el JSON no
 * cumple el esquema, el proyecto no arranca en vez de generar planes sin sentido.
 */
export const V1_RESEARCH: Ruleset = parseRuleset(rawV1);
