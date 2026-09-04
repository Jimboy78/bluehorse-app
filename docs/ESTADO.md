# Estado del trabajo

Este archivo reemplaza al resumen automático de sesión: vive en disco, sobrevive a `/clear` y se
puede leer desde cualquier sesión nueva. **Actualizalo al terminar una sesión larga.**

---

## Última actualización: 4 de septiembre de 2026

### Dónde quedó

Fase 1 del roadmap, a mitad. Está armado y verificado el esqueleto completo:

- Monorepo con workspaces (`packages/domain`, `packages/engine`, `apps/web`), Biome, Vitest,
  lefthook, CI en GitHub Actions.
- **Motor de prescripción funcionando** con ruleset provisorio: genera planes, propone progresiones
  y busca sustitutos. 27 tests en verde.
- **Esquema completo** en `supabase/schemas/` con RLS en todas las tablas. **Todavía no se aplicó
  contra una base real**: falta correr `npm run db:start` (necesita Docker levantado).
- PWA que compila, con service worker y cola offline.

### Verificado

`npm run check` (lint + typecheck + 27 tests) y `npm run build` pasan con Node 24.20.0.

### Lo próximo, en orden

1. Levantar Supabase local (`npm run db:start`) y aplicar el esquema. Es lo único del esqueleto que
   no está probado contra una base de verdad.
2. Auth con Google y email, y el onboarding mínimo.
3. Panel admin para cargar el catálogo.

### Trabas conocidas

- **Node**: el sistema tiene 22.3.0, que es demasiado viejo. Hay un Node 24.20.0 portable en
  `%LOCALAPPDATA%\node24`. Para usarlo, agregá esa carpeta al PATH antes que la instalación vieja, o
  instalá Node 24 LTS desde nodejs.org.
- El bundle pesa 631 kB (183 kB comprimido) porque entra todo junto. Cuando haya pantallas de
  verdad, hay que separar por rutas.
- El catálogo de Blue Horse no está cargado: sin eso el motor no puede armar una sesión real.
