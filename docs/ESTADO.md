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

### Dónde quedó — Fase 1 completa

La Fase 1 del roadmap está terminada salvo el ítem que depende del usuario (relevamiento real de
Blue Horse, Fase 0). Todo lo demás: motor, esquema verificado contra Postgres real, PWA, sistema
de movimiento, auth, onboarding, lector de catálogo con fallback automático a placeholder, y panel
admin completo (equipamiento con foto + ejercicios con mapeo).

**Arranca la Fase 2** ("Motor y sesión") en la próxima pasada. Su checklist, sin empezar:
- Generación de plan desde el catálogo real, **persistida** (hoy `use-today-session.ts` genera el
  plan al vuelo en cada render, no lo guarda en `plans`/`plan_sessions`/`plan_session_items`)
- Pantalla "Hoy" real (hoy existe una vista previa en `App.tsx`/`MotionPreview.tsx`, no la
  pantalla final)
- Pantalla de sesión, detalle de ejercicio con series pre-cargadas, cronómetro con registro real,
  cierre de sesión

### Bug repetido esta sesión (dos veces) — ya en `CLAUDE.md`, no repetir una tercera

Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre. Todo
`RequireX` nuevo chequea `status !== 'signed-in'` ANTES que `query.isPending`. Detalle completo en
`CLAUDE.md` → Trampas conocidas.

### Verificado

`npm run check` (lint + typecheck + **69 tests**) pasa. `/panel` completo (equipamiento +
ejercicios) probado en navegador local: formularios, chips interactivos, gates que no se cuelgan.
La escritura real (insert a Supabase, subida de foto) sigue sin probarse de punta a punta — falta
`.env` (el usuario tiene los valores, ver commits anteriores de esta fecha).

### Lo próximo, en orden

1. **Persistir el plan generado.** Al completar onboarding (o al primer login con onboarding ya
   hecho), generar el plan con el motor y guardarlo en `plans`/`plan_sessions`/
   `plan_session_items`, en vez de recalcularlo al vuelo en cada render.
2. Pantalla "Hoy" real: lee el plan persistido, no lo genera de nuevo.
3. Con `.env` cargado: probar registro, onboarding, y el panel de punta a punta contra la base
   real por primera vez.
4. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando
  existan pantallas reales de fase 2.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
