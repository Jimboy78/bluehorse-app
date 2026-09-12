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

## Continuación: el barrido que este documento decía no haber hecho

Agregado el mismo día. La última sección decía que no se habían buscado otras precondiciones. Se
buscaron.

### Precondiciones escritas: hay una sola, y era ésta

Barrido el contrato entero por prosa que declare un supuesto —"primero", "ordenado", "se espera",
"debe"—: **una sola coincidencia**, la de `history`. El resto de las interfaces no le pide nada al
que llama.

### Precondiciones no escritas: nueve entradas degeneradas contra los cuatro métodos

| Caso | Qué pasa |
|---|---|
| gimnasio sin ejercicios | plan con 8 sesiones vacías y 10 avisos |
| gimnasio sin equipamiento | ídem |
| gimnasio vacío del todo | ídem |
| **socio sin objetivos** | **lanza** `El usuario no tiene ningún objetivo cargado.` |
| 0 sesiones por semana | plan, 3 avisos |
| 20 sesiones por semana | plan, 2 avisos |
| sin fecha de nacimiento | plan, 1 aviso |
| sustituir un ejercicio inexistente | 0 resultados |
| revisar con el catálogo vacío | 0 propuestas |

Ocho de nueve aguantan. El que lanza está **guardado antes** en `apps/web/src/lib/plan.ts`, que
chequea los objetivos y tira un error propio nombrando la causa real —falta el onboarding— antes de
llamar al motor. O sea que el borde está cubierto en el lugar correcto.

El caso del gimnasio vacío es el mismo que ya había aparecido bloqueando las 58 estaciones
(`28-lo-que-el-socio-lee.md`), ahora por un camino más probable: un catálogo que no se cargó, que
`CLAUDE.md` marca como lo que pasa después de cada `db:reset`. Sigue sin construirse nada para él, y
sigue anotado.

### Lo que sí apareció: el mismo descuido, en la app

Leyendo `plan.ts` para ver el guard de los objetivos apareció esto tres líneas abajo:

```ts
// Una fila por ejercicio: la más reciente. La consulta viene ordenada, así
// que la primera de cada ejercicio gana.
baselines: dedupeByExercise(baselineRows ?? []),
```

`dedupeByExercise` se llama "quedarse con la más reciente" y lo que hacía era **quedarse con la
primera**. Está exportada, y su propio test empezaba con el comentario *"Llega ordenada de más nueva
a más vieja, como la pide la consulta"*: documentaba la precondición en vez de sacarla, igual que el
contrato con el historial.

Pesa lo mismo o más. De esos baselines sale `baselineToTarget`, o sea **la carga que el plan le
propone al socio**. Una fila vieja elegida por venir primera es una carga equivocada, sin error, sin
aviso y sin test rojo.

Corregido igual: ordena por instante al entrar. Falsificado de tres maneras, las tres fallando —
sacar el `sort`, invertirlo, y comparar texto en vez de instante.

Esa tercera importa y costó construirla bien. El primer test que escribí para el formato usaba
`'…+00:00'` contra `'…Z'` en **meses distintos**, así que el texto y el instante coincidían y el test
pasaba con cualquiera de las dos implementaciones. El par que sí discrimina es el mismo día con husos
distintos: `2026-09-01T12:00:00+02:00` son las 10:00 UTC, **anteriores** a `2026-09-01T11:00:00Z`,
pero alfabéticamente la cadena que empieza con "12" va primero.

## La tercera — encontrada el 12 de septiembre de 2026

El cierre de arriba decía "no se barrió el resto del proyecto buscando la tercera". Se barrió:
`grep` sobre cada `.sort(` y cada `.order(` de `apps/web/src` y `packages/engine/src` buscando
funciones que confíen en el orden de entrada en vez de garantizarlo ellas mismas.

`ultimaVezDe` (`apps/web/src/lib/last-session.ts:54`) tiene el mismo defecto exacto:

```ts
export function ultimaVezDe(filas: readonly unknown[]): UltimaVez | null {
  const primera = filas[0] as Fila | undefined;   // "la más reciente" == "la primera"
  ...
  const delMismo = (filas as Fila[]).filter((f) => f.workout_log_id === primera.workout_log_id);
```

Su docstring dice "las del entrenamiento más reciente", y depende enteramente de que quien la llama
haya pedido `.order('completed_at', { ascending: false })` — que hoy se cumple
(`last-session.ts:105`) — sin verificarlo. Es lo que le muestra al socio en la pantalla del
ejercicio como "la última vez hiciste X": si `filas` llegara en cualquier otro orden, muestra
la sesión equivocada sin ningún error.

Medido, reproduciendo la función con una fila de enero y una de hoy en ese orden (enero primero):

```
entrada:  [ {workout_log_id: 'wl-vieja', completed_at: '2026-01-01', load: 20},
            {workout_log_id: 'wl-hoy',   completed_at: '2026-09-12', load: 60} ]
salida:   { cuando: '2026-01-01', series: [{ load: 20, ... }] }
```

Un socio que entrenó hoy con 60 kg vería "la última vez hiciste 20 kg" — la sesión de enero, no la
de hoy. El test existente (`last-session.test.ts`) no lo detecta por la misma razón que ya apareció
dos veces: cada caso de prueba pasa las filas ya en el orden que la función asume, así que documenta
la precondición en vez de sacarla, igual que `dedupeByExercise` y el `history` del motor.

### Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| `ultimaVezDe` confía en el orden de `filas` | **mismo defecto que las otras dos** | Ninguna de las tres razones para no confiar cambió: un `select` que agregue una columna, o que reuse la función con datos ya en memoria, puede romperlo sin ningún error visible. |

No se tocó el código. La corrección, si se aplica, es la misma que ya funcionó dos veces: ordenar
por `Date.parse(f.completed_at)` al entrar a la función, no confiar en el `.order()` del llamador.
Costaría un `sort` sobre como mucho 12 filas (`limit(12)` en la query) y, si el orden ya viene bien
como corre hoy, no cambiaría ningún resultado — igual que las dos correcciones anteriores no
cambiaron el reporte de la matriz.

## Lo que este documento NO cubre

- **Si un plan recién generado para alguien que volvió después de un año debería salir con volumen
  reducido.** Hoy sale completo: el descargo por ausencia es una *propuesta* de `reviewProgress` y no
  toca `generatePlan`. Puede ser correcto —son dos caminos distintos— pero no está decidido en
  ningún lado, así que queda anotado.
- **El plan de 8 sesiones vacías con el catálogo sin cargar.** Se midió, no se construyó nada para
  él, y no se probó en el navegador qué muestra la app.
- **Si aplicar la corrección a `ultimaVezDe`.** Es código de la app, no del motor, y cambia qué ve
  el socio en pantalla — queda para quien decide, igual que el resto de esta vuelta.
