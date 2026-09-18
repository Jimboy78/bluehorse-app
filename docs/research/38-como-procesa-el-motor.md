# Cómo procesa el motor a una persona, y cómo mejorarlo

**Fecha:** 18/09/2026. **Pedido del dueño:** el motor tiene que analizar un contexto muy amplio
(edad, deporte, lesiones, vuelta después de una pausa, gente que sabe mucho y gente que no sabe
nada) y usar todo lo que hay en el gimnasio. Buscar la mejor forma de mejorar ese procesamiento.

## Cómo funciona hoy

El motor es una **cadena de pasos**, cada uno con su propio código:

1. Dosis del objetivo y el nivel (`prescription`).
2. Ajustes encima: edad (`olderAdults`), deporte y temporada (`sports`), frecuencia.
3. Plantilla de sesiones: una lista de huecos por patrón de movimiento ("sentadilla, empuje,
   tirón…").
4. Para cada hueco, un ejercicio: filtra lo que no se puede (molestia, técnica, estación) y después
   aplica ocho preferencias en orden fijo (rotar, repeticiones antes que tiempo, compuesto, nivel,
   músculo menos trabajado, deporte, variedad).
5. Agregados: el par explosivo (`37`).
6. Avisos: una función por tema (volumen, tiempo, interferencia, potencia, deporte, dolor…).

Funciona, y cada paso tiene su investigación atrás. El problema es de **forma**: cada contexto
nuevo agrega su rama en un lugar distinto, y nadie mira cómo se combinan. Hoy mismo apareció un caso:
una molestia leve y un deporte, cada uno correcto por separado, le daban saltos a alguien con dolor
lumbar. Ningún perfil de prueba tenía las dos cosas juntas.

## Lo que se midió

Se agregó `tools/motor-barrido.test.ts`: genera **3.000 socios** combinando nueve dimensiones
(objetivo, nivel, edad, frecuencia, minutos, deporte, fase, molestia, ausencia) sobre el catálogo
real. Para cada uno también arma el plan cambiando **una sola** dimensión, y mira si cambió.
Resultado en `tools/reportes/barrido-v1-research.json`.

### Qué dato del socio mueve el plan

| Si cambia solo… | …el plan cambia |
|---|---|
| objetivo | 97 % |
| nivel | 99 % |
| molestia | 71 % |
| fase de la temporada | 58 % |
| deporte | 51 % |
| sesiones por semana | 41 % |
| edad | 25 % |
| **minutos por sesión** | **0 %** |
| **días sin entrenar** | **0 %** |

- **Minutos: 0 %.** El motor no lee cuánto tiempo tiene la persona, solo avisa si se pasa. El 15 %
  de las sesiones pasa los minutos declarados por más de un 15 %. Ya estaba anotado como decisión
  pendiente (campos que se le piden al socio y no cambian el plan).
- **Ausencia: 0 %.** Quien vuelve después de un año recibe el mismo plan que quien entrenó ayer. Lo
  único que cambia es un aviso, y la carga cuando hay una cargada (que hoy es nunca, `15`). También
  estaba anotado como decisión pendiente.
- **Edad: 25 %.** La edad solo mueve dos cosas: la ventana de repeticiones de fuerza e hipertrofia a
  partir de los 60 y el tope de los explosivos. Nada más en el plan de alguien de 76 es distinto al de
  alguien de 40. Ver abajo: es el hueco con evidencia más firme.

### Qué parte del gimnasio se usa

- **9 ejercicios no entran nunca** en 3.000 socios: face pull, plancha, aperturas en máquina, cruce
  de poleas, caminata del granjero, pogo, zancada con salto, movilidad de cadera y tobillo,
  lanzamiento rotacional.
- **7 estaciones no se usan nunca**: pec deck, conos, discos de equilibrio, foam roller, pelotas
  suizas, sandbags y el árbol de discos (este es un guardado, está bien que no aparezca).
- Nada está sobreusado: el ejercicio más frecuente es el 7 % de los ítems.

Que algo no entre no es un error por sí solo (`25`: ocho sentadillas para un hueco dan variedad).
Lo que sí es un hueco es que **no exista ningún camino** para que entre, aunque la persona lo
necesite. Los conos, los discos de equilibrio y las pelotas suizas son justo lo que piden los dos
huecos de abajo.

### Avisos

Un plan trae en promedio **6,7 avisos**, y hasta 14. No hay una medición de cuántos lee el socio,
pero catorce párrafos arriba de un plan compiten con el plan mismo. Y cada contexto nuevo suma su
aviso, así que el número sube solo.

## Los huecos, por firmeza de la evidencia

### 1. Mayores: falta el equilibrio — CONFIANZA ALTA

- **Sherrington et al. 2019, Cochrane**, 108 ensayos, 23.407 personas de 60 años o más. El ejercicio
  de equilibrio y funcional baja las caídas un **24 %** (RaR 0,76; IC 0,70–0,81; certeza **alta**).
  Combinado con fuerza, un **34 %** (RaR 0,66; IC 0,50–0,88; certeza moderada). Y lo importante
  para el motor: **con fuerza sola, sin equilibrio, el efecto sobre las caídas es incierto**.
  DOI 10.1002/14651858.cd012424.pub2
- **OMS 2020**, recomendación **fuerte**: los mayores hacen actividad multicomponente que priorice
  equilibrio funcional y fuerza, 3 o más días por semana. Da como ejemplos caminar de costado o para
  atrás y pararse en un pie mientras se hace un ejercicio de brazos. DOI 10.1136/bjsports-2020-102955

Hoy un socio de 76 recibe exactamente fuerza sola, que es lo que la Cochrane no puede sostener para
caídas. El gimnasio tiene discos de equilibrio, pelotas suizas, steps y conos sin usar.

### 2. Deportistas: prevención de lesiones — CONFIANZA MEDIA

- **Thorborg et al. 2017**, FIFA 11+ en fútbol recreativo y subelite: **39 % menos lesiones**
  (IRR 0,61; IC 0,48–0,77). DOI 10.1136/bjsports-2016-097066. Es una entrada en calor
  neuromuscular de 20 minutos (carrera, fuerza, equilibrio, saltos), y el gimnasio tiene con qué
  hacerla. La evidencia firme es de fútbol; para otros deportes es extrapolación.

### 3. El tiempo — CONFIANZA MEDIA

- **Iversen et al. 2021**: las superseries y técnicas parecidas **reducen a la mitad** el tiempo de
  sesión sin perder volumen, más probadas para hipertrofia que para fuerza. Con poco tiempo,
  priorizar los multiarticulares: como mínimo uno de piernas, un tirón y un empuje, y 4 series por
  músculo por semana. DOI 10.1007/s40279-021-01490-1

Es la herramienta para que "tengo 30 minutos" cambie el plan en vez de solo generar un aviso: juntar
en par los ejercicios que no compiten (tirón con empuje) y sacar primero los aislados. La
infraestructura de pares ya existe desde `37`.

### 4. Entrada en calor con rodillo — CONFIANZA BAJA

- **Wiewelhove et al. 2019**: rodillo antes de entrenar, mejora chica en sprint (g 0,28) y
  flexibilidad (g 0,34), nada en salto ni fuerza. DOI 10.3389/fphys.2019.00376. No alcanza para
  meterlo en todos los planes. Queda disponible.

## Cómo lo resuelven otros sistemas

- **EXPERT** (Sociedad Europea de Cardiología Preventiva; Hansen et al. 2017, DOI
  10.1177/2047487317702042): parte de una prescripción general y la **ajusta con un módulo por
  condición**. Cada módulo trae su objetivo, sus ajustes de dosis y sus precauciones. Se validó
  simulando casos clínicos, no solo leyendo reglas. Es lo más parecido a Blue Horse que existe con
  respaldo institucional, y su forma es la que conviene imitar.
- **COPPER** (Braun et al. 2025, DOI 10.1186/s12966-025-01744-5): una ontología con perfil,
  contexto, barreras y reglas lógicas explícitas. Se prefirió a los modelos de caja negra porque
  integra lo que saben los expertos y deja ver por qué recomienda lo que recomienda.

**Lo que no conviene:**
- **Aprendizaje automático o un modelo de lenguaje adentro del motor.** No hay datos de resultados
  de socios con qué entrenarlo (la app todavía no tiene historia), y rompería las reglas duras 2
  (motor puro) y 3 (ningún número inventado).
- **Algoritmos genéticos u optimizadores genéricos.** Encuentran planes "óptimos" para una función
  que alguien tiene que escribir. Esa función es justamente lo difícil, y es mejor tenerla a la vista
  en el ruleset.

## La propuesta: tres etapas

### Etapa 1 — Medir cada combinación (hecha, 18/09/2026)

`motor-barrido.test.ts` corre en `npm run check`. Frena cinco invariantes en 3.000 combinaciones:

- ninguna sesión vacía;
- ningún ejercicio por encima del nivel técnico;
- ninguna dosis imposible;
- ningún explosivo suelto, con molestia o pasada la edad tope;
- el mismo socio da siempre el mismo plan.

El reporte de cobertura y sensibilidad se commitea como el de la matriz. Cualquier regla nueva
se prueba contra todo el espacio antes de entrar.

### Etapa 2 — Módulos de contexto (el cambio de forma)

Llevar la cadena de ramas a la forma de EXPERT. Cada contexto es un **módulo del ruleset**, no
código, y declara cuatro cosas:

| Qué declara | Ejemplo: mayor de 65 | Ejemplo: fútbol | Ejemplo: vuelve después de 4 meses |
|---|---|---|---|
| **Exclusiones** (duras) | — | día de partido: sin explosivos | — |
| **Bloques que agrega** | equilibrio, 3 veces por semana | par explosivo; entrada en calor preventiva | — |
| **Ajustes de dosis** | ventana 7-9 repeticiones | volumen por fase | volumen reducido las primeras semanas (decisión pendiente) |
| **Avisos** | uno | uno | uno |

Y un **solo lugar** que los combina con reglas escritas:

- las exclusiones se suman;
- los ajustes de dosis toman el más restrictivo (ya se hace así entre deporte y temporada);
- los bloques que se agregan compiten por los minutos disponibles, por prioridad;
- los avisos se ordenan y se muestran los dos primeros.

Ventajas:
- Cada contexto nuevo (embarazo, hipertensión, otro deporte) es una entrada del ruleset con su
  investigación, sin tocar el motor.
- El barrido prueba todas las combinaciones de módulos.

### Etapa 3 — Armar la semana con el tiempo como límite

El hueco de los minutos. Se llena la sesión por prioridad hasta los minutos declarados:

1. los multiarticulares;
2. los bloques de los módulos (equilibrio, par explosivo);
3. los aislados.

Si no entra, se juntan en par los que no compiten (Iversen) antes de sacar nada. Así "tengo 30
minutos" cambia el plan, y los estudios dicen cómo hacerlo sin perder lo importante.

## Qué hace falta del dueño

1. **Equilibrio para mayores (hueco 1).** La evidencia es la más firme de todo el proyecto. Hay que
   decidir desde qué edad (la Cochrane usa 60, la OMS 65) y si se agrega en todos los objetivos.
   Se sugiere empezar por acá.
2. **Minutos (decisión pendiente 4) y ausencia (decisión 11).** La etapa 3 contesta la primera con
   evidencia. La segunda sigue abierta.
3. **Prevención en deportistas.** Solo fútbol tiene evidencia firme. Hay que decidir si se extiende
   a los otros deportes de cancha como criterio de práctica, y decirlo.
