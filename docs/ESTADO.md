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

Fase 1 del roadmap, casi completa:

- Motor, esquema, PWA, sistema de movimiento, auth, onboarding, catálogo real con fallback — de
  pasadas anteriores.
- **Panel admin** (`/panel`): alta de equipamiento con foto, gateado por `profiles.role`
  (member/staff/admin). Bucket de Storage `equipment-photos` con RLS (lectura pública, escritura
  solo staff/admin) — verificado contra Postgres real.
- Falta: alta de ejercicios y su mapeo a equipamiento desde el panel (hoy solo hay alta de
  equipamiento; los ejercicios siguen entrando por seed).

### Bug repetido esta sesión — anotado para no volver a caer

**Una consulta de TanStack Query con `enabled: false` se queda en `isPending: true` para
siempre.** Si un componente de guardia (`RequireX`) chequea `isPending` antes que el estado de
auth, se cuelga en el spinner en vez de dejar pasar cuando Supabase no está configurado. Ya pasó
en `RequireOnboarding` (pasada anterior) y se repitió en `RequireAdmin` esta pasada. **Regla:
todo componente `RequireX` nuevo tiene que chequear `status !== 'signed-in'` ANTES que
`query.isPending`.**

### Verificado

`npm run check` (lint + typecheck + **61 tests**) pasa. `/panel` probado en navegador local: sin
`.env`, muestra el aviso de "no configurado" y el formulario deshabilitado en vez de colgarse (una
vez corregido el bug de arriba). La escritura real (subir foto, insertar equipamiento) sigue sin
probarse de punta a punta — falta `.env`.

### Lo próximo, en orden

1. Con `.env` cargado: probar el panel de punta a punta (crear equipamiento, subir foto, ver que
   aparezca en el catálogo real vía `useGymCatalog`).
2. Panel admin: alta y mapeo de ejercicios.
3. `npm run db:types` para generar `packages/domain/src/database.types.ts`.
4. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando
  existan pantallas reales de fase 2.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
