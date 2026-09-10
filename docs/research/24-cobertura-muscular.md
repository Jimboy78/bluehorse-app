# La cuenta de volumen la domina una etiqueta, y el cardio implementa media recomendación

Revisión del 10 de septiembre de 2026. Salió de cerrar el último objetivo que `npm run qa docs`
marcaba sin tabla: `cardio`. Verificando su fuente aparecieron dos cosas distintas, las dos
medibles.

## Lo que dice la fuente que el bloque invoca

La nota de `cardio` dice que su parte de sala es *"la dosis mínima de fuerza que la ACSM recomienda
sostener en paralelo: dos sesiones por semana, con cargas moderadas"*, y `02` cita como fuente a WHO
2020. Son dos organizaciones distintas en la misma afirmación, así que se abrió el texto completo.

**WHO 2020 sí lo dice, y dice una cosa más:**

> "Adults should also do muscle-strengthening activities at **moderate or greater intensity that
> involve all major muscle groups on 2 or more days a week**, as these provide additional health
> benefits."

> "…a **strong recommendation supported by moderate-certainty evidence**."

Y, directamente aplicable al volumen:

> "**There was no evidence to support a dose-response association with higher volumes of
> muscle-strengthening activities.**"

> Bull FC, Al-Ansari SS, Biddle S, et al. *World Health Organization 2020 guidelines on physical
> activity and sedentary behaviour.* Br J Sports Med. 2020;54(24):1451-1462.
> DOI 10.1136/bjsports-2020-102955 — **verificado: texto completo leído en Europe PMC (PMC7719906,
> PMID 33239350)**

La recomendación tiene entonces **tres partes**: intensidad moderada o mayor, **todos los grupos
musculares grandes**, y dos o más días por semana. El ruleset implementa la primera y la tercera.

## Hallazgo 1: el cardio no cubre lo que dice cubrir, y nada lo puede avisar

`prescription.cardio.default.weeklyVolume.minSetsPerMuscle` está en **0**, y la nota lo justifica
así: *"la recomendación es de dos sesiones semanales de fuerza, no de una cantidad de series por
músculo, y poner un número acá sería inventarlo"*. Eso es correcto sobre la **cantidad** —WHO dice
explícitamente que no hay dosis-respuesta— pero deja afuera la parte de **cobertura**, que sí está
en la recomendación y no es un número: es "todos".

El efecto medido, sobre el plan que el motor genera hoy para el perfil `cardio · principiante`
(3 sesiones por semana, catálogo real):

| Músculo | Series semanales |
|---|---|
| Abdominales | 6 |
| Cuádriceps | 2 |
| Glúteos | 2 |
| Espalda | 2 |
| Dorsales | 2 |
| Pecho | 2 |

**Seis grupos de dieciocho.** Sin isquiotibiales, sin gemelos, sin ningún hombro, sin bíceps ni
tríceps. Y el aviso que existiría para decirlo —`estos músculos quedan abajo de las N series
semanales mínimas`— **no puede dispararse nunca**, porque compara contra 0.

No es que el motor falle: hace lo que el ruleset le pide. Lo que falta es que el bloque diga cuál de
las tres partes de la recomendación no está implementando, que es la regla dura 4.

## Hallazgo 2: el techo de volumen lo rompe siempre el mismo músculo, y es por cómo está etiquetado el catálogo

De los 33 perfiles de la matriz, **5 pasan el techo semanal** que su propio objetivo declara. El
motor avisa en los 5, con el número exacto: eso está bien y es la regla 4 funcionando.

Lo que llama la atención es cuál músculo:

| Músculo nombrado en el aviso | En cuántos de los 5 perfiles |
|---|---|
| **Glúteos** | **5** |
| Espalda | 2 |
| Dorsales | 2 |
| Hombro anterior | 1 |

Glúteos aparece en **todos**. La causa no está en el motor ni en la prescripción: está en cómo se
reparten las etiquetas del catálogo.

| Músculo | Ejercicios donde es **primario** (de 58) |
|---|---|
| **Glúteos** | **23** |
| Cuádriceps | 15 |
| Pecho | 7 |
| Dorsales | 6 |
| Hombro anterior · Abdominales · Espalda | 5 cada uno |
| **Isquiotibiales** | **4** (secundario en 12) |
| Tríceps · Bíceps | 2 cada uno |
| **Gemelos** | **1** (secundario en 6) |

El 40 % del catálogo declara glúteo como primario. Sentadilla, prensa, hack, Smith, goblet, búlgara,
zancada, subida al cajón, peso muerto, rumano, swing, hip thrust, hiperextensión, abductores,
aductores, patada de glúteo, escaladora — todos suman series de glúteo. Con esa repartición,
cualquier plan con dos o tres ejercicios de pierna llega al techo de glúteo antes que a ningún otro.

**La consecuencia práctica:** el aviso de techo describe la convención de etiquetado tanto como el
plan. Un socio que lea "los glúteos pasan el techo" no está recibiendo información sobre un
desbalance de su plan, sino sobre que casi todo lo que mueve la cadera cuenta como glúteo.

### Un caso donde la etiqueta es directamente incorrecta

| Ejercicio | Primarios que declara | Qué entrena |
|---|---|---|
| **Aductores en máquina** | `glutes` + `quads` | los aductores |

No es un descuido: **`adductors` no existe en `MUSCLE_GROUPS`** (`packages/domain/src/enums.ts`,
18 valores). La máquina no tenía dónde ir. El resultado es que el trabajo de aductor se contabiliza
como glúteo y cuádriceps, y suma al techo del que ya es el músculo más sobre-representado.

La de abductores (`glutes`) es defendible: el glúteo medio abduce. La de aductores no.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| `cardio.minSetsPerMuscle: 0` | **se mantiene el número** | WHO es explícito en que no hay dosis-respuesta por volumen. Poner un mínimo sería inventarlo. |
| Que el bloque no diga que no cubre todos los músculos | **se corrige** | La cobertura es parte de la recomendación que el bloque dice implementar, y no es un número. Regla dura 4. |
| Las zonas de intensidad del bloque `cardio` de nivel superior | **se mantienen** | Coinciden exacto con la fila de Seiler de `02` (Z1 55-72, Z2 67-82, Z3 82-87, Z4 87-92, Z5 92-100). |
| `optimalSetsPerMuscle: [4, 10]` y `maxSetsPerMuscle: 12` en `cardio` | **queda anotado** | La nota razona que poner un número en el mínimo sería inventarlo, y hay dos números en el óptimo y el máximo que ninguna fuente respalda. Son los más bajos de los seis objetivos, o sea una escala plausible, no una medición. |
| Avisar el techo en vez de recortar | **se mantiene** | Es la regla 4: el plan dice lo que hace en vez de cambiarlo en silencio. |
| Glúteo primario en 23 de 58 | **decisión del dueño** | Es el catálogo, relevado a mano. Cambiar etiquetas no es algo que se decida desde acá. |
| `Aductores en máquina` como `glutes` + `quads` | **decisión del dueño, con costo de esquema** | Corregirlo bien pide agregar `adductors`, que es un `enum` de Postgres: migración de esquema. Ver abajo. |

## Lo que queda para decidir

1. **Agregar `adductors` a `MUSCLE_GROUPS`.** Toca el enum del dominio, el `create type
   muscle_group` de `supabase/schemas/01_types.sql` (migración), el catálogo y los tipos generados.
   Es la única forma de que la máquina de aductores cuente lo que entrena. Existe la skill
   `cambiar-esquema` para el procedimiento.
2. **Revisar si glúteo tiene que ser primario en los 23.** En hip thrust, patada de glúteo y
   abductores no hay discusión. En prensa, hack y sentadilla en Smith es más discutible: si en esos
   pasara a secundario, el techo dejaría de romperse por una convención de etiquetas. Es
   relevamiento, no investigación: la decisión es de quien cargó el catálogo.
3. **Si el objetivo `cardio` tiene que cubrir todos los grupos**, eso no se arregla con un mínimo
   de series —WHO no lo respalda— sino desde la plantilla: que la sesión de cuerpo entero toque
   empuje, tracción, pierna y bisagra. Es un cambio de `templates`, no de `weeklyVolume`.

## Lo que esta revisión NO cubre

- **Qué es un "grupo muscular grande".** WHO no los enumera. Cualquier lista que se escriba acá es
  criterio propio, así que no se escribió ninguna y por eso no hay un test que exija cobertura.
- **Los ejercicios de cardio del catálogo.** La escaladora declara `glutes` + `quads`, pero se
  prescribe por tiempo y no entra en la cuenta de series.
- **Si el aviso de techo se lee demasiado seguido.** Sale en 5 de 33 perfiles, o sea que todavía
  discrimina. Si al corregir el catálogo bajara a 0, habría que revisar si el techo sirve de algo.
