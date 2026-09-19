# Prevención por deporte: los isquios

**Fecha:** 19/09/2026. **Tanda:** T5a del plan de variables. En el checklist, el deporte ya era
*pedir*; lo nuevo es qué **suma** el deporte al plan para prevenir lesiones, no solo qué músculos
prioriza (`07`) ni cuánto recorta cerca del partido.

## La pregunta

Un futbolista declara su deporte y el plan hasta acá cambiaba el desempate entre ejercicios y el
volumen según la temporada. ¿Hay algo que el gimnasio pueda agregar y que baje sus lesiones de
verdad? ¿Con qué dosis, y qué pasa en temporada y el día del partido?

## Lo que dice la evidencia

Los resúmenes se leyeron en Europe PMC, y los textos completos cuando estaban abiertos.

- **Lauersen et al. 2014**, *Br J Sports Med*, metaanálisis de 25 ensayos con 26.610 personas:
  - el entrenamiento de fuerza baja las lesiones deportivas a **un tercio** (RR 0,315);
  - la propiocepción las baja a la mitad (RR 0,55);
  - el estiramiento no hace nada.
  - DOI 10.1136/bjsports-2013-092538.
- **van Dyk et al. 2019**, *Br J Sports Med*, 15 estudios sobre el **curl nórdico**: los programas
  que lo incluyen bajan las lesiones de isquios **a la mitad** (RR 0,49; con solo los ensayos
  aleatorizados, 0,52). Es el ejercicio de prevención con más respaldo en deportes con pique.
  DOI 10.1136/bjsports-2018-100045.
- **Cuthbert et al. 2020**, *Sports Med* (texto completo, PMC6942028):
  - revisión de los protocolos de curl nórdico;
  - el **volumen bajo rinde como el alto** en fuerza excéntrica y en largo del fascículo, con un
    mínimo de **6 semanas**. Por ejemplo, 2 series de 4, una vez por semana.
  - DOI 10.1007/s40279-019-01178-7.
- **Thorborg et al. 2017**, *Br J Sports Med*, metaanálisis del **FIFA 11+**: la entrada en calor
  del equipo baja las lesiones de fútbol (IRR 0,61). Se hace en la cancha, antes de entrenar, así
  que no es algo que arme el gimnasio. DOI 10.1136/bjsports-2016-097066.
- **Harøy et al. 2019**, *Br J Sports Med*: el **aductor de Copenhague** bajó un 41 % los problemas
  de ingle en fútbol. DOI 10.1136/bjsports-2017-098937. Pero un metaanálisis de 2025 no encuentra
  efecto significativo sobre las lesiones de ingle (RR 0,83; 0,41-1,68), y su volumen para fuerza
  ronda las 30 repeticiones por semana. DOI 10.1111/sms.70119.
- **Andersson et al. 2017**, *Br J Sports Med*: un programa de hombro en handball bajó los problemas
  de hombro (OR 0,72). DOI 10.1136/bjsports-2016-096226. Queda para T5c.
- **Entrenamiento neuromuscular y ligamento cruzado**, metaanálisis 2026, *Front Public Health*:
  OR 0,456, con más efecto en los jóvenes. DOI 10.3389/fpubh.2026.1801019. Queda para T5b.
- El `07` ya decía que lo **excéntrico cerca del partido suma daño** encima del que deja el
  partido.

### Qué quiere decir

El curl nórdico es lo único de la lista con efecto grande, consistente, en el gimnasio y con una
dosis mínima clara. El Copenhague tiene un ensayo bueno y un metaanálisis que no lo sostiene. El
11+ funciona, pero es del equipo, no del gimnasio: lo que le corresponde a la app es contárselo.

## Lo que decidió el dueño (19/09/2026)

- **Al catálogo entra solo el curl nórdico.** Va en las colchonetas, con los tobillos trabados por
  un compañero o un rodillo firme. El Copenhague no entra.
- **Deportes del nórdico:** los de pique (fútbol, futsal, rugby, hockey, handball y básquet). Lo
  neuromuscular de rodilla para los de giro, y el hombro para los de brazo arriba, van en T5b y T5c.
- **Bloque protegido:**
  - va al final de las sesiones de pierna;
  - fuera de temporada, en todas;
  - en temporada, en una;
  - sale el día anterior al partido, el del partido y el siguiente.
- **FIFA 11+:** un aviso en fútbol y futsal.

## Lo que hace el motor

- **El dato.** `exercises.prevents` es un array de `prevention_program` (hoy solo `hamstring`). Un
  ejercicio con programa es **de bloque**, como el equilibrio y el impacto:
  - no entra por un slot;
  - no suma al volumen semanal;
  - no recibe propuestas de carga;
  - solo se reemplaza por otro de bloque.
- **El contexto** (`contexto.ts`, `prevencionDelDeporte`): con un deporte del programa, un bloque
  con la dosis del ruleset. Va antes del impacto y el equilibrio, que cierran la sesión. En
  temporada lleva un tope de sesiones. Los avisos de la entrada en calor salen solo en los deportes
  de su nota.
- **Las sesiones de pierna** son las que traen un **multiarticular** de pierna, sin contar el
  cardio. La primera versión contaba cualquier ejercicio con un músculo de pierna, y el barrido lo
  encontró: con 15 o 30 minutos, el ajuste al tiempo (`59`) sacaba el curl femoral de un día de
  torso **después** de sumarle el nórdico, y quedaba un torso con nórdico. El ajuste nunca saca un
  multiarticular, así que la definición nueva no se puede romper después. La bici y la escaladora
  son `cardio` con cuádriceps: tampoco cuentan.
- **El ajuste al tiempo** trata el bloque como los demás: lo achica recién al final y deja al menos
  uno de cada programa.
- **El día de partido** (`adjustSession`) saca el ejercicio si su programa tiene ese estado en
  `removeOn`, y lo nombra en la nota.
- **Exclusiones.** El nórdico va de rodillas y pide `floor`: quien no baja al piso no lo recibe, y
  ningún otro ejercicio ocupa su lugar con su dosis.

### En temporada, "una vez por semana" es una sesión de la plantilla

El plan es una cola que rota la plantilla. En temporada el bloque va en **una sesión de la
plantilla**, no en una por semana. Las dos cosas coinciden cuando la plantilla tiene tantas
sesiones como días por semana. Cuando tiene menos, esa sesión se repite en la semana:

- `full_body_ab` con 3 días: A-B-A, B-A-B. La A cae 1,5 veces por semana;
- `upper_lower` con 6 días, y `cardio_base` con 5, igual.

Medido en el barrido: **media 1,2 veces por semana, máximo 2**. No es un riesgo: Cuthbert encuentra
que el volumen bajo alcanza, y no que el alto haga daño. Además, lo que importa en temporada, que es
no hacer excéntrico al lado del partido, lo resuelve el día de partido. Exactamente una vez por
semana pediría armar cada sesión de la cola por separado; queda anotado.

## El dato

- **Esquema:** enum `prevention_program` (`hamstring`) y la columna
  `exercises.prevents prevention_program[] not null default '{}'`. La migración no es destructiva.
- **Catálogo:** "Curl nórdico", aislado, isquios, peso corporal, en las colchonetas, pide `floor`,
  nivel principiante (la dificultad la pone cuánto se aguanta abajo).
- **Ruleset** (`sports.prevention`):
  - `programs[]` con los deportes, la dosis (2 × 4-6, 60 s, uno por sesión), `inSeasonSessions` 1,
    `removeOn` y la confianza (media);
  - `notes[]` con el aviso del 11+.

## Cómo se prueba

- **Unitario:**
  - `contexto.test.ts`: el bloque sale solo en los deportes del programa, con su dosis y su
    selector; el tope en temporada; el orden entre bloques; y el aviso del 11+ solo en fútbol y
    futsal;
  - `placeholder-engine.test.ts`: el nórdico está en cada sesión de pierna y en ninguna otra; en
    temporada, en la cuota; sin deporte o con tenis, nunca, tampoco por un slot; sale justo los
    días de `removeOn`; se reemplaza solo por otro de su bloque, y no reemplaza a uno de slot.
- **Matriz**, sobre el catálogo real:
  - en pretemporada, en más sesiones que en temporada;
  - en temporada, exactamente en las del programa;
  - fuera de los deportes del programa, nunca;
  - con el piso vedado, ni él ni otro con su dosis.
  - Además, la firma de la prevención se suma a las que el ruleset explica. El desempate por deporte
    y el ajuste del día de partido ahora la tienen en cuenta.
- **Barrido:** en cada socio, el nórdico sale solo con un deporte del programa, solo en sesiones de
  pierna, y en todas las de pierna (o en la cuota en temporada) si no está excluido.
  **Sensibilidad del deporte: de 46 % a 66 %.**
- **Falsificado: 16 de 16 en rojo.** Las mutaciones:
  - todos los deportes;
  - todas las sesiones;
  - sin tope en temporada, o con tope siempre;
  - la dosis corrida;
  - el aviso del 11+ a todos;
  - entrar por un slot;
  - el pool sin exclusiones;
  - no sacarlo el día de partido, o sacarlo todos los días;
  - reemplazar un bloque por un slot;
  - pierna por un aislado;
  - el cardio como pierna;
  - contarlo en la dosis;
  - que el ajuste al tiempo lo trate como fuerza;
  - ignorar `maxSesiones`.

  La de la dosis quedó verde la primera vez. Se agregó un test con control: el mismo historial
  propone subir en el curl femoral y nada en el nórdico.

## Lo que queda

- **T5b:** bloque neuromuscular de rodilla para los deportes de giro.
- **T5c:** bloque de hombro para los de brazo arriba. La "Rotación externa con banda" hoy entra por
  un slot; hay que decidir si pasa a ser de bloque.
- **Una vez por semana exacta en temporada**, si el dueño lo quiere (ver arriba).
- **Dónde trabar los tobillos** en el gimnasio: un compañero, un rodillo firme o una barra baja.
  Hay que verlo en el lugar.
