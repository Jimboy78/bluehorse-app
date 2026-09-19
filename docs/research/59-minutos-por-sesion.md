# Los minutos arman la sesión

**Fecha:** 19/09/2026. **Tanda:** T4a del plan de variables. En el checklist es *pedir*: "días
por semana, minutos por sesión, descanso".

## La pregunta

El socio dice en el onboarding cuántos minutos tiene por sesión (de 15 a 180). Hasta acá el motor
armaba la misma sesión declarara 15 o 120 minutos, y a lo sumo avisaba. Medido antes del cambio:

- las sesiones duraban de 21 a 74 minutos según objetivo, nivel y edad, sin relación con lo
  declarado;
- en el barrido de 3.000 socios, cambiar los minutos cambiaba el plan en el **0 %** de los casos;
- el número de minutos que ve el socio en la sesión era una constante de la plantilla: la misma
  "Sesión A" le prometía 55 minutos a todos.

¿Cuánto dura de verdad una sesión, y qué se achica primero cuando no entra?

## Lo que dice la evidencia

- **Cuánto tarda una serie.** Schoenfeld et al. 2019, *Med Sci Sports Exerc* (texto completo,
  PMC6303131): 7 ejercicios de 8-12 repeticiones con 90 s de pausa llevaron unos 13, 40 y 68
  minutos para 7, 21 y 35 series por sesión. Descontando la pausa, cada serie con su acomodo son
  unos **30 s**. DOI 10.1249/MSS.0000000000001764.
- **Cuánto puede bajar la pausa.**
  - Grgic et al. 2017, *Sports Med*, revisión de 23 estudios sobre fuerza: en personas no
    entrenadas alcanzan **60-120 s**; en entrenadas conviene **más de 2 minutos** para la fuerza
    máxima. DOI 10.1007/s40279-017-0788-x.
  - Grgic et al. 2017, *Eur J Sport Sci*, sobre hipertrofia: en entrenados, pausas más largas
    rinden algo más. DOI 10.1080/17461391.2017.1340524.
  - Singer et al. 2024, *Front Sports Act Living*, metaanálisis bayesiano de hipertrofia: un
    beneficio chico de pasar de 60 s, y ninguna evidencia de que pasar de 90 s agregue algo. DOI
    10.3389/fspor.2024.1429789.
- **Cómo se ahorra tiempo sin perder volumen.** Iversen et al. 2021, *Sports Med*, revisión
  narrativa sobre entrenar con poco tiempo (texto completo, PMC8449772):
  - lo mínimo es **un ejercicio de pierna, uno de empuje y uno de tirón**, multiarticulares;
  - con **al menos 4 series por músculo por semana** ya hay ganancias;
  - las **superseries** (una serie de cada ejercicio, alternando, sin pausa en el medio) llevan
    **la mitad del tiempo** sin perder volumen, en estudios agudos y un ensayo. Las mejor
    estudiadas son las de antagonistas (empuje y tirón);
  - **no se aconsejan con los multiarticulares pesados de peso libre**: la fatiga y la técnica;
  - las pausas: 1-2 minutos en no entrenados, 2 o más en entrenados. Una entrada en calor
    específica alcanza.
  - DOI 10.1007/s40279-021-01490-1.

### Qué quiere decir

- La duración se puede **estimar desde la prescripción**: cada serie son 30 s más su pausa. No hace
  falta suponer un tempo por repetición, y el número deja de ser una constante.
- Hay cosas que se pueden recortar **sin tocar el estímulo** (la pausa hasta un piso, juntar de a
  dos), y cosas que sí lo tocan (sacar ejercicios, bajar series). Las primeras van antes.
- Lo que no se toca nunca son los multiarticulares: son el mínimo de Iversen.

## Lo que decidió el dueño (19/09/2026)

- **El orden del recorte:** pausa, pares, aislados, series.
- **Los bloques de contexto** (equilibrio de los mayores, impacto para el hueso, el equilibrio en
  un pie del esguince, el par explosivo) van **después** de los aislados: se achican recién si con
  todo lo demás recortado igual no entra, y se avisa. De cada bloque queda al menos un ejercicio.
- **Si sobran minutos, no se agrega nada.** La dosis sale del ruleset, no del tiempo libre.
- **"Descanso"** en el checklist es el descanso entre series. Los días de descanso ya salen de los
  días por semana que declara. El descanso entre series como preferencia del socio queda para T4b.

## Lo que hace el motor

`packages/engine/src/tiempo.ts`, con los números de `sessionTime` en el ruleset:

1. **Estima** cada sesión: series × (30 s + la pausa). El cardio va por su duración y la pausa de
   cada vuelta. Ese número es el `estimatedMinutes` que ve el socio.
2. Si no entra en los minutos declarados, achica en orden, y cada paso corre sobre **todas** las
   sesiones de la plantilla antes del siguiente:
   1. **Pausa**: baja hasta el piso del nivel (90 s principiante y novato, 120 s intermedio y
      avanzado). Nunca sube. Solo en la fuerza regulada por RIR: la pausa larga de la potencia es
      parte de la dosis, y el par explosivo tiene la suya medida (`37`).
   2. **De a dos**: primero antagonistas (empuje horizontal con tirón horizontal, vertical con
      vertical), después cualquier par sin músculo principal en común. Nunca un multiarticular de
      peso libre o de rack. El primero va sin pausa; el segundo lleva la pausa de la vuelta, la
      mayor de las dos.
   3. **Aislados**: se sacan desde el final. Si uno iba de a dos, el compañero vuelve a ir solo,
      con la pausa de la vuelta.
   4. **Series**: de a una, primero al que más tiene y, entre iguales, al secundario. Nunca baja de
      una serie, y nunca deja un músculo por debajo del mínimo semanal del objetivo
      (`weeklyVolume.minSetsPerMuscle`, el mismo número que usa el aviso de volumen), salvo que ya
      estuviera abajo.
   5. **Bloques**: primero el explosivo del par (el levantamiento queda solo, con la pausa de la
      vuelta), después los ejercicios de bloque que sobran, desde el final.
3. **Avisa** en un solo mensaje qué cambió ("pausas más cortas", "algunos ejercicios de a dos", …),
   y en otro, si aun así alguna sesión no entra, cuál y cuánto dura.

### Dos cosas que encontró el barrido

- **El piso semanal se contaba antes de tiempo.** Con los pasos corriendo sesión por sesión, la
  sesión A bajaba series de sentadilla contando los aductores de la B, que la B sacaba después: la
  sentadilla terminaba en 1 serie semanal. Por eso cada paso corre sobre todas las sesiones antes
  del siguiente.
- **Dos pisos semanales.** La primera versión traía su propio mínimo (4 series, de Iversen) y el
  plan ya tenía el del objetivo (6 en hipertrofia). El mismo plan decía "achicamos manteniendo un
  mínimo" y "quedan abajo de las 6 series mínimas". Quedó uno solo: el del objetivo.

### Cómo se cuenta la semana

Igual que el aviso de volumen: las primeras sesiones de la cola, tantas como días declaró. Con
menos días que sesiones de plantilla (una vez por semana con una plantilla A/B), esa semana deja
afuera a la B, que se podría recortar sin límite. Ahí cuenta el promedio de la rotación: cada una,
media vez por semana.

## El dato

No hay esquema nuevo: `user_goals.session_minutes_target` ya existía (15 a 180) y ya llegaba al
motor. Lo nuevo está en el ruleset:

- `sessionTime`: `secondsPerSet`, `restFloorSeconds` por nivel, `pairIntraRestSeconds`,
  `antagonists`, `noPairEquipment`, los textos (`fittedNote`, `changes`, `overNote`,
  `sessionOver`) y la confianza (media).
- Se fueron `modifiers.sessionLength` (el aviso que comparaba solo el descanso) y el
  `estimatedMinutes` fijo de las nueve plantillas.

## Cómo se prueba

- **Unitario** (`tiempo.test.ts`, 23 casos):
  - la duración estimada;
  - cada paso por separado, y que para apenas entra;
  - que la pausa nunca sube ni toca la potencia;
  - que los pares no comparten músculo, no llevan peso libre y no desarman el par explosivo;
  - que el piso semanal se cuenta entre sesiones y después de los aislados de todas;
  - el promedio de la rotación;
  - los bloques al final;
  - que repeticiones y RIR no se tocan nunca.
- **Matriz**:
  - cada sesión entra en los minutos, o el plan dice cuál no entra y cuánto dura (35 perfiles
    con 30 minutos y con tres horas). Con tres horas no se achica nadie;
  - los minutos que se muestran salen de las series y las pausas, y la "Sesión A" ya no dura
    igual para todos;
  - tres perfiles nuevos: 30 minutos de hipertrofia, 15 de fuerza avanzado y 15 de un mayor de 70
    (le queda el equilibrio);
  - la firma de cada prescripción se sigue explicando por el ruleset, con lo que el ajuste puede
    hacerle y solo si el plan lo avisó.
- **Barrido** (dimensión `minutos`: 15, 30, 45, 60 y 90). Invariantes:
  - ninguna sesión pasa los minutos sin decirlo;
  - el ajuste no saca un multiarticular ni toca repeticiones o RIR;
  - bajar series no deja un músculo abajo del piso;
  - todo par por tiempo va pegado, sin músculo en común, sin peso libre y sin pausa adentro;
  - con el esguince queda al menos un ejercicio en un pie si el plan avisa que achicó los bloques.
  - **Sensibilidad de los minutos: de 0 % a 69 %.**
- **Falsificado**: 18 guardas en rojo. Una más (no rearmar el par explosivo) resultó redundante: el par ya queda afuera por tener grupo. Se sacó.

## Lo que queda

- **Lo que igual no entra.** El reporte del barrido lo cuenta por minutos y objetivo
  (`noEntranPorMinutosYObjetivo`). Con 15 minutos no entran muchas: el piso semanal del objetivo
  pesa más que los minutos, y el plan lo dice. Con 30 minutos es casi solo el cardio.
- **El cardio no se achica.** La sesión "Continuo" son 40 minutos de caminata o bici, y no está en
  el orden que decidió el dueño. Con 15 o 30 minutos sale el aviso de que no entra. Es decisión
  suya si el cardio continuo baja con los minutos (y hasta dónde).
- **El piso de pausa es por nivel, no por objetivo.** Para hipertrofia, Singer 2024 no encuentra
  beneficio en pasar de 90 s, y el piso de un intermedio es 120 s. Queda así, del lado prudente.
- **La pausa del principiante** era más larga que la del intermedio, sin respaldo. Se corrigió en
  `60`, que también decide no preguntarle al socio por el descanso.
- **El cardio continuo** baja con los minutos hasta un piso (T4c).
