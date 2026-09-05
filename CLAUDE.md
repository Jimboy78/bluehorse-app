# Blue Horse

PWA instalable de entrenamiento adaptativo para socios de **Blue Horse Gym** (Islas Malvinas 370
BIS, Arroyo Seco, Santa Fe). Genera y ajusta planes usando **solo el equipamiento que existe
físicamente en el gimnasio**, catalogado a mano con fotos.

Stack: React 19 + TypeScript + Vite (PWA) · Supabase (Postgres, Auth, Storage) · Biome · Vitest.
Monorepo con workspaces de npm.

**No es**: una app de nutrición, ni un plan fijo que se arma una vez, ni una app que sirva para un
gimnasio cuyo equipamiento no esté cargado.

## Estado

Fase 1 del roadmap: esqueleto y catálogo. **Todo el contenido de prescripción es provisorio** hasta
que exista un ruleset con `source: "research"`. Nada de lo que hoy devuelve el motor sirve como
consejo para una persona real.

## Comandos

```bash
npm run check        # lint + typecheck + tests. Correr antes de cerrar cualquier tarea.
npm run dev          # PWA en :5173
npm run db:start     # Supabase local (necesita Docker)
npm run db:reset     # recrea la base local desde schemas/ + seed.sql
npm run db:types     # regenera packages/domain/src/database.types.ts
```

Node mínimo **22.12** (probado con 24 LTS). Con una versión menor, Vite y Vitest no arrancan.

## Estructura y dirección de las dependencias

```
packages/domain   tipos, enums, zod, conversión de unidades → no importa nada del proyecto
packages/engine   contrato del motor + implementación placeholder → solo importa @bh/domain
apps/web          la PWA → importa @bh/domain y @bh/engine
supabase/schemas  fuente de verdad del esquema; las migraciones se generan desde acá
```

La flecha va en un solo sentido. Si el motor parece necesitar leer la base, el problema está
planteado al revés: cargá los datos en `apps/web` y pasáselos como argumento.

## Convenciones

- **Base**: `snake_case`, tablas en plural. **TypeScript**: `camelCase`, tipos en `PascalCase`.
  La traducción entre ambos vive solo en `apps/web/src/lib/mappers/`.
- **Idioma**: código, tablas y commits en inglés. Texto visible al usuario y documentación en
  castellano rioplatense (voseo).
- **Validación**: zod en los bordes (Supabase, formularios, ruleset). Adentro se confía en los tipos.
- **Fechas**: `timestamptz` en la base, UTC en el código. La zona del gimnasio solo al formatear.
- Nada de `any`. Lo desconocido es `unknown` y se valida.

## Reglas duras

Romper cualquiera de estas obliga a rehacer arquitectura. Si una tarea parece exigirlo, preguntá
antes de hacerlo.

1. **El motor es puro.** `packages/engine` y `packages/domain` no importan React ni Supabase, no
   leen la hora del sistema, no usan `Math.random`, no hacen `fetch`, no leen variables de entorno.
   Si el motor necesita la fecha o azar, se le pasan por parámetro.
2. **Ningún número de entrenamiento vive en el código.** Series, repeticiones, RIR, descansos,
   porcentajes, umbrales de descarga: todo sale del ruleset. Un `3` que significa "3 series" es un
   bug.
3. **Lo derivado de un ruleset `placeholder` se muestra marcado como provisorio**, y cada plan
   guarda el `rulesetVersion` con el que se generó.
4. **`gym_id` en toda tabla de negocio**, aunque hoy haya un solo gimnasio.
5. **La carga se guarda cruda y normalizada.** `load_value` + `load_unit` es lo que dice la máquina
   y es lo único que se le muestra al usuario. `load_kg_normalized` existe solo para gráficos, y es
   `null` cuando no se puede convertir sin inventar (pin sin tabla de kg, banda, peso corporal).
6. **Planificado y real son tablas distintas.** `plan_session_items` es lo que el motor propuso;
   `set_logs` es lo que la persona hizo. La diferencia entre ambos es la señal que alimenta la
   adaptación: si se pisan, se pierde.

## Trampas conocidas

- **Convertir libras a kilos en el input.** El socio vuelve al día siguiente, lee 45 en el disco y
  la app le muestra 20,4. Se guarda crudo y se muestra crudo.
- **Atar sesiones a días de la semana.** La gente falta y aparecen "sesiones vencidas". El plan es
  una cola ordenada por `sequence_index`, sin fechas: hoy toca la primera pendiente.
- **Tratar ejercicio y máquina como la misma cosa.** Son N:N. Sin eso no se puede sustituir cuando
  la máquina está ocupada, que es la única función que justifica el trabajo del catálogo.
- **Progresar por porcentaje en una máquina de pin.** No existe medio pin: se sube un nivel. Lo
  resuelve `nextLoad()` en `packages/domain/src/load.ts`; no lo reimplementes.
- **Service worker con `autoUpdate`.** Recargaría la app en medio de una serie. Está en `prompt` a
  propósito.
- **Una query de TanStack Query con `enabled: false` se queda en `isPending: true` para siempre.**
  Pasó dos veces en la misma sesión: un componente `RequireX` que chequea `query.isPending` antes
  que `auth.status` se cuelga en el spinner cuando Supabase no está configurado (la query queda
  deshabilitada y nunca resuelve). Todo gate nuevo chequea `status !== 'signed-in'` primero.
- **`supabase db diff` no lee `schema_paths` desde la CLI ≥ 2.116.** El comando correcto es
  `npm run db:sync` (`supabase db schema declarative sync --apply`). Y esa sincronización rechaza
  `INSERT` sobre tablas de sistema (`storage.buckets`, etc.): los inserts van en `seed.sql`, las
  políticas (`CREATE POLICY`) sí son DDL y van en `schemas/`.

## Documentación

- `docs/01-arquitectura.md` — decisiones de stack y por qué
- `docs/02-modelo-datos.md` — las tablas y las cuatro decisiones de modelado
- `docs/03-contrato-motor.md` — la frontera con la investigación de contenido
- `docs/04-glosario.md` — RIR, deload, patrón de movimiento, cola
- `docs/05-relevamiento-catalogo.md` — cómo se releva el gimnasio
- `docs/06-roadmap.md` — fases y qué se entrega en cada una
- `docs/ESTADO.md` — dónde quedó el trabajo. **Actualizalo al terminar una sesión larga.**
- `docs/adr/` — decisiones puntuales, una por archivo

Los procedimientos largos están en skills, no acá: `cambiar-esquema`, `activar-ruleset`,
`cargar-catalogo`. Para revisar cambios antes de commitear existe el agente `revisor`.
