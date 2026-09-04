# ADR 0003 — Motor puro con ruleset versionado

**Estado**: aceptada · 2026-09-04

## Contexto
El contenido de entrenamiento sale de una investigación en curso. El MVP necesita funcionar antes de
que ese contenido exista, y recibirlo después sin rehacer la arquitectura.

## Decisión
`packages/engine` es una función pura: entra un snapshot, sale un blueprint. Todos los números de
entrenamiento salen de un ruleset JSON versionado y validado con zod. Cada plan y cada propuesta
guardan el `rulesetVersion` con el que se generaron.

## Alternativas descartadas
- Lógica de prescripción dentro de los componentes de React: imposible de testear y de reemplazar.
- Números en constantes de TypeScript: cambiar contenido pasaría a ser un deploy de código.

## Consecuencias
El motor no puede leer la hora ni usar `Math.random`: se le inyectan por `EngineContext`. A cambio,
es determinista y testeable con casos fijos, y enchufar el contenido real es escribir un ruleset
nuevo y activarlo.
