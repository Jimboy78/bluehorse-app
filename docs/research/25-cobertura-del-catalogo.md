# Un tercio del gimnasio no entra en ningún plan

Revisión del 10 de septiembre de 2026. El catálogo es la pieza que ninguna herramienta había
mirado: `qa` barre datos muertos y código muerto, y `qa docs` cruza el ruleset con la
investigación, pero nadie preguntaba nunca qué pasa con los 58 ejercicios relevados a mano.

Se generaron los planes de los 33 perfiles de la matriz y se contó qué del catálogo aparece.

**Resultado: 19 de 58 ejercicios no aparecen en ningún plan, y cuatro grupos musculares no se
entrenan nunca.** Dos de esos cuatro son inalcanzables por construcción, no por casualidad.

## Lo que no se usa

| | |
|---|---|
| Ejercicios en el catálogo | 58 |
| Ejercicios que aparecen en algún plan | 39 |
| **Ejercicios que no aparecen en ninguno** | **19** |

Los 19: prensa de piernas, sentadilla con cinturón, wall ball, hiperextensiones, slam ball,
flexiones de brazos, face pull en polea, plancha, gemelos sentado, aperturas en máquina, cruce de
poleas, curl con barra Z, encogimientos de hombros, abductores en máquina, patada de glúteo en
máquina, extensión de glúteo sentado, elíptico, escaladora y caminata del granjero.

No todos son el mismo problema. La mayoría simplemente pierde desempates: hay ocho ejercicios de
patrón `squat` y el slot elige uno. Eso es esperable y no es un defecto — es lo que hace que dos
socios del mismo perfil no reciban el mismo aparato.

Lo que sí es un defecto es cuando el ejercicio **no puede ganar nunca**.

## Los cuatro músculos que no se entrenan, y por qué

| Músculo | Ejercicios que lo tienen como primario | ¿Puede entrar? |
|---|---|---|
| **Oblicuos** | Plancha (`core` / **tiempo**) | **No, estructural** |
| **Antebrazos** | Caminata del granjero (`carry` / **tiempo**) | **No, estructural** |
| Gemelos | Gemelos sentado (`isolation` / reps) | Sí; pierde desempates |
| Trapecios | Face pull, encogimientos de hombros (reps) | Sí; pierden desempates |

Las dos razones estructurales son reglas del motor que están **bien**:

1. **Fuera del cardio se descartan los ejercicios que se miden por tiempo.** Paso 2 de
   `chooseExercise`, y su comentario lo explica: el ruleset prescribe series, repeticiones y RIR, y
   *"decirle a alguien 2×6-10 de plancha no significa nada"*. Correcto. Pero la plancha es el
   **único** ejercicio del gimnasio con oblicuos primario.
2. **`carry` es un patrón que ninguna plantilla pide.** De los diez patrones que usan las
   plantillas, `carry` no está. La caminata del granjero es el único ejercicio `carry` y el único
   con antebrazos primario.

Ninguna de las dos se arregla tocando el motor sin romper algo mejor.

## Por qué importa: once deportes apuntan a un músculo que no existe para el plan

`sports.catalog` le asigna a cada deporte los músculos del gesto, para desempatar la selección.
Cruzando esa lista con los músculos inalcanzables:

| Deporte | Énfasis | Inalcanzable |
|---|---|---|
| Fútbol, Futsal | quads, hamstrings, glutes, **obliques** | oblicuos |
| Tenis, Pádel | **obliques**, front_delts, rear_delts, **forearms** | oblicuos, antebrazos |
| Béisbol | **obliques**, front_delts, **forearms** | oblicuos, antebrazos |
| Golf | **obliques**, **forearms**, rear_delts | oblicuos, antebrazos |
| Handball, Boxeo, Kickboxing, Hockey | **obliques**, … | oblicuos |
| Básquet | quads, glutes, calves | (ninguno: los gemelos sí pueden entrar) |

**Once de los doce deportes con énfasis nombran al menos un músculo que ninguna sesión puede
tocar.** Fútbol —el deporte más probable en un gimnasio de Arroyo Seco— es uno de ellos.

Y hay un segundo efecto, medido comparando el mismo perfil con deporte y sin deporte: **para cinco
de los doce (fútbol, futsal, básquet, hockey, golf) declarar el deporte no cambia ni un ejercicio
del plan.** En fútbol porque cuádriceps, isquios y glúteos ya están en todos lados y los oblicuos no
pueden entrar: el desempate no tiene sobre qué desempatar.

Eso no era visible desde ningún lado. La nota de la categoría `local_gesture` —*"prioriza los
músculos del gesto cuando hay varios ejercicios equivalentes"*— **solo se muestra cuando el deporte
cambia el volumen**, y `local_gesture` tiene `volumeMultiplier: 1`. Así que no había una promesa
rota en pantalla; había una función que no hacía nada y nadie lo decía.

## Corrección del 10 de septiembre de 2026: faltaba mirar los equivalentes

Todo lo de arriba cuenta qué ejercicios entran **al plan**. Pero el plan no es lo único que el socio
puede hacer: cada ejercicio ofrece "otras formas de hacerlo" (`findSubstitutes`), y esa es la
función que justifica el relevamiento del catálogo entero. Medido sobre los mismos 33 perfiles,
juntando el plan y los equivalentes que ofrece:

| | |
|---|---|
| Ejercicios que aparecen en algún plan | 39 |
| Ejercicios que aparecen como equivalente | 41 |
| **Alcanzables de una forma u otra** | **49 de 58** |
| **Sin aparecer en ningún lado** | **9** |

Los equivalentes **rescatan 10 de los 19**: prensa de piernas, sentadilla con cinturón,
hiperextensiones, flexiones de brazos, **plancha**, curl con barra Z, patada de glúteo, extensión de
glúteo sentado, elíptico y escaladora.

Los 9 que no aparecen en ninguna parte: wall ball, slam ball, face pull en polea, gemelos sentado,
aperturas en máquina, cruce de poleas, encogimientos de hombros, abductores en máquina y caminata
del granjero.

### Por qué los 9 restantes no llegan tampoco por ahí

Reimplementando el ranking de `scoreEquivalence` para ver en qué puesto queda cada ausente, los 9 se
parten en dos grupos distintos:

| Grupo | Cuáles | Qué pasa |
|---|---|---|
| **Ni siquiera puntúan** | Face pull, gemelos sentado, encogimientos de hombros, caminata del granjero | Puntaje **0** contra todo lo que aparece en algún plan: no comparten ni patrón ni un solo músculo primario. Quedan debajo de `minEquivalence: 0.5` siempre. Son, exactamente, los ejercicios de gemelos, trapecios y antebrazos. |
| **Puntúan pero quedan afuera del corte** | Wall ball (7º), aperturas (5º), cruce de poleas (6º), slam ball (4º) | `maxOptions: 3`. Son equivalentes válidos que no entran en los tres que se muestran. |

El primer grupo es el hallazgo real: no es un problema de cuántas opciones se muestran, sino de que
esos músculos no tienen ningún puente hacia el resto del catálogo.

### Un caso donde compartir estación esconde el equivalente más parecido

`findSubstitutes` bloquea siempre la máquina del ejercicio original, porque nació de "la máquina
está ocupada". Medido:

- **Aductores en máquina** tiene dos estaciones; **abductores en máquina**, una sola: la combinada.
- El plan le asigna al socio justamente la combinada.
- Con esa estación bloqueada, el ejercicio más parecido que existe en el gimnasio no se le puede
  ofrecer. Es correcto —la máquina está ocupada— pero vale anotarlo.

Y hay un contexto donde ese bloqueo **no** corresponde: `/explorar`, donde nadie está esperando una
máquina, se está mirando el catálogo. Ahí se sacó. Medido sobre los 58, cambia lo que se ve en uno
solo: abriendo "Remo invertido en TRX" ahora aparecen las dominadas, que estaban tapadas por
compartir estación. Es poco; la alternativa era seguir filtrando por una condición que en esa
pantalla no se cumple.

### Esto corrige el aviso que se había agregado

La primera versión del aviso preguntaba si el **catálogo** tenía, estructuralmente, algún ejercicio
con ese músculo primario en un patrón que alguna plantilla pidiera. Contra los planes reales esa
pregunta se equivoca en las dos direcciones:

| | Qué decía | Qué pasa de verdad |
|---|---|---|
| **Oblicuos** | "el gimnasio no tiene con qué" | **Falso.** La plancha aparece entre los equivalentes de los ejercicios de core: el socio puede cambiarla desde la sesión. |
| **Hombro posterior** (tenis, pádel) | no lo marcaba | **Faltaba.** Estructuralmente hay ejercicios que lo tienen primario, pero en el plan que esos perfiles reciben no aparece ni en una sesión ni entre los tres equivalentes de ningún ejercicio. |

Lo que el socio experimenta es su plan y lo que puede cambiar dentro de él. Eso es lo que hay que
medir, y es lo que mide ahora.

## Lo que se cambió

El plan **avisa**, con dos mensajes distintos según el caso, nombrando los músculos en los dos. Los
textos viven en el ruleset (`sports.emphasisOnlyBySwapNote` y `sports.emphasisUnreachableNote`), no
en el código:

- **"No lo trae de entrada, pero podés cambiarlo."** El músculo no está en el plan y sí entre los
  equivalentes. El aviso manda a "otras formas de hacerlo", que es la función que existe justo para
  esto.
- **"El gimnasio no tiene hoy con qué."** No está en el plan ni entre los equivalentes. Es el caso
  del hombro posterior y los antebrazos en tenis y pádel, **y desde la revisión del 13 de septiembre
  también el de los oblicuos** — ver abajo.

Se avisa en vez de arreglar la selección, y es a propósito:

- **Agregar un ejercicio de oblicuos con carga** sería inventar catálogo. El gimnasio tiene lo que
  tiene, relevado a mano y con fotos.
- **Sacar los oblicuos del énfasis** sería borrar la pregunta en vez de contestarla: el gesto de
  patear y el de golpear una pelota sí pasan por ahí.
- **Aflojar la regla del tiempo** para que entre la plancha llevaría a prescribir "3×10 de plancha",
  que es exactamente lo que esa regla existe para evitar.

## Corrección del 13 de septiembre de 2026: la regla valía en una puerta y no en la otra

El párrafo de arriba dice que aflojar la regla del tiempo llevaría a "3×10 de plancha". Eso ya
estaba pasando, por la otra puerta.

`chooseExercise` descarta los ejercicios por tiempo al **armar** el plan, y `findSubstitutes` no
mira la modalidad al **reemplazar**: su puntaje son patrón y músculos primarios, nada más. La
plancha (`core`, abs + oblicuos) y los abdominales en máquina (`core`, abs) puntuaban 0,70 entre
sí. Medido sobre el catálogo real, **4 de los 123 ofrecimientos cruzaban de tiempo a
repeticiones**.

Y aceptar un reemplazo no reescribe la prescripción —`handlePickSubstitute` cambia el ejercicio y
la estación, no las series— así que alguien en "Abdominales en máquina, 3 series de 15" tocaba
cambiar, elegía la plancha y se quedaba con **"Plancha, 3 series de 15 repeticiones"**. Textual lo
que este documento declaraba evitado.

Eso invalida la conclusión de la sección anterior en su parte más citada: el aviso "podés
cambiarlo" para los oblicuos **era cierto solo a través del bug**. Diez de los 26 deportes del
catálogo enfatizan oblicuos y el gimnasio tiene un solo ejercicio con oblicuos primario, que es de
tiempo. Con la regla aplicada en las dos puertas, los oblicuos pasan a "el gimnasio no tiene hoy con
qué", que es lo que siempre fue.

Lo que se agregó, en el ruleset y no en el código (`substitution.requireSameMeasure` y
`substitution.requireSameExplosiveness`):

| Regla | Qué descarta | Costo medido |
|---|---|---|
| `requireSameMeasure` | Sostener por repetir: plancha ↔ abdominales | 6 de 123 ofrecimientos; 1 ejercicio queda sin reemplazo (la plancha, que no tiene equivalente por tiempo en esta sala) |
| `requireSameExplosiveness` | Salto al cajón ↔ sentadilla, swing ↔ peso muerto rumano | 8 de 123; ninguno queda sin reemplazo |
| Las dos juntas | | 123 → 109 ofrecimientos, 7 → 8 sin reemplazo |

El segundo es el que salía **primero** en pantalla: `Sentadilla` → `Salto al cajón` puntuaba 1,00
—mismo patrón, mismos primarios— así que encabezaba la lista con un 100%. Alguien con objetivo de
fuerza en 4×5 con carga tocaba "cambiar ejercicio" y la primera opción era saltar a un cajón cinco
veces. Al revés importa para `power`: el salto y el swing son el ejercicio **por ser** explosivos.

No se pidió la `modality` exacta. `reps_weight` y `reps_bodyweight` se cuentan igual, y ahí están
los equivalentes más obvios de la sala —press de banco → flexiones, dorsalera → dominadas—.
Exigirla costaba 29 ofrecimientos y cinco ejercicios más sin reemplazo.

Es la regla dura 4 aplicada a la cobertura: si el plan no está cubriendo algo que el deporte pide,
el plan lo dice.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| Descartar ejercicios por tiempo fuera del cardio | **se mantiene** | El ruleset prescribe series y reps; un ejercicio isométrico no los tiene. |
| `carry` sin ninguna plantilla que lo pida | **queda anotado** | No es un error del motor: es una plantilla que no existe. Ver decisiones. |
| El énfasis por deporte | **se mantiene, y ahora avisa cuando no puede** | Es un desempate blando y así lo declara `06`. Lo que faltaba era decir cuándo no tiene con qué. |
| 19 ejercicios sin usar | **la mayoría, esperable** | Ocho ejercicios de `squat` para un slot: que sobren es lo que da variedad entre socios. |
| Gemelos y trapecios sin entrenar en 33 perfiles | **queda anotado, no se fuerza** | Pueden entrar; no ganaron ningún desempate. Forzarlos sería inventar una prioridad que ninguna fuente sostiene. |

## Lo que queda para decidir

1. **Una plantilla que use `carry`.** Es el único patrón huérfano. Con eso entrarían la caminata del
   granjero y con ella los antebrazos — aunque sigue siendo de tiempo, así que habría que ver cómo
   se prescribe.
2. **Si vale la pena un ejercicio de oblicuos con carga.** Subió de prioridad con la corrección de
   arriba: era la única pregunta que el aviso "podés cambiarlo" hacía parecer contestada. Giro ruso
   con mancuerna, leñador en polea, rotación en polea: si alguno existe físicamente en el gimnasio y
   no está cargado, se resuelve cargándolo, no tocando el motor.
   **18/09/2026:** se cargó "Lanzamiento rotacional con wall ball" (oblicuos), que se hace con lo
   que el gimnasio tiene. Es explosivo, así que no entra en el slot de core (regulado por RIR): queda
   disponible en el plan a mano y como equivalente. Ver `37`.
3. **Si los gemelos merecen su propio slot.** Hoy compiten en `isolation` contra todo lo demás y
   nunca ganan. Es la misma pregunta que ya se contestó para el core, que sí tiene slot propio.

## Corrección del 12 de septiembre de 2026: el piso de `minPoolSize` no protege todos los filtros

El punto pendiente de más abajo ("los patrones que sí se piden pero con pocos candidatos") se midió.
`chooseExercise` (`packages/engine/src/placeholder-engine.ts:1346`) aplica ocho preferencias en
cadena. Tres de ellas usan `preferSoft`, que respeta `selection.minPoolSize` (hoy 3) y se salta el
filtro si dejaría el pool más chico que el piso: rotación respecto del plan anterior (paso 1),
tolerancia de nivel (paso 5) y énfasis deportivo (paso 7). El propio comentario del código explica
por qué existe esa protección: *"Un pool de una sola opción no es una elección: es el mismo ejercicio
—y la misma máquina— para todos los socios del mismo perfil, aunque el catálogo tenga alternativas
equivalentes."*

**Los otros tres pasos usan `prefer`, sin esa protección**, y con el catálogo real dos patrones que
sí se piden como ejercicio principal colapsan por debajo del piso:

Simulando la cadena de filtros del ejercicio principal (`modality !== 'time'` → `modality ===
'reps_weight'` → `isCompound`) contra los 58 ejercicios reales:

| Patrón | Candidatos totales | Sobreviven al principal | ¿Por qué se cae cada uno |
|---|---|---|---|
| `horizontal_pull` | 4 | **2** | Remo invertido en TRX (peso corporal) cae en el filtro de `reps_weight`; face pull en polea (aislado) cae en el filtro de compuesto. |
| `vertical_pull` | 3 | **2** | Dominadas (peso corporal) cae en el filtro de `reps_weight`. |

Los cuatro patrones restantes que sí se piden como principal (`squat`, `hinge`, `horizontal_push`,
`cardio` no aplica esta cadena) quedan por encima del piso y no tienen el problema.

**Acotado a `primary`.** Se repitió la misma simulación para `secondary` (sin el filtro de
`reps_weight`, que solo aplica al principal) y para `isolation`: con el catálogo actual, ningún
patrón pedido en esos dos roles queda por debajo del piso de 3. El colapso es específico del rol
principal, donde se suman dos filtros duros en cadena (`reps_weight` y `isCompound`) en vez de uno
solo.

**Consecuencia medida:** todo socio a quien el motor le pida un `vertical_pull` principal elige
entre **dorsalera al pecho y dorsalera con agarre neutro únicamente** — dominadas nunca puede ser el
ejercicio principal de ese slot, sin importar nivel o rotación, porque la cadena lo descarta antes de
que la protección de piso tenga oportunidad de aplicarse. Mismo caso para `horizontal_pull`: remo
sentado y remo con mancuerna se reparten el 100% de las asignaciones, remo invertido en TRX y face
pull en polea quedan estructuralmente afuera del rol principal.

**Por qué importa además de la variedad:** es la misma preferencia (`modality === 'reps_weight'`)
que `22-carga-de-potencia.md` ya identificó bloqueando los ejercicios explosivos del objetivo
potencia. Acá el efecto es más amplio: no depende del objetivo, alcanza a `strength` e `hypertrophy`
también, cada vez que el patrón principal es `horizontal_pull` o `vertical_pull`.

### Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| `preferSoft` con piso solo en 3 de 8 pasos | **inconsistencia real** | El propio código explica por qué el piso importa; la razón no depende de cuál paso está aplicando el filtro. |
| Bug de código, no de evidencia | — | No hay ningún número de investigación en juego: es una preferencia de selección que se auto-contradice contra su propio piso declarado. |

### Lo que queda para decidir (dueño)

Cambiar los pasos 2-4 (`modality !== 'time'`, `modality === 'reps_weight'` en el principal,
`isCompound`) de `prefer` a `preferSoft` alinearía la protección con lo que el comentario del código
ya promete. Es un cambio de comportamiento de selección —no de números de prescripción—, así que
queda para quien decide: **no se tocó el motor** desde esta auditoría. Si se aplica, hay que correr
`npm run qa:motor` después y mirar el diff del reporte: se espera que dominadas y remo invertido en
TRX empiecen a aparecer como principal para una parte de los perfiles.

## Lo que esta revisión NO cubre

- **Si los 19 sin usar deberían estar en el catálogo.** Un ejercicio que existe en el gimnasio va al
  catálogo aunque el motor no lo elija: sirve para sustituir cuando la máquina está ocupada, que es
  la función que justifica el relevamiento entero.
- **Cuántos socios declaran cada deporte.** Toda la tabla de arriba pesa distinto si nadie juega al
  golf. Eso se sabrá con datos de uso, no desde acá.
