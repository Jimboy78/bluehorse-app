-- EL PLAN — lo genera el motor a partir de un ruleset.

-- Todo el contenido de prescripción vive acá, versionado.
-- Cuando termine la investigación: se inserta una fila con source='research'
-- y se activa. No cambia el esquema ni el código.
create table rulesets (
  version text primary key,
  source ruleset_source not null,
  content jsonb not null,
  is_active boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- Solo puede haber un ruleset activo a la vez.
create unique index rulesets_single_active_idx on rulesets ((true)) where is_active;

create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  gym_id uuid not null references gyms (id) on delete cascade,
  /* Con qué contenido se generó. Sin esto no se puede reproducir un plan ni
     comparar contra el que se genere con el contenido real. */
  ruleset_version text not null references rulesets (version),
  template_id text not null,
  goal_snapshot jsonb not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  generated_at timestamptz not null default now()
);

create unique index plans_one_active_per_user_idx on plans (user_id) where status = 'active';

-- LA COLA. Sin fecha a propósito: "hoy" es la primera pendiente.
-- Atar sesiones a días de la semana genera "sesiones vencidas" cuando el socio
-- falta, que es el problema que hace que la gente abandone la app.
create table plan_sessions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans (id) on delete cascade,
  sequence_index smallint not null,
  label text not null,
  focus text not null,
  estimated_minutes smallint not null,
  status session_status not null default 'pending',
  completed_at timestamptz,
  unique (plan_id, sequence_index)
);

create index plan_sessions_queue_idx on plan_sessions (plan_id, sequence_index)
  where status = 'pending';

create table plan_session_items (
  id uuid primary key default gen_random_uuid(),
  plan_session_id uuid not null references plan_sessions (id) on delete cascade,
  /* Orden SUGERIDO. El socio hace el que esté libre: no es obligatorio. */
  order_index smallint not null,
  exercise_id uuid not null references exercises (id) on delete restrict,
  equipment_id uuid references equipment (id) on delete set null,
  target_sets smallint not null,
  target_reps_min smallint not null,
  target_reps_max smallint not null,
  target_load numeric(7, 2),
  target_load_unit load_unit,
  target_rir smallint,
  rest_seconds smallint not null,
  /* El "por qué va acá" que se muestra en la lista de la sesión. */
  rationale text not null,
  /* true mientras el ruleset que lo generó sea placeholder. */
  is_placeholder boolean not null default true,
  superset_group smallint,
  unique (plan_session_id, order_index)
);
