# Estado del trabajo

Este archivo reemplaza al resumen automático de sesión: vive en disco, sobrevive a `/clear` y se
puede leer desde cualquier sesión nueva. **Actualizalo al terminar una sesión larga.**

---

## Última actualización: 4 de septiembre de 2026 (loop autónomo, corre cada 15 min)

### Dónde quedó

Fase 1 del roadmap, avanzando. Además del esqueleto (motor, esquema, PWA):

- **Sistema de movimiento** (`apps/web/src/lib/motion.ts`): duraciones, curvas y resortes con
  nombre, para no tener animaciones sueltas por componente. Componentes reales construidos sobre
  él: `RestTimer` (cronómetro con anillo de progreso), `SetRow` (confirmar serie de un toque),
  celebración de récord con `canvas-confetti`. Todo respeta `prefers-reduced-motion`.
- **Auth**: routing con `react-router` (`/auth` público, `/` protegido), `AuthProvider` con tres
  estados reales (`unconfigured` / `signed-out` / `signed-in`) para que un `.env` incompleto se
  muestre en pantalla en vez de romper la app. Google OAuth + email/contraseña. Errores de
  Supabase traducidos a castellano con una función pura y testeada.
- **Investigación de contenido, segunda tanda**: reemplazó la primera (130 videos de YouTube, 0
  datos usables) por prompts que fuerzan fuentes revisadas por pares. Resultado en
  `docs/research/`: 01 y 03 son curables directo al ruleset, 02 necesita extender el esquema para
  cardio, 04 (seguridad) es la más floja y necesita otra pasada antes de un socio real.
- **Marca**: paleta real del ícono de Blue Horse extraída por píxel (`docs/07-marca-blue-horse.md`)
  — es azul sobre negro puro, sin turquesa ni naranja. Contradice la paleta que ya está en
  `styles.css` (turquesa/naranja), que salía de una descripción no verificada. **Decisión de
  paleta pendiente del usuario**, documentada, no resuelta unilateralmente.

### Verificado

`npm run check` (lint + typecheck + 33 tests) pasa. Probado en navegador (Chrome vía
claude-in-chrome): `/auth` renderiza, el toggle entrar/crear cuenta anima bien, los campos
deshabilitan correctamente sin Supabase configurado, `/` redirige según estado de sesión.

### Lo próximo, en orden

1. **Onboarding mínimo**: crear `profile` + primer `user_goal` al primer login. Los 5 pasos están
   documentados en el artifact de diseño: objetivo/deporte → edad/sexo/nivel → frecuencia →
   ¿sabés cuánto levantás o calibramos?
2. Levantar Supabase local (`npm run db:start`, necesita Docker) y aplicar el esquema — sigue sin
   probarse contra una base real.
3. Panel admin para cargar el catálogo.
4. Decisión de paleta (ver `docs/07-marca-blue-horse.md`) — bloqueada, es del usuario.

### Trabas conocidas

- **Node**: el sistema tiene 22.3.0. Hay un Node 24.20.0 portable en `%LOCALAPPDATA%\node24` —
  hay que anteponerlo al PATH en cada sesión de shell nueva.
- El bundle de producción crece con cada feature (motion + auth ya suman peso). Cuando existan
  rutas reales de fase 2, separar por `React.lazy()` en vez de un solo bundle.
- El catálogo de Blue Horse sigue sin cargar: sin eso el motor no puede armar una sesión real, y
  el onboarding no tiene equipamiento real contra el cual calibrar.
- Loop autónomo corriendo cada 15 min (`CronCreate` job `f04a93b3`, session-only, expira en 7 días
  o al cerrar esta sesión). Si esta sesión se cierra, el loop se corta — no hay trabajo en curso
  perdido porque cada pasada cierra con commit.
