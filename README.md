# Blue Horse

App de entrenamiento adaptativo para **Blue Horse Gym** (Arroyo Seco, Santa Fe). Genera y ajusta
planes usando solo el equipamiento que existe físicamente en el gimnasio.

> **Contenido provisorio.** Todos los valores de entrenamiento que hoy devuelve la app son
> marcadores de posición mientras se termina la investigación de contenido. No sirven como consejo
> para una persona real.

## Arrancar

Necesitás **Node 22.12 o mayor** (probado con 24 LTS) y, para la base local, **Docker**.

```bash
npm install
cp .env.example .env      # completá las variables

npx supabase init         # una sola vez: genera supabase/config.toml
npm run db:start          # levanta Postgres local e imprime las claves
npm run db:reset          # aplica supabase/schemas/ + seed.sql

npm run dev               # http://localhost:5173
```

Para que la CLI use los esquemas declarativos, `supabase/config.toml` necesita:

```toml
[db.migrations]
schema_paths = ["./schemas/*.sql"]
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | PWA en `:5173` |
| `npm run check` | lint + typecheck + tests |
| `npm run build` | build de producción con service worker |
| `npm run db:reset` | recrea la base local desde `schemas/` + `seed.sql` |
| `npm run db:diff -- nombre` | genera una migración desde los esquemas |
| `npm run db:types` | regenera los tipos de TypeScript desde la base |
| `npm run db:ruleset` | sube el ruleset a la base y lo deja activo |

## Estructura

```
packages/domain    tipos, enums, zod, conversión de unidades. Sin dependencias del proyecto.
packages/engine    contrato del motor de prescripción + implementación provisoria.
apps/web           la PWA.
supabase/schemas   fuente de verdad del esquema. Las migraciones se generan desde acá.
docs/              arquitectura, modelo de datos, glosario, roadmap y decisiones.
```

`packages/` no importa React ni Supabase: el motor es una función pura, testeable y reemplazable.
Por qué, en `docs/03-contrato-motor.md`.

## Deploy de prueba

**https://bluehorse-app.vercel.app** — build de Vercel apuntando a `main`, sin variables de
entorno configuradas todavía. Muestra el dashboard de estado y la vista previa de animaciones;
sin `.env` no hay auth real (la pantalla lo indica en vez de romperse). La configuración de build
está en `vercel.json` — necesaria porque es un monorepo con npm workspaces: instalar solo desde
`apps/web` rompe la resolución de `@bh/domain`/`@bh/engine`.

Para verificar cambios mientras se desarrolla, usar `npm run dev` (local, con HMR) y reservar el
deploy de Vercel para compartir avances — cada push a `main` redeploya solo.

## Estado

Fase 1 de 4: esqueleto y catálogo. Ver `docs/06-roadmap.md` y `docs/ESTADO.md`.
