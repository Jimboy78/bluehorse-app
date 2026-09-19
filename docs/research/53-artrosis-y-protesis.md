# Artrosis y prótesis: qué cambia en el plan

**Fecha:** 19/09/2026. **Tanda:** T3e del plan de variables.
- **Artrosis** ya estaba en la lista de salud (`43`) sin ningún efecto.
- **Prótesis** es nueva. El dueño la marcó *opcional* en el checklist, así que entra a la lista como
  una opción más del grupo "huesos y articulaciones".

## Artrosis

### El ejercicio es el tratamiento — CONFIANZA ALTA

- **EULAR 2023** (Moseng et al., recomendaciones para el manejo no farmacológico de la artrosis de
  cadera y rodilla, texto completo, PMC11103326):
  - a **todas** las personas con artrosis de cadera o de rodilla hay que ofrecerles un programa de
    ejercicio con la dosis adecuada y progresión: fuerza, aeróbico, flexibilidad o neuromotor;
  - un plan que combine ejercicio, educación y, si corresponde, bajar de peso rinde más que cada
    parte por separado;
  - ninguna modalidad le gana claramente a otra, y la dosis óptima no está establecida.
  - Para la cadera en particular, la fuerza progresiva supervisada mejora el dolor, la función y la
    calidad de vida, con efectos chicos.
  - DOI 10.1136/ard-2023-225041

**En el motor:**
- **La dosis no cambia y no sale nada.** La condición no dice qué articulación es. El ajuste por
  zona ya lo hacen las reglas de dolor: la de rodilla (`09`) y la de cadera (`49`).
- **Un aviso:** el ejercicio es parte del tratamiento; si una articulación duele al entrenar, que la
  anote como molestia y el plan se ajusta a esa zona. Es la manera de conectar la condición con la
  zona sin preguntar dos veces.

## Prótesis de cadera o rodilla

### Se vuelve al deporte; el alto impacto, por consenso, no — CONFIANZA BAJA

- **Hoorntje et al. 2018**, revisión sistemática de 37 estudios sobre prótesis de cadera (texto
  completo, PMC5999146):
  - **8 de cada 10 vuelven** al nivel de deporte que tenían antes de los síntomas;
  - tardan entre **16 y 28 semanas**;
  - volver a deportes de **alto impacto es menos probable**, pero posible en quien ya los hacía;
  - antes de operarse, el 14 % hacía deportes de alto impacto; después, el 8 %.
  - Cita a **Klein et al. 2007**, encuesta a 549 cirujanos ortopédicos:
    - lo de bajo impacto (nadar, caminar, bailar) está permitido;
    - lo de impacto intermedio, solo para quien ya lo hacía;
    - **hubo consenso en no permitir el alto impacto**;
    - "esas recomendaciones se basan en opinión de expertos, no en resultados de estudios
      clínicos".
  - DOI 10.1007/s40279-018-0924-2
- **Barnsley et al. 2015**, revisión sistemática sobre las "precauciones de cadera" (no flexionar
  más de 90°, no cruzar las piernas) después de la prótesis (texto completo, PMC4536510):
  - con abordaje anterolateral, **no previenen la luxación**, que ya es rara;
  - demoran la vuelta a la actividad y bajan la satisfacción;
  - no hay estudios del abordaje posterior.
  - DOI 10.1177/2151458515584640
- **Prótesis de rodilla:** no se encontró una revisión abierta equivalente. La regla es la misma,
  porque el consenso de los cirujanos es el mismo para las dos.

**En el motor:**
- **Salen los saltos, los lanzamientos y el bloque de impacto**, igual que con el embarazo o las
  pérdidas de orina. Con osteoporosis también: sacar gana sobre sumar (`46`).
- **La fuerza no cambia.** Nada de lo que se leyó pide bajarla.
- **La flexión profunda no se saca:** las precauciones de cadera no mostraron beneficio.
- **Un aviso:** fuerza normal; saltos e impacto afuera por consenso de los traumatólogos; si se operó
  hace menos de seis meses (el techo de las 16–28 semanas de Hoorntje), primero lo que le indicaron
  el cirujano o el kinesiólogo.

La confianza es `low` porque lo único que cambia el plan, sacar el impacto, es opinión de expertos.
Es el lado prudente: el costo de sacar los saltos a alguien con prótesis es chico, el de desgastarla
o aflojarla no.

## Qué se tocó

- **Enum `health_condition`:** se agregó `joint_replacement`. La migración es un `ADD VALUE`, no
  destructiva.
- `packages/domain/src/enums.ts`, `database.types.ts` regenerado.
- La lista de la app suma "Una prótesis de cadera o rodilla" en "huesos y articulaciones".
- El ruleset suma dos entradas: `osteoarthritis` y `joint_replacement`.

## Cómo se prueba

- El barrido suma a la dimensión salud: artrosis, prótesis, y artrosis con prótesis y osteoporosis.
- La lista escrita a mano de condiciones que sacan saltos e impacto (`SIN_SALTOS`) suma la prótesis.
- Unitario: la artrosis deja la dosis y los bloques iguales y suma un aviso; la prótesis deja la
  dosis y saca impacto y par; con osteoporosis, el impacto sigue afuera.
- Matriz: una mujer de 64 con prótesis de cadera y artrosis, fuerza principiante.
- Falsificado: sin `excludesExplosive` ni `impactBlock` en la prótesis, el barrido encuentra saltos
  con vallas, slam ball e impacto.
