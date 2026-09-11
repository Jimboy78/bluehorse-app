# Una línea de una query decidía si la adaptación tenía sentido

Revisión del 10 de septiembre de 2026. Salió de terminar lo que `29-la-intensidad-que-nadie-lee.md`
dejó anotado: los otros tres modificadores, que ahí solo se miraron de reojo.

Los tres funcionan. Lo que apareció es otra cosa.

## Los tres modificadores, medidos

**Desentrenamiento** — cuatro perfiles, y el escalonado es el correcto:

| Perfil | Días sin entrenar | Qué avisa |
|---|---|---|
| `volvió a la semana` | 7 | nada (el multiplicador de 10 días es 1,0) |
| `volvió al mes` | 30 | la nota **sin carga** |
| `volvió a los tres meses` | 90 | la nota **sin carga** |
| `volvió al año` | 365 | la nota **sin carga** |

El ruleset tiene dos textos, `withLoad` y `withoutLoad`, y el motor elige el segundo porque ningún
ítem trae carga. Es la decisión honesta y ya estaba tomada: anunciarle a alguien un recorte del 30 %
sobre una carga que no va a ver en ninguna parte sería peor que no decirle nada. El multiplicador se
calcula igual y espera a que haya baselines.

**Nota de nivel** — aparece en `power`, `endurance`, `cardio` y los perfiles de deporte con esos
objetivos, o sea exactamente los tres que tienen el `byLevel` vacío. Es la corrección que pedía
`10-nivel-de-experiencia.md`, funcionando.

**Frecuencia** — el aviso de "elegiste menos días de los que esta plantilla necesita" sale en
`frecuencia mínima` y en nadie más.

## Lo que sí estaba mal

`ReviewProgressInput.history` lleva este comentario en el contrato:

> Series registradas, **más recientes primero**. El motor no decide cuántas mirar: se le pasan.

Y toda la adaptación lo da por cierto sin verificarlo. `proposeAbsenceDeload` hace
`history.find((s) => !s.isWarmup)` y trata esa serie como la última que hizo el socio;
`isReadyToIncrease` mira `sets.slice(0, N)` como si fueran las N más recientes.

Un comentario no es una garantía. Medido, con el mismo historial de seis sesiones —la más reciente de
hoy, la más vieja de hace 100 días— pasado de tres formas:

| Cómo viene el historial | Qué propone el motor |
|---|---|
| como pide el contrato | `load_increase/rir_above_target:41` |
| **al revés** | `deload/absence:50%` + `load_increase/rir_above_target:41` |
| **desordenado** | `deload/absence:50%` + `load_increase/rir_above_target:41` |

El motor le propone **cortar el volumen a la mitad a alguien que entrenó hoy**, con el texto "Pasaron
100 días desde tu última sesión".

Lo importante es cómo se rompería. Hoy la app lo ordena bien:

```ts
.order('completed_at', { ascending: false })   // apps/web/src/lib/adaptation.ts
```

Es una línea de una query. Alguien que agregue una columna al `select`, o que copie esa consulta para
otra pantalla, puede tocarla sin saber que de ella depende la adaptación entera. **Y el error no
rompe nada**: no hay excepción, no hay pantalla en blanco, no hay test rojo. Sale una propuesta
absurda, el socio la acepta o la rechaza, y nadie se entera.

### La corrección

`reviewProgress` ordena el historial al entrar. Cuesta un `sort` sobre un array acotado por
`HISTORY_LIMIT`, con el orden correcto no cambia absolutamente nada —los 498 tests siguen en verde y
el reporte de planes es idéntico— y vuelve imposible esa clase de error.

Se compara por instante y no por texto: dos ISO válidos del mismo momento pueden escribirse distinto
(`Z` contra `+00:00`) y ordenarlos alfabéticamente los pondría en cualquier lado. `Date.parse` no lee
el reloj, así que el motor sigue siendo puro (regla dura 2).

## Dos falsificaciones que no fallaron, y por qué

Esto vale más que el arreglo, porque es la segunda vez en dos iteraciones que una falsificación
engaña.

**1. Invertir el orden del `sort` dejaba todo en verde.** El test que había escrito pedía que las
tres entradas dieran el mismo resultado, y un motor que ordena al revés **también cumple eso**: las
tres dan la misma respuesta equivocada. La consistencia no es la corrección. Hizo falta un segundo
test que fije la **dirección**: con la última sesión de hoy y la primera de hace 100 días, no puede
salir ningún descargo por ausencia.

**2. Reemplazar `${Math.round(params.deload.volumeMultiplier * 100)}%` por `"50%"` dejaba todo en
verde.** Ahí el test estaba bien y la rotura estaba mal: `volumeMultiplier` **vale** 0,5, así que las
dos expresiones producen el mismo string. La falsificación correcta es cambiar el número en el
ruleset **y** hardcodearlo en el motor a la vez; ahí sí falla, con
`expected 'deload/absence:50%' to contain '60%'`.

Las dos comparten la lección de la iteración anterior: **una falsificación que no rompe nada puede
significar un test flojo o una rotura falsa**, y hay que averiguar cuál antes de concluir.

## Lo que este documento NO cubre

- **Si un plan recién generado para alguien que volvió después de un año debería salir con volumen
  reducido.** Hoy sale completo: el descargo por ausencia es una *propuesta* de `reviewProgress` y no
  toca `generatePlan`. Puede ser correcto —son dos caminos distintos— pero no está decidido en
  ningún lado, así que queda anotado.
- **El resto de las precondiciones del contrato.** Ésta era la única que se verificó. Si hay otras
  que el motor da por ciertas sin comprobar, no se buscaron.
