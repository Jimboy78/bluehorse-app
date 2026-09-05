# Estado del trabajo

Este archivo reemplaza al resumen automático de sesión: vive en disco, sobrevive a `/clear` y se
puede leer desde cualquier sesión nueva. **Actualizalo al terminar una sesión larga.**

---

## Última actualización: 4 de septiembre de 2026 (loop autónomo, corre cada 15 min)

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

**Fase 3 en marcha.** Su checklist:
- Propuestas de ajuste con motivo, aceptar o rechazar — sin empezar
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
- Pantalla de instalación (destino del QR) — sin empezar

### Bug repetido esta sesión (tres veces) — regla ya en `CLAUDE.md`

Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre.
Chequear `auth.status !== 'signed-in'` antes que `query.isPending` en CUALQUIER componente que
dependa de sesión.

### Verificado

`npm run check` (lint + typecheck + **96 tests**) pasa. `Hoy.tsx` (con el flujo de sustitución) +
`SessionClose.tsx` probados en navegador local sin romper el estado "sin configurar" ni tirar
errores de consola propios de la app. Los mappers nuevos (`session-event.ts`,
`toSubstitutionEvent`, `progress.ts`: `computeAdherence`/`computeWeeklyVolume`/`computeRecords`)
están probados sin base. **`/progreso` todavía NO se probó en el navegador**: la extensión de
Chrome se desconectó a mitad de esta pasada (el tab que tenía abierto se cerró solo) y no volvió a
conectar — pendiente re-verificar visualmente la próxima vez que la extensión esté disponible.

**Todavía sin probar de punta a punta contra una base real**: registro → onboarding → generar
plan → marcar series → cerrar sesión → confirmar que la cola avanza a la sesión 2 → ver el
progreso reflejado en `/progreso`. Falta `.env` (el usuario tiene los valores) y una cuenta real
completando el flujo entero.

### Lo próximo, en orden

1. **Con `.env` cargado**: la primera prueba de punta a punta real de todo lo construido hasta
   acá. Es el paso más urgente — hay mucho código nunca ejercitado contra Supabase de verdad.
   Correr `npm run db:types` en el mismo momento.
2. Seguir Fase 3: propuestas de ajuste con motivo, aceptar o rechazar (es lo único que queda de su
   checklist además de la pantalla de instalación).
3. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- **Después de cada `npm run db:reset`, correr `npm run db:ruleset`** (con `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` de `npx supabase status -o env`) o la generación de plan falla.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando el
  árbol de rutas crezca más.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
