# Prompts de investigación

Cuatro investigaciones, cada una apunta a campos concretos del ruleset
(`packages/engine/src/ruleset.ts`). Se mandan **por separado**: cada prompt es autónomo.

**Por qué se rehace**: la primera tanda salió de 130 videos de YouTube transcriptos. Sobre 21.868
líneas había 0 rangos de repeticiones, 0 intensidades como %1RM y 1 sola mención de descansos. Estos
prompts fuerzan la fuente y fuerzan el formato de salida.

| Prompt | Llena |
|---|---|
| 1 · Parámetros agudos de fuerza | `prescription.{strength,hypertrophy,power}` |
| 2 · Cardio y resistencia | `prescription.{cardio,endurance,recomposition}` + interferencia |
| 3 · Progresión y descarga | `progression`, `regression`, `deload` de todos los objetivos |
| 4 · Individualización y seguridad | `byLevel`, modificadores, calibración inicial, contraindicaciones |

---

## Bloque común (va al principio de LOS CUATRO prompts)

```
Sos un investigador en ciencias del ejercicio. Estoy construyendo una aplicación que genera
programas de entrenamiento de forma automática, y necesito codificar reglas de prescripción en
un archivo de configuración. No necesito un artículo divulgativo ni contenido motivacional:
necesito NÚMEROS con su respaldo.

REGLAS DE FUENTE (no negociables):
- Solo literatura revisada por pares: metaanálisis, revisiones sistemáticas, ensayos controlados
  y guías de posición de organismos (ACSM, NSCA, NASM, ESSA, IOC).
- Priorizá 2015 en adelante. Si un consenso anterior sigue vigente y no fue superado, usalo y
  aclaralo.
- Citá SIEMPRE: autor, año, publicación y DOI o PMID. Sin cita, el dato no entra.
- PROHIBIDO como fuente: videos de YouTube, blogs, Instagram, foros, sitios comerciales de
  suplementos, entrenadores personales sin publicación, y contenido generado por IA.

REGLAS DE RESPUESTA:
- Cero relleno motivacional. Nada de "la constancia es la clave" ni introducciones.
- Para cada parámetro dame: (a) el rango que sostiene la evidencia, (b) UN valor por defecto
  concreto que usarías en una app, (c) el nivel de confianza: ALTO (varios metaanálisis
  concordantes) / MEDIO (evidencia limitada o mixta) / BAJO (consenso de expertos sin evidencia
  fuerte).
- Cuando las fuentes se contradigan, decilo explícitamente y explicá el desacuerdo. No promedies
  para tapar la discusión.
- Si para algún campo NO hay evidencia suficiente, escribí "SIN EVIDENCIA SUFICIENTE" y explicá
  qué se usa en la práctica y por qué. **No inventes un número para llenar el casillero.**
- Respondé en castellano, pero dejá los nombres de campo del JSON en inglés tal cual te los paso.
- Cerrá con la lista de todas las fuentes citadas.
```

---

## Prompt 1 — Parámetros agudos: fuerza, hipertrofia y potencia

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: variables agudas de la prescripción de entrenamiento con sobrecarga, para tres objetivos:
fuerza máxima (strength), hipertrofia (hypertrophy) y potencia/explosividad (power).

La app clasifica cada ejercicio de una sesión en uno de tres roles:
- primary: el ejercicio más demandante de la sesión, multiarticular, se hace descansado.
- secondary: multiarticular o de apoyo, aporta volumen con menos carga.
- isolation: monoarticular, cierra la sesión.

Para CADA combinación de objetivo (strength, hypertrophy, power) × rol (primary, secondary,
isolation), dame estos cinco valores:

  sets         (número de series por ejercicio, por sesión)
  repsMin      (extremo bajo del rango de repeticiones)
  repsMax      (extremo alto del rango de repeticiones)
  rirTarget    (repeticiones en reserva objetivo; null si el objetivo no se regula así)
  restSeconds  (descanso entre series, en segundos)

Además, por objetivo:
1. VOLUMEN SEMANAL por grupo muscular: dosis mínima efectiva, rango donde está el grueso del
   beneficio, y punto a partir del cual los rendimientos decrecen o se vuelven negativos.
2. INTENSIDAD como % del 1RM para cada rol, y cómo se relaciona con el rango de repeticiones.
3. FRECUENCIA semanal por grupo muscular, y si el volumen total importa más que su distribución.
4. PROXIMIDAD AL FALLO: qué dice la evidencia sobre entrenar al fallo vs. dejar repeticiones en
   reserva, para cada objetivo. Incluí la precisión real con la que la gente estima su propio RIR.
5. TEMPO y tiempo bajo tensión: ¿tiene efecto independiente del volumen y la carga?
6. Para POWER específicamente: rango de %1RM para máxima potencia mecánica, por qué las
   repeticiones son bajas, y cuánto descanso se necesita para que la calidad no caiga.

FORMATO DE SALIDA: primero un bloque JSON con esta forma exacta, completado. Después una tabla
donde cada número tenga su justificación, su cita y su nivel de confianza.

{
  "strength":    { "primary": {"sets":0,"repsMin":0,"repsMax":0,"rirTarget":0,"restSeconds":0},
                   "secondary": {...}, "isolation": {...},
                   "weeklySetsPerMuscle": {"min":0,"optimal":[0,0],"max":0},
                   "intensityPct1RM": {"primary":[0,0],"secondary":[0,0],"isolation":[0,0]},
                   "weeklyFrequencyPerMuscle": [0,0] },
  "hypertrophy": { ...igual... },
  "power":       { ...igual... }
}
```

---

## Prompt 2 — Cardio, resistencia y recomposición corporal

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: prescripción de entrenamiento cardiovascular y de resistencia, y su combinación con
entrenamiento de fuerza. Tres objetivos de la app: cardio, endurance, recomposition.

IMPORTANTE SOBRE EL FORMATO: mi esquema actual describe el cardio con series y repeticiones, que
es la forma del entrenamiento con pesas y no le sirve al cardio. Necesito que me digas cuál es la
forma correcta de representar una prescripción de cardio en datos: qué campos hacen falta
(duración, zona de intensidad, intervalos con trabajo y pausa, distancia, frecuencia semanal) y
cómo se estructuran. Proponé el esquema vos.

Cubrí:
1. ZONAS DE INTENSIDAD: el modelo o los modelos vigentes (2, 3 o 5 zonas), cómo se define cada
   zona de forma operativa (% de frecuencia cardíaca máxima, % de reserva, umbrales de lactato,
   RPE) y qué adaptación produce cada una. Decime cuál es el más práctico para una app que solo
   puede pedirle al usuario un esfuerzo percibido y, como mucho, pulsaciones.
2. DISTRIBUCIÓN de la intensidad a lo largo de la semana: qué proporción de trabajo suave vs.
   intenso sostiene la evidencia, y para qué tipo de persona.
3. INTERVALOS: protocolos con respaldo real (duración del trabajo, duración de la pausa, cantidad
   de repeticiones, intensidad objetivo), separados por objetivo: salud cardiometabólica,
   rendimiento aeróbico, pérdida de grasa.
4. EFECTO DE INTERFERENCIA: qué dice la evidencia sobre combinar cardio y fuerza en el mismo
   programa. Cuánto interfiere realmente, de qué depende (modalidad, volumen, intensidad, orden
   dentro de la sesión, horas de separación), y qué reglas concretas debería codificar la app para
   minimizarlo.
5. RECOMPOSICIÓN CORPORAL: en qué condiciones es posible ganar músculo y perder grasa a la vez,
   en quién, y a qué ritmo. Qué debería hacer distinto el programa de entrenamiento en ese caso
   (no me interesa la parte nutricional más allá de lo que condicione el entrenamiento).
6. DOSIS MÍNIMA de actividad cardiovascular para salud, según las guías vigentes, y cómo
   convive con un programa de fuerza.

FORMATO DE SALIDA: primero el esquema JSON que proponés para representar cardio en datos, con un
ejemplo completado para cada uno de los tres objetivos. Después la tabla de justificación con
citas y nivel de confianza.
```

---

## Prompt 3 — Progresión, autorregulación, estancamiento y descarga

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: cómo debe cambiar un programa de entrenamiento a lo largo del tiempo, en función de lo que
la persona registra sesión a sesión. Esto es el corazón de la app: no genera un plan fijo, lo
ajusta.

La app registra, por serie: carga, repeticiones hechas vs. objetivo, RIR de la última serie de los
ejercicios principales, descanso real, y una valoración de la sesión completa. También registra
ausencias.

Necesito reglas de decisión ejecutables, con umbrales numéricos. Para cada regla decime cuál es la
señal, cuál es el umbral, y qué acción se toma.

1. SOBRECARGA PROGRESIVA: qué modelos tienen respaldo (doble progresión, progresión lineal,
   autorregulada por RPE/RIR, basada en velocidad). Para cada uno: en quién funciona, cuánto dura
   antes de agotarse, y qué incremento de carga es realista por unidad de tiempo, distinguiendo
   principiantes de avanzados y tren superior de tren inferior.
2. CUÁNDO SUBIR LA CARGA: la señal concreta. ¿Cuántas sesiones seguidas con cuántas repeticiones
   en reserva justifican un aumento? ¿De qué magnitud, en porcentaje?
3. CUÁNDO BAJARLA: cuántas sesiones fallando el rango objetivo antes de reducir, y cuánto reducir.
4. ESTANCAMIENTO: cómo se define operativamente, distinguiéndolo de la variación normal entre
   sesiones. ¿Cuántas sesiones sin progreso constituyen un estancamiento real?
5. DESCARGA (deload): cuándo hace falta, si conviene programarla por calendario o dispararla por
   señales, qué se reduce (volumen, intensidad o ambos), en qué proporción y por cuánto tiempo.
   ¿Qué evidencia hay de que sea necesaria en alguien que entrena 3 veces por semana sin competir?
6. DESENTRENAMIENTO: qué se pierde y en cuánto tiempo, separando fuerza de masa muscular y de
   capacidad aeróbica. Cuántos días de ausencia justifican reducir la carga al volver, y cuánto
   reducirla. Esto lo necesito con números: la app tiene que decidir qué hacer con alguien que
   volvió después de 10, 30 o 90 días.
7. VARIACIÓN DE EJERCICIOS: ¿hace falta rotarlos? ¿Cada cuánto? ¿O conviene la consistencia para
   poder medir el progreso?

FORMATO DE SALIDA: primero este bloque JSON completado, por cada objetivo (strength, hypertrophy,
power, cardio, endurance, recomposition):

{
  "progression": { "stepPct": 0, "triggerRirAtLeast": 0, "consecutiveSessions": 0 },
  "regression":  { "stepPct": 0, "missedRepsSessions": 0 },
  "deload":      { "stallSessions": 0, "absenceDays": 0, "volumeMultiplier": 0.0 },
  "detraining":  { "days": [{"threshold": 0, "loadMultiplier": 0.0, "rationale": ""}] }
}

Si algún objetivo necesita campos que este esquema no tiene, agregalos y explicá por qué. Después,
la tabla de justificación con citas y nivel de confianza.
```

---

## Prompt 4 — Individualización, arranque seguro y selección de ejercicios

```
[PEGAR ACÁ EL BLOQUE COMÚN]

TEMA: cómo se modifica una prescripción de entrenamiento según quién es la persona, cómo se
determina con qué carga arranca alguien sin hacerle un test máximo, y qué hace equivalentes a dos
ejercicios entre sí.

PARTE A — MODIFICADORES INDIVIDUALES
Para cada variable, decime qué cambia concretamente en los parámetros (series, repeticiones,
intensidad, descanso, frecuencia, velocidad de progresión) y con qué respaldo:
1. NIVEL DE EXPERIENCIA (principiante, novato, intermedio, avanzado): primero, dame una
   definición OPERATIVA de cada nivel que una app pueda evaluar sin un entrenador presente
   (¿años entrenando? ¿carga relativa al peso corporal? ¿velocidad a la que todavía progresa?).
   Después, qué cambia en la prescripción para cada uno.
2. EDAD: adolescentes, adultos jóvenes, mediana edad y adultos mayores. Qué cambia realmente y
   qué es mito. Incluí a partir de qué edad hay consideraciones de seguridad concretas.
3. SEXO: qué diferencias reales hay en tolerancia al volumen, recuperación entre sesiones,
   respuesta a rangos de repeticiones y fatiga. Separá con claridad lo que tiene respaldo de lo
   que es creencia popular.
4. DEPORTE PRACTICADO: cómo cambia un programa de gimnasio si la persona además compite o
   practica un deporte. Qué es transferencia real y qué no. Incluí el manejo de temporada:
   pretemporada, en competencia, fuera de temporada.

PARTE B — ARRANQUE SIN TEST MÁXIMO
5. Cómo estimar con seguridad la carga de trabajo inicial de alguien que nunca entrenó, sin
   hacerle un test de 1RM. Protocolos de calibración con respaldo: cuántas sesiones, qué
   repeticiones, qué señales usar.
6. Ecuaciones de estimación de 1RM a partir de series submáximas: cuáles son las más precisas,
   cuál es su error real, y en qué rango de repeticiones dejan de ser confiables.
7. Cuánto se puede confiar en lo que la propia persona declara sobre sus cargas.

PARTE C — SELECCIÓN Y SUSTITUCIÓN DE EJERCICIOS
Contexto: la app conoce el equipamiento exacto de un gimnasio. Si una máquina está ocupada, tiene
que ofrecer un reemplazo.
8. Qué hace que dos ejercicios sean intercambiables: patrón de movimiento, musculatura implicada,
   perfil de resistencia, demanda de estabilidad, curva de aprendizaje. Ordenalos por importancia.
9. Qué evidencia hay sobre máquinas vs. peso libre para cada objetivo, y cuándo importa la
   diferencia.
10. ORDEN DE LOS EJERCICIOS dentro de una sesión: cuánto importa realmente, y qué se pierde si
    alguien altera el orden porque una máquina estaba ocupada.

PARTE D — SEGURIDAD
11. Contraindicaciones y señales de alarma que una app debería detectar y ante las cuales debe
    frenar y derivar a un profesional.
12. Qué hacer, a nivel de programa, cuando alguien reporta dolor en una zona: qué se evita, qué
    se puede seguir haciendo, y cuándo dejar de sugerir entrenamiento.
13. Qué disclaimer y qué límites debería tener una app que prescribe ejercicio sin supervisión
    presencial.

FORMATO DE SALIDA: para las partes A, B y C, tablas de modificadores expresados como
multiplicadores o desplazamientos sobre los valores base (por ejemplo: "adultos mayores:
restSeconds ×1.3, repsMin +2"), listas para codificar. Para la parte D, una lista de reglas
accionables. Todo con cita y nivel de confianza.
```

---

## Al recibir las respuestas

1. No las pegues directo al ruleset. Van a `docs/research/` y se curan al JSON con la skill
   `activar-ruleset`.
2. Todo lo que venga marcado como confianza BAJA o "SIN EVIDENCIA SUFICIENTE" se anota como hueco
   conocido, no se completa a ojo.
3. El ruleset nuevo lleva `"source": "research"`. Recién ahí se apagan solas las marcas de
   contenido provisorio en la app.
