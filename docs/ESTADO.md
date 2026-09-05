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

### Bug repetido esta sesión (tres veces) — regla ya en `CLAUDE.md`

Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre.
Chequear `auth.status !== 'signed-in'` antes que `query.isPending` en CUALQUIER componente que
dependa de sesión.

### Verificado

`npm run check` (lint + typecheck + **104 tests**) pasa, y también `npm run build` (build de
producción limpia, un solo warning de tamaño de bundle ya conocido). Todos los mappers nuevos de
esta sesión (`session-event.ts`, `progress.ts`, `adaptation.ts`, `use-install-prompt.ts`) están
probados sin base. La extensión de Chrome volvió a conectar: se vieron en el navegador `/instalar`
(rama "other"/desktop, con el botón "Entrar" navegando bien a `/auth`), `/progreso` (estado "sin
sesión" correcto, sin quedarse colgado en el spinner) y `/` con `Proposals` montado (no rompe nada
sin sesión). Sin errores de consola propios de la app en ninguna.

**Todavía sin probar de punta a punta contra una base real**: registro → onboarding → generar
plan → marcar series → cerrar sesión → confirmar que la cola avanza a la sesión 2 → ver el
progreso en `/progreso` → ver y resolver una propuesta de ajuste. Falta `.env` (el usuario tiene
los valores) y una cuenta real completando el flujo entero. Tampoco se probó `/instalar` en un
Android o iPhone real (`beforeinstallprompt` no dispara en `localhost` con Chrome desktop en todos
los casos) — la rama de Safari/iOS y el flujo de instalación real quedan sin verificar en un
dispositivo físico.

### Lo próximo, en orden

1. **Con `.env` cargado**: la primera prueba de punta a punta real de todo lo construido hasta
   acá. Es el paso más urgente — hay mucho código nunca ejercitado contra Supabase de verdad.
   Correr `npm run db:types` en el mismo momento.
2. Fase 4 (contenido real) está bloqueada por research y por el relevamiento del catálogo — no
   arrancar sin eso. Teclado y contraste ya se verificaron limpios (ver arriba); no queda una
   tarea técnica obvia pendiente sin tocar contenido — la próxima pasada probablemente tenga que
   buscar en el código algo más específico para pulir en vez de un ítem ya anotado.
3. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- **Después de cada `npm run db:reset`, correr `npm run db:ruleset`** (con `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` de `npx supabase status -o env`) o la generación de plan falla.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
