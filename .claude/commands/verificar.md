---
description: Corre lint, typecheck y tests, y revisa las reglas duras antes de cerrar una tarea.
allowed-tools: Bash, Read, Grep, Glob
---

Verificá que el trabajo está terminado. No cierres nada que no pase estos cuatro pasos.

1. `npm run check` (lint + typecheck + tests). Si falla, arreglalo antes de seguir.
2. `git diff` para ver qué cambió realmente.
3. Revisá el diff contra las seis reglas duras de `CLAUDE.md`. Las tres que más se rompen:
   - un import de `react` o `@supabase/*` dentro de `packages/`
   - un número de entrenamiento escrito en `.ts` en vez de salir del ruleset
   - una tabla o query nueva sin `gym_id`
4. Si tocaste el motor o el dominio, confirmá que hay tests nuevos que cubran el cambio.

Reportá en tres líneas: qué corriste, qué pasó, qué falta. Si algo falla, decilo derecho.
