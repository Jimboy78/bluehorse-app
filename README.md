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
cp .env.example .env      # completá las variables (npm run db:start te las imprime)

npx supabase init         # una sola vez: genera supabase/config.toml (ya versionado en el repo)
npm run db:start          # levanta Postgres local e imprime las claves
npm run db:sync           # genera y aplica la migración inicial desde supabase/schemas/
npm run db:reset          # aplica migrations/ + seed.sql desde cero, para verificar

npm run dev               # http://localhost:5173
```

`supabase/config.toml` ya tiene `schema_paths = ["./schemas/*.sql"]` configurado — no hace falta
tocarlo. Ese setting le dice a `db:sync` (no a `db diff`, que en CLI ≥ 2.116 dejó de leerlo) dónde
están los esquemas declarativos.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | PWA en `:5173` |
| `npm run check` | lint + typecheck + tests |
| `npm run build` | build de producción con service worker |
| `npm run db:reset` | recrea la base local desde `migrations/` + `seed.sql` |
| `npm run db:sync` | genera y aplica una migración desde `supabase/schemas/` |
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
entorno configuradas todavía. Sin `.env` la app no rompe: cada pantalla lo indica en su lugar
("Supabase no está configurado") en vez de tirar un error. El panel técnico de configuración
(`import.meta.env.DEV`) no sale en esta build — eso es solo para desarrollo local. La
configuración de build está en `vercel.json` — necesaria porque es un monorepo con npm
workspaces: instalar solo desde `apps/web` rompe la resolución de `@bh/domain`/`@bh/engine`. El
mismo archivo tiene el rewrite de SPA que hace falta para que rutas como `/instalar` o `/progreso`
no den 404 al navegarlas directo (por ejemplo, al escanear el QR del gimnasio).

Para verificar cambios mientras se desarrolla, usar `npm run dev` (local, con HMR) y reservar el
deploy de Vercel para compartir avances — cada push a `main` redeploya solo.

## Estado

Fases 1, 2 y 3 completas (esqueleto y catálogo, motor y sesión, adaptación/progreso/offline) salvo
el relevamiento real del catálogo de Blue Horse, que es un paso manual del dueño del proyecto, no
de código. Fase 4 (contenido real de entrenamiento) espera esa investigación. Ver `docs/06-roadmap.md`
y `docs/ESTADO.md` para el detalle.
