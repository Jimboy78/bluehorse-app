# Estado del trabajo

Este archivo reemplaza al resumen automático de sesión: vive en disco, sobrevive a `/clear` y se
puede leer desde cualquier sesión nueva. **Actualizalo al terminar una sesión larga.**

---

## Última actualización: 4 de septiembre de 2026 (loop autónomo, corre cada 15 min)

### Instrucciones vigentes del usuario

1. **No bloquear por falta de catálogo real.** Mientras no lleguen las fotos/máquinas de Blue
   Horse (Fase 0), seguir desarrollando con datos placeholder marcados como tales (prefijo
   "Ejemplo —"), que se dejan de usar solos cuando el catálogo real reemplace `placeholder-gym.ts`.
2. **Toda prescripción de entrenamiento sale de `docs/research/`**, nunca inventada. Ver memoria
   `feedback_base_cientifica`.
3. **Verificar en `localhost:5173`**, no en el deploy de Vercel. El deploy es para compartir.

### Dónde quedó

Fase 1 del roadmap, muy avanzada:

- Motor, esquema, PWA, sistema de movimiento, auth (Google+email), onboarding de 4 pasos — de
  pasadas anteriores.
- **La vista previa ahora usa el motor real**: `apps/web/src/lib/use-today-session.ts` llama a
  `engine.generatePlan()` contra `placeholder-gym.ts` (gimnasio de ejemplo, prefijo "Ejemplo —").
  El motor detectó y avisó un hueco real en los datos de ejemplo (faltaba un ejercicio de patrón
  "isolation"); se corrigió agregando uno.
- **Supabase local verificado por primera vez contra Postgres real** (Docker): 20 tablas, RLS en
  todas, 26 políticas, seed con Blue Horse + 16 ejercicios canónicos. Encontré y corregí dos
  problemas reales en el camino:
  - Maté un proceso de `supabase start` creyendo que estaba colgado (CPU casi nula) cuando en
    realidad seguía bajando imágenes de Docker — quedó a mitad de aplicar el esquema, y el
    `stop` posterior backupeó ese estado roto. Lección: verificar cantidad de tablas antes de
    confiar en una instancia restaurada de backup.
  - La CLI de Supabase ≥ 2.116 cambió el flujo declarativo: `db diff` **ya no lee
    `schema_paths`** (la propia CLI lo advierte). El comando correcto ahora es
    `supabase db schema declarative sync --apply`. Renombré `db:diff` → `db:sync` en
    `package.json` y corregí la skill `cambiar-esquema` y el `README.md`, que documentaban el
    comando viejo.
- Deploy de prueba sigue en <https://bluehorse-app.vercel.app>, redeploya solo con cada push.

### Verificado

`npm run check` (lint + typecheck + **45 tests**) pasa. Sesión de hoy con motor real probada en
`localhost:5173`. Esquema de base **verificado por primera vez contra una instancia real**
(migración `20260904235408_initial_schema.sql` aplicada limpia, seed aplicado, RLS confirmado por
consulta directa a `pg_policies`).

**Pendiente del usuario**: crear el archivo `.env` local — está bloqueado para mí por una regla de
permisos que yo mismo configuré (nunca tocar `.env` sin que el usuario lo vea). Los valores exactos
(URL y anon key de la instancia local ya levantada) se los di en el chat de esa pasada; están
también disponibles corriendo `npx supabase status` con la instancia arriba. Una vez creado ese
archivo y reiniciado `npm run dev`, se puede probar auth y onboarding de punta a punta por primera
vez contra una base real.

### Lo próximo, en orden

1. Con `.env` cargado: probar registro por email, confirmar que el trigger crea el `profile`, y
   completar el onboarding real (hoy solo se probó la UI, nunca la escritura a la base).
2. Panel admin con catálogo placeholder (sigue pendiente, no bloqueado).
3. `npm run db:types` para generar `packages/domain/src/database.types.ts` desde la base real
   (nunca se corrió — hasta ahora no había una base contra la cual generarlos).
4. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer al PATH en cada sesión
  de shell nueva.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando
  existan pantallas reales de fase 2.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
