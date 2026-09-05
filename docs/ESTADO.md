# Estado del trabajo

Este archivo reemplaza al resumen automático de sesión: vive en disco, sobrevive a `/clear` y se
puede leer desde cualquier sesión nueva. **Actualizalo al terminar una sesión larga.**

---

## Última actualización: 5 de septiembre de 2026 (loop autónomo, corre cada 15 min)

### Instrucciones vigentes del usuario

1. **No bloquear por falta de catálogo real.** Placeholders marcados como tales, que se dejan de
   usar solos cuando el dato real los reemplace.
2. **Toda prescripción de entrenamiento sale de `docs/research/`**, nunca inventada.
3. **Verificar en `localhost:5173`**, no en el deploy de Vercel.

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

**Fase 3 cerrada.** Sigue Fase 4 (contenido real), bloqueada por el research y por el relevamiento
del catálogo (Fase 0, del usuario) — no hay más código de producto para escribir sin esos dos
insumos. Lo que queda mientras tanto es técnico: verificación end-to-end contra Supabase real,
`npm run db:types`, y pulir lo ya construido (performance, accesibilidad).

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

**Todavía sin probar de punta a punta A TRAVÉS DE LA APP**: el registro real (vía Supabase Auth,
no la UI de React) ya se probó contra la base local, ver arriba. Lo que falta es todo lo que pasa
por `apps/web` de verdad — onboarding → generar plan → marcar series → cerrar sesión → confirmar
que la cola avanza a la sesión 2 → ver el progreso en `/progreso` → ver y resolver una propuesta de
ajuste — porque eso necesita el cliente de Supabase de la app corriendo, y este entorno tiene
`Read(./.env)`/`Read(./.env.*)` denegado por `.claude/settings.json` (no es solo prudencia mía: es
una regla del proyecto). Sigue siendo del usuario: pegar los valores en `.env` y correr la app.
Tampoco se probó `/instalar` en un Android o iPhone real (`beforeinstallprompt` no dispara en
`localhost` con Chrome desktop en todos los casos) — la rama de Safari/iOS y el flujo de
instalación real quedan sin verificar en un dispositivo físico.

### Lo próximo, en orden

1. **Con `.env` cargado**: la primera prueba de punta a punta real de todo lo construido hasta
   acá. Es el paso más urgente — hay mucho código nunca ejercitado contra Supabase de verdad.
   Correr `npm run db:types` en el mismo momento.
2. Fase 4 (contenido real) está bloqueada por research y por el relevamiento del catálogo — no
   arrancar sin eso. La auditoría de robustez de `apps/web/src/lib/` ya se cerró (ver arriba); no
   queda una tarea técnica obvia pendiente sin `.env` real — la próxima pasada probablemente
   necesite leer código con más cuidado para encontrar algo específico, no repasar una lista ya
   hecha.
3. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- **Después de cada `npm run db:reset`, correr `npm run db:ruleset`** (con `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` de `npx supabase status -o env`) o la generación de plan falla.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
