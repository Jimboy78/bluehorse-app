# Estado del trabajo

Este archivo reemplaza al resumen automático de sesión: vive en disco, sobrevive a `/clear` y se
puede leer desde cualquier sesión nueva. **Actualizalo al terminar una sesión larga.**

---

## Última actualización: 4 de septiembre de 2026 (loop autónomo, corre cada 15 min)

### Instrucción vigente del usuario — no bloquear por falta de catálogo

El usuario pidió explícitamente: mientras no comparta las fotos/máquinas reales de Blue Horse
(Fase 0), **seguir desarrollando con datos placeholder claramente marcados**, en vez de esperar.
El aviso de "esto es un placeholder" tiene que apagarse solo cuando el dato real lo reemplace —
mismo criterio que ya usa `showsPlaceholderContent` con el ruleset. Aplica sobre todo al próximo
ítem: panel admin y catálogo.

También pidió explícitamente: todo valor de prescripción de entrenamiento tiene que salir de
`docs/research/`, nunca inventado. Ver la memoria `feedback_base_cientifica` para el detalle.

### Dónde quedó

Fase 1 del roadmap, bien avanzada:

- Motor, esquema con RLS, PWA con service worker y cola offline — de sesiones anteriores.
- **Sistema de movimiento** y componentes reales (`RestTimer`, `SetRow`, celebración de récord).
- **Auth**: Google + email, routing protegido, 3 estados reales.
- **Onboarding**: wizard de 4 pasos (objetivo/deporte → personal → frecuencia → calibración),
  guardado por `RequireOnboarding`. No pide baseline por ejercicio todavía — el catálogo no existe,
  así que solo guarda la preferencia declarado/calibrar.
- **Deploy de prueba en vivo**: <https://bluehorse-app.vercel.app> — se redeploya solo con cada
  push a `main`. Configuración de monorepo (Root Directory, comandos) resuelta y guardada en
  `vercel.json`.
- Investigación de contenido (segunda tanda) revisada — ver `docs/research/README.md`.
- Paleta del logo real extraída por píxel — decisión de diseño pendiente del usuario, ver
  `docs/07-marca-blue-horse.md`.

### Verificado

`npm run check` (lint + typecheck + **45 tests**) pasa. Onboarding probado en navegador local
(`localhost:5173`, no en el deploy de Vercel — el usuario pidió usar el entorno local para
verificar cambios): los 4 pasos renderizan y navegan bien. **La escritura real a Supabase no está
probada** — no hay una instancia corriendo todavía (ni local con Docker, ni de nube).

### Lo próximo, en orden

1. **Panel admin + catálogo con placeholders**: no esperar el relevamiento real. Cargar
   equipamiento/ejercicios de ejemplo, claramente marcados ("Ejemplo — Prensa 45°" o similar), para
   poder construir generación de plan y pantalla de sesión contra datos reales de la base (aunque
   el contenido sea de mentira). Cuando llegue el relevamiento real, reemplaza y el aviso de
   placeholder se apaga solo.
2. Levantar Supabase (local con Docker, o de nube) para probar el flujo de escritura real por
   primera vez — sigue pendiente.
3. Generación de plan persistida + pantalla "Hoy" (Fase 2).
4. Decisión de paleta (`docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: el sistema tiene 22.3.0. Node 24.20.0 portable en `%LOCALAPPDATA%\node24` — anteponer
  al PATH en cada sesión de shell nueva.
- El bundle de producción crece con cada feature. Separar por rutas con `React.lazy()` cuando
  existan pantallas reales de fase 2.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión).
