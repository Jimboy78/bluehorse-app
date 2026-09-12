# Auditoría del motor: un parámetro por vez

Revisión sistemática de **todo lo que el motor mira para armar un plan**. Para cada entrada:
¿existe?, ¿está respaldada por evidencia primaria con DOI?, ¿el número que usa el ruleset es el que
dice esa evidencia?, ¿cambia algo en el plan de verdad?

Regla de la auditoría: **un parámetro por iteración, hasta el fondo**. Vale más cerrar uno con su
metaanálisis y sus tests que dejar diez a medias. Lo que no tiene respaldo se dice, no se maquilla.

## Inventario: qué mira el motor hoy

Medido contando usos reales en `packages/engine/src/`, no leyendo la documentación.

| Entrada | ¿La usa? | Estado |
|---|---|---|
| `experienceLevel` | sí | ✅ **auditado** — `10-nivel-de-experiencia.md` |
| `goal` | sí | ✅ **auditado** — `12-objetivo.md` |
| `birthDate` (edad) | sí | ✅ **auditado** — `08-edad.md` |
| `sport` | sí | auditado en `06`; queda como dato, sin promesas |
| `seasonPhase` | sí | auditado en `06` |
| día de partido | sí | auditado en `07`; falta el marcador de énfasis excéntrico |
| `constraints` (dolor / lesión) | sí | ✅ **auditado** — `09-dolor-y-lesiones.md` |
| `sessionsPerWeekTarget` | sí | ✅ **auditado** — `11-frecuencia-semanal.md` |
| `baselines` | **se lee, nunca se escribe** | ✅ **auditado** — `15-baselines.md` |
| `daysSinceLastSession` | sí | ✅ **auditado** — `14-historial-y-desentrenamiento.md` |
| `sex` | **no (0 usos)** | pendiente — decidir si se saca del formulario |
| `weightKg` | **no (0 usos)** | pendiente |
| `heightCm` | **no (0 usos)** | pendiente |
| `sessionMinutesTarget` | **no (0 usos)** | pendiente — se le pide al socio y no hace nada |
| `preSleep` / `preEnergy` | **no (0 usos)** | pendiente — se registran y no alimentan nada |
| `sessionFeel` | **no (0 usos)** | pendiente |
| `priority` | sí, pero **nunca discrimina** | el onboarding deja elegir un solo objetivo — ver `12` |
| `cardio.interference` | sí | ✅ **auditado** — `13-cardio-e-interferencia.md` |
| `redFlags` (señales de alarma) | **no se muestran** | pendiente — en la lista de deuda de `ruleset-consumo.test.ts` |
| `specialPopulations` (embarazo, hipertensión…) | **están en el ruleset, sin ninguna consecuencia** | pendiente — iteración propia |
| lesión **aguda** vs dolor crónico | **no se distinguen** | pendiente — brecha abierta en `09` |
| fragilidad | **no existe el campo** | abierto — ver `08-edad.md` |
| tiempo bajo tensión | **no se prescribe** | abierto — predictor fuerte en `08-edad.md` |

## Iteraciones

### 1 · Edad — cerrada el 2026-09-09

`docs/research/08-edad.md`. Tres de los cuatro números del modificador no se sostenían.

- El ruleset aplicaba a **todo** socio de 60+ la recomendación pensada para el subgrupo **frágil**:
  −20 % de intensidad, +2 repeticiones, +30 % de descanso. Origen: consenso ACSM 2009, sin DOI.
- Dos metaanálisis independientes dicen lo contrario. Borde 2015 (25 ECAs, 819 participantes,
  60-90 años, DOI 10.1007/s40279-015-0385-9) mide el óptimo en **70-79 % 1RM** y **7-9
  repeticiones**, con la intensidad como predictor más fuerte (p < 0,01). Un segundo metaanálisis
  (18 ECAs, 1283 participantes) encuentra la alta intensidad superior en prensa (SMD 0,95) y
  extensión (SMD 0,63), **sin más caídas ni más eventos adversos**.
- Impacto medido antes de corregir: **34 de 36** combinaciones caían fuera de la ventana. Un
  principiante de 65 con objetivo hipertrofia quedaba prescrito al **28-44 % 1RM** en aislamiento.
- Bug encontrado de paso: `Math.max(repsMax, repsMin + delta)` **colapsaba el rango a un punto**
  (potencia quedaba en 3-3 repeticiones; fuerza/novato en 6-6).
- Se reemplazaron los multiplicadores por ventanas y se acotó a los objetivos medidos. 4 tests
  nuevos, 291 en verde.
- **Abierto:** después de los 60 el nivel de experiencia ya no diferencia intensidad ni
  repeticiones. Declarado en `08-edad.md`.

### 2 · Dolor y lesiones — cerrada el 2026-09-09

`docs/research/09-dolor-y-lesiones.md`. Dos problemas distintos, uno de evidencia y uno de plomería.

**Plomería, y es lo más serio de toda la auditoría hasta acá:** `referIf` (cuándo ir al médico),
`redFlags` (6 señales de alarma) y `specialPopulations` (embarazo, hipertensión no controlada,
diabetes con complicaciones) estaban escritos, versionados y validados por zod, y **no los
consumía nadie**. Un ruleset que aparenta cobertura que la app no entrega es peor que uno
incompleto. `referIf` ya se emite; los otros dos siguen pendientes.

**Evidencia:** la regla lumbar sacaba, con dolor 3 de 5, todo el patrón `hinge` y todo trabajo de
`lower_back` — que es exactamente lo que tres metaanálisis usan como tratamiento.

- Ejercicio **con** dolor contra ejercicio sin dolor, 7 ECAs / 385 participantes: SMD −0,28
  (IC −0,49 a −0,08) a corto plazo **a favor del que permite dolor**; sin diferencia a largo plazo.
  Calidad baja. DOI 10.1136/bjsports-2016-097383
- Extensión lumbar cargada, 8 ECAs / 381 participantes: dolor g = −0,633 (IC −1,06 a −0,20),
  p = 0,004. Certeza muy baja. DOI 10.1038/s41598-025-90699-5
- Carga externa contra ejercicio sin carga, 13 ECAs / 778 participantes: MD −0,52 en 0-10
  (IC −0,92 a −0,08) más allá de 7 semanas. Los autores concluyen que cargar es **seguro y
  factible**, y que lo que decide el resultado es **la exposición y la adherencia**, no la carga.

- Se partió el umbral único en dos: `monitorFrom` (se avisa, no se saca nada) y `avoidFrom` (se
  saca). El lumbar moderado pasó de bloquear a monitorear.
- Se ancló la escala 1-5 al NPRS 0-10 (`safety.severityScale`), que es la que usan las fuentes.
  Antes el socio elegía un número sin anclas y ese número sacaba ejercicios.
- Se agregó `safety.painMonitoring`: hasta 5/10 durante, vuelta a la basal al día siguiente, sin
  escalar semana a semana (Silbernagel, DOI 10.1177/0363546506298279).
- 5 tests nuevos, 296 en verde. Los tests viejos usaban severidad 1 y 4, **salteando justo el 3**
  que era el caso en disputa; por eso el cambio de umbral no rompió nada.

### 3 · Nivel de experiencia — cerrada el 2026-09-09

`docs/research/10-nivel-de-experiencia.md`. Acá no hacía falta buscar papers para encontrar lo
principal: alcanzó con medir el ruleset contra sí mismo.

- **En 3 de 6 objetivos el nivel no cambia absolutamente nada.** En `power`, `endurance` y `cardio`
  el `byLevel` está vacío: los cuatro niveles reciben la misma prescripción palabra por palabra.
  En `recomposition` solo se separa el principiante. Solo `strength` e `hypertrophy` diferencian los
  cuatro.
- **El nivel `novice` no existe en ninguna investigación del proyecto** — cero ocurrencias en los
  doce documentos de `docs/research/`. Se agregó al enum y se le inventaron valores. Se conserva
  porque sacarlo obliga a migrar datos de socios, pero queda marcado.
- **La mejor evidencia dosis-respuesta solo distingue dos estados.** Pelland 2025 (67 estudios,
  2058 participantes, DOI 10.1007/s40279-025-02344-w) usa el estado de entrenamiento como covariable
  **binaria**: entrenado / no entrenado. Cuatro escalones son plausibles, no medidos.
- **No hay forma objetiva de determinar el nivel.** El modelo de referencia (DOI
  10.1519/SSC.0000000000000627) pide **cinco** parámetros — tiempo ininterrumpido, desentrenamiento,
  experiencia previa, técnica y nivel de fuerza — y el onboarding captura tres de forma difusa, con
  autoevaluación. Los dos más objetivos (técnica y fuerza) son los que quedan librados al criterio
  del socio.
- **Lo que sí quedó confirmado:** `weeklyVolume.optimalSetsPerMuscle: [6, 12]` cae justo sobre las
  medianas observadas (6 series/semana para fuerza, 10,5 para hipertrofia). Es de lo poco que esta
  auditoría encontró bien puesto.
- Se agregó `modifiers.experienceLevel.noDoseEffectNote`: cuando el nivel no cambia la dosis, el
  plan lo dice (regla dura 4). 4 tests nuevos, 300 en verde.

### 4 · Frecuencia semanal — cerrada el 2026-09-09

`docs/research/11-frecuencia-semanal.md`.

- **El 42 % de lo que el socio puede elegir cae a un fallback.** El slider ofrece 1 a 7 sesiones y
  las plantillas cubren 18 de 42 combinaciones objetivo × frecuencia mal: ninguna cubre 1 ni 7 para
  ningún objetivo, y `power` no tiene nada por encima de 3.
- **Bug con consecuencia real:** `Math.max(target, template[0])` subía la frecuencia declarada hasta
  el mínimo de la plantilla **para medir el volumen semanal**. Quien decía que solo puede venir una
  vez tenía su volumen medido sobre dos sesiones, así que el aviso de "estás por debajo del mínimo"
  **nunca se disparaba justo para quien lo necesitaba**. Ahora se mide sobre lo que el socio dijo.
- **La frecuencia pesa diez veces más en fuerza que en hipertrofia.** Pelland 2025
  (DOI 10.1007/s40279-025-02344-w): pendiente marginal β = **3,27 %** (IC creíble 2,74 a 3,84,
  probabilidad 100 %) para fuerza, contra β = 0,32 % (IC **−0,14 a 0,82**, probabilidad 91,3 %) para
  hipertrofia — este último cruza el cero y los autores lo llaman compatible con efectos
  insignificantes.
- **Matiz que hay que tener presente:** esos modelos están ajustados por volumen. En la app, bajar
  la frecuencia **sí** baja el volumen (medido: 16 series/semana con f=1 contra 48 con f=3), así que
  quien viene menos pierde por los dos lados.
- Los autores mismos declaran que su hallazgo sobre frecuencia y fuerza **contradice metaanálisis
  previos**, y un ECA volumen-igualado (DOI 10.2478/hukin-2019-0062) no encontró diferencias. Queda
  documentado así, no como consenso.
- Se agregó `modifiers.frequency`: el plan dice qué se pierde, y lo dice distinto según el objetivo.
  5 tests nuevos, 305 en verde.

### 5 · Objetivo — cerrada el 2026-09-09

`docs/research/12-objetivo.md`.

- **Seis objetivos, cinco prescripciones**: `recomposition` es idéntico byte por byte a
  `hypertrophy` en su bloque `default`. Y está bien: la diferencia real es dietética y la app
  declara que no maneja nutrición. El propio ruleset ya lo decía en su nota.
- **El hallazgo: esa nota nunca se mostraba.** `EvidenceNotice` filtraba por
  `confidence !== 'low'`, así que las notas de `cardio` y `recomposition` —ambas `medium`—
  quedaban escritas y silenciadas. La de recomposición dice que los números son los de hipertrofia
  y que la diferencia la hace la dieta: información que cambia lo que el socio espera del plan.
  La regla dura 4 pide que lo flojo avise; no pide que lo demás se calle cuando tiene algo escrito.
- **La hipertrofia es independiente de la carga; la fuerza no.** Metaanálisis en red de 28 estudios
  y 747 adultos (DOI 10.1249/MSS.0000000000002585): en hipertrofia **ninguna** comparación entre
  cargas alta, moderada y baja resultó significativa (la mayor, SMD 0,12; IC −0,06 a 0,29). En
  fuerza sí: alta contra baja SMD **0,60** (IC 0,38 a 0,82; p < 0,001).
- **Tensión declarada, no resuelta:** `strength` prescribe el primario a 85-100 % 1RM, y esa ventaja
  sobre la carga moderada **no alcanza significación** (SMD 0,26; IC −0,02 a 0,54; p = 0,068). Para
  una app que prescribe sin supervisión, y cuyo propio bloque de seguridad desaconseja cargas
  máximas sin guía, hay un choque entre dos bloques del mismo ruleset. **No se cambió ningún
  número**: no significativo no es equivalente, y reemplazarlo sería inventar.
- `priority` nunca discrimina: el onboarding permite un solo objetivo.
- `EvidenceNotice` se movió a su propio archivo para poder testearlo — importar `App.tsx` arrastra
  el service worker. 8 tests nuevos, 313 en verde.

### 6 · Cardio, interferencia y el barrido de bloques muertos — cerrada el 2026-09-09

`docs/research/13-cardio-e-interferencia.md`.

**El barrido, que era lo que el patrón repetido ameritaba.** Se recorrieron las 114 claves de
contenido del ruleset activo buscando cada una en `packages/engine/src` y `apps/web/src`:
**doce bloques declarados y muertos**. Uno de ellos, `severityScale`, **lo agregué yo en la
iteración 2**, en el mismo documento donde denuncié este patrón. El problema no es descuido: es que
escribir en el ruleset es más barato que conectarlo y nada avisaba.

Ahora sí avisa: `packages/engine/src/ruleset-consumo.test.ts` escanea el código, lee el **JSON
crudo** (zod descarta en silencio lo que no está en el esquema, y eso es aún más invisible) y falla
si aparece una clave nueva sin consumir. La deuda existente queda listada ahí, explícita.

**La interferencia.** El bloque declaraba `avoidIntervalsSameDayAsLowerBody: true` y
`minHoursBetweenSessions: 6`, sin fuente y sin uso. El metaanálisis (15 estudios,
DOI 10.1007/s40279-022-01688-x) dice:

- Efecto global sobre fibra: SMD **−0,23** (IC −0,46 a −0,00; p = 0,050) — roza el cero. Tipo I
  −0,34 (p = 0,078) y tipo II −0,13 (p = 0,315), ninguno significativo. **A nivel de músculo entero
  no aparece.**
- **Correr, fibras tipo I: SMD −0,81** (IC −1,26 a −0,36). Pedalear: sin efecto. Tercera vez que el
  mecanismo excéntrico explica un hallazgo en esta investigación.
- **Ni el orden dentro de la sesión, ni la frecuencia, ni misma sesión contra días separados
  mostraron diferencia.** Las dos reglas del ruleset prescribían exactamente lo que no se encontró.

Se reemplazaron por una nota que el motor sí emite: el efecto es chico, da igual el día, y si ese
día entrenás pierna fuerte conviene la bici antes que la cinta. Es lo único accionable que dejó la
evidencia.

**De paso:** la plantilla de cardio ya separa el cardio del trabajo de pierna por diseño, o sea que
`avoidIntervalsSameDayAsLowerBody` era redundante además de infundado. Y el primer criterio que
escribí para el aviso —mirar si caían en la misma sesión— estaba mal: condicionarlo a que
coincidan es aplicar justo la regla que se cayó. 6 tests nuevos, 319 en verde.

### 7 · Historial y desentrenamiento — cerrada el 2026-09-09

`docs/research/14-historial-y-desentrenamiento.md`.

A diferencia de casi todo lo auditado, **este bloque sí tenía fuente**: `03` cita a Mujika y Padilla
con PMIDs. El problema es el salto: la fuente describe **la cinética de lo que se pierde**, y de ahí
alguien derivó **multiplicadores de carga**. La cinética no da multiplicadores.

- **El mensaje al socio tenía el mecanismo dado vuelta.** Decía "la fuerza vuelve rápido; el tendón
  tarda más". Kubo 2010 (J Strength Cond Res 24(2):322-331) mide, durante 3 meses de
  desentrenamiento: **fuerza y activación neural sin cambios**, área muscular a nivel pre al mes,
  **rigidez del tendón a nivel pre a los 2 meses**. La fuerza no vuelve: **nunca se fue**. El riesgo
  real es que la persona vuelve pudiendo levantar lo mismo con un tendón que ya no lo tolera — un
  argumento *mejor* que el que estaba escrito. Limitación grande: **n = 8**, isométrico monoarticular.
- **El texto vivía en el código**, no en el ruleset. Si los números no viven en el código, el texto
  que los explica tampoco: es contenido y cambia con la investigación. Se movió a
  `modifiers.detraining.note`.
- **El escalón de 90 días llega tarde.** El tendón ya está en nivel pre a los **60**. Y el
  metaanálisis de cese en mayores (DOI 10.3390/ijerph192114048) muestra que a **12-24 semanas no hay
  pérdida significativa de tamaño muscular** (d = −0,60; IC −1,21 a 0,01), o sea que si el argumento
  del recorte fuera la atrofia, a los 90 días no se sostendría. Como es el tendón, sí — pero el
  umbral relevante es 60.
- **No se tocó ningún multiplicador ni ningún umbral.** Mover 90 a 60 haría el sistema más
  conservador apoyándose en un n = 8, y agregar un escalón obligaría a inventar un multiplicador.
  Declarado como decisión de producto, igual que el 85-100 % 1RM de la iteración 5.
- Ningún test cubría el mensaje de retorno: cambiarlo entero no rompió nada. 5 tests nuevos, 324 en
  verde.
- **Hueco anotado:** `detraining` solo ajusta la carga de sala. `03` dice que el VO2max cae 4-14 % en
  **menos de 10 días** — mucho más rápido que la fuerza — y el motor no ajusta nada del bloque
  `cardio` por ausencia.

### 8 · Baselines — cerrada el 2026-09-09

`docs/research/15-baselines.md`. Con esta cierran **todas las entradas grandes del motor**.

- **`user_baselines` se lee y nunca se escribe.** No hay un solo `insert` en toda la app. La cadena
  completa: `user.baselines` siempre `[]` → `baselineLoad` siempre `null` → **`targetLoad` de cada
  item del plan es siempre `null`**. Ningún plan prescribe carga.
- **Pero el sistema funciona igual**, y hay que ser justo: la progresión no sale de los baselines
  sino de `set_logs`. `reviewProgress` propone contra lo que la persona realmente hizo. El diseño de
  "arrancá con lo que puedas y la app ajusta" está implementado y anda.
- **Lo que estaba mal es lo que se decía alrededor.** El aviso de desentrenamiento prometía
  "arrancamos con un 15 % menos de carga" sobre un plan sin carga. **Esto lo dejé pasar en la
  iteración 7**, cuando toqué justo ese texto. Ahora tiene dos formas: con carga dice cuánto se
  bajó; sin carga le dice al socio que arranque más liviano, sin anunciar un porcentaje invisible.
- **El paso `baselineMode` del onboarding no cambia nada** — el propio código lo declara "solo
  informativo en el MVP". Es la quinta pregunta que no afecta el plan.
- **La gente elige el 53 % de su 1RM** cuando se la deja elegir (18 estudios, 359 participantes;
  IC creíble 49-58 %; DOI 10.1007/s40279-022-01717-9), y **la experiencia no modera**: los entrenados
  también se quedan cortos. Cruzado con Lopez 2021 de la iteración 5: alcanza para hipertrofia,
  **queda corto para fuerza**, que necesita ≥70 %.
- **Las fórmulas de 1RM (Epley/Brzycki) que `04` propone no están implementadas en ningún lado.**
  Otro bloque de investigación escrito y nunca construido.
- 8 tests, 327 en verde.

## Segunda vuelta — 2026-09-09

Seis huecos abiertos por la primera vuelta, todos cerrados el mismo día. Dos con código; los otros
cuatro quedan **declarados como limitación**, que es lo que corresponde cuando la evidencia no
alcanza para prescribir: una fila de investigación que dice "no hay consenso" cierra el hueco tan
bien como una que dice un número.

| # | Documento | Qué pasó |
|---|---|---|
| 16 | `16-tiempo-bajo-tension.md` | **Limitación declarada.** El TUT no se prescribe. La ACSM 2026 no lo lista entre las variables de prescripción. |
| 17 | `17-lesion-aguda.md` | **Código.** Una lesión y un dolor de arrastre producían planes byte a byte idénticos. Ahora una lesión no accede al tramo permisivo: su piso para sacar el ejercicio es el umbral en el que un dolor crónico apenas se monitorea. |
| 18 | `18-enfasis-excentrico.md` | **Limitación declarada.** La columna no se puede construir: la fuente que sostenía el criterio de ranking resultó ser un paper de mecánica arterial. |
| 19 | `19-desentrenamiento-aerobico.md` | **Código.** Las duraciones de cardio eran idénticas en todas las ventanas de ausencia. El aviso de cardio ahora arranca en el escalón más chico que el objetivo ya define, no en uno nuevo. |
| 20 | `20-arranque-sin-test.md` | **Limitación declarada.** El hueco de carga inicial para fuerza no se cierra sin inventar. |
| 21 | `21-fragilidad.md` | **Limitación declarada.** FRAIL es medible con una PWA, pero lo que se haría con el resultado no tiene respaldo. |

**Lo que más rindió no fue buscar papers, otra vez.** La lesión que no cambiaba nada, el cardio
idéntico en toda ventana de ausencia y —fuera del motor— el gráfico de volumen semanal que
renderizaba cero barras desde que existe: los tres salieron de medir el sistema contra sí mismo.

**Tres citas fabricadas, confirmadas contra Crossref.** Un DOI atribuido a un metaanálisis de
carga-velocidad resuelve a un corrigendum sobre atletas transgénero; otro atribuido a énfasis
excéntrico resuelve a un paper de mecánica arterial windkessel; un tercero (PEACE & LOVE) directamente
404. Cada una está documentada en la nota al pie del documento correspondiente, y
`apps/web/src/content/sources.test.ts` congela la regla de que ninguna cita sin resolver llega a la
app. **La primera tanda de investigación (`01` a `07`) nunca pasó por este control** — vale una
pasada con el mismo criterio.

### El motor, auditado de punta a punta

Las trece entradas grandes están cerradas. Lo que queda es de otra clase:

1. **Decisiones de producto declaradas**, que esta auditoría no toma sola: el 85-100 % 1RM de
   `strength` (iteración 5), el escalón de 90 días que llega tarde (7), conectar o sacar
   `user_baselines` y el paso de calibración (8).
2. **Once bloques del ruleset en deuda**, congelados en `ruleset-consumo.test.ts`.
3. **Cinco preguntas al socio que no cambian el plan**: `sex`, `weightKg`, `heightCm`,
   `sessionMinutesTarget`, `baselineMode` — más `preSleep`, `preEnergy` y `sessionFeel`, que se
   registran y no alimentan nada.
4. **Huecos concretos**: el cardio no se ajusta por ausencia (VO2max cae 4-14 % en menos de 10 días);
   no hay marcador de énfasis excéntrico en el catálogo; no se distingue lesión aguda de dolor
   crónico; no se prescribe tiempo bajo tensión, que es predictor fuerte (p < 0,01).

Nada de eso es investigación pendiente: es trabajo de producto o de catálogo, con la evidencia ya
puesta al lado de cada uno.

## Tercera vuelta — 2026-09-10

No salió de un hueco declarado sino de una pregunta suelta: **¿el motor hace lo que la
investigación dice, para la diversidad entera de socios?** Cinco documentos, cinco correcciones de
código, y un cambio de método que vale más que cualquiera de ellas.

| # | Documento | Qué pasó |
|---|---|---|
| 26 | `26-acsm-2026.md` | **Fuente nueva, la más fuerte del proyecto.** El position stand 2026 de ACSM (DOI 10.1249/mss.0000000000003897, overview de **137 revisiones sistemáticas**) se declara el reemplazo del 2009 sobre el que se apoya medio ruleset. Cuatro cosas coinciden; el volumen de hipertrofia `[10, 20]` cae exactamente entre su piso (≥10) y su plateau (~18-20). **Código:** `strength.advanced` pisaba el RIR objetivo a 2 y heredaba el gatillo 4 del default — un avanzado que cumplía el plan al pie de la letra **nunca recibía una suba de carga**. |
| 27 | `27-zonas-sin-regla.md` | **Código.** `BODY_REGIONS` ofrece diez zonas y `painRules` cubre cinco. Una lesión de severidad 5 en cadera, tobillo, codo, espalda alta u "otra" producía el plan completo y **cero avisos**, indistinguible de "lo miramos y no hay nada". No se inventaron reglas: se agregó `safety.noRuleForRegion`, que dice que no hay. Y la rodilla, única zona con dos tramos, emitía el consejo de los dos: el socio leía "hacé sentadillas parciales" y cuatro renglones abajo que no quedaba ninguna sentadilla en el plan. |
| 28 | `28-lo-que-el-socio-lee.md` | **Código.** El aviso de patrón sin cubrir interpolaba `slot.pattern` crudo: el socio leía `el patrón "vertical_pull"`. Cuatro de los 33 planes del reporte lo mostraban. Es el mismo bug que ya se había arreglado para objetivos, músculos y zonas. Además listaba las tres causas posibles cuando el motor sabe cuál es — decirle a alguien con la rodilla lesionada que "falta equipamiento en el catálogo" lo manda a reclamarle al gimnasio por algo que el gimnasio tiene. |
| 29 | `29-la-intensidad-que-nadie-lee.md` | **Deuda declarada.** `intensityPct1RM` aparece dos veces en el motor: el esquema y **una escritura**. Cero lecturas. Son **36 bandas** curadas desde `01` y `02` que no llegan a ninguna pantalla. Pasó `ruleset-consumo.test.ts` toda su vida porque el chequeo era `includes(k)` y nombrar una clave no es leerla. |
| 30 | `30-el-orden-del-historial.md` | **Código, dos veces.** `reviewProgress` daba por cierta la precondición "más recientes primero" del contrato: con el historial al revés le proponía a alguien que entrenó **hoy** cortar el volumen a la mitad "porque pasaron 100 días". Y en la app, `dedupeByExercise` se llamaba "quedarse con la más reciente" y hacía "quedarse con la primera" — de ahí sale la carga que el plan propone. |

### Las tres lecciones de método

**1. Preguntar quién lee un número antes de discutirlo.** Dos veces en la misma vuelta se comparó
contra la evidencia un campo que nadie consume: `optimalSetsPerMuscle` primero, `intensityPct1RM`
después. Verificar la fuente es la mitad del trabajo; la otra mitad es verificar que el número llega.

**2. Una falsificación que no rompe nada puede ser un test flojo o una rotura falsa.** Pasó tres
veces y hay que distinguir cuál es antes de concluir: invertir el `sort` del historial dejó todo en
verde porque el test pedía *consistencia* entre órdenes y un motor que ordena al revés también la
cumple —la consistencia no es la corrección—; reemplazar el porcentaje del ruleset por `"50%"`
literal dejó todo en verde porque `volumeMultiplier` **vale** 0,5; e inyectar
`inventadoYMuerto: rule.inventadoYMuerto` no falló porque esa línea **lee** la clave.

**3. Un comentario no es una garantía.** Las dos precondiciones de orden que se rompieron estaban
documentadas, y el test de `dedupeByExercise` incluso empezaba diciendo "llega ordenada como la pide
la consulta": documentaba la precondición en vez de sacarla.

### Lo que quedó abierto

- **Cuatro decisiones de prescripción nuevas** (techo de potencia, cuatro series en fuerza,
  intensidad de `beginner`/`novice`, banda de volumen 6-24). Dos de ellas son sobre
  `intensityPct1RM`, o sea que hoy moverlas no cambia un solo plan.
- **Reglas de dolor para cadera y tobillo**, las dos zonas sin cubrir que más aparecen en un
  gimnasio. O sale de investigación o queda el aviso. **Actualizado 2026-09-12:** la investigación
  salió — `31-cadera-y-tobillo.md`. Hay evidencia de calidad media (GTPS: DOI
  10.1016/j.physio.2024.01.001; CAI: DOI 10.3389/fbioe.2025.1691203) de que el ejercicio ayuda en
  las dos zonas, pero ninguna mide un umbral de severidad ni qué patrón sacar, así que no alcanza
  para escribir una regla como las cinco que ya existen. Sigue siendo decisión del dueño: al menos
  cambiar el texto de `noRuleForRegion` para esas dos zonas en vez de escribir exclusiones.
- **Si un plan generado para alguien que vuelve después de un año debe salir con volumen reducido.**
  Hoy sale completo: el descargo por ausencia es una propuesta de `reviewProgress` y nunca toca
  `generatePlan`.
- **El plan de 8 sesiones vacías con el catálogo sin cargar.** Medido, no construido, no probado en
  el navegador.

## Cuarta vuelta — 2026-09-12

Salió de correr `npm run qa docs`, que sigue marcando `05-seguridad-reforzada.md` (21 filas, cero
citas) desde la primera vuelta. Ese documento no es solo evidencia floja: su prosa **es** el
`referIf` que `09` activó, así que llega directo a la pantalla del socio.

| # | Documento | Qué pasó |
|---|---|---|
| 31 | `31-cadera-y-tobillo.md` | **Investigación, sin código.** Cadera y tobillo, las dos zonas sin regla que `27` dejó como decisión del dueño. Hay evidencia de calidad media de que el ejercicio ayuda en las dos (GTPS: DOI 10.1016/j.physio.2024.01.001; inestabilidad crónica de tobillo: DOI 10.3389/fbioe.2025.1691203), pero ninguna mide un umbral de severidad ni qué patrón sacar. No alcanza para una regla como las cinco que existen; sí alcanza para no seguir tratando esas zonas como si no hubiera nada que decir. |
| 32 | `32-red-flags-lumbares.md` | **El más serio de la vuelta.** El `referIf` lumbar —ya emitido en la app— no menciona anestesia en silla de montar ni incontinencia urinaria/fecal, que son las dos señales de mayor especificidad para cauda equina (DOI 10.1016/j.msksp.2019.05.004, especificidad hasta 0,88 contra RMN). En cambio incluye "dos semanas sin mejorar" y "empeora tras 48 horas de reposo", que no aparecen como red flags de patología grave en el consenso de 16 guías internacionales (DOI 10.1007/s00586-016-4684-0). Cauda equina es una emergencia quirúrgica con ventana de horas; el aviso actual no le pregunta al socio por lo que de verdad la distingue. Nada tocado en el ruleset — es decisión de quien firma ese texto. |

Ninguna de las dos vueltas tocó `packages/engine` ni el ruleset: son investigación documentada,
verificada contra Crossref y Europe PMC, con la decisión de aplicarla dejada para el dueño del
producto.

| # | Documento | Qué pasó |
|---|---|---|
| 33 | `33-red-flags-cervicales.md` | **Menor, mismo método que 32.** El `referIf` de cuello está bien orientado (mareo, náusea coinciden con el marco IFOMPT vigente, DOI 10.2519/jospt.2022.11147) salvo un detalle: "hormigueo en los brazos" no es la señal vascular del marco (esa es entumecimiento facial), es una señal de radiculopatía cervical, cuadro distinto y no urgente. A diferencia de `32`, el error no omite nada peligroso — como mucho sobre-alarma. |
| 34 | `34-red-flags-hombro-y-muneca.md` | **Cierra el repaso de los cinco `referIf`.** Hombro: "debilidad marcada" es correcto en esencia pero impreciso frente al criterio medido (no poder levantar el brazo por arriba de la horizontal — sensibilidad 84 %, DOI 10.1186/s12891-025-08754-1). Muñeca: falta el dedo mayor en el territorio del nervio mediano (DOI 10.7759/cureus.87563, evidencia más débil que las otras cuatro zonas). Ninguno de los dos con la urgencia de `32`. Con esto, las cinco zonas con regla tienen su `referIf` comparado contra evidencia real. |
| — | `25-cobertura-del-catalogo.md` (actualizado) | **Bug de motor, no de evidencia.** `chooseExercise` protege el piso `selection.minPoolSize` en 3 de sus 8 pasos (`preferSoft`); los otros 3 usan `prefer` sin piso. Medido contra el catálogo real: el principal de `vertical_pull` colapsa de 3 candidatos a 2 (dominadas queda estructuralmente afuera) y el de `horizontal_pull` de 4 a 2 (remo invertido en TRX y face pull en polea, afuera). Mismo mecanismo que ya encontró `22` para potencia, acá alcanza también a fuerza e hipertrofia. Nada tocado en el motor. |
| — | `30-el-orden-del-historial.md` (actualizado) | **La tercera función que dice "más reciente" y hace "la primera".** `ultimaVezDe` (`apps/web/src/lib/last-session.ts:54`) confía en el orden de la fila 0 igual que las dos ya corregidas. Reproducido: con una fila de enero antes que una de hoy, muestra "la última vez" de enero. El test existente no lo detecta por la misma razón que las otras dos: documenta la precondición en vez de sacarla. Nada tocado. |
