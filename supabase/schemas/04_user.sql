-- Perfil de entrenamiento: qué quiere, qué no puede, de dónde parte.

create table user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  goal training_goal not null,
  /* Deporte que practica, si el objetivo es de transferencia. */
  sport text,
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

-- "Asiento en 4, respaldo en 2". Detalle chico que ahorra un minuto por ejercicio.
create table user_equipment_settings (
  user_id uuid not null references profiles (id) on delete cascade,
  equipment_id uuid not null references equipment (id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, equipment_id)
);
