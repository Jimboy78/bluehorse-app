# El salto del par: horizontal primero, sin preguntar puesto ni qué mejorar

**Fecha:** 19/09/2026. **Tanda:** T5g del plan de variables. En el checklist: "posición y qué
quiere mejorar, que eligen el par explosivo y el énfasis".

## La pregunta

¿Hay que preguntarle a quien hace deporte en qué puesto juega y qué quiere mejorar (sprint, salto,
cambio de dirección, lanzamiento), para elegir el explosivo del par y los músculos a priorizar?

## Lo que dice la evidencia

- **Puesto.** No hay ningún metaanálisis ni revisión de **intervención** por puesto: lo publicado
  describe en qué se diferencian los arqueros o los pivotes, no qué entrenamiento les sirve más.
  Buscado en Europe PMC: revisiones sobre puesto y entrenamiento de fuerza (cero resultados), y
  sobre arqueros (solo estudios descriptivos, por ejemplo *J Funct Morphol Kinesiol* 2025, DOI
  10.3390/jfmk10040398).
- **Hacia dónde se salta: Moran et al. 2021**, *Sports Med*, metaanálisis que compara pliometría
  vertical contra horizontal. DOI 10.1007/s40279-020-01340-6.
  - En lo **horizontal** (salto largo, sprint), la horizontal gana con efecto moderado: ES 0,65
    (IC 0,12 a 1,18).
  - En lo **vertical** no hay diferencia: −0,04 (IC −0,33 a 0,24).
  - Conclusión de los autores: la horizontal es **al menos igual** para el salto vertical y mejor
    para lo horizontal. Es la forma más eficiente de mejorar en varias direcciones a la vez.
- **Una pierna o dos: 2025**, *BMC Sports Sci Med Rehabil*, 11 ensayos. Las diferencias en sprint
  y cambio de dirección son triviales (ES −0,04 y −0,08). Solo el salto a un pie mejora más con
  trabajo a un pie (0,53). DOI 10.1186/s13102-025-01113-6.
- **Tren superior: 2023**, *Sports Med Open*, 30 estudios y 1.412 participantes. La pliometría de
  brazos mejora el lanzamiento del deporte (ES 0,55), pero con certeza GRADE **baja o muy baja**.
  DOI 10.1186/s40798-023-00631-2.

## Qué quiere decir

- **El puesto no se pregunta.** No hay con qué convertir la respuesta en un plan distinto.
- **"Qué querés mejorar" tampoco.** Lo único sostenido es la dirección del salto, y la respuesta
  sería la misma para todos: el horizontal sirve para el sprint y no pierde en el salto vertical.
  Una pregunta cuya respuesta no mueve el plan tiene sensibilidad 0 %, y el protocolo del plan dice
  que no se hace.
- **Lo de una pierna y lo del tren superior no cambian nada.** Lo primero es trivial. Lo segundo ya
  pasa (el pase de pecho va en par con el empuje horizontal), y su certeza no alcanza para darle
  más lugar.
- **El énfasis por deporte** (`sports.catalog[].emphasis`) sigue igual, y sigue siendo criterio de
  práctica (`confidence: low`).

## Lo que se decidió (recomendada)

**Ni puesto ni qué mejorar.** Lo que sí cambia es el motor:

1. **El par prefiere el salto horizontal.** `explosive.preferJumpDirection: "horizontal"` en el
   ruleset. Entre los explosivos del patrón va primero el de esa dirección; si el patrón no tiene
   uno, o el socio no puede hacerlo, sale otro como antes.
2. **Cada salto dice hacia dónde se salta.** Columna `exercises.jump_direction` (`vertical`,
   `horizontal`, `lateral`), nula en lo que no es un salto (swing, lanzamientos). Una restricción
   impide ponerla en algo no explosivo.
3. **Un salto nuevo en el catálogo:** "Salto horizontal a pies juntos", novato, sin estación (se
   hace en el piso).
   - Se probó también "Salto horizontal a un pie", para combinar una y dos piernas como sugiere
     Moran. No entraba nunca: el par cae siempre en la sentadilla o la bisagra, no en la zancada.
     Se sacó.
4. **Una corrección que el salto nuevo destapó:**
   - **Lo explosivo ya no ocupa un slot común, ni siquiera cuando es lo único del patrón.** Era una
     preferencia "para no dejar el slot vacío", y no se notaba porque todo salto de sentadilla pedía
     una estación. Con el salto horizontal, que no pide ninguna, sacar de servicio las estaciones de
     sentadilla llenaba el slot con saltos a 4×1-5 con RIR 3, y el aviso al staff desaparecía. Un
     slot vacío con su causa dice la verdad; un salto con la dosis de otro, no. El aviso ahora
     cuenta solo lo que puede ocupar un slot.

## Lo que cambia en los planes

- **Matriz (`tools/reportes/motor-v1-research.json`):**
  - los 26 saltos del par (24 saltos en profundidad y 2 al cajón) pasan a ser el horizontal;
  - la bisagra pasa de slam ball a swing, y el bloque de equilibrio y el de rodilla se reordenan.
    Es el mismo sorteo determinista corrido: la sentadilla ahora tiene un solo candidato y no
    consume un número. No cambió ninguna regla.
- **Barrido:**
  - el 100 % de los saltos del par van en la dirección preferida;
  - el salto al cajón, el de vallas, el de profundidad y el de barra hexagonal no entran más a
    ningún plan. Siguen en el catálogo como alternativas para "otras formas de hacerlo".

## Cómo se prueba

- **Motor** (`placeholder-engine.test.ts`, "la dirección del salto en el par"):
  - el ruleset pide el horizontal;
  - con los dos saltos, cada par lleva el horizontal en 20 semillas, contando cuántos pares miró;
  - sin horizontal, el vertical ocupa su lugar;
  - el control: sin la preferencia en el ruleset, el vertical también sale;
  - un ejercicio de prevención nunca va en el par, aunque sea el único salto. Lo cuida el pool
    (`usableExercises` saca los de bloque), y el test fija eso con alguien de vóley, que es a quien
    le entra el aterrizaje. Sacarle a `chooseExplosive` un filtro propio no lo pone en rojo: el
    filtro sobraba y se sacó.
- **Slot sin explosivos:** "ni aunque sea lo único del patrón: el slot queda vacío y lo dice".
- **Matriz:** "lo que no se puede sustituir se sigue explicando por su causa" es el test que
  encontró el problema del slot.
- **Barrido:**
  - un salto que no es horizontal va en el par solo si el socio no tenía uno horizontal a mano;
  - ningún ejercicio de bloque lleva la dosis del par.
- **Mapper:** trae la dirección y rechaza una que no existe.
- **Falsificado: 9 de 9 en rojo.**
  - elegir sin mirar la dirección;
  - preferir lo que no está en el plan antes que la dirección;
  - el ruleset sin `preferJumpDirection`;
  - lo explosivo de vuelta en un slot;
  - el aviso contando los explosivos;
  - el mapper sin la dirección;
  - el barrido leyendo el catálogo sin la dirección;
  - el pool con los ejercicios de bloque: rojo en el test de vóley y en el barrido ("de un bloque,
    en el par explosivo").
