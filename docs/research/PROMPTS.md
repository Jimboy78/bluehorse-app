# Prompts de investigación — segunda tanda: los huecos

La primera tanda (cuatro prompts anchos) llenó el ruleset `v1-research` desde cero. **Ese trabajo
está hecho y auditado**: `docs/research/08` a `15` verificaron cada entrada del motor contra
evidencia primaria. Los prompts viejos se borraron porque volver a correrlos regeneraría lo que ya
existe.

Esta tanda es distinta: **un prompt por hueco concreto**, angosto a propósito.

| # | Hueco | Llena / decide |
|---|---|---|
| 1 | Tiempo bajo tensión | `prescription.*` — predictor fuerte que el motor no prescribe |
| 2 | Lesión aguda vs dolor crónico | `safety.painRules` — hoy `injury` y `pain` se tratan igual |
| 3 | Énfasis excéntrico por ejercicio | columna nueva de catálogo, como `is_explosive` |
| 4 | Desentrenamiento aeróbico | `cardio` — hoy solo se ajusta la carga de sala |
| 5 | Estimación de 1RM sin test máximo | `baselines` — Epley/Brzycki nunca se implementaron |
| 6 | Fragilidad (no es edad) | campo que no existe; decide si vale la pena crearlo |

**Por qué son cortos:** se mandan a modelos baratos con esfuerzo bajo. Un prompt angosto con una
sola pregunta y un formato de salida fijo rinde bien ahí. Uno ancho con trece sub-preguntas
devuelve un resumen superficial de todas. Si un hueco necesita más profundidad, se parte en dos
prompts, no se agranda uno.

---

## Bloque común (va al principio de TODOS los prompts)

```
Sos un investigador en ciencias del ejercicio. Estoy construyendo una aplicación que genera
programas de entrenamiento de forma automática y necesito codificar reglas en un archivo de
configuración. No necesito divulgación ni motivación: necesito NÚMEROS con su respaldo.

REGLAS DE FUENTE (no negociables):
- Solo literatura revisada por pares: metaanálisis, revisiones sistemáticas, ensayos controlados
  y guías de posición de organismos (ACSM, NSCA, ESSA, IOC).
- Priorizá 2015 en adelante. Si un consenso anterior sigue vigente, usalo y aclaralo.
- Citá SIEMPRE: autor, año, publicación y DOI o PMID. Sin cita, el dato no entra.
- PROHIBIDO: YouTube, blogs, Instagram, foros, sitios de suplementos, entrenadores sin
  publicación, y contenido generado por IA.
- ABRÍ el paper antes de citarlo. El resumen de un buscador no alcanza: ya pasó una vez que
  presentara como respaldado algo que el paper refutaba, porque citaba la introducción y no los
  resultados. Si solo pudiste ver el resumen, decilo al lado de la cita.

REGLAS DE RESPUESTA:
- Cero relleno. Nada de introducciones ni de "la constancia es la clave".
- Para cada número: (a) el rango que sostiene la evidencia, (b) UN valor por defecto concreto,
  (c) confianza ALTA (varios metaanálisis concordantes) / MEDIA (evidencia limitada o mixta) /
  BAJA (consenso sin evidencia fuerte).
- Dame el intervalo de confianza y el tamaño de muestra siempre que existan. Si el intervalo
  cruza el cero, decilo con esas palabras.
- Cuando las fuentes se contradigan, decilo y explicá el desacuerdo. No promedies para tapar la
  discusión.
- Si no hay evidencia suficiente, escribí "SIN EVIDENCIA SUFICIENTE" y explicá qué se hace en la
  práctica y por qué. **No inventes un número para llenar el casillero.**
- Respondé en castellano; dejá los nombres de campo en inglés tal cual.
- Cerrá con la lista de fuentes citadas.
```

---

## Prompt 1 — Tiempo bajo tensión

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: tiempo bajo tensión (TUT) y tempo de ejecución en entrenamiento con sobrecarga.

CONTEXTO: en un metaanálisis de dosis-respuesta en adultos mayores (Borde, Hortobágyi y
Granacher 2015, DOI 10.1007/s40279-015-0385-9), el tiempo bajo tensión resultó predictor
significativo de la ganancia de fuerza en la meta-regresión (p < 0,01), con un óptimo reportado
de 6,0 segundos por repetición. Mi motor no prescribe tempo en absoluto.

UNA SOLA PREGUNTA: ¿hay evidencia suficiente para prescribir tempo o TUT como parámetro
independiente, o el efecto se explica por el volumen y la carga?

Cubrí exactamente esto:
1. ¿El tempo tiene efecto independiente del volumen y de la carga sobre fuerza e hipertrofia?
   Necesito el tamaño de efecto con su intervalo de confianza.
2. Si lo tiene: ¿qué duración de fase concéntrica y excéntrica sostiene la evidencia? ¿Cambia
   según el objetivo?
3. ¿Se sostiene el hallazgo de Borde fuera de adultos mayores, o es específico de esa población?
4. ¿Un tempo muy lento perjudica? ¿Desde dónde?
5. Riesgo práctico: ¿se puede pedir un tempo a alguien que entrena solo, sin que lo cuente nadie?
   ¿Hay evidencia sobre la precisión con la que la gente ejecuta un tempo prescrito?

FORMATO DE SALIDA:
- Un veredicto de una línea: SE PRESCRIBE / NO SE PRESCRIBE / SE PRESCRIBE SOLO EN <caso>.
- Si se prescribe: el bloque JSON {"tempoEccentricSeconds":0,"tempoConcentricSeconds":0,
  "appliesToGoals":[]} completado, con su nivel de confianza.
- Una tabla de justificación: cada número, su cita, su n y su intervalo.
```

---

## Prompt 2 — Lesión aguda contra dolor crónico

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: diferencia de manejo entre una lesión aguda reciente y un dolor musculoesquelético crónico,
a nivel de qué se puede seguir entrenando.

CONTEXTO: mi app tiene reglas de dolor por zona del cuerpo con dos umbrales — uno que solo avisa
y otro que saca ejercicios del plan. Están construidas sobre evidencia de dolor CRÓNICO: que el
dolor durante el ejercicio no es barrera (Smith 2017, DOI 10.1136/bjsports-2016-097383), que
cargar la zona es seguro, y que lo que decide el resultado es la exposición y la adherencia. Hoy
la app trata igual una molestia de meses y un esguince de ayer, y eso es claramente incorrecto.

UNA SOLA PREGUNTA: ¿en qué se diferencia el manejo de las primeras 72 horas — y de las primeras
semanas — respecto del dolor crónico?

Cubrí exactamente esto:
1. ¿Sigue vigente el reposo relativo en lesión aguda, o lo reemplazó la carga temprana? Necesito
   la evidencia, no el eslogan (PEACE & LOVE, POLICE y similares: decime qué respaldo tienen de
   verdad y cuál es solo acrónimo de consenso).
2. Ventanas temporales concretas: ¿a partir de cuándo se puede volver a cargar la zona lesionada,
   y con qué progresión?
3. ¿Qué tipos de lesión NO admiten carga temprana y hay que derivar sí o sí?
4. ¿Sirve de algo preguntarle al usuario si la lesión fue "de golpe" o "de a poco" para
   clasificarla? ¿Hay algún criterio que una persona sin formación pueda aplicar bien?
5. Señales de alarma específicas de lesión aguda que una app debe detectar para frenar y derivar,
   distintas de las de dolor crónico.

FORMATO DE SALIDA:
- Una tabla: fase (0-72h / 72h-2 semanas / 2-6 semanas / crónico) × qué se puede entrenar de la
  zona afectada × qué del resto del cuerpo × confianza.
- La lista de señales de derivación, accionables, en castellano rioplatense listo para mostrar.
- Un veredicto sobre el punto 4: si NO hay criterio aplicable por un lego, decilo — es una
  respuesta válida y me sirve más que un criterio inventado.
```

---

## Prompt 3 — Énfasis excéntrico por ejercicio

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: clasificar ejercicios de gimnasio según cuánto daño muscular por contracción excéntrica
producen.

CONTEXTO: la contracción excéntrica es el mecanismo del daño muscular y del dolor tardío
(DOI 10.1007/978-3-031-44270-4_8). Mi app necesita, cerca de un partido, sacar del plan los
ejercicios de énfasis excéntrico marcado — no bajar el volumen, cambiar QUÉ ejercicio se hace.
Ya tengo una marca booleana por ejercicio para trabajo explosivo (`is_explosive`) y quiero la
equivalente para lo excéntrico. Hasta donde busqué, NO existe una clasificación publicada
ejercicio por ejercicio.

UNA SOLA PREGUNTA: ¿hay algún criterio con respaldo para decidir si un ejercicio dado tiene
énfasis excéntrico alto, o hay que declararlo como criterio propio?

Cubrí exactamente esto:
1. ¿Qué características del ejercicio predicen el daño muscular? Candidatas a evaluar: longitud
   muscular en la que se aplica la tensión, amplitud de recorrido, si la fase de bajada es
   resistida o asistida, peso libre contra máquina, unilateral contra bilateral.
2. ¿Cuál de esas características tiene el respaldo más fuerte? Necesito poder ordenarlas.
3. ¿El daño escala de forma continua o hay un salto entre categorías de ejercicio?
4. ¿Existe alguna clasificación, escala o tabla publicada que ordene ejercicios comunes de
   gimnasio por daño inducido? Si no existe, decilo explícitamente.
5. ¿Cuánto tarda en recuperarse la fuerza tras una sesión de énfasis excéntrico marcado, y cómo
   se compara con una sesión concéntrica de volumen equivalente?

FORMATO DE SALIDA:
- Una regla de decisión de una o dos líneas que se pueda aplicar mirando un ejercicio, ordenada
  por la característica con más respaldo.
- Aplicá esa regla a estos ejercicios y devolvé alto/medio/bajo con una justificación de media
  línea cada uno: curl nórdico, peso muerto rumano, sentadilla profunda con barra, zancada
  caminando, prensa de piernas, extensión de rodilla en máquina, curl femoral en máquina, press
  de banca, dominadas, remo en polea.
- Si la respuesta al punto 4 es que no hay clasificación publicada, decilo en la primera línea:
  necesito poder declarar en mi documentación que el criterio es propio.
```

---

## Prompt 4 — Desentrenamiento aeróbico

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: qué se pierde de capacidad aeróbica durante una pausa, y cómo debe volver alguien que
estuvo sin entrenar.

CONTEXTO: mi app ajusta la carga de sala cuando alguien vuelve después de una pausa (escalones a
10, 30 y 90 días). No ajusta NADA del bloque de cardio. Y la evidencia que ya tengo dice que el
VO2max cae entre 4 % y 14 % en menos de 10 días — mucho más rápido que la fuerza, que
prácticamente se conserva (Kubo 2010, J Strength Cond Res 24(2):322-331: fuerza sin cambios a los
3 meses de cese). O sea que el ajuste está puesto donde menos hace falta.

UNA SOLA PREGUNTA: ¿qué debería cambiar en una prescripción de cardio cuando la persona vuelve
tras 10, 30 o 90 días sin entrenar?

Cubrí exactamente esto:
1. Curso temporal de la pérdida de VO2max, con números por ventana de tiempo y su fuente.
2. Qué se pierde primero y qué después: volumen plasmático, densidad mitocondrial, enzimas
   oxidativas, economía de movimiento.
3. ¿Cómo se traduce eso a una prescripción? Concretamente: al volver, ¿se baja la duración, la
   intensidad, las dos? ¿En qué proporción y por cuántas sesiones?
4. ¿Cuánto tarda en recuperarse lo perdido al retomar? ¿Es más rápido que construirlo la primera
   vez?
5. ¿Hay riesgo real —no solo bajo rendimiento— en volver a la intensidad previa de golpe?

FORMATO DE SALIDA:
- Este JSON completado, con un escalón por ventana:
  {"aerobicDetraining":[{"days":0,"durationMultiplier":0.0,"intensityMultiplier":0.0,
   "sessionsToNormal":0,"rationale":""}]}
- Una tabla de justificación con cita, n e intervalo por cada número.
- Si algún multiplicador no tiene respaldo directo y sale de tu criterio, marcalo como tal en la
  columna de confianza. Prefiero un hueco declarado a un número inventado.
```

---

## Prompt 5 — Arranque sin test máximo

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: con cuánta carga arranca cada ejercicio alguien que nunca hizo un test de fuerza máxima.

CONTEXTO: mi app no le hace test de 1RM a nadie: prescribe sin supervisión presencial y eso sería
imprudente. Hoy directamente no prescribe carga — le da series, repeticiones y RIR, y la persona
elige el peso. Sé por evidencia que cuando se deja elegir, la gente elige el 53 % de su 1RM (IC
creíble 49-58 %, 18 estudios, DOI 10.1007/s40279-022-01717-9), y que la experiencia no modera eso.
También sé que eso alcanza para hipertrofia pero queda corto para fuerza, que necesita ≥70 %
(Lopez 2021, DOI 10.1249/MSS.0000000000002585).

UNA SOLA PREGUNTA: ¿cómo se llega a una carga inicial segura y suficiente sin test máximo?

Cubrí exactamente esto:
1. Ecuaciones de estimación de 1RM desde series submáximas (Epley, Brzycki, Lombardi y las que
   correspondan): error real de cada una, y desde cuántas repeticiones dejan de ser confiables.
2. Protocolos de calibración progresiva: cuántas sesiones, con qué repeticiones y qué señal se usa
   para subir. ¿Hay alguno validado?
3. ¿El RIR autoinformado sirve como señal de calibración? Necesito la precisión real con la que
   la gente estima su propio RIR, y si esa precisión mejora con la experiencia.
4. ¿Cómo se cierra la brecha del objetivo fuerza —que necesita ≥70 % y la persona elige 53 %—
   sin un test máximo y sin ponerla en riesgo?
5. ¿Qué tan mal está arrancar liviano de más? ¿Cuánto tiempo de progreso se pierde, si es que se
   pierde alguno?

FORMATO DE SALIDA:
- Una recomendación de una línea: qué debería hacer la app en la primera sesión de un ejercicio.
- La ecuación elegida con su error y su rango válido de repeticiones.
- El protocolo de calibración como pasos numerados, ejecutables por software.
- Sobre el punto 4: si la respuesta honesta es que no se puede cerrar esa brecha sin test, decilo.
```

---

## Prompt 6 — Fragilidad, que no es lo mismo que edad

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: cómo identificar a una persona frágil y qué cambia en su prescripción.

CONTEXTO: mi app aplicaba a todo mayor de 60 la recomendación pensada para adultos frágiles
—menos carga, más repeticiones, más descanso— y eso resultó mal: dos metaanálisis muestran que en
adultos mayores sanos la carga alta (≥70 % 1RM) es superior y no produce más caídas ni más eventos
adversos (Borde 2015, DOI 10.1007/s40279-015-0385-9). Lo corregí. Pero al corregirlo quedó al
descubierto lo que de verdad importaba: la fragilidad, que la app no mide y que no es la edad.

UNA SOLA PREGUNTA: ¿vale la pena que la app intente medir fragilidad, y con qué?

Cubrí exactamente esto:
1. Definiciones operativas vigentes de fragilidad y presarcopenia. ¿Cuál es la más usada?
2. Instrumentos validados y qué requiere cada uno: ¿hace falta un profesional presente, o hay
   alguno autoinformado con validación? Nombrá cada uno con su validación.
3. De esos, ¿cuál podría aplicar una app sin supervisión y sin equipamiento de medición? Si
   ninguno sirve, decilo: es una respuesta válida.
4. ¿Qué cambia CONCRETAMENTE en la prescripción de una persona frágil respecto de un adulto mayor
   sano? Necesito los parámetros: series, repeticiones, intensidad, descanso, frecuencia,
   progresión.
5. ¿A partir de qué punto la app no debería prescribir sola y tiene que derivar?

FORMATO DE SALIDA:
- Un veredicto de una línea sobre el punto 3: MEDIBLE POR LA APP / NO MEDIBLE / MEDIBLE CON
  RESERVAS.
- Si es medible: las preguntas o pruebas exactas, redactadas en castellano rioplatense y listas
  para poner en un formulario, con su puntaje y su corte.
- Los modificadores de prescripción como multiplicadores o ventanas sobre los valores base, con
  cita y confianza.
```

---

## Al recibir las respuestas

1. No van directo al ruleset. Van a `docs/research/` como documento propio, numerado, y se curan
   al JSON después.
2. Todo lo que venga como confianza BAJA o "SIN EVIDENCIA SUFICIENTE" se anota como hueco
   conocido. **No se completa a ojo.**
3. Un veredicto de "no se puede" o "no hay evidencia" es un resultado, no un fracaso: cierra el
   hueco igual, porque deja de ser una pregunta abierta y pasa a ser una limitación declarada.
4. Se verifica al menos una cita por informe abriendo el DOI antes de escribir nada al motor.
   Los modelos baratos alucinan citas.
