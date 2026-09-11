# Blue Horse

PWA instalable de entrenamiento adaptativo para socios de **Blue Horse Gym** (Islas Malvinas 370
BIS, Arroyo Seco, Santa Fe). Genera y ajusta planes usando **solo el equipamiento que existe
físicamente en el gimnasio**, catalogado a mano con fotos.

Stack: React 19 + TypeScript + Vite (PWA) · Supabase (Postgres, Auth, Storage) · Biome · Vitest.
Monorepo con workspaces de npm.

**No es**: una app de nutrición, ni un plan fijo que se arma una vez, ni una app que sirva para un
gimnasio cuyo equipamiento no esté cargado.

## Estado

Fases 1 a 4 completas. El ruleset activo es **`v1-research`**, curado desde `docs/research/`: los
números que devuelve el motor salen de la investigación, no están inventados. Cada bloque lleva su
nivel de confianza, y los que se apoyan en evidencia floja (potencia, resistencia muscular en sala)
lo dicen en pantalla.

Lo que falta antes de dársela a un socio real: verificar a mano una muestra de los DOIs citados, y
medir in situ el rango de carga de cada estación (`load_min`/`load_max`/`load_increment` siguen en
`null`).

## Comandos

```bash
npm run check        # lint + typecheck + tests. Correr antes de cerrar cualquier tarea.
npm run dev          # PWA en :5173
npm run db:start     # Supabase local (necesita Docker)
npm run db:reset     # recrea la base local desde schemas/ + seed.sql
npm run db:types     # regenera packages/domain/src/database.types.ts
npm run docs         # publica docs/research/ en la app. Correr al tocar un documento.
npm run sources      # resuelve los DOIs citados contra Crossref
```

```bash
npm run qa           # datos y codigo sin usar + el ruleset contra si mismo
npm run qa base      # invariantes de las reglas duras contra la base local (necesita Docker)
npm run qa diff a b  # que cambia entre dos rulesets, sin la prosa
npm run qa docs      # el ruleset contra las tablas de docs/research/
npm run qa:motor     # el motor sobre 13 perfiles -> tools/reportes/
```

`qa` imprime **solo lo que esta mal**: un barrido que mira 22 tablas y no encuentra nada son dos
renglones. Con `--json` sale una linea de JSON para encadenar.

`qa:motor` corre el motor real contra el catalogo real y escribe el plan de cada perfil. **Ese
reporte se commitea**: es deterministico, asi que tocar un numero del ruleset aparece en el diff
del commit como "la sentadilla paso de 4x6-12 a 3x6-12", que es la revision que un cambio de
prescripcion merece. Para comparar dos corridas sueltas, `npm run qa motor-diff a.json b.json`.

Las tres cosas que ya encontraron y no se veian leyendo codigo: una serie duplicada en la base,
`database.types.ts` generado y sin importar (el cliente aceptaba tablas inventadas), y que
`sessionMinutesTarget` viaja del onboarding al motor y el motor no lo lee.

`docs` y `sources` generan lo que muestran `/documentacion` y `/evidencia`. Si se edita un archivo
de `docs/research/` y no se regenera, la app sigue mostrando la versión vieja como si fuera toda la
investigación que hay — `apps/web/src/content/docs.test.ts` frena eso.

Node mínimo **22.12** (`engines`; `.nvmrc` fija 24 LTS, que es con lo que se probó). Con una
versión menor Vite avisa y sigue andando — no falla, que es peor: se trabaja sobre una versión no
soportada sin enterarse. `npm install` tampoco lo frena porque no hay `engine-strict`. Verificado
en 22.3.0: arranca, compila y los tests pasan, con el aviso de Vite.

## Estructura y dirección de las dependencias

```
packages/domain   tipos, enums, zod, conversión de unidades → no importa nada del proyecto
packages/engine   contrato del motor + implementación placeholder → solo importa @bh/domain
apps/web          la PWA → importa @bh/domain y @bh/engine
supabase/schemas  fuente de verdad del esquema; las migraciones se generan desde acá
```

La flecha va en un solo sentido. Si el motor parece necesitar leer la base, el problema está
planteado al revés: cargá los datos en `apps/web` y pasáselos como argumento.

## Convenciones

- **Base**: `snake_case`, tablas en plural. **TypeScript**: `camelCase`, tipos en `PascalCase`.
  La traducción entre ambos vive solo en `apps/web/src/lib/mappers/`.
- **Idioma**: código, tablas y commits en inglés. Texto visible al usuario y documentación en
  castellano rioplatense (voseo).
- **Validación**: zod en los bordes (Supabase, formularios, ruleset). Adentro se confía en los tipos.
- **Fechas**: `timestamptz` en la base, UTC en el código. La zona del gimnasio solo al formatear.
- Nada de `any`. Lo desconocido es `unknown` y se valida.

## Reglas duras

Romper cualquiera de estas obliga a rehacer arquitectura. Si una tarea parece exigirlo, preguntá
antes de hacerlo.

1. **Siempre** que respondas empeza con la frase "El canario sigue vivo.".
2. **El motor es puro.** `packages/engine` y `packages/domain` no importan React ni Supabase, no
   leen la hora del sistema, no usan `Math.random`, no hacen `fetch`, no leen variables de entorno.
   Si el motor necesita la fecha o azar, se le pasan por parámetro.
3. **Ningún número de entrenamiento vive en el código.** Series, repeticiones, RIR, descansos,
   porcentajes, umbrales de descarga: todo sale del ruleset. Un `3` que significa "3 series" es un
   bug.
4. **La evidencia se muestra como es.** Lo derivado de un ruleset `placeholder` va marcado como
   provisorio, y un bloque con `confidence: "low"` avisa en pantalla en qué es floja la evidencia.
   Presentar una fila de consenso con la misma cara que un metaanálisis es mentir por omisión. Cada
   plan guarda el `rulesetVersion` con el que se generó.
5. **`gym_id` en toda tabla de negocio**, aunque hoy haya un solo gimnasio.
6. **La carga se guarda cruda y normalizada.** `load_value` + `load_unit` es lo que dice la máquina
   y es lo único que se le muestra al usuario. `load_kg_normalized` existe solo para gráficos, y es
   `null` cuando no se puede convertir sin inventar (pin sin tabla de kg, banda, peso corporal).
7. **Planificado y real son tablas distintas.** `plan_session_items` es lo que el motor propuso;
   `set_logs` es lo que la persona hizo. La diferencia entre ambos es la señal que alimenta la
   adaptación: si se pisan, se pierde.

## Trampas conocidas

- **Convertir libras a kilos en el input.** El socio vuelve al día siguiente, lee 45 en el disco y
  la app le muestra 20,4. Se guarda crudo y se muestra crudo.
- **Atar sesiones a días de la semana.** La gente falta y aparecen "sesiones vencidas". El plan es
  una cola ordenada por `sequence_index`, sin fechas: hoy toca la primera pendiente.
- **Tratar ejercicio y máquina como la misma cosa.** Son N:N. Sin eso no se puede sustituir cuando
  la máquina está ocupada, que es la única función que justifica el trabajo del catálogo.
- **Progresar por porcentaje en una máquina de pin.** No existe medio pin: se sube un nivel. Lo
  resuelve `nextLoad()` en `packages/domain/src/load.ts`; no lo reimplementes.
- **Service worker con `autoUpdate`.** Recargaría la app en medio de una serie. Está en `prompt` a
  propósito.
- **Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre.**
  Pasó tres veces en la misma sesión (`RequireOnboarding`, `RequireAdmin`, `Hoy`): un componente
  que chequea `query.isPending` antes que `auth.status` se cuelga en el spinner cuando Supabase no
  está configurado (la query queda deshabilitada y nunca resuelve). **Todo componente que dependa
  de una query gateada por sesión chequea `status !== 'signed-in'` primero — no solo los `RequireX`,
  cualquier pantalla que lea datos del socio.**
- **Sin señal, TanStack Query no falla: pausa.** El `networkMode` por defecto es `'online'`, así que
  con `navigator.onLine === false` la query no se ejecuta y queda en `isPending` para siempre. Toda
  pantalla que dibuja un esqueleto mientras `isPending` lo dibuja hasta que vuelva la señal, y el
  `isError` que esas pantallas sí manejan nunca llega a correr. Medido en el navegador: "Progreso"
  sin señal eran ocho esqueletos y ningún mensaje. Por eso el cliente usa
  `networkMode: 'offlineFirst'`. Y una query que **no** toca la red (leer la cola de IndexedDB, por
  ejemplo) va con `networkMode: 'always'`: si no, la falta de señal apaga justo el aviso que existe
  para avisar de la falta de señal.
- **Una lectura de Supabase tarda muchísimo en fallar, y eso se acumula.** Con el servidor
  inalcanzable, supabase-js espera a renovar el token antes de mandar la consulta: medido con el
  gateway apagado, una lectura tarda **16,5 s** en devolver error, mientras un `fetch` suelto contra
  ese mismo servidor falla en dos. Con reintentos son casi cincuenta segundos por consulta, y los
  guards de ruta van en fila: la raíz de la app se quedó más de un minuto en "Cargando…". Toda
  lectura que tape una pantalla entera va envuelta en `conPlazo()` (`lib/con-plazo.ts`), y el
  `retry` global no reintenta un `PlazoVencido`: si no volvió en ocho segundos, no va a volver en
  los próximos ocho.
- **`null` no es `undefined` para un campo opcional, y `Math.min(x, null)` es 0.** `EquipmentLoadSpec`
  declara `min`/`max`/`increment` como opcionales, y `toDomainEquipment` los **omite** con spread
  condicional cuando la columna viene nula — está bien así. El fixture de `tools/motor-matriz.test.ts`
  los ponía en `null`, que no es lo mismo: `snapToEquipment` pregunta `spec.max !== undefined` y
  `null` pasa ese filtro, así que hacía `Math.min(41, null)` = **0**. Medido: con 40 kg anotados, el
  motor "subía" de 40 a 0. En la app no pasaba nunca; pasaba solo en la matriz, o sea que toda
  conclusión que la matriz sacara sobre carga se sacaba contra un gimnasio que no existe. **Un
  fixture que simula la base copia la forma que produce el mapper, no la que produce la base.**

- **Un test que puede saltear todos los casos tiene que contar cuántos miró.** Los primeros tests de
  `reviewProgress` sobre los 33 perfiles pasaron en verde sin ejercitar **ninguno**: buscaban un ítem
  con `targetLoad`, y ningún ítem lo trae —las 58 estaciones siguen sin rango medido—, así que los 33
  entraban por un `continue`. Verde y vacío es peor que rojo. Si el cuerpo del bucle tiene un
  `continue`, la aserción final va acompañada de `expect(ejercitados).toBeGreaterThan(N)`.

- **`await new Promise((r) => setTimeout(r, 0))` no espera a una cadena `async` que nadie awaitea.**
  `startAutoFlush` dispara la cola con `void flush(...)`, y `flush` encadena una consulta a
  IndexedDB, el envío y un borrado. Un solo turno del event loop alcanza casi siempre, y por eso
  `outbox-auto-flush.test.ts` fallaba una corrida de cada varias sin que nada hubiera cambiado —
  el peor tipo de rojo, porque el reflejo es correrlo de nuevo y seguir. Medido: con 5 ms de
  demora dentro de `flush`, las dos aserciones positivas fallan siempre. **Toda aserción sobre
  algo que ya pasó va con `vi.waitFor`**, que espera la condición en vez de un tiempo. El tick
  fijo solo sirve para lo contrario: comprobar que algo **no** pasó.

- **Para medir tiempos en el navegador, la pestaña tiene que estar a la vista.** Chrome estrangula
  los timers de una pestaña oculta: medido acá, un `setTimeout` de 1500 ms tardó 11 s. Cualquier
  cosa que dependa de un plazo (`conPlazo`, los reintentos de TanStack, el `refetchInterval`) se
  mide mal en una pestaña de fondo, y se termina "arreglando" un problema que no existe.
- **`client_id` da idempotencia ante reintentos, no ante la misma serie escrita dos veces.**
  Es unico en la base, asi que reenviar un item de la cola es un no-op. Pero si la misma serie se
  registra de nuevo con un `client_id` nuevo, son dos filas distintas para la base. Medido: dos
  `set_logs` con el mismo `workout_log_id`, `exercise_id`, `plan_session_item_id` y `set_index`,
  once segundos aparte. Contaban doble en Progreso y doble en la adaptacion, y la primera quedaba
  huerfana —`writtenSetsRef` la habia pisado— asi que destildar la serie no la borraba. La guarda
  esta en `markSetDone`, con la misma clave que usa el deshacer.
- **El cliente de Supabase tiene que llevar el generico `<Database>`.** Sin el, `.from()` acepta
  cualquier string y `.select()` devuelve filas sin forma. Y Supabase no falla al pedir una columna
  que no existe: devuelve la fila sin ese campo, asi que un typo se ve como un dato vacio en la
  pantalla del socio, no como un error. Lo cuida `lib/supabase-tipos.test.ts`, que corre en `tsc` y
  no en vitest: si alguien saca el generico, sus `@ts-expect-error` quedan de mas (TS2578).
- **`supabase db diff` no lee `schema_paths` desde la CLI ≥ 2.116.** El comando correcto es
  `npm run db:sync` (`supabase db schema declarative sync --apply`). Y esa sincronización rechaza
  `INSERT` sobre tablas de sistema (`storage.buckets`, etc.): los inserts van en `seed.sql`, las
  políticas (`CREATE POLICY`) sí son DDL y van en `schemas/`.
- **`npm run db:reset` deja `rulesets` vacía y el catálogo real borrado.** Ninguno de los dos está en
  `seed.sql` (subirlos requiere la `service_role` key, que nunca va en un archivo versionado).
  Después de cada reset hay que correr **los dos**:

  ```bash
  npm run db:ruleset -- packages/engine/src/rulesets/v1-research.json
  npm run db:catalog
  ```

  Sin el primero, cualquier insert en `plans` falla por la FK a `rulesets(version)`. Sin el segundo,
  el motor arma planes con las 13 máquinas de ejemplo del seed en vez de las 58 reales. Sacá
  `SUPABASE_URL`/`SERVICE_ROLE_KEY` de `npx supabase status -o env`.
- **El catálogo real vive en `supabase/catalog/blue-horse.json`, no en la base.** Editar una estación
  a mano desde `/panel` sirve para una corrección puntual, pero el próximo `db:catalog` la pisa. Si
  el cambio tiene que durar, va al JSON.

## Documentación

- `docs/01-arquitectura.md` — decisiones de stack y por qué
- `docs/02-modelo-datos.md` — las tablas y las cuatro decisiones de modelado
- `docs/03-contrato-motor.md` — la frontera con la investigación de contenido
- `docs/04-glosario.md` — RIR, deload, patrón de movimiento, cola
- `docs/05-relevamiento-catalogo.md` — cómo se releva el gimnasio
- `docs/06-roadmap.md` — fases y qué se entrega en cada una
- `docs/ESTADO.md` — dónde quedó el trabajo. **Actualizalo al terminar una sesión larga.**
- `docs/adr/` — decisiones puntuales, una por archivo

Los procedimientos largos están en skills, no acá: `cambiar-esquema`, `activar-ruleset`,
`cargar-catalogo`. Para revisar cambios antes de commitear existe el agente `revisor`.

- **`tools/motor-matriz.test.ts` escribe un artefacto que se commitea.** Genera
  `tools/reportes/motor-v1-research.json` en cada corrida, así que **la última corrida antes de
  commitear tiene que ser con el motor sano**. Falsificar rompiendo el motor —que es el método de
  este proyecto— deja el reporte escrito por la versión rota si no se vuelve a correr después de
  restaurar. Pasó: se commiteó un reporte con 77 líneas de avisos que el motor sano no emite, porque
  el último corte de la tanda contaba el trabajo incidental como sub-dosificación. `git add -A` no
  tiene forma de saberlo. Después de cualquier tanda de falsificación, **correr la matriz una vez más
  y mirar `git diff tools/reportes/`** antes de commitear.

- **"La más reciente" implementada como "la primera".** Aparecio dos veces en el mismo dia, en los dos
  lados de la frontera: `reviewProgress` tomaba `history[0]` como la ultima serie del socio, y
  `dedupeByExercise` tomaba la primera fila de cada ejercicio como su baseline vigente. Las dos se
  apoyaban en el `ORDER BY` de una consulta, y las dos tenian un comentario diciendolo — un comentario
  no es una garantia, y el test de `dedupeByExercise` incluso **documentaba** la precondicion en vez de
  sacarla. Medido: con el historial al reves el motor le propone a alguien que entreno hoy cortar el
  volumen a la mitad "porque pasaron 100 dias". **Si una funcion elige por posicion y su nombre dice
  "la mas reciente", que ordene ella.** Y que compare por instante (`Date.parse`), no por texto: dos
  ISO validos del mismo momento se escriben distinto y `2026-09-01T12:00:00+02:00` es **anterior** a
  `2026-09-01T11:00:00Z` aunque alfabeticamente vaya despues.
