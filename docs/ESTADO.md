# Estado del trabajo

Este archivo reemplaza al resumen automático de sesión: vive en disco, sobrevive a `/clear` y se
puede leer desde cualquier sesión nueva. **Actualizalo al terminar una sesión larga.**

---

## Última actualización: 5 de septiembre de 2026 (loop autónomo, corre cada 15 min)

### Lo más importante de esta sesión: la app se probó por primera vez de verdad

Hasta acá todo se verificaba con `curl` contra Supabase o con tests. Entrar con un usuario real
(`socio.prueba@bluehorse.test`) y hacer clic pantalla por pantalla encontró **cinco bugs que
ninguna de esas dos vías podía ver**, tres de ellos graves:

1. **Vite nunca leyó el `.env`.** `envDir` apunta por defecto al directorio de `vite.config.ts`
   (`apps/web`), pero el `.env` va en la raíz del monorepo, que es lo que dice el README. Las
   variables quedaban `undefined` en silencio: cualquiera que siguiera las instrucciones del
   proyecto veía "Supabase no está configurado" para siempre. Arreglado con `envDir: monorepoRoot`.
2. **Entrar dejaba al socio en el formulario de login.** La sesión se creaba (200), pero nada lo
   sacaba de `/auth`: `RequireAuth` protege las otras rutas, no expulsa de esa. Se leía como "el
   botón Entrar no hace nada". Nuevo guard `RedirectIfSignedIn`.
3. **Ninguna serie se guardaba.** `set_logs.load_unit` era `not null` mientras `load_value` sí
   aceptaba nulos, y una serie sin carga (dominadas, o la primera sesión de alguien que pidió que
   la app le calcule los pesos) no tiene unidad que anotar. Todos los inserts fallaban. Como
   `set_logs` es la señal que alimenta la adaptación entera, la app parecía andar sin guardar lo
   único que importa. La columna ahora es nullable con un check que impide valor sin unidad.
4. **El error estaba oculto.** `lastError` de la cola offline guardaba `String(error)`, y Supabase
   tira un objeto plano, no un `Error`: todo quedaba como `"[object Object]"`. Por eso el bug 3
   sobrevivió tanto. Ahora hay `describeOutboxError` con test.
5. **Volver a la lista borraba la sesión.** `seriesHechas` era un array plano que se reseteaba en
   cada "Volver", y la lista no mostraba ni las series hechas ni la sustitución aplicada. En el
   gimnasio se vuelve a esa lista todo el tiempo para ver qué máquina está libre. Ahora el progreso
   se guarda por ítem, sobrevive la navegación, y la lista muestra `n/total`, el nombre sustituido y
   mueve "sugerido" al primer ejercicio que falta.

También: después de sustituir, el detalle seguía mostrando el `rationale` del motor, que nombra al
ejercicio original.

### Segunda pasada de prueba manual (misma fecha)

Recorrido completo otra vez, ahora incluyendo lo que había quedado sin tocar. **Anda**: `/instalar`,
`/panel` (rebota bien a un `member`, y con `role: admin` carga y guarda), validación de
`load_min > load_max` en el formulario, alta de estación a discos y de pin (el formulario cambia
los campos según cómo carga la estación), salir de la sesión, error de contraseña equivocada en
castellano, deshacer una serie marcada, cola offline en 0 pendientes, y `/progreso` sin errores de
consola.

Se agregó confirmación al guardar en el panel: antes el formulario se vaciaba y lo único que
cambiaba era un contador lejos del botón, así que cargando el gimnasio fila por fila no se veía si
había entrado.

**Uno de los dos huecos ya está cerrado** — el panel dejó de ser solo de alta:
- **Editar y borrar estaciones** (`useUpdateEquipment`, `useDeleteEquipment`, `useEquipmentUsage`
  en `lib/panel.ts`; `EquipmentRow` y `EquipmentFormActions` en `Panel.tsx`). "Editar" precarga el
  formulario, lo marca en teal y hace scroll hasta él — tocar editar en la fila 40 no mostraba
  ningún cambio si no. "Borrar" es de dos toques y dice qué se lleva: los mapeos a ejercicios
  cascadean, así que avisa cuántos son; los `set_logs` de quien ya la usó no se pierden
  (`equipment_id` queda en null). La foto vieja se borra del bucket recién después de que la fila
  se actualizó, no antes.
- Probado a mano: precarga correcta de una estación a discos, guardado de un cambio, confirmación
  con el conteo de mapeos, y borrado real de una estación descartable.

**El segundo hueco también quedó cerrado: deshacer una serie ahora la borra de verdad.**
`dequeue()` en `outbox.ts` y `undoSetDone()` en `session-log.ts`. Si la escritura todavía no salió
de la cola, se saca de ahí y listo; si ya salió, se encola un `set_log_delete` que viaja por la
misma cola y aguanta la falta de señal como el resto. Verificado contra la base: marcar una serie
llevó `set_logs` de 7 a 8, deshacerla lo devolvió a 7.

Sin test unitario, igual que `markSetDone` y `sendOutboxItem`: la convención del repo es testear
mappers puros, no la capa de I/O.

**Y el progreso de la sesión ahora sobrevive un refresh** (`lib/session-restore.ts`). El teléfono
se bloquea, se queda sin batería o el navegador descarta la pestaña: al volver, las series marcadas
seguían apareciendo sin marcar, volver a marcarlas duplicaba el `set_log`, y —peor— se creaba un
`workout_log` nuevo para la misma sesión, partiendo el entrenamiento en dos registros.

`useRestoredSession` lee el `workout_log` abierto de la sesión y sus `set_logs`, y con eso
reconstruye la pantalla y reengancha los refs de `useSessionLog`. La fuente de verdad es la base,
no el estado local. Verificado: dos series marcadas, recarga completa, la lista mostró `2/3`, y
marcar la tercera dejó `set_logs` en 10 (sin duplicar las dos anteriores) y los `workout_logs`
abiertos en 4 (sin crear uno nuevo).

**Tres arreglos visuales que salieron de mirar la app a 390px:**
- La chapita "sugerido" estaba al costado del nombre y le comía 91px: en un teléfono
  "Peso muerto rumano" partía en dos líneas y esa tarjeta quedaba 110px de alto contra 70px de las
  otras. Ahora la chapita va en la línea de abajo, junto a series/reps, y el nombre se queda con
  todo el ancho (243px en las cuatro filas).
- El encabezado de `App.tsx` tenía los botones al costado del título. Como el contenedor es
  `max-w-md` siempre, eso partía "Blue Horse Gym · Arroyo / Seco" en dos líneas incluso en
  escritorio. Título y acciones ahora van en filas separadas, con "Salir" al extremo opuesto de
  "Progreso" para no tocarlo sin querer.
- En `/progreso`, "sesiones (90 días)" partía en dos líneas y dejaba las tres columnas de
  adherencia desparejas. La ventana es la misma para las tres, así que se dice una sola vez abajo.

**El layout en ancho de teléfono ya está verificado.** La ventana del navegador está maximizada y
`resize_window` no la achica, pero un iframe de 390px sí crea un viewport real (las media queries y
el overflow se evalúan contra él). Ninguna pantalla desborda a lo ancho: `/`, `/progreso`,
`/panel` e `/instalar` dieron `scrollWidth === clientWidth` y cero elementos pasados del borde.
Truco a reusar: inyectar un iframe a `localhost:5173` con `width:390px` y medir adentro.

### El hallazgo más importante: la adaptación no podía adaptarse

`set_logs` guardaba `reps: item.repsTarget` — el objetivo del plan copiado como si fuera el
resultado — y nunca escribía `rir` ni la carga usada. Con eso, el motor comparaba el plan contra sí
mismo, y **tres de las cuatro reglas de adaptación eran inalcanzables**:

| Regla | Necesita | Estaba |
|---|---|---|
| `proposeIncrease` | `rir >= triggerRirAtLeast` | `rir` siempre null |
| `proposeDecrease` | `reps < repsTarget` | iguales por construcción |
| `proposeStallDeload` | compara cargas entre sesiones | `load_value` siempre null |
| `proposeAbsenceDeload` | días sin entrenar | única que podía disparar |

O sea: la app se presenta como entrenamiento adaptativo y la señal que alimenta la adaptación
estaba fabricada desde el plan. Es la regla dura 6 al revés.

**Arreglado**: durante el descanso ahora se pregunta carga, repeticiones y cuántas quedaban. Va ahí
a propósito — son dos minutos parado al lado de la máquina, tiempo muerto, así que no cuesta un
toque de más; y arranca con lo que decía el plan, así que si salió como estaba escrito no hay nada
que tocar. La carga es editable (llegar a 60 kg de a 2,5 son 24 toques) y se ajusta al escalón real
de la estación recién al salir del campo: tipear 62 en una barra que sube de a 2,5 guarda 62,5.

`stepLoad()` es nuevo en `packages/domain/src/load.ts`, con tests: un escalón real para arriba o
para abajo, un nivel en las de pin, y `null` cuando la estación no dice de cuánto es su escalón
(mover "un poco" sin saber cuánto sería inventar).

Verificado contra la base: una serie quedó en `load_value 62.50 / plates_kg /
load_kg_normalized 82.50` (62,5 + 20 de la barra) y otra en `reps 7 / reps_target 12 / rir 0`.
Antes las dos cosas eran imposibles de representar. `/progreso` ya muestra "62,5 kg" en vez de
"sin registrar".

### La adaptación funciona de punta a punta (verificado en pantalla)

Jugando dos sesiones reales de Sentadilla con RIR 4 apareció la primera propuesta del motor:
*"En Sentadilla te sobraron repeticiones las últimas 2 veces. ¿Subimos la carga?" 17.5 → 20*, con
su marca de `RULESET PROVISORIO`. Aceptar aplica la carga a las sesiones pendientes del plan.

Llegar ahí destapó cuatro bugs más:

1. **La adaptación fallaba en silencio.** `mappers/adaptation.ts` exigía `load_unit` no nulo
   (arreglé el de `progress.ts` y me olvidé de este). Una sola serie sin unidad hacía explotar el
   zod, la query quedaba en error, y `Proposals` devolvía `null` — indistinguible de "no hay
   propuestas". **Toda la adaptación desaparecía sin un solo mensaje.** Ahora el error se muestra.
2. **`SetLog.load` era no-nulo en el dominio** mientras la base ya aceptaba nulos. Pasó a
   `LoadReading | null`, con las guardas correspondientes en el motor: sin carga anotada no se
   propone subir, porque no hay desde dónde.
3. **Aceptar una propuesta generaba otra idéntica** en el siguiente render: el motor solo saltea
   las rechazadas. Ahora tampoco repite una aceptada cuyo destino ya es el mismo — recién cuando la
   persona entrene con la carga nueva hay evidencia nueva que mirar.
4. **`applyLoadChange` guardaba `target_load` sin `target_load_unit`**: un 20 que no se sabía si
   eran kilos, libras o un nivel de pin. La misma incoherencia que el check de `set_logs` prohíbe.

### Aceptar y rechazar, los dos probados

`adaptation_proposals` sumó una columna `load_unit` (migración aditiva). Sin ella, `to_value`
guardaba "20" y no había forma de saber si eran kilos, libras o un nivel de pin — el mismo agujero
que `target_load` sin unidad. Ahora la propuesta se muestra **17,5 kg → 20 kg**, con coma decimal
y unidad, como el resto de la app; un deload sigue diciendo "60%" porque no tiene unidad que
mostrar.

- **Aceptar** aplica la carga a las sesiones pendientes (`target_load 20.00` +
  `target_load_unit plates_kg`) y no vuelve a proponer lo mismo.
- **Rechazar** deja la propuesta en `rejected`, **no toca ningún `target_load`**, y no vuelve a
  aparecer para ese ejercicio (`wasRecentlyRejected`).

### Alta de ejercicios, molestias y cierre vacío

Probado el formulario de ejercicios del panel (nunca se había tocado): nombre, patrón, modalidad,
nivel, músculos primarios y secundarios, y el mapeo a estaciones, todo persiste bien. **La
validación ya impide crear un ejercicio sin estación** ("Elegí en qué estación se hace, o marcá
'peso corporal'"), que es justo lo que dejaría al motor sin poder proponerlo.

Tres arreglos que salieron de ahí:

1. **Cerrar una sesión sin marcar series tiraba lo que escribías.** El formulario *exigía* elegir
   una sensación y ofrecía notas, pero ambas viven en `workout_logs` — y sin series no hay
   `workout_log`, así que se descartaban en silencio. Ahora esa pantalla dice "No marcaste ninguna
   serie, así que no hay entrenamiento que guardar", esconde sensación y notas, y deja reportar la
   molestia, que sí se guarda sola (`pain_reports.workout_log_id` es nullable).
2. **El slider de molestia no mostraba su valor**, a diferencia de los del onboarding: no se sabía
   si estabas reportando un 2 o un 4, que es exactamente el dato.
3. "1 estación(es) asociada(s)" pasó a singular/plural de verdad, y un ejercicio sin mapear se
   muestra en ámbar: es trabajo a medio hacer, no un estado normal.

**Ojo con las pruebas por script**: varios "bugs" que creí encontrar eran mis clics compitiendo con
las animaciones de transición. Verificar siempre contra la base antes de dar por roto algo.

### Terminar el plan ya no es un callejón sin salida

Completar las 8 sesiones dejaba una pantalla que felicitaba y decía "todavía no hay una forma de
pedir más sesiones". Ahora hay un botón que genera el plan siguiente con el mismo motor.

Lo que importa es lo que se arrastra: **la carga objetivo de cada ejercicio del plan que terminó**.
Sin eso, alguien que entrenó ocho sesiones y aceptó tres propuestas de subir carga volvería a
arrancar de cero, y todo lo que ganó la adaptación se perdería justo cuando empieza a servir. No es
una regla de entrenamiento nueva —el motor sigue decidiendo qué ejercicios y cuántas series—, es
seguir donde quedó.

El plan anterior queda `archived`: la base tiene un índice único de un plan activo por persona, así
que el intercambio es obligatorio. Se archiva recién con el blueprint ya en la mano, y se
desarchiva si la inserción falla — quedarse sin plan activo es peor que no haber pedido nada.

Verificado: sembré 42,5 kg en Sentadilla, pedí las próximas sesiones, y el plan nuevo quedó con
42,5 kg en las cuatro apariciones del ejercicio, con el viejo archivado.

**Lo que NO se hizo, a propósito**: calibrar los `user_baselines` desde el historial real. La tabla
lo contempla (`baseline_source` incluye `calibrated`), pero *qué* serie cuenta como baseline es una
decisión de contenido —¿la más pesada?, ¿la más reciente?— y por la regla dura 2 sale de la
investigación, no de acá.

### Alta nueva y onboarding, probados de punta a punta

Se creó una segunda cuenta desde la UI (`ana.prueba@bluehorse.test`, principiante) para probar el
alta y el onboarding completos. Confirmado:

- El alta ahora **entra directo al onboarding** (antes parecía que el botón no hacía nada: era el
  bug del guard que se arregló al principio de la sesión).
- **"Atrás" del onboarding conserva lo elegido**: volver al paso 1 mantenía el objetivo marcado y
  el deporte tipeado.
- El motor **ramifica bien por nivel**: la cuenta principiante recibió `full_body_ab`, la
  intermedia `upper_lower`. No es la misma plantilla para todos.

**Accesibilidad**: los botones de selección del onboarding (objetivo, sexo, nivel, y los dos de
baseline) eran los únicos de la app sin `aria-pressed` — el color era la única señal de qué estaba
elegido. El resto de la app ya lo usaba (RIR, chips de músculos, sensación al cerrar). Quedó
parejo.

Las dos cuentas quedan en la base local a propósito: tener una principiante y una intermedia sirve
para probar que el motor ramifique.

### La cola offline, probada cortando la señal de verdad

Era la promesa central del diseño ("en el gimnasio la señal se corta") y nunca se había probado sin
red. Simulando el corte (fetch a Supabase que falla + `navigator.onLine` en false):

1. Se marcan series con normalidad, la pantalla responde igual.
2. Quedan **3 ítems en cola con `attempts: 0`** — `flush()` ni lo intenta sin señal, no gasta
   reintentos.
3. En el servidor, **nada**.
4. Vuelve la señal → evento `online` → `startAutoFlush` drena sola → llegan el `workout_log` y las
   dos series con sus datos correctos (`rir: 3`, el `rirTarget` de principiante del ruleset).

Funciona tal como está escrito que debería.

**Dos cosas más que salieron de ahí:**
- El contador "Cola offline" del panel de desarrollo era una foto del arranque (la query no
  refrescaba): marcaba 0 justo mientras se apilaban las series, que es el único momento en que ese
  panel sirve. Ahora refresca cada 2s. Verificado: 0 → 1 → 0.
- **Una URL mal tipeada mostraba la pantalla de "Algo se rompió"**, con el texto de "si marcaste
  series ya están guardadas" — alarmante y falso para una dirección equivocada, y el único botón
  era "Recargar", que vuelve a lo mismo. Ahora hay una ruta `*` que dice que la página no existe y
  ofrece volver al entrenamiento.

### El récord personal: confeti sin récord, y tres bugs encadenados

Nunca se había visto disparar la celebración. Al forzarla aparecieron **tres bugs, uno atrás del
otro**, y ninguno se notaba desde afuera porque un `catch` de "esto es un nice-to-have" se tragaba
todo:

1. **El récord se medía contra el plan, no contra lo que levantó.** `loadKg` salía de
   `item.targetLoad`. Alguien que levantaba 140 kg sobre un plan de 42,5 no hacía récord nunca.
   Es un resto de cuando la carga real todavía no se registraba (mismo problema plan-vs-realidad
   que ya se arregló en `set_logs`).
2. **La comparación competía contra su propia serie.** La consulta de "mejor marca previa" corría
   sin excluir la serie recién hecha; si la cola la subía primero, la serie se comparaba consigo
   misma y no había récord. Contra un servidor local pasaba siempre; contra uno lento, a veces —
   peor todavía, porque el confeti dependía de la latencia. Se excluye por id.
3. **El récord nunca se guardaba.** `personal_records.set_log_id` es una FK a `set_logs`, pero se
   insertaba directo mientras la serie viajaba por la cola: la fila apuntada todavía no existía, la
   FK fallaba y el `catch` lo tapaba. Ahora el récord va por la misma cola, detrás de la serie.

Verificado: 95 kg en Peso muerto rumano → confeti + fila en `personal_records` con `max_load` 115
(95 + 20 de la barra) y su `set_log_id` intacto.

### Foco de teclado

La app tenía dos lenguajes de foco: los botones se quedaban con el anillo blanco del navegador y
los campos lo apagaban (`outline-none`) cambiando solo el borde. Ahora hay un `:focus-visible`
único en teal, con offset. `prefers-reduced-motion` y los objetivos táctiles de 44px ya estaban
bien resueltos de antes.

**Moraleja para las próximas sesiones: `curl` contra la base y los tests verdes no dicen que la app
funcione.** Verificado a mano el recorrido completo: alta → onboarding → plan generado → marcar
series → cronómetro de descanso → sustitución → cerrar sesión → avance de la cola a la sesión
siguiente → `/progreso` con datos reales.

### Instrucciones vigentes del usuario

1. **No bloquear por falta de catálogo real.** Placeholders marcados como tales, que se dejan de
   usar solos cuando el dato real los reemplace.
2. **Toda prescripción de entrenamiento sale de `docs/research/`**, nunca inventada.
3. **Verificar en `localhost:5173`**, no en el deploy de Vercel.
4. **Probar la app entrando de verdad**, con usuario y clics, no solo con `curl` y tests.
5. **La paleta de colores no se saca del ícono de Blue Horse.** Sigue sin definirse.

### Dónde quedó

**Fase 1 completa** (salvo el relevamiento real). **Fase 2 completa**: motor persistido,
pantalla "Hoy" real, escritura a `set_logs` vía cola offline, y ahora también **cierre de sesión**
(`SessionClose.tsx`) — sensación, una molestia como mucho, notas. Cerrar marca `plan_sessions`
como completada, que es lo único que hace avanzar la cola a la sesión siguiente (sin esto,
`useActivePlan` iba a devolver la misma sesión para siempre).

**Fase 3 completa.** Su checklist:
- [x] Propuestas de ajuste con motivo, aceptar o rechazar (`lib/adaptation.ts`,
  `components/Proposals.tsx`, mostradas arriba de "Hoy"): `engine.reviewProgress()` corre sobre el
  historial real de `set_logs` y se persiste como `adaptation_proposals` `pending` — no se vuelve a
  generar si ya hay propuestas sin resolver para el plan activo. Aceptar `load_increase`/
  `load_decrease` actualiza `target_load` en las sesiones pendientes del plan para ese ejercicio.
  `deload` (por ausencia o estancamiento) solo se resuelve — repartir el volumen reducido entre
  sesiones pendientes queda pendiente, no se inventó una forma de aplicarlo. Domain sumó
  `proposalTypeSchema`/`proposalStatusSchema` (faltaban para validar el borde).
- [x] Sustitución por máquina ocupada: `SubstitutePicker.tsx` calcula reemplazos con
  `engine.findSubstitutes()` contra el catálogo real (con el mismo fallback a placeholder que el
  resto de la app), botón "Máquina ocupada" en `Hoy.tsx`. El cambio se registra como
  `session_event` tipo `substituted` (nuevo mapper `session-event.ts`, nueva rama en el sender de
  la cola offline en `session-log.ts`) sin pisar `plan_session_items` — la prescripción original
  (series/reps/descanso) se mantiene, solo cambia identidad de ejercicio/estación
- [x] Progreso (`/progreso`, `Progreso.tsx` + `lib/progress.ts` + `mappers/progress.ts`): lee
  `set_logs`/`workout_logs` reales (nunca `plan_session_items`). Adherencia (sesiones, racha de
  días consecutivos, última sesión), volumen semanal (reps × `load_kg_normalized`, agrupado por
  semana ISO — series sin conversión posible quedan afuera de la suma, no cuentan como 0), récords
  por ejercicio (comparados por `load_kg_normalized` cuando existe, pero siempre mostrando la carga
  cruda que vio la máquina; sin forma de comparar, se marca "sin comparar entre estaciones" en vez
  de inventar un ranking), evolución por ejercicio (últimas series). Acceso desde un botón nuevo en
  el header de "Hoy". La aritmética de agregación es pura, con tests.
- [x] Pantalla de instalación (`/instalar`, `Instalar.tsx` + `lib/use-install-prompt.ts`): pública
  (sin `RequireAuth`), destino del QR del gimnasio. Detecta la plataforma para no prometer lo que
  el navegador no puede dar — Android/Chrome usa `beforeinstallprompt` real, iOS/Safari muestra el
  paso a paso manual (no tiene instalación programática), y si ya está instalada
  (`display-mode: standalone`) solo muestra un mensaje corto. Todas las ramas ofrecen "Entrar" sin
  instalar. La detección de plataforma es pura, con tests.

**Fase 3 cerrada.** Sigue Fase 4 (contenido real). **Corrección importante: el research NO está
pendiente de producirse — ya existe** en `docs/research/` (4 documentos, segunda tanda, con DOIs
verificables) y `docs/research/README.md` ya lo evalúa documento por documento. Lo que bloquea
Fase 4 es la curación, no la investigación en sí, y esa curación es explícitamente del usuario
(o de alguien con criterio clínico para la Parte D de seguridad) — no algo que yo deba decidir
solo: verificar a mano una muestra de los DOIs citados (sobre todo en `03` y `04`), decidir qué
hacer con las filas en confianza BAJA, y solo `02` (cardio) necesita además extender
`ruleset.ts` con un esquema nuevo (session_type/intensity_zone/etc., propuesto en el research)
antes de poder cargarse — eso sí es un cambio de código, pero lo dejo para cuando se sepa qué
forma final le van a dar al resto de la curación, no antes. Ver `docs/research/README.md` para el
detalle completo y la skill `activar-ruleset` para el procedimiento. Sigue bloqueada también por
el relevamiento del catálogo (Fase 0, del usuario). Lo que queda mientras tanto es técnico:
verificación end-to-end contra Supabase real, y pulir lo ya construido.

**Code-splitting por ruta ya hecho** (`router.tsx`, todas las pantallas via `React.lazy()`): el
chunk principal bajó de ~966kB a ~318kB, sin warning de tamaño. Ya no es una traba pendiente.

**Pasada de accesibilidad ya hecha**: `role="alert"` en todo mensaje de error/validación que
aparece sin recargar, `aria-pressed` en los grupos de selección única (sensación/molestia en
`SessionClose`, chips de `Panel`, selector de ejercicio en `Progreso`), `aria-label` en el botón
"volver" de `/progreso` (antes solo un ícono sin nombre accesible), `aria-live="polite"` en la
lista de `Proposals` y un `aria-label` prolijo en `SetRow` en vez de dejar que el lector de
pantalla concatene spans sueltos. Sin cambios de comportamiento.

**Verificado con foco real por teclado (Tab) en `/auth`**: los inputs muestran el cambio de color
de borde (`focus:border-teal`, es a propósito, ver `outline-none` en esos className) y los
botones sin ese override reciben el anillo nativo del navegador (`outlineStyle: "auto"`,
confirmado por consola) — nada lo suprime. Los botones deshabilitados (Google/submit cuando
Supabase no está configurado) correctamente salen del orden de tabulación, no es un bug. También
se midió el contraste de la paleta (`--color-slate` sobre `--color-navy-soft` da 5.81:1, el más
ajustado de todos) — todos los pares texto/fondo usados pasan WCAG AA. Conclusión: no había nada
que arreglar acá; la sospecha de la pasada anterior no era un problema real.

**Récord personal real, ya no una demo**: `personal_records` existía en el esquema desde la fase 1
sin ningún escritor, y la celebración (`celebratePersonalRecord`) solo se disparaba desde un botón
de prueba en `Hoy.tsx` que su propio comentario contradecía ("se usa SOLO cuando el motor detecta
un récord real"). Ahora `markSetDone()` (`lib/session-log.ts`) compara el `load_kg_normalized` de
la serie contra el máximo histórico real de ese ejercicio ANTES de encolarla (para no compararla
contra sí misma), sin bloquear el toque de "hecha" — best-effort, sin conexión simplemente no hay
celebración esa vez. La primera serie de un ejercicio nunca es "récord" (es el punto de partida).
Si es un récord real, dispara la celebración y guarda la fila en `personal_records`. Se sacó el
botón de prueba.

**Cinco bugs de robustez reales, encontrados por revisión de código (no por el usuario) y ya
arreglados** — todos el mismo patrón: una mutación encadena dos o más escrituras a Supabase sin
pensar qué pasa si la primera se confirma y la segunda falla:
- `useGeneratePlan` (`lib/plan.ts`): `plans` tiene un índice único por socio con
  `status = 'active'`. Si sesiones/ítems fallaban a mitad de camino, el `plan` ya insertado quedaba
  huérfano y activo — cualquier reintento futuro chocaba con ese índice único, dejando al socio sin
  poder generar un plan NUNCA MÁS, sin ninguna pantalla para borrar el huérfano. Ahora, si falla
  persistir sesiones/ítems, se borra el plan recién insertado (`on delete cascade`) antes de
  relanzar el error.
- `useCloseSession` (`lib/session-log.ts`): marcaba `plan_sessions` completada ANTES de cerrar el
  `workout_log` y guardar el reporte de dolor. Si cualquiera de esos dos pasos fallaba después, la
  cola ya había avanzado con la sensación/notas de esa sesión perdidas para siempre. Reordenado:
  `workout_log` → `pain_report` → `plan_sessions` (recién esto último avanza la cola).
- `useCompleteOnboarding` (`lib/onboarding.ts`) — **el más severo de los cuatro**: marcaba
  `profiles.onboarded_at` ANTES de insertar el `user_goal`. Si esa segunda escritura fallaba, el
  socio quedaba marcado "ya completó el onboarding" (`RequireOnboarding` solo mira ese campo) pero
  sin ningún objetivo — pasaba el gate, llegaba a "Hoy", tocaba "Generar mi plan" y se encontraba
  con un error de "falta el onboarding" que ya no podía resolver desde ninguna pantalla. Reordenado:
  `user_goals` primero, `profiles.onboarded_at` al final.
- `useCreateEquipment`/`useCreateExercise` (`lib/panel.ts`), menos severo (el panel es de uso
  interno, no del socio): si subir la foto salía bien pero insertar `equipment` fallaba, la foto
  quedaba huérfana en Storage para siempre; si insertar `exercises` salía bien pero mapear su
  equipamiento fallaba, el ejercicio quedaba en el listado sin equipamiento asociado y, como el
  panel todavía no tiene edición, sin forma de arreglarlo. Ambos casos ahora limpian (borran) lo que
  ya se había escrito antes de relanzar el error.
- `useResolveProposal` (`lib/adaptation.ts`): marcaba la propuesta `accepted` ANTES de aplicar el
  cambio de carga a `plan_session_items`. Si aplicar la carga fallaba después, la propuesta quedaba
  resuelta para siempre (deja de aparecer en `usePendingProposals`) sin que el cambio se hubiera
  aplicado nunca — el socio cree que aceptó subir el peso, pero la próxima sesión sigue mostrando
  el valor viejo, sin error visible y sin forma de reintentar. Reordenado: aplicar la carga
  primero, marcar la propuesta resuelta al final.

**Auditoría de `apps/web/src/lib/` completa** (todo hook que encadena más de una escritura a
Supabase, buscando este mismo patrón): `plan.ts`, `session-log.ts`, `onboarding.ts`, `panel.ts` y
`adaptation.ts` ya revisados y arreglados donde hacía falta. `auth/AuthProvider.tsx` es una sola
llamada a Supabase Auth por acción (sin problema). `catalog.ts`/`progress.ts`/`use-today-session.ts`
son de solo lectura. No queda ningún hook de esta clase sin revisar.

Ninguno de los cinco se puede reproducir fácil sin forzar una falla de red a mitad de una
escritura — no están cubiertos por test (son hooks que pegan contra Supabase, mismo criterio que
el resto del proyecto), pero la lógica de rollback/orden en sí es simple de leer y revisar.

**Panel de debug sacado de producción**: "Estado del esqueleto" (en `App.tsx`) mostraba mensajes de
zod sin traducir (`VITE_SUPABASE_URL: Invalid input...`) directo en la pantalla principal — quedó
de cuando se armaba el esqueleto en fase 1/2, nunca se lo sacó. Ahora vive detrás de
`import.meta.env.DEV`: Vite lo elimina por completo de la build de producción (confirmado con
`grep` sobre el bundle), y las dos queries que solo lo alimentaban (estado de conexión, cola
offline) tampoco corren fuera de desarrollo. El manejo de errores que sí ve un socio real
(Supabase mal configurado, sin sesión) sigue en `SignIn.tsx`/`Hoy.tsx`, sin tocar.

**Red de contención para errores de render**: la app no tenía ningún error boundary — un error de
render en cualquier pantalla dejaba al socio con una pantalla en blanco, sin ninguna pista de qué
pasó. Se agregó `CrashScreen.tsx` (el mensaje en castellano, con la tranquilidad real de que las
series ya marcadas no se pierden — van por la cola offline antes de cualquier render),
`RouteError.tsx` como `errorElement` de cada ruta en `router.tsx`, y `ErrorBoundary.tsx` envolviendo
`<RouterProvider>` en `main.tsx` para lo que queda afuera de las rutas (`AuthProvider`,
`QueryClientProvider`). **Detalle importante verificado con un throw forzado en el navegador**: sin
`errorElement` por ruta, `createBrowserRouter` muestra su propia pantalla de error genérica en
inglés ("Unexpected Application Error") por ENCIMA de cualquier `ErrorBoundary` de React puesto
afuera del router — un límite de error normal ahí no alcanza. Los dos hacen falta.

**Spinners de pantalla completa, anunciados a lectores de pantalla**: los tres `RequireX`, el
fallback de `React.lazy()` en el router, y los "cargando" de `Hoy`/`Progreso` eran el único
contenido visible mientras cargaban, sin `role` ni texto — un lector de pantalla no tenía forma de
saber que algo estaba pasando. Ahora son `role="status"` con un `sr-only` descriptivo. Los
spinners al lado de texto visible en un botón (no son el único contenido) no se tocaron.

**Bug real en el deploy de Vercel, encontrado por revisión de `vercel.json` (no probado en vivo,
todavía sin pushear)**: la app usa `createBrowserRouter` (rutas reales: `/auth`, `/progreso`,
`/instalar`, `/onboarding`, `/panel`), pero `vercel.json` no tenía ningún rewrite de SPA. Sin eso,
Vercel solo sabe servir `index.html` en `/` — cualquier navegación directa a otra ruta (refrescar,
un link compartido, y sobre todo **escanear el QR que apunta directo a `/instalar`**) devuelve el
404 de Vercel en vez de la app. Se agregó el rewrite estándar (`/(.*) → /index.html`; Vercel sirve
los archivos reales del build antes de aplicar el rewrite, así que JS/CSS/manifest/`sw.js` siguen
sirviéndose directo). **No se puede verificar en local** — `vite preview` trae su propio fallback
de SPA incorporado, así que este bug solo se manifiesta en el deploy real. Falta confirmarlo
después del próximo push a Vercel.

**Cola offline: un ítem roto ya no atasca todo lo demás** (`lib/outbox.ts`): `flush()` cortaba
entero al primer error de envío. Un ítem roto para siempre (un bug real, no solo falta de señal)
dejaba TODA la cola de ese teléfono sin sincronizar nunca más — sin ningún error visible, solo
`pendingCount` creciendo. Ahora sigue intentando el resto aunque uno falle; el orden entre una
serie y su `workout_log` sigue respetado porque esa serie en particular vuelve a fallar (FK
inexistente) hasta que su sesión llegue, pero ya no bloquea sesiones no relacionadas.

**Documentación: referencia rota y README desactualizado**: `cargar-catalogo/SKILL.md` apuntaba a
`docs/06-relevamiento-catalogo.md` (no existe; es `docs/05-...`). `README.md` describía el deploy
de Vercel como "dashboard de estado y vista previa de animaciones" y "Fase 1 de 4" — quedó así
desde el esqueleto inicial y ahora es directamente falso (saqué el dashboard de producción hace
dos pasadas). Reescrito para reflejar el estado real.

**Tests nuevos en `packages/engine`**: `rng.ts` (el generador determinista que desempata qué
ejercicio entra en el plan — la regla dura "misma semilla, mismo plan" no tenía ningún test) y
`resolveParams()` en `ruleset.ts` (el merge por nivel de experiencia, el mecanismo completo de la
regla dura "ningún número vive en el código" — tampoco tenía cobertura, ni directa ni indirecta).
120 tests en total.

**Bug real en iOS, encontrado por revisión de `index.html`**: `apple-touch-icon` apuntaba a
`icon.svg`. Safari/iOS no rasteriza SVG para el ícono de la pantalla de inicio — lo ignora en
silencio y usa una captura de la página en su lugar. Esto rompía la mitad del trabajo de
`/instalar`: la rama de iOS pide "Agregar a inicio", pero el ícono que iba a quedar en la pantalla
del socio no era el de Blue Horse. Se generó `apple-touch-icon.png` (180×180, rasterizado desde
`icon.svg` con un `<canvas>` en el navegador — no hay ninguna librería de rasterizado SVG→PNG en
el proyecto), referenciado con `sizes="180x180"`, y sumado a `includeAssets`/`globPatterns` de
Workbox para que el service worker lo precachee. Verificado visualmente en el navegador (dos
intentos: el primero rasterizó mal — el `<img>` sin `naturalWidth`/`Height` explícitos usó un
tamaño por defecto del navegador que recortaba el ícono — corregido pasando esas dimensiones al
`drawImage`).

**RLS verificado en vivo, no solo leído** (el Postgres local ya estaba corriendo): con la `anon
key` (sin sesión), `select` a `equipment`, `pain_reports`, `profiles`, `gyms`,
`adaptation_proposals`, `personal_records`, `set_logs` y `workout_logs` devuelve `[]` en las ocho
— ninguna política nombra al rol `anon`, todas dicen `to authenticated`, así que RLS deniega por
default. Un `insert` a `pain_reports` como anon devuelve 401 con el código de Postgres de RLS
(`42501`), no un error genérico. Primera vez en la sesión que esto se confirma contra una base
real en vez de solo leyendo el SQL.

**Dos huecos reales cerrados contra Postgres local, con usuarios de prueba creados y borrados
después (vía Auth Admin API con la service key local, nada de esto tocó `.env` ni el cliente)**:
- El trigger `on_auth_user_created` → `handle_new_user()` funciona: se creó un usuario real, y
  `profiles` apareció solo con `gym_id` = Blue Horse (fallback por `join_code` ausente),
  `display_name` desde los metadatos, `onboarded_at` en `null` — exactamente el estado que
  `RequireOnboarding` necesita para mandar al onboarding. Es la primera vez que el flujo de
  registro se prueba contra una base real en toda la sesión (antes solo se leía el SQL).
- Se confirmó en carne propia el bug que arregló `useGeneratePlan` esta sesión: insertar un
  segundo `plans` con `status='active'` para el mismo usuario devuelve `409` /
  `duplicate key value violates unique constraint "plans_one_active_per_user_idx"` — el error
  exacto que un socio vería para siempre si un plan a medias no se limpiara. El fix (borrar el
  plan huérfano antes de relanzar el error) es la única salida de ese estado.

**Aislamiento entre socios, confirmado con dos usuarios reales y JWTs de sesión de verdad (no
service role)**: creé dos cuentas, inicié sesión como una de las dos (password grant real) y
probé contra `workout_logs` — insertar una fila con el `user_id` de la OTRA cuenta devuelve `403`
(`new row violates row-level security policy`); insertar con el propio `user_id` anda (`201`); y
un `select` sin filtro devuelve únicamente la fila propia, la de la otra cuenta ni aparece. Es la
propiedad de seguridad más importante para una app multi-socio real, y ahora está confirmada de
punta a punta (login real → escritura → lectura), no solo leída en el SQL. Las dos cuentas y sus
filas se borraron después.

**El gate de staff del panel admin, confirmado con el MISMO JWT antes y después de un cambio de
rol**: una cuenta nueva (`member` por default) intentó insertar en `equipment` y recibió `403`;
promovida a `staff` (`update profiles set role='staff'` vía service role, sin volver a iniciar
sesión — el JWT no cambia), el mismo `insert` con el mismo token anduvo (`201`). Confirma que
`is_gym_admin()` lee el rol actual en cada request en vez de algo cacheado en el JWT — así que un
cambio de rol surte efecto sin que la persona tenga que volver a loguearse, y que el gate del
panel (que bloqueé más temprano con los fixes de `useCreateEquipment`/`useCreateExercise`) está
parado sobre una RLS que de verdad filtra por rol.

**LA prueba de punta a punta que faltaba toda la sesión, resuelta con un script Node aparte (no
la app — igual no toca `.env`)**: Node 24 puede importar `.ts` directo (probado con
`packages/engine/src/index.ts`), así que se pudo correr el MOTOR REAL — no una simulación —
contra el catálogo real de Blue Horse (13 equipos, 16 ejercicios, leídos de Postgres) y persistir
el resultado con el mismo orden de tres pasos que usa `useGeneratePlan`:
1. `engine.generatePlan()` con un usuario real (`hypertrophy`, intermedio) armó 8 sesiones válidas
   — cero errores de FK al insertar, o sea que cada `exercise_id`/`equipment_id` que propone el
   motor existe de verdad en el catálogo.
2. Leída la sesión pendiente igual que `useActivePlan` (sesión 0, 5 ítems), se marcaron sus series
   con `load_kg_normalized` calculado con el `toKg()` real (no inventado).
3. Se cerró la sesión en el orden del fix de esta sesión (`workout_log` → `plan_sessions`) — **y
   la cola avanzó de verdad**: la siguiente lectura devolvió la sesión 1, no la 0 de nuevo. Es la
   promesa central de "cola sin fechas, no días de la semana" (`04-glosario.md`), confirmada.
4. `engine.reviewProgress()` con el historial recién escrito corrió sin tirar error (0 propuestas
   — esperable en la primera sesión; la progresión necesita varias sesiones seguidas).
5. Limpieza completa después: `plans`, `profiles`, `workout_logs`, `set_logs` quedaron en 0 filas
   de prueba.

Con esto, la cadena completa generar → persistir → marcar → cerrar → avanzar la cola → revisar
progreso quedó probada contra Postgres real con el código real del motor.

**Extendida esa prueba al fix de `useResolveProposal`, con una propuesta REAL (no armada a mano)**:
mismo plan de 8 sesiones; se registraron dos "series tope" con RIR alto para el mismo ejercicio
(Press de banco) en dos `workout_logs` distintos — hace falta que sean sesiones separadas de
verdad, `groupTopSetsByExercise()` agrupa por `workout_log_id`, dos series en el mismo log cuentan
como una sola sesión y no alcanza. Con eso, `engine.reviewProgress()` generó de verdad una
propuesta `load_increase` (40 → 42.5, con el texto real: *"te sobraron repeticiones las últimas 2
veces"*). Aceptarla en el orden del fix (aplicar la carga antes de marcar `accepted`) actualizó
`target_load` en **las dos** sesiones pendientes que todavía tienen ese ejercicio en la cola — no
solo la primera. Limpieza completa después (`plans`/`profiles`/`workout_logs`/`set_logs`/
`adaptation_proposals` en 0).

**También verificada la query exacta de `celebrateIfRecord` (récord personal, `lib/session-log.ts`)
contra Postgres real**: serie de 40 kg (primera del ejercicio, no hay "anterior" — la lógica real
del código no la cuenta como récord, pero la query en sí queda como base) → serie de 42 kg → la
misma query que usa el código (`is_warmup=false`, `load_kg_normalized` no nulo, orden descendente,
límite 1) devuelve 42, confirmando que SÍ se detectaría como récord (42 > 40) → serie de 41 kg → la
query sigue devolviendo 42 (41 no es récord, como corresponde) → serie de calor de 50 kg
(`is_warmup=true`) → la query sigue devolviendo 42, confirmando que el filtro de warmup excluye
esa serie de la comparación aunque sea la carga más alta de todas. El insert final a
`personal_records` también anduvo con los FKs reales. Limpieza completa después.

**Última pieza del motor: `engine.findSubstitutes()` contra el catálogo real**. Con "Sentadilla"
y su estación marcada como ocupada, el motor ofreció "Prensa de piernas" (equivalencia 1.00) y
"Zancadas" (0.60) — dos alternativas reales del catálogo de Blue Horse, ninguna la estación
ocupada. Se verificó explícitamente que ninguna opción devuelve la misma estación marcada como no
disponible ni un `exercise_id`/`equipment_id` que no exista en el catálogo. El `session_event`
tipo `substituted` (lo que graba `logSubstitution`) se insertó sin problema con los FKs reales.
Limpieza completa después.

Con esto quedaron probadas contra Postgres real las tres funciones del `PrescriptionEngine`
(`generatePlan`, `reviewProgress`, `findSubstitutes`) con el catálogo y el motor de verdad, no
simulados. Lo único que sigue sin probarse es la capa de React arriba de todo esto (formularios,
hooks, pantallas) — eso sí necesita el `.env` de la app, que sigue sin tocarse.

### Bug repetido esta sesión (tres veces) — regla ya en `CLAUDE.md`

Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre.
Chequear `auth.status !== 'signed-in'` antes que `query.isPending` en CUALQUIER componente que
dependa de sesión.

### Verificado

`npm run check` (lint + typecheck + **120 tests**) pasa, y también `npm run build` (build de
producción limpia, un solo warning de tamaño de bundle ya conocido). Todos los mappers nuevos de
esta sesión (`session-event.ts`, `progress.ts`, `adaptation.ts`, `use-install-prompt.ts`) están
probados sin base. La extensión de Chrome volvió a conectar: se vieron en el navegador `/instalar`
(rama "other"/desktop, con el botón "Entrar" navegando bien a `/auth`), `/progreso` (estado "sin
sesión" correcto, sin quedarse colgado en el spinner) y `/` con `Proposals` montado (no rompe nada
sin sesión). Sin errores de consola propios de la app en ninguna.

**Todavía sin probar A TRAVÉS DE LA APP** (la lógica de negocio en sí — motor, persistencia,
avance de cola, RLS — ya se probó completa contra Postgres real, ver arriba dos veces): falta
específicamente la capa de React — formularios de `Onboarding.tsx`, botones y estados de carga de
`Hoy.tsx`/`Progreso.tsx`/`Proposals.tsx`, la sesión de `AuthProvider` en el navegador — porque eso
necesita el cliente de Supabase de la app corriendo con un `.env` real, y este entorno tiene
`Read(./.env)`/`Read(./.env.*)` denegado por `.claude/settings.json` (no es solo prudencia mía: es
una regla del proyecto). Sigue siendo del usuario: pegar los valores en `.env` y correr la app.
Tampoco se probó `/instalar` en un Android o iPhone real (`beforeinstallprompt` no dispara en
`localhost` con Chrome desktop en todos los casos) — la rama de Safari/iOS y el flujo de
instalación real quedan sin verificar en un dispositivo físico.

### Lo próximo, en orden

1. **Con `.env` cargado**: la única prueba que falta es la capa de React en sí (formularios, hooks,
   pantallas) — la lógica de negocio (motor, persistencia, RLS, avance de cola) ya se verificó
   completa contra Postgres real esta sesión, ver más arriba. `npm run db:types` ya está hecho.
2. **Curación del research a `v1-research.json`** — es del usuario (o de alguien con criterio
   clínico para la Parte D de `04`), no mía: verificar DOIs, decidir las filas de confianza BAJA.
   Ver `docs/research/README.md`. Solo el esquema nuevo de cardio en `ruleset.ts` (paso 3 de esa
   guía) es código, y conviene esperar a que se resuelvan los pasos 1-2 antes de tocarlo, para no
   tener que rehacerlo si la forma final cambia.
3. Relevamiento del catálogo real (Fase 0) — también del usuario.
4. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- **Después de cada `npm run db:reset`, correr `npm run db:ruleset`** (con `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` de `npx supabase status -o env`) o la generación de plan falla.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
- **El Postgres local puede estar corriendo sin que el agente lo haya arrancado** — `npx supabase
  status` lo confirma (imprime las claves `anon`/`service_role` y `DB_URL`, todas de desarrollo,
  no secretas de verdad). Con eso corriendo se puede verificar CUALQUIER lógica de negocio en vivo
  con `curl`/REST sin tocar `.env` — así se probó toda la sesión (RLS, el motor real vía Node 24
  importando `.ts` directo, altas/bajas de usuarios de prueba por la Auth Admin API). Siempre
  limpiar los datos de prueba después (usuarios, filas) y confirmar en 0 antes de dar por
  terminada la verificación.
