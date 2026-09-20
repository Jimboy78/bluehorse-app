# Objetivos secundarios: bajar grasa y cuidar la salud

**Fecha:** 19/09/2026. **Tanda:** T6a del plan de variables. En el checklist: "varios objetivos con
prioridad (`priority` ya existe y no se usa), bajar grasa, subir peso, salud, movilidad, volver de
una lesión". Esta tanda cubre los dos primeros que mueven el plan, **bajar grasa** y **salud**.
Subir peso y movilidad van en T6b; volver de una lesión, en T6c.

## La pregunta

El socio elige un objetivo principal. ¿Qué cambia en su plan si además quiere bajar grasa o cuidar
la salud? ¿Y qué hace la prioridad entre varios?

## Lo que dice la evidencia

- **Salud: OMS 2020** (Bull et al., `61`): **150 a 300 minutos semanales** de actividad aeróbica
  moderada, o la mitad de vigorosa, más fuerza dos días por semana. Cualquier tramo suma (Jakicic
  2019). DOI 10.1136/bjsports-2020-102955.
- **Bajar grasa: Jayedi et al. 2024**, *JAMA Netw Open*, metaanálisis de dosis-respuesta, 116
  ensayos y 6.880 adultos con sobrepeso u obesidad. DOI 10.1001/jamanetworkopen.2024.52185.
  - Cada 30 minutos semanales de aeróbico: −0,52 kg de peso (GRADE moderada), −0,56 cm de cintura
    (alta), −0,37 % de grasa (moderada).
  - La relación es **lineal hasta 300 minutos por semana**.
  - **Desde 150 minutos** las reducciones de cintura y grasa son clínicamente importantes.
- **Bellicha et al. 2021**, *Obes Rev*, 12 revisiones y 149 estudios:
  - el ejercicio solo baja 1,5 a 3,5 kg de peso y 1,3 a 2,6 kg de grasa;
  - intervalos y continuo rinden igual si gastan lo mismo;
  - **la fuerza cuida la masa magra mientras se baja de peso** (0,8 kg);
  - el ejercicio no mostró efecto en mantener el peso bajado.

  DOI 10.1111/obr.13256.
- **El orden dentro de la sesión: Eddens et al. 2018**, *Sports Med*, 10 estudios.
  - Fuerza primero y cardio después: +6,9 % de fuerza dinámica de pierna.
  - El orden no cambia la hipertrofia, el VO₂máx ni el porcentaje de grasa.

  DOI 10.1007/s40279-017-0784-1.
- **Interferencia:** sumar aeróbico no baja la fuerza máxima ni la hipertrofia (Schumann 2022,
  `66`).

## Qué quiere decir

- **Salud y bajar grasa piden lo mismo del gimnasio:** llegar a 150 minutos moderados por semana,
  con la fuerza que el plan ya trae. El número es el mismo y viene de dos lados: el piso de la OMS
  y el umbral de Jayedi.
- **Lo que distingue a bajar grasa es la alimentación**, y la app no la maneja. Eso se dice una
  vez, con adónde consultar. Es accionable, no un descargo (regla 4).
- **Recomposición y cardio como objetivo principal también piden los 150.** Recomposición es bajar
  grasa sin perder músculo: los números de fuerza son los de hipertrofia (`12`), y lo que le faltaba
  era el aeróbico que la baja. El objetivo cardio quedaba en 72 a 144 minutos por semana (hallazgo
  de `61`).

## Lo que se decidió (recomendada)

1. **Los secundarios se guardan en orden** (`user_goals.secondary_goals`, el primero es el que más
   importa). Solo se ofrecen los que el motor sabe usar: hoy bajar grasa y cuidar la salud.
2. **Un secundario nunca le saca nada al principal.** El plan del principal se arma y se ajusta a
   los minutos primero. Recién después, con el tiempo que sobra en cada sesión, se suma un tramo
   continuo de cardio en zona 2, hasta llegar a 150 minutos moderados por semana.
   - Sumarlo antes del ajuste no servía: el ajuste saca aislados y series antes que el cardio, y un
     secundario terminaba comiéndose al principal.
   - Así es como la prioridad se vuelve real: el principal manda sobre el secundario.
3. **El tramo va después de la fuerza y antes de los bloques del contexto.** La fuerza primero
   rinde más en la pierna (Eddens). El equilibrio sigue cerrando la sesión (Otago, `39`).
4. **El reparto entre sesiones:**
   - lo que falta se reparte parejo;
   - la sesión con menos lugar usa todo el que tiene, y lo que no entró se lo llevan las otras;
   - en minutos enteros.
5. **Si el tiempo no alcanza, se dice cuánto suma la semana** y que lo que falta cuenta igual
   afuera: caminar o pedalear, en tramos de cualquier largo. Reemplaza al aviso de `61` para quien
   tiene la meta.
6. **A quien marca "bajar grasa" se le dice** que lo que más pesa es la alimentación y que lo
   consulte con un nutricionista.
7. **La prioridad entre bajar grasa y salud** hoy no cambia nada: los dos piden lo mismo. Queda
   guardada para cuando entren los secundarios de T6b, que piden cosas distintas.

## Lo que hace

- **Esquema:** enum `secondary_goal` (`fat_loss`, `health`) y
  `user_goals.secondary_goals secondary_goal[]` (migración `20260919212940`, no destructiva).
- **Ruleset:** `cardio.weeklyTarget`.
  - Qué objetivos lo piden: los principales cardio y recomposición, y los secundarios bajar grasa y
    salud.
  - La sesión continua que da la zona.
  - Los dos textos.
  - La meta sale de `weeklyMinimum.moderateMinutes` (150): un solo número, en un solo lugar.
- **Motor:**
  - `resolverContexto` decide si hay meta (`aerobico`);
  - `aerobico.ts` cuenta la semana y reparte;
  - `completarAerobico` suma los tramos después del ajuste de tiempo.
- **App:**
  - "Además, ¿querés…?" en el primer paso del onboarding y en Perfil;
  - se eligen en orden y, con más de uno, se ve el número;
  - `toDomainGoal` pasa a `lib/mappers/`: la traducción de la fila del objetivo vivía inline en
    `plan.ts`, sin test.

## Cómo se prueba

- **`aerobico.test.ts`:**
  - el reparto parejo;
  - lo que no entra en una sesión se lo llevan las otras;
  - si no alcanza, todo lo que hay;
  - las veces por semana, y la rotación con menos días;
  - minutos enteros;
  - **2.000 casos al azar:** nunca pasa lo que sobra, y llega siempre que el tiempo alcance;
  - el peso de cada zona, y que la pausa de los intervalos no cuenta.
- **Barrido:**
  - la dimensión nueva `secundarios`;
  - **un secundario no cambia nada del principal**: sacando un tramo continuo por sesión, el plan
    es idéntico al que sale sin él;
  - el tramo va antes de los bloques;
  - no suma más de lo que falta;
  - con meta, se llega o se avisa, y sin meta no se avisa.
- **Matriz:**
  - dos perfiles nuevos: "hipertrofia · bajar grasa", con poco tiempo, y "fuerza · salud · cinco
    días", con tiempo;
  - el que tiene tiempo llega y no avisa;
  - el otro avisa con los minutos que suma;
  - la nota de alimentación sale solo con bajar grasa;
  - sin nada que lo pida, no hay cardio.
- **App:**
  - el orden de elección es la prioridad;
  - el mapper guarda sin repetidos;
  - `toDomainGoal` copia los secundarios.
