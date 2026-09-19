# Osteoporosis, suelo pélvico y hernia: qué cambia en el plan

**Fecha:** 18/09/2026. **Tanda:** T2d del plan de variables. Las tres se marcan en la lista de salud
(`43`). Es la primera tanda de condiciones que cruza con un bloque de T1: el impacto para el hueso
(`42`).

## Osteoporosis

### Fuerza e impacto para todos, sin flexionar la columna cargada — CONFIANZA MEDIA

- **Consenso británico 2022** (Brooke-Wavell et al., "Strong, steady and straight", texto completo,
  PMC9304091). Para **todas** las personas con osteoporosis:
  - fuerza progresiva 2 o 3 días por semana, lo máximo que se levanta 8 a 12 veces, hasta 3
    series [evidencia];
  - impacto moderado la mayoría de los días (el mismo del bloque de `42`);
  - evitar las posturas con mucha flexión de columna, en el ejercicio y en la vida diaria [consenso].
    Hubo **fracturas vertebrales** reportadas con flexión "al final del rango, sostenida, repetida o
    cargada", **incluidos los abdominales**, y con algunas posturas de yoga;
  - "cualquier ejercicio que curve demasiado la espalda, sobre todo con carga, se modifica o se
    evita". Los giros son seguros si se hacen suaves;
  - con fractura vertebral o varias fracturas por fragilidad, el impacto no pasa de una **caminata
    rápida**;
  - los riesgos del ejercicio son bajos y el beneficio grande: el énfasis está en poder seguir, no
    en prohibir. En los ensayos, el 5,8 % de los que hacían ejercicio tuvo una fractura, contra el
    9,6 % de los controles.
  - DOI 10.1136/bjsports-2021-104634
- **Too Fit To Fracture** (Giangregorio et al. 2014), consenso Delphi canadiense: llega a lo mismo,
  fuerza y equilibrio para todos, y para quien tiene fractura vertebral, ejercicios con la columna
  en posición neutra. DOI 10.1007/s00198-013-2523-2 (solo el resumen: el texto de PMC5112023 vino
  incompleto).

**En el motor:**
- **Sale** todo ejercicio cuyo movimiento sea flexionar el tronco. Es un atributo nuevo del
  catálogo, `loads_spinal_flexion`. Hoy lo tienen:
  - abdominales en máquina;
  - abdominales en camilla;
  - crunch en polea;
  - elevación de piernas colgado;
  - slam ball.
- **Entra el bloque de impacto** aunque el sexo y la edad no lo pidan. El consenso lo recomienda a
  todos con osteoporosis, no solo a las mujeres después de la menopausia.
- **La dosis no cambia:** la fuerza progresiva es lo que se pide.
- **La fractura vertebral** no se pregunta en la lista. Es un "sí" del seguimiento del PAR-Q+
  ("fractura por osteoporosis"), que manda a consultar (`43`). Quien llega al plan con osteoporosis
  marcada no la tiene declarada.

### Lo que salió al medir: el catálogo no tenía core sin flexión

- Al sacar los abdominales que flexionan, el core que quedaba era:
  - la plancha, que es por tiempo y el slot la dosificaría en repeticiones;
  - la rueda abdominal, que es avanzada;
  - el lanzamiento rotacional con wall ball, que es explosivo.
- El selector solo **prefiere** no explosivos, así que el barrido mostró el lanzamiento entrando
  suelto, con la dosis del slot. Con una molestia, además, entraba contra `avoidExplosive`.
- Dos arreglos:
  - **Se sumaron dos core de columna neutra**, hechos con equipo que el gimnasio ya tiene: **Pallof
    press en polea** (antirrotación, en el Cross Over) y **Dead bug** (en colchoneta). Entran también
    en los planes de los demás. En la matriz, 20 de 43 perfiles cambian algún ejercicio: la
    mayoría son core que flexionaba y ahora no, y el resto son efectos de la semilla. Ningún aviso
    cambió.
  - **Con una molestia, lo explosivo sale también de los slots comunes**, no solo del par. La regla
    `avoidExplosive` ya existía y se aplicaba a las sustituciones y al par, pero no a la selección
    normal.

## Suelo pélvico (pérdidas de orina)

### El entrenamiento del suelo pélvico lo cura; el impacto lo dispara — CONFIANZA ALTA / MEDIA

- **Cochrane 2018** (Dumoulin et al.), 31 ensayos con 1.817 mujeres: con incontinencia de esfuerzo,
  el entrenamiento de los músculos del suelo pélvico la **cura en el 56 %**, contra el 6 % sin
  tratamiento (evidencia de calidad alta). Cura o mejora en el 74 % contra el 11 %. "Podemos
  estar seguros de que cura o mejora los síntomas." DOI 10.1002/14651858.CD005654.pub4
- **Nygaard y Shaw 2016**, revisión (texto completo, PMC4744534):
  - las pérdidas durante el ejercicio son más frecuentes con **impacto alto**;
  - la actividad moderada (caminar rápido) **baja** el riesgo;
  - "la mayoría de la actividad física no daña el suelo pélvico".
  - DOI 10.1016/j.ajog.2015.08.067
- **Bø y Nygaard 2020**, revisión (texto completo, PMC7018791): las atletas tienen unas tres veces
  más pérdidas que las no atletas, sobre todo en deportes de salto. En saltar, la fuerza contra el
  piso es de 5 a 12 veces el peso del cuerpo. Que el impacto dañe a largo plazo **no está probado**:
  los datos son transversales. DOI 10.1007/s40279-019-01243-1
- **Consenso de osteoporosis 2022:** "la incontinencia puede ser una barrera para el impacto;
  tratarla puede ser el paso necesario antes".

**En el motor:**
- **Sale el bloque de impacto** y **salen los saltos y lanzamientos**, del par y de los slots. Se
  sacan por los síntomas, no por daño: el aviso lo dice y pide desmarcarlo cuando se resuelva.
- **Con osteoporosis también, gana el suelo pélvico** (primero se tratan las pérdidas). Hay un aviso
  de la combinación que lo explica.
- La fuerza no se toca: con levantamientos cortos se puede contraer el suelo pélvico a voluntad,
  no así en impactos repetidos (Bø y Nygaard 2020).
- **Aviso:** las pérdidas se tratan con kinesiología de piso pélvico.

## Hernia abdominal o inguinal

### Se entrena normal; lo que importa es reconocer la urgencia — CONFIANZA MEDIA

- **Fitzgibbons et al. 2006**, ensayo con 720 hombres con hernia inguinal con pocos síntomas: la
  espera vigilada es segura. Encarcelación aguda en **1,8 cada 1.000 pacientes-año**.
  DOI 10.1001/jama.295.3.285
- **HerniaSurge 2018**, guía internacional (texto completo, PMC5809582):
  - después de la operación, "retomar la actividad normal **sin restricciones** apenas se sienta
    cómodo";
  - "ningún estudio mostró que volver temprano a la actividad aumente la recurrencia";
  - las restricciones que dan los cirujanos son "muy variables y rara vez basadas en evidencia".
  - DOI 10.1007/s10029-017-1668-x
- No se encontró evidencia de que la fuerza en el gimnasio empeore una hernia sin síntomas. Tampoco
  hay evidencia específica sobre la hernia umbilical o la de la línea media.

**En el motor:** el plan no cambia. Un aviso con la señal de urgencia (dolor fuerte, bulto duro o
que no vuelve a entrar), que es lo único accionable.

## Lo que se decidió

| Condición | Qué cambia | De dónde |
|---|---|---|
| Osteoporosis | sin ejercicios que flexionen el tronco | Consenso británico 2022 |
| Osteoporosis | bloque de impacto para cualquier sexo y edad | Consenso británico 2022 |
| Osteoporosis | aviso: levantar cosas del piso con la cadera, no con la columna | Consenso británico 2022 |
| Suelo pélvico | sin bloque de impacto ni saltos | Nygaard 2016; Bø 2020; consenso 2022 |
| Suelo pélvico | aviso: kinesiología de piso pélvico, desmarcar cuando se resuelva | Cochrane 2018 |
| Osteoporosis + suelo pélvico | sin impacto, con aviso de la combinación | Consenso 2022 |
| Hernia | aviso de urgencia; el plan no cambia | Fitzgibbons 2006; HerniaSurge 2018 |
| Con una molestia | lo explosivo sale también de los slots comunes | `avoidExplosive` ya existente |

**Quedan para una tanda aparte:** la artrosis y el problema de columna, del mismo grupo "huesos y
articulaciones". La columna se cruza con las molestias por zona, que ya existen, y las dos son T3.

## Cómo se prueba

- El barrido suma a la dimensión salud: osteoporosis, suelo pélvico, las dos, hernia.
- Invariantes nuevas:
  - con osteoporosis, ningún ejercicio que flexione;
  - el impacto aparece por edad y sexo o por osteoporosis, nunca con molestia ni con suelo pélvico;
  - ningún explosivo con suelo pélvico.
- Matriz: un hombre de 45 con osteoporosis, y una mujer de 55 con pérdidas de orina.
- Falsificado: la flexión, el sumar impacto, el sacarlo y los explosivos con molestia dan rojo al
  romperlos.
