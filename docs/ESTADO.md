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

**Fase 1 completa** (salvo el relevamiento real de Blue Horse, que es del usuario). **Fase 2 en
curso**: la generación de plan ya persiste en la base (`useGeneratePlan`, dispara automáticamente
al terminar el onboarding) y se puede leer de vuelta (`useActivePlan`, primera sesión pendiente
con sus ítems). Falta construir la pantalla "Hoy" real que consuma `useActivePlan` — hoy
`App.tsx`/`MotionPreview.tsx` siguen siendo la vista previa del motor en memoria, no la pantalla
final del producto.

**Bloqueo real encontrado y resuelto esta pasada**: `plans.ruleset_version` tiene FK a
`rulesets(version)`, y esa tabla estaba completamente vacía en la instancia local — nunca se había
corrido `scripts/push-ruleset.mjs`. Sin esto, **cualquier** inserción de plan iba a fallar. Ya
está cargado (`v0-placeholder`, activo), pero **se vacía de nuevo con cada `npm run db:reset`**
porque el ruleset no vive en `seed.sql` a propósito (subirlo pide la `service_role` key, que nunca
va en un archivo versionado). Documentado en `CLAUDE.md` → Trampas conocidas.

### Bug repetido esta sesión (dos veces) — ya en `CLAUDE.md`, no repetir una tercera

Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre. Todo
`RequireX` nuevo chequea `status !== 'signed-in'` ANTES que `query.isPending`.

### Verificado

`npm run check` (lint + typecheck + **73 tests**) pasa. Los mappers de plan (motor → filas de
Supabase) están probados sin necesitar base. **La escritura/lectura real del plan contra Supabase
sigue sin probarse de punta a punta** — falta `.env` (el usuario tiene los valores) y una cuenta
real para completar el onboarding y disparar la generación.

### Lo próximo, en orden

1. **Pantalla "Hoy" real**: reemplazar `MotionPreview` (vista previa en memoria) por una pantalla
   que use `useActivePlan()` — sin plan generado, mostrar un estado que ofrezca generarlo; con
   plan, mostrar la cola real.
2. Con `.env` cargado: probar registro → onboarding → generación de plan → panel admin, de punta a
   punta contra la base real por primera vez. Es el momento de correr `npm run db:types` también.
3. Detalle de ejercicio real (series pre-cargadas desde `plan_session_items`, cronómetro con
   registro del descanso real, escritura a `set_logs`).
4. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- **Después de cada `npm run db:reset`, correr `npm run db:ruleset`** (con `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` de `npx supabase status -o env`) o la generación de plan falla.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando
  existan pantallas reales de fase 2.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
