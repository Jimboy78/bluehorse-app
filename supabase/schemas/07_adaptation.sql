-- ADAPTACIÓN — el motor propone, el usuario confirma.
-- Guardar la respuesta sirve para dos cosas: que el socio sienta que manda él,
-- y que vos puedas medir si el motor acierta antes de venderlo.

create table adaptation_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  plan_id uuid not null references plans (id) on delete cascade,
  type proposal_type not null,
  /* A qué apunta: {"exerciseId": "..."} o {"planId": "..."}. */
  target_ref jsonb not null,
  from_value text,
  to_value text,
  /* Código estable para métricas: rir_above_target, missed_reps, stalled, absence. */
  reason_code text not null,
  /* El motivo en castellano, tal cual se le muestra al socio. */
  reason_text text not null,
  ruleset_version text not null references rulesets (version),
  status proposal_status not null default 'pending',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index proposals_pending_idx on adaptation_proposals (user_id, created_at desc)
  where status = 'pending';

-- Detección de récords. Barato de calcular y es el momento que hace volver a la gente.
create table personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete cascade,
  type text not null check (type in ('max_load', 'max_reps', 'max_volume', 'est_1rm')),
  value numeric(9, 2) not null,
  set_log_id uuid references set_logs (id) on delete set null,
  achieved_at timestamptz not null default now()
);

create index personal_records_user_idx on personal_records (user_id, achieved_at desc);
