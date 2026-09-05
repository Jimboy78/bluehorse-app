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

**Empieza Fase 3** en la próxima pasada. Su checklist, sin empezar (la cola offline ya se marcó
hecha, se construyó en Fase 2 aunque estaba listada acá):
- Propuestas de ajuste con motivo, aceptar o rechazar
- Sustitución por máquina ocupada
- Progreso: evolución por ejercicio, adherencia y racha, volumen semanal, récords
- Pantalla de instalación (destino del QR)

### Bug repetido esta sesión (tres veces) — regla ya en `CLAUDE.md`

Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre.
Chequear `auth.status !== 'signed-in'` antes que `query.isPending` en CUALQUIER componente que
dependa de sesión.

### Verificado

`npm run check` (lint + typecheck + **84 tests**) pasa. `Hoy.tsx` + `SessionClose.tsx` probados en
navegador local sin romper el estado "sin configurar". Los mappers de cierre de sesión
(`workout_logs` update, `plan_sessions` completado, `pain_reports`) están probados sin base.

**Todavía sin probar de punta a punta contra una base real**: registro → onboarding → generar
plan → marcar series → cerrar sesión → confirmar que la cola avanza a la sesión 2. Falta `.env`
(el usuario tiene los valores) y una cuenta real completando el flujo entero.

### Lo próximo, en orden

1. **Con `.env` cargado**: la primera prueba de punta a punta real de todo lo construido hasta
   acá. Es el paso más urgente — hay mucho código nunca ejercitado contra Supabase de verdad.
   Correr `npm run db:types` en el mismo momento.
2. Empezar Fase 3: probablemente arrancar por sustitución de máquina ocupada (el motor ya tiene
   `findSubstitutes()`, solo falta la UI) o por progreso (lectura de `set_logs` acumulados).
3. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión.
- **Después de cada `npm run db:reset`, correr `npm run db:ruleset`** (con `SUPABASE_URL` y
  `SUPABASE_SERVICE_ROLE_KEY` de `npx supabase status -o env`) o la generación de plan falla.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando el
  árbol de rutas crezca más.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
