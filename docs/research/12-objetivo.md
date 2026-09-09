# El objetivo: seis opciones, cinco prescripciones y dos explicaciones escondidas

Auditoría del 9 de septiembre de 2026, quinta iteración de la revisión del motor.

El objetivo es la entrada que más mueve el plan: elige la plantilla y trae el bloque entero de
prescripción. Es la última de las entradas grandes que quedaba sin auditar.

## Lo que se mide sin salir del repo

### `recomposition` es idéntico a `hypertrophy`

Comparando el bloque `default` completo de los seis objetivos —series, repeticiones, RIR, descanso e
intensidad de los tres roles—:

| Objetivo | Primario | Secundario | Aislamiento |
|---|---|---|---|
| `strength` | 4×1-5 · RIR 3 · 180 s · 85-100 % | 3×3-8 · 120 s · 75-85 % | 2×6-10 · 90 s · 60-75 % |
| `hypertrophy` | 4×6-12 · RIR 1 · 120 s · 65-80 % | 3×8-15 · 90 s · 60-75 % | 2×10-15 · 60 s · 40-60 % |
| `recomposition` | **idéntico a hipertrofia** | **idéntico** | **idéntico** |
| `power` | 3×1-3 · sin RIR · 240 s · 30-60 % | 3×1-5 · 180 s · 30-60 % | 2×1-3 · 120 s · 30-60 % |
| `endurance` | 3×12-15 · RIR 2 · 60 s · 40-60 % | 3×12-15 · 45 s · 40-60 % | 2×12-15 · 45 s · 35-55 % |
| `cardio` | 2×8-12 · RIR 3 · 90 s · 60-75 % | 2×10-15 · 60 s · 55-70 % | 2×12-15 · 45 s · 40-60 % |

**Seis objetivos, cinco prescripciones.** Y esto no es un descuido: el propio ruleset lo declara en
la nota de confianza de `recomposition`, que dice textualmente *"Los números son los de hipertrofia;
lo que cambia es la dieta, que esta app no maneja"*. Es honesto, correcto según `02`, y coherente
con que la app declare explícitamente que **no es una app de nutrición**.

El problema es otro, y es el hallazgo de esta iteración.

### Dos objetivos tienen una explicación escrita que el socio nunca ve

`apps/web/src/App.tsx`:

```ts
if (block?.confidence !== 'low' || !block.confidenceNote) return null;
```

El aviso solo aparece cuando la confianza es **exactamente** `low`. Resultado:

| Objetivo | Confianza | ¿Tiene nota? | ¿Se muestra? |
|---|---|---|---|
| `endurance` | low | sí | ✅ |
| `power` | low | sí | ✅ |
| `cardio` | medium | **sí** | **no** |
| `recomposition` | medium | **sí** | **no** |
| `strength` | high | no | — |
| `hypertrophy` | high | no | — |

Las dos notas ocultas dicen cosas que cambian lo que el socio espera del plan:

- **`recomposition`**: que los números son los de hipertrofia y que la diferencia la hace la
  alimentación, que la app no maneja. Alguien que eligió "recomposición" esperando que el plan
  hiciera algo distinto merece saberlo.
- **`cardio`**: que el trabajo de sala es solo la dosis mínima de fuerza en paralelo, y que
  `minSetsPerMuscle` está en 0 **a propósito** porque poner un número sería inventarlo.

La regla dura 4 dice que un bloque con `confidence: "low"` avisa en pantalla. No dice que uno con
`medium` deba callarse cuando tiene algo escrito. Alguien escribió esas dos notas a propósito y un
`!==` las silenció.

### `priority` no discrimina nada

`primaryGoal` ordena los objetivos por `priority` y **descarta todos menos el primero**. Pero el
onboarding solo deja elegir **uno** (`useState<Goal | null>`), así que el array nunca tiene más de
un elemento y `priority` nunca decide nada. Es infraestructura para una función que no existe: no
hace daño, pero no hay que confundirla con individualización.

### `cardio.interference` está declarado y muerto

`avoidIntervalsSameDayAsLowerBody: true` y `minHoursBetweenSessions: 6` viven en el ruleset,
validados por zod, y **no los lee nadie** — solo aparecen en el esquema. Es el mismo patrón que
`referIf` y `redFlags` en la iteración 2. Queda anotado para la iteración de cardio.

## Lo que dice la evidencia sobre separar objetivos por rango de repeticiones

### La hipertrofia es independiente de la carga; la fuerza no — CONFIANZA ALTA

Metaanálisis en red de **28 estudios y 747 adultos sanos**, comparando carga baja (>15 RM o
<60 % 1RM), moderada (9-15 RM o 60-79 %) y alta (≤8 RM o ≥80 %):

**Hipertrofia — ninguna comparación resultó significativa:**

| Comparación | SMD (IC 95 %) | p |
|---|---|---|
| Alta vs baja | 0,12 (−0,06 a 0,29) | 0,241 |
| Moderada vs baja | 0,20 (−0,04 a 0,44) | 0,113 |
| Alta vs moderada | −0,09 (−0,33 a 0,16) | 0,469 |

**Fuerza — sí hay diferencias, a favor de la carga alta:**

| Comparación | SMD (IC 95 %) | p |
|---|---|---|
| Alta vs baja | **0,60 (0,38 a 0,82)** | **< 0,001** |
| Moderada vs baja | **0,34 (0,05 a 0,62)** | **0,003** |
| Alta vs moderada | 0,26 (−0,02 a 0,54) | 0,068 |

Conclusión de los autores: *las mejoras de hipertrofia parecen independientes de la carga, mientras
que las de fuerza son superiores con cargas altas.*

> Lopez P, Radaelli R, Taaffe DR, Newton RU, Galvão DA, Trajano GS, Teodoro JL, Kraemer WJ,
> Häkkinen K, Pinto RS. *Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain:
> Systematic Review and Network Meta-analysis.* Med Sci Sports Exerc. 2021.
> DOI 10.1249/MSS.0000000000002585

**Qué implica para el ruleset, con cuidado:**

1. La separación `hypertrophy` (65-80 %) contra `endurance` (40-60 %) **no produce diferencias de
   hipertrofia**. El socio que elige resistencia muscular gana músculo igual. Eso no invalida
   separarlos —los desenlaces buscados son distintos— pero sí desmiente la idea de que el rango de
   repeticiones sea el mecanismo del crecimiento. Lo que manda es el volumen, y eso ya está medido
   en `11`.
2. **La zona más riesgosa no tiene ventaja demostrada.** `strength` prescribe el primario a
   85-100 % 1RM, o sea series de 1 a 5 repeticiones cerca del máximo. Contra la carga moderada, esa
   ventaja **no alcanza significación** (SMD 0,26; IC −0,02 a 0,54; p = 0,068).

   Hay que decirlo con precisión: *no significativo* no es *equivalente*. El punto estimado favorece
   a la carga alta y el intervalo apenas roza el cero. Pero para una app que prescribe **sin
   supervisión presencial**, y cuyo propio bloque de seguridad recomienda abstenerse de cargas
   máximas sin guía, hay una tensión real entre los dos bloques del mismo ruleset. **No se cambió
   ningún número por esto**: reemplazar 85-100 % por otro rango sería cambiar un número respaldado
   por uno inventado. Queda declarado como decisión pendiente de producto.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| Seis objetivos, cinco prescripciones | **se mantiene** | `recomposition` = `hypertrophy` es lo correcto según `02`: la diferencia es dietética y la app no maneja dieta. |
| Ocultar la nota de los bloques `medium` | **se cae** | Dos explicaciones escritas a propósito, silenciadas por un `!==`. |
| `strength` a 85-100 % 1RM | **se mantiene, declarado** | La ventaja sobre carga moderada no alcanza significación, pero tampoco hay evidencia de equivalencia. Cambiarlo sería inventar. |
| Separar `hypertrophy` de `endurance` por repeticiones | **se mantiene, matizado** | Los desenlaces difieren, pero no por la hipertrofia: esa es independiente de la carga. |
| `priority` | **superficie muerta** | El onboarding permite un solo objetivo. No hace daño; no es individualización. |
| `cardio.interference` | **declarado y muerto** | Nadie lo lee. Pendiente para la iteración de cardio. |

## Lo que se cambió

El aviso de evidencia ahora se muestra **siempre que el bloque traiga una nota**, y el encabezado
cambia según la confianza: los bloques flojos siguen apareciendo como advertencia, y los `medium`
como información. Un `high` sin nota sigue sin mostrar nada.

## Lo que esta investigación NO cubre

- **Si `power` merece ser un objetivo separado** con la evidencia que tiene. Su bloque ya está
  marcado `low`, no tiene RIR, no diferencia por nivel (iteración 3) y ninguna plantilla lo cubre
  por encima de 3 sesiones (iteración 4). Es el objetivo peor sostenido de los seis y merece una
  decisión de producto, no más investigación.
- **La interferencia entre cardio y fuerza.** Hay un bloque escrito y sin usar; evaluarlo es la
  próxima iteración.
- **Si conviene permitir varios objetivos a la vez.** La infraestructura existe (`priority`), la
  interfaz no. No hay evidencia acá que lo decida: es producto.
