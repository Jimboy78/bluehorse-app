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

**Fase 1 completa** (salvo el relevamiento real). **Fase 2 completa salvo el cierre de sesión**:

- Plan generado y persistido, pantalla "Hoy" real, y **ahora también la escritura real a
  `set_logs`**: marcar una serie encola (Dexie) un `set_log` — y, en la primera serie de la
  sesión, su `workout_log` — y los manda cuando hay señal. La cola arranca una sola vez, en la raíz
  de la app (`startSessionOutbox`), no por pantalla: si el gimnasio tiene mala señal, reintenta
  sin importar en qué parte de la app esté el socio.
- El cronómetro ya usa el `rest_seconds` real de cada ítem, no el valor fijo de demo.
- `load_kg_normalized` se calcula con `toKg()` del dominio usando la spec real de la estación —
  `null` si no hay tabla de conversión, nunca un número inventado.
- **Falta para cerrar Fase 2 del todo**: pantalla de cierre de sesión (sensación, molestias,
  resumen). Hoy no hay forma de completar `workout_logs.ended_at`/`session_feel`.

### Bug repetido esta sesión (tres veces) — regla ya en `CLAUDE.md`

Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre.
Chequear `auth.status !== 'signed-in'` antes que `query.isPending` en CUALQUIER componente que
dependa de sesión, no solo los `RequireX`.

### Verificado

`npm run check` (lint + typecheck + **79 tests**) pasa. Los mappers de `set_logs`/`workout_logs`
(motor → filas, cálculo de `load_kg_normalized`) están probados sin necesitar base — incluye el
caso "sin tabla de stack, no inventar". **La escritura real contra Supabase (incluida la cola
offline hablando con la base de verdad) sigue sin probarse de punta a punta** — falta `.env` y una
cuenta real completando una sesión.

### Lo próximo, en orden

1. **Pantalla de cierre de sesión**: sensación (`session_feel`), molestias (`pain_reports`),
   resumen, y completar `workout_logs.ended_at`. Cierra la Fase 2 entera.
2. Con `.env` cargado: primera prueba de punta a punta real — registro → onboarding → plan →
   marcar series → ver que `set_logs` tenga filas de verdad. Correr `npm run db:types` ahí mismo.
3. Empezar Fase 3: propuestas de adaptación, sustitución por máquina ocupada, progreso.
4. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- **Después de cada `npm run db:reset`, correr `npm run db:ruleset`** (con `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` de `npx supabase status -o env`) o la generación de plan falla.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando el
  árbol de rutas crezca más.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
