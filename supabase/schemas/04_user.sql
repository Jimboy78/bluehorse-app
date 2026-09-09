-- Perfil de entrenamiento: qué quiere, qué no puede, de dónde parte.

create table user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  goal training_goal not null,
  /* Deporte que practica, si el objetivo es de transferencia. */
  -- Id de una entrada de `sports.catalog` del ruleset, no texto libre: un
  -- string suelto no se puede mapear y el motor lo ignoraría en silencio.
  sport text,
  -- Momento de la temporada. Mueve volumen, nunca selección ni intensidad.
  -- Solo se le pregunta a quien compite; el resto queda en 'none'.
  season_phase season_phase not null default 'none',
  priority smallint not null default 1,
  sessions_per_week_target smallint not null check (sessions_per_week_target between 1 and 7),
  session_minutes_target smallint not null default 60 check (session_minutes_target between 15 and 180),
  is_active boolean not null default true,
  started_at timestamptz not null default now()
);

create index user_goals_active_idx on user_goals (user_id) where is_active;

create table user_constraints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  type constraint_type not null,
  body_region body_region,
  exercise_id uuid references exercises (id) on delete cascade,
  equipment_id uuid references equipment (id) on delete cascade,
  severity smallint not null default 3 check (severity between 1 and 5),
  note text,
  active_from timestamptz not null default now(),
  active_to timestamptz
);

create index user_constraints_active_idx on user_constraints (user_id)
  where active_to is null;

-- Punto de partida por ejercicio. Cubre las dos ramas del onboarding:
-- 'declared' = el usuario ya sabe cuánto levanta.
-- 'calibrated' = lo dedujo la app en las primeras sesiones a partir del RIR.
create table user_baselines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete cascade,
  source baseline_source not null,
  load_value numeric(7, 2),
  load_unit load_unit not null,
  load_kg_normalized numeric(7, 2),
  reps smallint,
  recorded_at timestamptz not null default now()
);

create unique index user_baselines_current_idx on user_baselines (user_id, exercise_id, recorded_at desc);

-- Peso y altura. Append-only, igual que `user_baselines`: el peso cambia, y la
-- serie de mediciones ES el dato en un objetivo de recomposición. Un UPDATE
-- sobre una fila única borraría justo eso.
--
-- La altura viaja en la misma fila y no en `profiles` porque se toma en el
-- mismo momento que el peso; en un adulto no cambia, pero repetirla es más
-- barato que tener el dato partido en dos tablas y desincronizado.
--
-- Se guarda en kg y cm SIEMPRE. No es la trampa de la regla dura 6: eso es
-- sobre la carga que muestra una máquina, que se lee de una placa y se anota
-- cruda. Acá el socio elige la unidad al escribir y la app convierte una vez;
-- una balanza en libras se lee igual en kg y nadie vuelve a la balanza a
-- comparar contra lo que dice la app.
create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  gym_id uuid not null references gyms (id) on delete restrict,
  weight_kg numeric(5, 2) check (weight_kg between 25 and 350),
  height_cm numeric(5, 1) check (height_cm between 100 and 250),
  recorded_at timestamptz not null default now()
);

create index body_metrics_recent_idx on body_metrics (user_id, recorded_at desc);

-- "Asiento en 4, respaldo en 2". Detalle chico que ahorra un minuto por ejercicio.
create table user_equipment_settings (
  user_id uuid not null references profiles (id) on delete cascade,
  equipment_id uuid not null references equipment (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, equipment_id)
);
