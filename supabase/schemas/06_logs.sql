-- LO QUE REALMENTE HIZO — nunca pisa al plan.
-- La diferencia entre plan_session_items y set_logs es la señal que alimenta
-- la adaptación. Si se sobrescribe el plan con lo ejecutado, esa señal se pierde.

create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  plan_session_id uuid references plan_sessions (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  /* Check-in previo. Opcional y salteable: es la pregunta que más se ignora. */
  pre_sleep smallint check (pre_sleep between 1 and 5),
  pre_energy smallint check (pre_energy between 1 and 5),
  /* Cierre de sesión. */
  session_feel session_feel,
  session_rpe smallint check (session_rpe between 1 and 10),
  notes text,
  /* Clave de idempotencia generada en el teléfono. Ancla de la cola offline:
     si el envío se reintenta, no se duplica la sesión. */
  client_id text not null unique,
  created_at timestamptz not null default now()
);

create index workout_logs_user_idx on workout_logs (user_id, started_at desc);

create table set_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references workout_logs (id) on delete cascade,
  plan_session_item_id uuid references plan_session_items (id) on delete set null,
  exercise_id uuid not null references exercises (id) on delete restrict,
  equipment_id uuid references equipment (id) on delete set null,
  set_index smallint not null,

  /* CRUDO: lo que dice la máquina. Es lo único que se le muestra al usuario. */
  load_value numeric(7, 2),
  load_unit load_unit not null,
  /* NORMALIZADO: solo para gráficos y comparaciones. null cuando no se puede
     convertir sin inventar (pin sin tabla de kg, banda, peso corporal). */
  load_kg_normalized numeric(7, 2),

  reps smallint,
  reps_target smallint,
  rir smallint check (rir between 0 and 10),
  duration_seconds integer,
  distance_meters numeric(8, 2),
  rest_prescribed_seconds smallint,
  /* Lo que descansó de verdad. Si cortó antes, es dato, no error. */
  rest_actual_seconds smallint,
  is_warmup boolean not null default false,
  completed_at timestamptz not null default now(),
  client_id text not null unique
);

create index set_logs_progress_idx on set_logs (exercise_id, completed_at desc);
create index set_logs_session_idx on set_logs (workout_log_id, set_index);

-- Por qué la sesión se desvió del plan. A los seis meses, "esta máquina está
-- siempre ocupada a las 19" es un dato que le podés vender al gimnasio.
create table session_events (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references workout_logs (id) on delete cascade,
  type text not null check (type in ('machine_occupied', 'substituted', 'reordered', 'skipped_exercise')),
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index session_events_type_idx on session_events (type, occurred_at desc);

-- Dato de salud: entra en la política de privacidad y no se comparte con el gimnasio.
create table pain_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  workout_log_id uuid references workout_logs (id) on delete set null,
  exercise_id uuid references exercises (id) on delete set null,
  body_region body_region not null,
  severity smallint not null check (severity between 1 and 5),
  note text,
  reported_at timestamptz not null default now()
);

create index pain_reports_user_idx on pain_reports (user_id, reported_at desc);
