# El contrato del motor

Este documento existe para una sola cosa: que el contenido de la investigación entre sin rehacer la
app.

## La separación

**El motor es el mecanismo. El ruleset es el contenido.**

`packages/engine` sabe elegir un ejercicio para un patrón, respetar el escalón de una máquina,
comparar series entre sesiones y armar una cola. No sabe cuántas series hacer, ni cuándo subir la
carga, ni qué es un rango de repeticiones razonable. Eso lo lee del ruleset.

## La interfaz

```ts
export interface PrescriptionEngine {
  readonly id: string;
  generatePlan(input: GeneratePlanInput): PlanBlueprint;
  reviewProgress(input: ReviewProgressInput): readonly ProposalBlueprint[];
  findSubstitutes(input: FindSubstitutesInput): readonly SubstituteOption[];
}
```

Tres reglas la sostienen:

1. **Pura.** No toca la base, no hace red, no lee la hora ni variables de entorno. La hora y la
   semilla del azar entran por `EngineContext`.
2. **Determinista.** Mismo input y misma semilla, mismo plan. Sin esto no se puede testear ni
   reproducir el plan de un socio que reporta un problema.
3. **Trazable.** Cada plan y cada propuesta guardan el `rulesetVersion` con el que se generaron.

## La forma del ruleset

Definida y validada en `packages/engine/src/ruleset.ts` con zod. Un ruleset que no valide hace
fallar el arranque: es preferible a generar planes con contenido roto.

```jsonc
{
  "version": "v0-placeholder",
  "source": "placeholder",        // "research" cuando sea contenido real
  "planning": { "sessionsAhead": 8 },
  "prescription": {
    "hypertrophy": {
      "default": {
        "primary":   { "sets": 3, "repsMin": 8, "repsMax": 12, "rirTarget": 2, "restSeconds": 120 },
        "secondary": { ... },
        "isolation": { ... },
        "progression": { "stepPct": 2.5, "triggerRirAtLeast": 3, "consecutiveSessions": 2 },
        "regression": { "stepPct": 10, "missedRepsSessions": 2 },
        "deload":     { "stallSessions": 3, "absenceDays": 14, "volumeMultiplier": 0.6 }
      },
      "byLevel": { "beginner": { /* pisa solo los bloques que nombra */ } }
    }
    // ... los otros cinco objetivos
  },
  "templates": [ /* estructura semanal: sesiones y sus huecos por patrón */ ],
  "substitution": { "minEquivalence": 0.5, "patternWeight": 0.4, "muscleWeight": 0.6, "maxOptions": 3 },
  "rationale": { "primary": "{exercise} va primero: ...", ... }
}
```

Cada objetivo tiene un `default` obligatorio y ajustes opcionales por nivel de experiencia. El merge
lo hace `resolveParams()`, bloque por bloque.

## Qué llena qué

| Investigación | Llena |
|---|---|
| `..._strength_hypertrophy_power` | `prescription.strength`, `.hypertrophy`, `.power` |
| `..._cardio_endurance_recomposition` | `prescription.cardio`, `.endurance`, `.recomposition` |
| `..._individual_variables_age_sex_experience_sport` | los bloques `byLevel` y modificadores nuevos |
| `..._adaptive_workout_generation` | nada del ruleset: se cruza contra `01-arquitectura.md` |

Hay un paso humano entre la investigación y el JSON: el research sale en prosa y alguien lo cura al
esquema. Ese paso no lo hace el código.

## Estado actual

`v0-placeholder` está en `packages/engine/src/rulesets/`. **Todos sus números son inventados** y
existen para que la app funcione de punta a punta mientras tanto. Su `notes` lo dice, la UI lo
muestra y cada item del plan lleva `isPlaceholder: true`.

Un pendiente conocido: el bloque de cardio y resistencia usa la forma de fuerza (series y
repeticiones) por comodidad del MVP. La forma real —intervalos, zonas, duración— va a requerir
extender el esquema. Está previsto y documentado, no olvidado.

Para el procedimiento de reemplazo, ver la skill `activar-ruleset`.
