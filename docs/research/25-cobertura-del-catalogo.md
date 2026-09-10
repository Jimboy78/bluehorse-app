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

## Lo que se cambió

El plan **avisa** cuando el deporte declarado enfatiza un músculo que el gimnasio no puede cubrir
dentro de una sesión, nombrándolo. El texto vive en el ruleset
(`sports.emphasisUnreachableNote`), no en el código.

Se avisa en vez de arreglar la selección, y es a propósito:

- **Agregar un ejercicio de oblicuos con carga** sería inventar catálogo. El gimnasio tiene lo que
  tiene, relevado a mano y con fotos.
- **Sacar los oblicuos del énfasis** sería borrar la pregunta en vez de contestarla: el gesto de
  patear y el de golpear una pelota sí pasan por ahí.
- **Aflojar la regla del tiempo** para que entre la plancha llevaría a prescribir "3×10 de plancha",
  que es exactamente lo que esa regla existe para evitar.

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
2. **Si vale la pena un ejercicio de oblicuos con carga.** Giro ruso con mancuerna, leñador en
   polea, rotación en polea: si alguno existe físicamente en el gimnasio y no está cargado, se
   resuelve cargándolo, no tocando el motor.
3. **Si los gemelos merecen su propio slot.** Hoy compiten en `isolation` contra todo lo demás y
   nunca ganan. Es la misma pregunta que ya se contestó para el core, que sí tiene slot propio.

## Lo que esta revisión NO cubre

- **Si los 19 sin usar deberían estar en el catálogo.** Un ejercicio que existe en el gimnasio va al
  catálogo aunque el motor no lo elija: sirve para sustituir cuando la máquina está ocupada, que es
  la función que justifica el relevamiento entero.
- **Cuántos socios declaran cada deporte.** Toda la tabla de arriba pesa distinto si nadie juega al
  golf. Eso se sabrá con datos de uso, no desde acá.
- **Los patrones que sí se piden pero con pocos candidatos.** No se midió si algún slot queda con
  una sola opción, que es el problema que `selection.minPoolSize` existe para evitar.
