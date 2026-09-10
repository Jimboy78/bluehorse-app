# ADR 0007 — Planes armados a mano, separados de los del motor

**Estado**: aceptada · 2026-09-09

## Contexto

Hasta acá la única forma de tener un plan era el motor: se responde el onboarding, se elige un
objetivo, y `generatePlan()` devuelve la cola entera con cada número saliendo del ruleset. Eso cubre
a quien quiere que la app decida.

No cubre a quien ya sabe lo que quiere hacer. Y no cubre —esto es lo que hizo aparecer el pedido—
a quien quiere armar el plan **de a pedazos**: cargar hoy el día de piernas, mañana el de empuje, la
semana que viene agregarle otro. El motor no tiene un modo "medio plan": o devuelve la cola completa
o no devuelve nada.

El esquema tampoco lo tenía. Tres columnas eran `not null` porque hasta acá siempre hubo motor
detrás:

- `plans.ruleset_version` — con qué contenido se generó
- `plans.template_id` — de qué plantilla salió
- `plan_session_items.rationale` — el "por qué va acá" citando el ruleset

## Decisión

Una columna `plans.origin` (`'engine' | 'manual'`), y esas tres columnas pasan a admitir nulo, con
un `check` que obliga a las dos del plan cuando `origin = 'engine'`.

**El nulo es el punto de la decisión, no un efecto colateral.** La alternativa cómoda era anotar en
un plan manual el ruleset activo del momento —la columna se llena, el `not null` se mantiene, nada
se rompe—. Pero eso dice que los números de ese plan salen de la investigación, cuando los eligió
una persona. Es la regla dura 4 rota en silencio, que es la peor forma de romperla: no hay ninguna
pantalla donde se note.

Lo mismo con `rationale`: escribirle "Elegido por vos" a un ejercicio manual le pone voz de
evidencia a una decisión que no la tiene. Va nulo, y `Hoy` no dibuja el bloque de la cita.
Antes lo dibujaba siempre y quedaba la barra azul al costado de un párrafo vacío.

Y `is_placeholder` va en `false` en los ítems manuales, no en el `true` del default: esa bandera
dice "el ruleset que generó esto es provisorio", y acá no generó nada ningún ruleset. Lo que avisa
que el plan no está respaldado es `origin`, una vez por plan, arriba de la pantalla.

### Lo que la pantalla no hace

- **No sugiere ningún número.** Series, repeticiones, descanso y RIR arrancan vacíos. Un valor por
  defecto acá sería un número de entrenamiento naciendo en el código (regla dura 3), y encima uno
  sin ninguna fila de investigación detrás. Quien quiere que la app decida tiene el motor a un botón.
- **No elige la unidad de la carga.** Sale de la estación (regla dura 6). Sin estación elegida no
  hay campo de carga; en una estación de peso corporal tampoco.
- **No revisa el plan.** El motor avisa cuando falta cubrir un patrón o cuando el volumen semanal
  queda corto con la frecuencia elegida. Un plan manual no pasa por ese control, y la pantalla lo
  dice con todas las letras arriba de todo.

### Cómo crece

El plan nace **guardado** (`status = 'archived'`) y vacío. Un plan activo sin ningún día deja "Hoy"
sin nada que ofrecer, así que activarlo es un paso explícito, disponible recién cuando hay al menos
un día con ejercicios.

Los días se agregan de a uno, con `sequence_index = max + 1` y no `count`: borrar el día del medio
deja un hueco, y contar filas devolvería un índice ya usado que choca contra el
`unique (plan_id, sequence_index)`. El hueco no molesta — la cola se ordena por el índice, no exige
que sean consecutivos.

Los días **siguen siendo una cola, no un calendario** (ADR 0004). Se llaman "Día 1, Día 2"; lo que
la persona escribe ("Lunes de pierna") va en `focus`, que es descripción y no decide cuándo toca.
El pedido hablaba de lunes y miércoles, pero lo que pedía era poder armarlos en distintos momentos,
no que vencieran en una fecha.

## Alternativas descartadas

**Una tabla aparte para los planes manuales.** Duplicaría `plan_sessions`, `plan_session_items`,
sus políticas de RLS y las tres pantallas que los leen ("Hoy", Planes, Progreso), para representar
la misma cosa. Y rompería lo único que importa de verdad: un `set_log` apunta a un
`plan_session_item`, así que dos tablas de ítems serían dos historiales.

**Dejar que el motor "complete" un plan manual.** Suena útil y es exactamente el error que evita
esta separación: el resultado sería un plan mitad respaldado y mitad no, sin forma de decir cuál
número es cuál en pantalla.

## Consecuencias

- El motor no cambió una línea. `packages/engine` no sabe que esto existe, y sigue sin saberlo.
- Un día vacío ahora es un estado posible que el motor nunca podía producir. `Hoy` lo trata como lo
  que es —un día a medio cargar, no un error— y ofrece terminar de cargarlo. Antes dibujaba la
  sesión igual: "series de hoy 0/0", la lista vacía, el aviso de que se puede sustituir una máquina
  que no existe, y "Terminar sesión" como única salida.
- **Cardio queda afuera de esta primera versión.** Un bloque aeróbico se prescribe por duración y
  zona de intensidad, no por series y repeticiones, y es otro formulario. Los tres campos
  (`target_duration_seconds`, `target_intensity_zone`, `target_interval_rest_seconds`) se guardan en
  nulo. Un plan manual hoy es trabajo de sala.
- La adaptación (propuestas de subir carga, descarga) mira `set_logs` contra `plan_session_items`,
  así que funciona igual sobre un plan manual. Lo que no hay es un ruleset contra el cual comparar
  la prescripción original — si eso importa más adelante, es una decisión aparte.
