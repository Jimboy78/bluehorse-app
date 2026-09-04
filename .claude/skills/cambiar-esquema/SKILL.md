---
name: cambiar-esquema
description: Cómo cambiar el esquema de la base sin romperla. Usar cuando haya que agregar, modificar o borrar tablas, columnas, tipos o políticas RLS en Supabase.
---

# Cambiar el esquema de la base

El esquema es **declarativo**: los archivos de `supabase/schemas/` son la fuente de verdad y las
migraciones se generan a partir de ellos. Nunca al revés.

## El flujo, en orden

1. **Editá el archivo de `supabase/schemas/` que corresponda.** Se aplican en orden alfabético, así
   que las dependencias tienen que respetarlo (`01_types` antes que `03_catalog`).
2. **Columnas nuevas van al final de la tabla.** Insertarlas en el medio genera diffs enormes y
   rompe las vistas.
3. Generá la migración:
   ```bash
   npm run db:diff -- nombre_descriptivo_en_snake_case
   ```
4. **Leé la migración generada** antes de aplicarla. Un `drop column` o un `alter type` sobre datos
   existentes es destructivo y la CLI no te va a avisar.
5. Aplicala y verificá:
   ```bash
   npm run db:reset      # recrea la base local desde schemas/ + seed.sql
   npm run db:types      # regenera los tipos de TypeScript
   npm run check
   ```

## Lo que no se hace nunca

- Editar a mano un archivo de `supabase/migrations/`. Ya se aplicó en algún lado.
- Tocar la base desde el SQL editor de Studio: `db diff` compara contra los archivos de `schemas/`,
  no contra la base, así que ese cambio se pierde en el próximo diff.
- Crear una tabla de negocio sin `gym_id`.
- Crear una tabla sin `enable row level security` y sin políticas. Una tabla con RLS activo y sin
  políticas no devuelve nada; una tabla sin RLS la lee cualquiera con la clave anon.

## Al agregar una tabla, revisá los cuatro

1. `gym_id` o una cadena de claves foráneas que llegue a uno.
2. `alter table ... enable row level security` en `08_rls.sql`.
3. Políticas de lectura y de escritura, separadas si los permisos difieren.
4. Índice sobre las columnas por las que se filtra de verdad (casi siempre `user_id` + una fecha).

## Si el cambio toca un enum

Los enums de `01_types.sql` son espejo de `packages/domain/src/enums.ts`. Si cambia uno, cambian los
dos en el mismo commit, o el motor va a recibir valores que no sabe manejar.
