---
name: activar-ruleset
description: Cómo reemplazar el contenido de entrenamiento provisorio por el que sale de la investigación. Usar cuando llegue el research y haya que enchufar los valores reales de series, repeticiones, RIR, descansos o progresión.
---

# Enchufar el contenido real de entrenamiento

Este es el momento para el que se diseñó toda la arquitectura. Si hay que tocar código de la app
para que entre el contenido, algo se hizo mal antes.

## Qué llena qué

| Investigación | Llena |
|---|---|
| `training_program_design_strength_hypertrophy_power` | `prescription.strength`, `.hypertrophy`, `.power` |
| `training_program_design_cardio_endurance_recomposition` | `prescription.cardio`, `.endurance`, `.recomposition` |
| `training_program_individual_variables_age_sex_experience_sport` | los bloques `byLevel` y, si hace falta, modificadores nuevos |
| `fitness_app_architecture_adaptive_workout_generation` | nada del ruleset: se cruza contra `docs/01-arquitectura.md` |

## Pasos

1. **Curar la prosa a JSON.** El research sale en texto. Alguien lo traduce al esquema de
   `packages/engine/src/ruleset.ts`. Ese paso es humano, no lo hace el código.
2. Crear `packages/engine/src/rulesets/v1-research.json` con `"source": "research"` y una `version`
   nueva. **No editar `v0-placeholder.json`**: se conserva para poder comparar planes viejos.
3. Exportarlo desde `packages/engine/src/index.ts` y validarlo con `parseRuleset` al importar. Si el
   JSON no cumple el esquema, el proyecto no arranca: eso es a propósito.
4. Subirlo y activarlo:
   ```bash
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run db:ruleset -- packages/engine/src/rulesets/v1-research.json
   ```
5. Regenerar los planes activos. Los planes viejos guardan su `ruleset_version`, así que se puede
   comparar qué cambió para cada usuario antes de aplicarlo.
6. Verificar que las marcas de "provisorio" desaparecieron solas de la UI. Están atadas a
   `source === 'placeholder'`, no a una bandera manual. Si hay que apagarlas a mano, es un bug.

## Si el contenido real no entra en el esquema

Puede pasar: por ejemplo, el cardio real necesita zonas e intervalos, y el esquema actual usa series
y repeticiones. Entonces se extiende el esquema en `ruleset.ts` **antes** de curar el contenido, con
sus tipos y su validación, y se actualiza `v0-placeholder.json` para que siga siendo válido. No se
fuerza el contenido a un esquema que no lo representa.

## Antes de dárselo a un socio del gimnasio

Con `source: "placeholder"` la app sirve para que la uses vos. No se la des a otra persona: son
números inventados presentados como una prescripción de ejercicio.
