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

-- Cribado previo a entrenar (PAR-Q+) y aceptación del aviso legal.
--
-- Vive acá y no en `04_user.sql` porque necesita la FK a `rulesets`, que se crea
-- en este archivo: los schemas se aplican en orden alfabético.
--
-- Una fila por vez que se responde: no se pisa la anterior. Si alguien pasa de
-- "sin problemas" a "el médico me dijo que tengo la presión alta", queda el
-- registro de las dos respuestas y de cuándo cambió.
--
-- `cleared = false` significa frenar hasta tener autorización médica. La app lo
-- respeta como un gate, igual que `onboarded_at`.
create table health_screenings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  /* Con qué ruleset se hizo: las preguntas salen de ahí y pueden cambiar. Sin
     esto no se sabe qué se le preguntó exactamente a esta persona. */
  ruleset_version text not null references rulesets (version),
  /* { "chest_pain_activity": true, ... } — id de pregunta a respuesta. */
  answers jsonb not null,
  /* false = respondió que sí a algo bloqueante: necesita visto bueno médico. */
  cleared boolean not null,
  /* Cuándo aceptó el aviso legal. Se vuelve a pedir cada tantos meses. */
  disclaimer_accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index health_screenings_user_idx on health_screenings (user_id, created_at desc);

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
  generated_at timestamptz not null default now(),
  /* Lo que el motor avisó al armar este plan: patrones sin cubrir, volumen
     semanal por debajo del mínimo con la frecuencia elegida. Antes vivía solo
     en memoria — se veía una vez en la vista previa y se perdía para
     siempre. Guardarlo es lo que permite mostrarlo de nuevo mientras el socio
     entrena bajo este plan, no solo en el momento de armarlo (regla dura 4:
     la evidencia se muestra como es, y un hueco de volumen no dicho es
     mentir por omisión igual que un ruleset placeholder sin marcar). */
  warnings text[] not null default '{}'
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

  /* Cardio: no entra en series y repeticiones. Un bloque continuo se prescribe
     por duración y zona de intensidad; uno de intervalos, por trabajo/descanso
     por vuelta. Nulos en todo lo que es trabajo de sala.
     `target_duration_seconds` vale para los dos: en intervalos es la duración
     del bloque de trabajo de cada vuelta. */
  target_duration_seconds integer check (target_duration_seconds > 0),
  target_intensity_zone smallint check (target_intensity_zone between 1 and 5),
  target_interval_rest_seconds integer check (target_interval_rest_seconds > 0),

  unique (plan_session_id, order_index)
);
