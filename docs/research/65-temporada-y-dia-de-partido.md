# La temporada y el día de partido llegan al socio

**Fecha:** 19/09/2026. **Tanda:** T5d del plan de variables. En el checklist: "días al partido,
que el motor ya soporta y la app no pregunta".

## La pregunta

El motor tiene desde `07` un ajuste por día de partido (jugué ayer, jugué anteayer, juego mañana,
juego hoy) y un recorte de volumen en temporada. Desde `62` y `63` también saca la prevención cerca
del partido. ¿Le llega algo de eso a un socio?

## Lo que se encontró

**Nada le llegaba.** Dos huecos, uno detrás del otro:

- **La app no preguntaba el momento de la temporada.** `user_goals.season_phase` quedaba siempre en
  `none`. El recorte de volumen en temporada (×0,5), el tope del nórdico en temporada (`62`) y todo
  lo que depende de estar en temporada no se aplicaban nunca fuera de los tests.
- **La app no preguntaba el partido.** `adjustSession` no tenía ningún llamador en la app.

## La evidencia

No hay investigación nueva: `07` ya fijó los estados, sus multiplicadores y **a quién** le
corresponde la pregunta. Solo a un deporte con partido semanal, **en temporada**; todo lo demás no
la ve. Esta tanda es llevar eso a la pantalla sin inventar nada.

## Lo que se decidió (19/09/2026)

El dueño eligió la primera opción de cada pregunta. Después pidió que las decisiones de producto
las tome la opción recomendada, y eso es lo que marca "(recomendada)".

- **Día fijo, corregible el día.** En el perfil del deporte, "¿Qué día jugás?", con la opción
  "Varía". Hoy deduce el estado de la fecha y lo dice ("Juego mañana"). Si una semana cambia, "¿Cambió
  el partido?" lo corrige. Los días normales no se pregunta nada.
- **Se guarda en la sesión registrada** en qué momento del partido se entrenó
  (`workout_logs.match_day_state`). Una sesión recortada porque juega mañana no es una sesión
  incompleta, y así Progreso y la adaptación lo pueden saber.
- **La temporada se pregunta a quien declara un deporte**, en el onboarding. Se edita en Perfil
  porque cambia a lo largo del año. (recomendada)
- **La corrección se guarda como partido, no como estado.** Si el partido se corre del sábado al
  domingo, alcanza con una corrección y no hace falta una por día. (recomendada)
- **Dos partidos cerca: gana el estado más restrictivo.** Si empatan en todo, gana el más cercano
  al partido, y entre dos igual de cercanos el de después: el daño medido es el que deja el partido
  (`07`). (recomendada)
- **El reseteo de perfil** borra también los partidos declarados y los días de descanso marcados.
  Los días de descanso quedaban sin borrar, y se corrigió de paso. (recomendada)

## Lo que hace

- **Esquema:**
  - enum `match_day_state`, espejo de `MATCH_DAY_STATES`;
  - `user_goals.match_weekday` (1 lunes … 7 domingo, nulo si varía);
  - tabla `match_exceptions` (`day`, `plays`), única por socio y día, con `gym_id` y RLS propia;
  - `workout_logs.match_day_state`.

  La migración no es destructiva.
- **Ruleset:** cada estado de `sports.matchDay` declara `daysFromMatch` (1 jugué ayer, 2 anteayer,
  −1 juego mañana, 0 juego hoy, `null` el normal). La distancia es un dato, no un número del código.
- **Motor** (`partido.ts`, puro, la fecha entra por parámetro):
  - `estadoDelDia`: el estado de hoy a partir del día fijo y las excepciones;
  - `excepcionesParaEstado`: qué declarar para que hoy sea el estado elegido. Borra las excepciones
    que el día fijo ya cubre, así una corrección no deja nada que la semana siguiente haya que
    deshacer.
- **App:**
  - `TemporadaYDia` en el onboarding (paso del objetivo) y en Perfil (con "Guardar");
  - en Hoy, `DiaDePartido` arriba de la lista: el estado, lo que ajustó el motor ("Hoy se sacan…")
    y "¿Cambió el partido?";
  - la sesión que se muestra es la de `adjustSession`, mapeada de vuelta ítem por ítem;
  - el `workout_log` se crea con el estado.

## Cómo se prueba

- **Motor** (`partido.test.ts`, 11 casos):
  - la semana entera con partido fijo;
  - sin partido fijo;
  - una semana sin partido;
  - un partido corrido;
  - un partido suelto de quien no tiene día fijo;
  - dos partidos cerca y el desempate, que no depende del orden del ruleset;
  - las distancias salen del ruleset;
  - **ida y vuelta**: en 125 combinaciones de día fijo, fecha y estado elegido, lo que se declara
    hace que hoy sea ese estado;
  - elegir lo que ya dice el día fijo no declara nada.
- **App:**
  - `partido.test.ts`: tiene partidos lo que dice la categoría, se pide solo en temporada, y la
    limpieza de lo que no corresponde guardar;
  - `partido-ajuste.test.ts`: el día normal no toca nada. El del partido saca la pierna. El día
    después, el salto sale y el levantamiento queda suelto con la pausa de la vuelta. Cada ítem
    vuelve a ser el suyo;
  - `TemporadaYDia.test.tsx` y `DiaDePartido.test.tsx`: cuándo aparece cada pregunta, y que elegir
    el mismo estado no escribe;
  - mappers: el objetivo guarda temporada y día solo cuando corresponde, y el registro guarda el
    estado.
- **Falsificado: 11 de 11 en rojo.** Las mutaciones:
  - ignorar las excepciones;
  - desempate por orden;
  - que gane el menos restrictivo;
  - declarar siempre;
  - una distancia fija;
  - guardar el día fuera de temporada;
  - preguntarlo en cualquier etapa;
  - el ajuste sin la pausa nueva;
  - el registro sin estado;
  - mandar el mismo estado;
  - temporada sin deporte.
- **Sin cubrir por test:** que `Hoy` le pase el estado a `useSessionLog`. `Hoy` no tiene test de
  componente; queda para la prueba en el navegador.

## Lo que queda

- **La prueba en el navegador**, contra la base local.
- **Qué hace Progreso con `match_day_state`.** Hoy se guarda y nadie lo lee. Cuando la adaptación
  mire series hechas contra planificadas, una sesión de "juego mañana" no tiene que contar como
  incompleta.
- **Los partidos de quien tiene "Varía"** se declaran desde Hoy, el mismo día. No hay forma de
  cargar el fixture por adelantado.
