-- ROW LEVEL SECURITY
--
-- Regla general: cada socio ve solo sus datos. El catálogo lo lee todo el
-- gimnasio y lo escribe solo staff/admin. Los datos de salud (dolor) no se
-- comparten con el gimnasio ni siquiera con rol admin.

alter table gyms enable row level security;
alter table profiles enable row level security;
alter table equipment enable row level security;
alter table exercises enable row level security;
alter table exercise_equipment enable row level security;
alter table exercise_substitutions enable row level security;
alter table user_goals enable row level security;
alter table user_constraints enable row level security;
alter table user_baselines enable row level security;
alter table user_equipment_settings enable row level security;
alter table rulesets enable row level security;
alter table plans enable row level security;
alter table plan_sessions enable row level security;
alter table plan_session_items enable row level security;
alter table workout_logs enable row level security;
alter table set_logs enable row level security;
alter table session_events enable row level security;
alter table pain_reports enable row level security;
alter table adaptation_proposals enable row level security;
alter table personal_records enable row level security;

-- ---------------------------------------------------------------- gimnasio

create policy "socios ven su gimnasio" on gyms
  for select to authenticated using (id = current_gym_id());

create policy "cada uno ve su perfil" on profiles
  for select to authenticated using (id = auth.uid() or is_gym_admin());

create policy "cada uno edita su perfil" on profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------- catálogo

create policy "el gimnasio lee su equipamiento" on equipment
  for select to authenticated using (gym_id = current_gym_id());

create policy "solo staff edita equipamiento" on equipment
  for all to authenticated using (is_gym_admin() and gym_id = current_gym_id())
  with check (is_gym_admin() and gym_id = current_gym_id());

create policy "ejercicios globales y del gimnasio" on exercises
  for select to authenticated using (gym_id is null or gym_id = current_gym_id());

create policy "solo staff edita ejercicios" on exercises
  for all to authenticated using (is_gym_admin()) with check (is_gym_admin());

create policy "lectura del mapeo ejercicio-equipamiento" on exercise_equipment
  for select to authenticated using (true);

create policy "solo staff edita el mapeo" on exercise_equipment
  for all to authenticated using (is_gym_admin()) with check (is_gym_admin());

create policy "lectura de sustituciones" on exercise_substitutions
  for select to authenticated using (true);

create policy "solo staff edita sustituciones" on exercise_substitutions
  for all to authenticated using (is_gym_admin()) with check (is_gym_admin());

-- ---------------------------------------------------------------- contenido

create policy "todos leen el ruleset activo" on rulesets
  for select to authenticated using (is_active);

create policy "solo admin escribe rulesets" on rulesets
  for all to authenticated using (is_gym_admin()) with check (is_gym_admin());

-- ------------------------------------------------- datos propios del socio

create policy "objetivos propios" on user_goals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "restricciones propias" on user_constraints
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "baselines propios" on user_baselines
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "ajustes de maquina propios" on user_equipment_settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "planes propios" on plans
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "sesiones del plan propio" on plan_sessions
  for all to authenticated
  using (exists (select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from plans p where p.id = plan_id and p.user_id = auth.uid()));

create policy "items del plan propio" on plan_session_items
  for all to authenticated
  using (exists (
    select 1 from plan_sessions s join plans p on p.id = s.plan_id
    where s.id = plan_session_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from plan_sessions s join plans p on p.id = s.plan_id
    where s.id = plan_session_id and p.user_id = auth.uid()
  ));

create policy "sesiones propias" on workout_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "series propias" on set_logs
  for all to authenticated
  using (exists (select 1 from workout_logs w where w.id = workout_log_id and w.user_id = auth.uid()))
  with check (exists (select 1 from workout_logs w where w.id = workout_log_id and w.user_id = auth.uid()));

create policy "eventos propios" on session_events
  for all to authenticated
  using (exists (select 1 from workout_logs w where w.id = workout_log_id and w.user_id = auth.uid()))
  with check (exists (select 1 from workout_logs w where w.id = workout_log_id and w.user_id = auth.uid()));

-- Dato de salud: sin excepción para admin.
create policy "dolor: solo el propio socio" on pain_reports
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "propuestas propias" on adaptation_proposals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "records propios" on personal_records
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
