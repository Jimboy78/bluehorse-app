# Salud con puerta: quién necesita autorización y qué cambia en el plan

**Fecha:** 18/09/2026. **Tanda:** T2a del plan de variables. El dueño pidió que en lo médico, antes
de marcar veinte opciones, haya una pregunta de sí o no, y que recién con un "sí" se abra la lista.

## Lo que hace la app hoy

`safety.screening` tiene 7 preguntas tomadas de la primera página del PAR-Q. Cinco bloquean: con un
"sí" la app pide autorización médica antes de arrancar. Entre las que bloquean están:

- "¿Alguna vez un médico te dijo que tenés un problema del corazón **o presión alta**?"
- "¿Tomás **medicación para la presión** o para el corazón?"

Resultado: un hipertenso controlado, con medicación y que ya entrena, queda frenado igual que
alguien con dolor de pecho. Y ninguna condición le cambia el plan a quien sí pasa: el motor no se
entera de que alguien tiene diabetes, asma u osteoporosis.

## Lo que dice la evidencia

### El cribado actual deriva de más — CONFIANZA ALTA

- **ACSM 2015** (Riebe et al.): el cribado anterior mandaba a demasiada gente al médico, y eso era
  una barrera para hacer ejercicio. El ejercicio es seguro para la mayoría, los eventos suelen venir
  precedidos de síntomas, y el riesgo baja a medida que la persona se pone en forma. El modelo nuevo
  decide con tres cosas: si ya hace actividad, si tiene síntomas o una enfermedad cardiovascular,
  metabólica o renal conocida, y qué intensidad quiere hacer. Los factores de riesgo (edad,
  colesterol, etc.) **dejan de ser motivo de derivación**. DOI 10.1249/MSS.0000000000000664
  - Según lo que resume el SPARQ 2021 de ACSM: quien no tiene síntomas y tiene esas enfermedades
    puede seguir entrenando con progresión. Solo necesita autorización la presión no controlada
    (≥ 140/90 en reposo), la de etapa 2 (≥ 160/100) o el daño en órganos. DOI 10.3390/healthcare13151837
  - **No se pudo abrir el texto completo** de ACSM 2015: las copias abiertas están detrás de
    controles anti-bots. Se cita por su resumen y por el resumen del SPARQ.
- **SPARQ 2021** (Singapur): su primera pregunta no es "¿alguna vez te dijeron presión alta?", sino
  "¿tenés presión alta o un problema del corazón **por el que todavía necesitás tratamiento y
  seguimiento cercano**?". Aun así, deriva al 35,7 %. Del PAR-Q+ reporta derivaciones por encima del
  55 % en Estados Unidos.

### PAR-Q+: la puerta con seguimiento, validada — CONFIANZA ALTA

- **PAR-Q+** (Warburton, Jamnik, Bredin y Gledhill, 2011; versión 2023), hecho con el proceso AGREE
  (Jamnik et al. 2011, DOI 10.1139/h11-044; Warburton et al. 2011, DOI 10.1139/h11-062). Es la
  forma exacta que pidió el dueño:
  1. **Siete preguntas generales**: corazón o presión, dolor de pecho, mareo o desmayo, otra
     enfermedad crónica, medicación, huesos y articulaciones, y si un médico le dijo que solo haga
     actividad supervisada. Con todo "no", queda habilitado.
  2. Con algún "sí", **se abren solo los grupos que correspondan**, con 2 a 5 preguntas cada uno:
     - artritis, osteoporosis o espalda;
     - cáncer;
     - corazón;
     - **presión alta**: ¿cuesta controlarla?, ¿en reposo está en 160/90 o más, o no la sabés?;
     - metabolismo: diabetes (control, bajas de azúcar, complicaciones);
     - salud mental;
     - respiratorio: asma, EPOC;
     - lesión medular;
     - ACV;
     - otras.
  3. Con todas las de seguimiento en "no", **queda habilitado**: arrancar despacio, de intensidad
     baja a moderada, e ir subiendo. Con alguna en "sí", corresponde consultar (o el ePARmed-X+).
- Con esto, un hipertenso controlado por debajo de 160/90 **pasa**. Uno que no sabe su presión, no:
  el PAR-Q+ le pide contestar que sí.

### Lo que el dueño pidió y el PAR-Q+ no pregunta

Anticoagulantes, betabloqueantes, glaucoma o retina, hernia abdominal, suelo pélvico y epilepsia no
deciden si alguien necesita autorización: cambian **cómo** entrena. Van en la lista de condiciones,
dentro de los grupos, y los usa el motor (T2b a T2e). No bloquean.

## La propuesta

**La puerta.** Las 7 preguntas generales del PAR-Q+, adaptadas al castellano. La de síntomas actuales
(dolor de pecho, desmayo) sigue bloqueando sola, como hoy.

**Con un "sí", la lista agrupada**, que abre solo lo marcado:

| Grupo | Qué se marca | Seguimiento (PAR-Q+) | Lo usa el motor en |
|---|---|---|---|
| Corazón y presión | problema del corazón · presión alta · betabloqueantes · anticoagulantes | control; arritmia; insuficiencia; coronaria sin actividad en 2 meses; presión ≥ 160/90 o no sabe | T2b, T2c |
| Metabolismo | diabetes | control; bajas de azúcar; complicaciones | T2c |
| Respiración | asma · EPOC | control; oxígeno; síntomas esta semana | T2e |
| Huesos y articulaciones | artrosis · osteoporosis · problema de espalda | control; fractura reciente o por osteoporosis; corticoides | T2d |
| Abdomen y pelvis | hernia abdominal · suelo pélvico | — | T2d |
| Vista y sistema nervioso | glaucoma o retina · epilepsia o vértigo | — (los desmayos ya están en la puerta) | T2e |
| Solo mujeres | embarazo · posparto (opcional) | el PAR-Q+ manda consultar con embarazo | T2f |

**El resultado:**
- **Habilitado**: todas las de seguimiento en "no". El plan sale con los módulos de las condiciones
  marcadas.
- **Consultar**: alguna de seguimiento en "sí". Es lo mismo que hoy: la app pide autorización.
- Se guarda cada condición marcada (no solo el resultado) en una tabla propia, con `gym_id`, para
  que el motor la reciba en `UserSnapshot`.

## Decisiones del dueño

1. **Aflojar el bloqueo.** Hoy la presión alta o su medicación bloquean siempre. Con el PAR-Q+, la
   presión controlada por debajo de 160/90 no bloquea. Es lo que recomiendan ACSM 2015 y el propio
   PAR-Q+, pero cambia a quién deja pasar la app.
   - **(a)** Adoptar el PAR-Q+ completo (recomendado).
   - **(b)** Dejar el bloqueo como está y usar la lista solo para ajustar el plan.
2. **Licencia.** El PAR-Q+ es de la PAR-Q+ Collaboration (© 2024), hecho con fondos públicos
   canadienses. El documento no dice si se puede reproducir dentro de una app. Antes de copiar sus
   preguntas textuales, conviene escribirles (eparmedx@gmail.com). Si no se consigue, se usa la misma
   estructura con preguntas redactadas por nosotros.

Mientras tanto: T2b a T2e (lo que cada condición cambia en el plan) se investigan y se construyen
en el motor. El motor no depende de cómo se pregunte, solo de qué condiciones llegan.
