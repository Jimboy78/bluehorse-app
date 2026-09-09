# Frecuencia semanal: importa diez veces más para fuerza que para hipertrofia

Auditoría del 9 de septiembre de 2026, cuarta iteración de la revisión del motor.

El socio elige la frecuencia con un slider de **1 a 7** sesiones por semana. Ese número hace dos
cosas: elige la plantilla, y define sobre cuántas sesiones se mide el volumen semanal.

## Lo que se puede medir sin salir del repo

### El 42 % de lo que el socio puede elegir cae a un fallback

Cruzando los seis objetivos contra las siete frecuencias que el slider permite:

| Objetivo | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| `strength` | ✗ | ok | ok | ok | ok | ok | ✗ |
| `hypertrophy` | ✗ | ok | ok | ok | ok | ok | ✗ |
| `recomposition` | ✗ | ok | ok | ok | ok | ok | ✗ |
| `endurance` | ✗ | ok | ok | ok | ok | ✗ | ✗ |
| `cardio` | ✗ | ✗ | ok | ok | ok | ✗ | ✗ |
| `power` | ✗ | ok | ok | ✗ | ✗ | ✗ | ✗ |

**18 de 42 combinaciones** caen a la plantilla de fallback, con una advertencia. Ninguna frecuencia
de 1 ni de 7 está cubierta para ningún objetivo, y `power` no tiene nada por encima de 3.

No es que el fallback esté roto — funciona y avisa. Es que se le ofrece al socio un rango que el
ruleset no cubre, y casi la mitad de las respuestas posibles terminan en una plantilla que no era
para eso.

### El chequeo de volumen mide una semana que el socio no va a hacer

Este es el hallazgo con consecuencia real. En `placeholder-engine.ts`:

```ts
const perWeek = Math.min(
  Math.max(goal.sessionsPerWeekTarget, template.sessionsPerWeek[0]),
  template.sessionsPerWeek[1],
);
```

Ese `Math.max` **sube la frecuencia declarada hasta el mínimo de la plantilla**. Un socio que dijo
que solo puede venir 1 vez por semana, con una plantilla de `[2, 3]`, hace que el motor mida el
volumen semanal **sobre 2 sesiones**.

Consecuencia: el aviso de "estás por debajo del volumen mínimo" **nunca se dispara para quien va
una sola vez**, que es exactamente la persona que lo necesita. El motor le calcula el volumen de
alguien que viene el doble de veces y concluye que está bien.

Medido, generando planes con el ruleset real y sumando las series de la semana:

| Frecuencia declarada | Series por semana |
|---|---|
| 1 | 16 (medidas como si fueran 2 sesiones) |
| 2 | 32 |
| 3 | 48 |
| 4 | 54 |
| 5 | 70 |
| 6 | 83 |
| 7 | 112 |

El volumen escala con la frecuencia: **el motor no redistribuye**. Ir menos veces significa hacer
menos series, no las mismas repartidas. Eso es correcto y realista, pero cambia por completo cómo
hay que leer la evidencia de abajo.

## Lo que dice la evidencia

### La frecuencia tiene efectos muy distintos según el objetivo — CONFIANZA ALTA

Del mismo metaanálisis de meta-regresiones usado en la iteración anterior (67 estudios,
2058 participantes), ahora mirando específicamente la frecuencia:

| Desenlace | Pendiente marginal (β) | Probabilidad de ser > 0 | Estudios |
|---|---|---|---|
| **Fuerza** | **3,27 %** (IC creíble 95 % **2,74 a 3,84**) | **100 %** | 66 estudios, 490 efectos, 2020 participantes |
| **Hipertrofia** | 0,32 % (IC creíble 95 % **−0,14 a 0,82**) | 91,3 % | — |

La pendiente para fuerza es **diez veces mayor**, y su intervalo creíble no toca el cero. La de
hipertrofia sí lo cruza: los autores la describen como *inconsistente y compatible con efectos
insignificantes*, y los modelos secundarios que usan solo efectos directos (15 estudios,
370 participantes) confirman esa compatibilidad con el nulo.

Para fuerza, el mejor ajuste fue un modelo recíproco: hay dosis-respuesta **con rendimientos
decrecientes**. Más frecuencia ayuda, pero cada sesión extra ayuda menos que la anterior.

**El detalle que cambia todo, y que es fácil pasar por alto:** estos modelos están **ajustados por
volumen**. Lo que dicen es "a igual volumen semanal, repartirlo en más sesiones da más fuerza". No
dicen que agregar sesiones sin agregar volumen sirva, ni que ir menos veces con menos volumen sea
equivalente.

Como en la app ir menos veces **sí** baja el volumen (tabla de arriba), el socio que baja la
frecuencia pierde por los dos lados: pierde el efecto de frecuencia (si busca fuerza) y pierde
volumen (que afecta a los dos objetivos con 100 % de probabilidad, según la misma fuente).

> Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC. *The Resistance Training Dose
> Response.* Sports Med. 2025. DOI 10.1007/s40279-025-02344-w

### El contraste con la evidencia previa, que conviene declarar

Los propios autores señalan que su hallazgo sobre frecuencia y fuerza **contradice metaanálisis
anteriores**, que no encontraban efecto independiente de la frecuencia. Su explicación: no existe
consenso sobre cómo definir la frecuencia, y en particular sobre si el trabajo indirecto (ejercicios
distintos del evaluado que igual involucran el músculo) cuenta o no. Este trabajo lo cuenta con
peso 0,5 — el método `fractional` — y esa decisión, que los autores mismos llaman una *heurística*
y no un estándar, es parte de por qué el resultado difiere.

Un ECA volumen-igualado en 36 varones entrenados (10 semanas, 2 contra 3 días/semana) tampoco
encontró diferencias significativas en fuerza ni hipertrofia, y los tamaños de efecto de hipertrofia
favorecieron a la frecuencia **menor**. > DOI 10.2478/hukin-2019-0062

O sea: la dirección del efecto en fuerza es la mejor apuesta disponible, pero no es unánime, y
conviene decirlo así.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| Slider de 1 a 7 | **se mantiene, pero el motor avisa** | Preguntar es correcto; lo que no se puede es responder con una plantilla que no era para eso sin decirlo con claridad. |
| `Math.max(target, template[0])` en el chequeo de volumen | **se cae** | Mide una semana que el socio no va a hacer, y silencia el aviso justo para quien va menos. |
| El fallback de plantilla | **se mantiene** | Ya avisa. El problema es la cobertura del ruleset, no el mecanismo. |
| No redistribuir volumen al bajar frecuencia | **se mantiene** | Es lo realista. Pero hay que decirle al socio qué pierde. |
| Tratar la frecuencia igual para todos los objetivos | **se cae** | β = 3,27 % en fuerza contra 0,32 % en hipertrofia, con el intervalo de hipertrofia cruzando el cero. |

## Lo que se cambió

1. El volumen semanal se mide sobre **las sesiones que el socio dijo que puede hacer**, no sobre el
   mínimo de la plantilla. Si va una vez por semana, se mide una.
2. Cuando la frecuencia declarada queda por debajo de lo que la plantilla necesita, el plan lo dice
   explícitamente en vez de rellenar en silencio.
3. El aviso de frecuencia distingue por objetivo, con el texto en el ruleset
   (`modifiers.frequency`): en fuerza, sumar una sesión rinde; en hipertrofia, lo que importa es el
   total de series de la semana.

## Lo que esta investigación NO cubre

- **Cuál es la frecuencia mínima útil.** Nadie la midió como tal. Que la dosis-respuesta tenga
  rendimientos decrecientes no dice dónde está el piso.
- **La cobertura del ruleset.** Faltan plantillas para 1 y 7 sesiones, y para `power` por encima de
  3. Escribirlas es trabajo de contenido, no de investigación, y no se hizo acá.
- **Si conviene concentrar el volumen o repartirlo** cuando la frecuencia es baja por obligación.
  Los modelos están ajustados por volumen, así que no responden esta pregunta.
- **La brecha demográfica sigue igual** que en la iteración anterior: muestras de ~25 años, 79 %
  varones.
