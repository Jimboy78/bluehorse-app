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

**Fase 1 completa** (salvo el relevamiento real de Blue Horse). **Fase 2 muy avanzada**:

- Plan generado con el motor real y **persistido** en `plans`/`plan_sessions`/`plan_session_items`.
- **Pantalla "Hoy" real** (`Hoy.tsx`) reemplazó a `MotionPreview` (borrado): lee el plan
  persistido con `useActivePlan`, no vuelve a correr el motor en cada render. Cubre cuatro estados
  reales — sin plan generado (con botón para generarlo), cola completa, sesión pendiente con sus
  ejercicios, y detalle de ejercicio con series pre-cargadas y cronómetro de descanso.
- **Falta, para cerrar la Fase 2**: marcar una serie como hecha sigue siendo estado local, no
  escribe a `set_logs`. Es lo único que queda de la fase.

### Bug repetido esta sesión (tres veces) — ya en `CLAUDE.md`, buscarlo activamente antes de escribir cualquier pantalla nueva

Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre.
Volvió a pasar en `Hoy.tsx` (tercera vez: `RequireOnboarding`, `RequireAdmin`, `Hoy`). Regla: en
CUALQUIER componente que lea datos gateados por sesión (no solo los `RequireX`), chequear
`auth.status !== 'signed-in'` antes que `query.isPending`.

### Verificado

`npm run check` (lint + typecheck + **73 tests**) pasa. `Hoy.tsx` probado en navegador local: sin
`.env`, muestra el mensaje correcto ("Supabase no está configurado") en vez de colgarse. La
escritura/lectura real del plan contra Supabase sigue sin probarse de punta a punta — falta `.env`
y una cuenta real que complete el onboarding.

### Lo próximo, en orden

1. **Escribir a `set_logs`** al marcar una serie: carga, reps, RIR (solo en la última serie de
   compuestos), descanso real. Con esto se cierra la Fase 2 completa.
2. Usar el `rest_seconds` real de cada `plan_session_item` en el cronómetro, en vez del valor fijo
   de demo (12 s) que quedó de cuando `Hoy.tsx` todavía imitaba a `MotionPreview`.
3. Con `.env` cargado: primera prueba de punta a punta real — registro, onboarding, generación de
   plan, panel admin, marcar series. Correr `npm run db:types` en el mismo momento.
4. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- **Después de cada `npm run db:reset`, correr `npm run db:ruleset`** (con `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` de `npx supabase status -o env`) o la generación de plan falla por
  la FK de `plans.ruleset_version` contra una tabla `rulesets` vacía.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando el
  árbol de rutas crezca más.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
