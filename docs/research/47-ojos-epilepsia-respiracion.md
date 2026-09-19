# Glaucoma y retina, epilepsia y vértigo, asma y EPOC

**Fecha:** 19/09/2026. **Tanda:** T2e del plan de variables. Son los grupos "vista y equilibrio" y
"respiración" de la lista de salud (`43`).

## Glaucoma y retina

### La presión del ojo sube como la arterial: con el esfuerzo hacia el fallo — CONFIANZA MEDIA

- **Vera et al. 2020**, 19 adultos jóvenes, sentadilla y curl de bíceps de 10 repeticiones hasta el
  fallo, respirando normal:
  - la presión del ojo **sube a medida que se acumula el esfuerzo** (r = 0,97–0,98);
  - sube más con músculos grandes (sentadilla) que con chicos (bíceps);
  - "el entrenamiento de fuerza muy exigente debería evitarse cuando conviene mantener estable la
    presión del ojo".
  - DOI 10.1007/s00417-020-04736-2
- **Vaghefi et al. 2021**, 24 adultos jóvenes en prensa de piernas: subas **transitorias y
  dramáticas**, de 26 mmHg de promedio, con un máximo de 70 mmHg en un participante. Las mediciones
  fueron con 1 repetición al 95 %, 6 al 75 % y un isométrico máximo. DOI 10.1136/bmjophth-2021-000723
- **Baskaran et al. 2006**, 75 practicantes de yoga: en la vertical sobre la cabeza, la presión del
  ojo se **duplica** y se mantiene así durante la postura. DOI 10.1016/j.ophtha.2006.02.063
- **Gildea et al. 2024**, revisión de 16 estudios:
  - el aeróbico moderado **baja** la presión del ojo de forma transitoria;
  - la fuerza de alta intensidad la sube;
  - la actividad y el estado físico podrían proteger contra el glaucoma.
  - DOI 10.1097/IJG.0000000000002411
- **ACSM 2022** (`45`), para la retinopatía diabética:
  - no aguantar el aire;
  - no bajar la cabeza;
  - contraindicado con retinopatía proliferativa inestable o después de un láser o una cirugía
    reciente, y consultar al oftalmólogo.

Todos estos estudios son en sanos. Nadie midió si esas subas empeoran un glaucoma. Por eso el
criterio es el mismo que para la presión arterial (`44`): no se baja la carga; se evita el fallo y
aguantar el aire, que es lo que dispara la presión.

**En el motor:**
- **Piso de RIR 2**, igual que la presión alta.
- **Sin ejercicios con la cabeza por debajo del corazón.** Es un atributo nuevo del catálogo,
  `head_below_heart`, y hoy lo tiene solo el abdominal en el banco declinado.
- **Avisos:**
  - el de respirar, que es el mismo texto que el de la presión y no se repite si tiene las dos;
  - con retinopatía activa o un láser o una cirugía reciente, preguntarle al oftalmólogo.

## Epilepsia y vértigo — PENDIENTE

- **ILAE 2016** (Capovilla et al.), consenso del grupo de trabajo sobre deporte y epilepsia:
  - el ejercicio puede **mejorar** el control de las crisis;
  - a la gente con epilepsia se la suele desaconsejar por miedo y sobreprotección;
  - los deportes se dividen en tres grupos según el riesgo si ocurre una crisis;
  - la decisión depende del deporte, del control de las crisis, de su tipo y horario, y de cuánto
    riesgo acepta la persona.
  - DOI 10.1111/epi.13261
- **No se pudo abrir la tabla** que pone cada deporte en un grupo. El PDF abierto está detrás de un
  control anti-bots, y la copia del repositorio de UNIFESP no responde. No aparece transcrita en
  ninguna revisión abierta de PMC. Poner en el motor en qué grupo cae el trabajo con pesas sin
  haberlo leído sería inventarlo.
- **Vértigo:** comparte la entrada con la epilepsia en la lista, pero es otra cosa (riesgo de caída,
  rehabilitación vestibular). Probablemente convenga separarlos cuando se retome.

**En el motor:** nada todavía. La condición se guarda. Pendiente conseguir el texto completo de ILAE
2016.

## Asma

- **ATS 2013** (Parsons et al.), guía de práctica clínica sobre la broncoconstricción inducida por
  ejercicio: recomendación **fuerte** de usar un **broncodilatador de acción corta antes del
  ejercicio** en todos los que la tienen. Si los síntomas siguen, tratamiento diario, que decide el
  médico. DOI 10.1164/rccm.201303-0437ST
- No hay nada que cambiar en la fuerza ni en el cardio: el asma controlada no limita el tipo de
  ejercicio.

**En el motor:** un aviso: si el ejercicio le cierra el pecho, usar el broncodilatador de rescate
antes de entrenar, como se lo indicó el médico, y tenerlo a mano. El resumen no da cuántos minutos
antes, así que el aviso no pone un número.

## EPOC

- **Liao et al. 2015**, metaanálisis de 18 ensayos con 750 personas con EPOC avanzada: la fuerza
  mejora la disnea, la fuerza muscular y el VEF1, y **no hubo eventos adversos**. Combinada con
  aeróbico, mejora la calidad de vida. DOI 10.4187/respcare.03598
- Los que usan oxígeno o tuvieron síntomas esa semana los frena el seguimiento del PAR-Q+ (`43`).

**En el motor:** nada. La fuerza no se toca, y no hay un aviso accionable con respaldo.

## Lo que se decidió

| Condición | Qué cambia | De dónde |
|---|---|---|
| Glaucoma o retina | piso de RIR 2 | Vera 2020; Vaghefi 2021 |
| Glaucoma o retina | sin ejercicios con la cabeza abajo | Baskaran 2006; ACSM 2022 |
| Glaucoma o retina | aviso de respirar; aviso de consultar si hay retinopatía activa o una operación reciente | ACSM 2022 |
| Asma | aviso del broncodilatador antes de entrenar | ATS 2013 |
| EPOC | nada | Liao 2015 |
| Epilepsia o vértigo | pendiente | ILAE 2016 sin abrir |

## Cómo se prueba

- El barrido suma: glaucoma, asma, EPOC, epilepsia.
- Invariante: con glaucoma, ningún ejercicio con la cabeza abajo; el piso de RIR lo cubre la
  invariante general.
- Unitario: el aviso de respirar no se repite con glaucoma y presión juntos; el test de "condición
  sin entrada" elige sola una condición que el ruleset no tenga.
- Matriz: un hombre de 62 con glaucoma, hipertrofia avanzada.
