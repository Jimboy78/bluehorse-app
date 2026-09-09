-- Gimnasios y personas.
-- gym_id existe desde el día 1 aunque hoy haya un solo gimnasio: agregarlo
-- después obliga a reescribir cada query y cada política de acceso.

create table gyms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  /* Código que el socio escribe o escanea para asociarse a este gimnasio. */
  join_code text unique,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  gym_id uuid not null references gyms (id) on delete restrict,
  display_name text not null,
  birth_date date,
  sex sex not null default 'undisclosed',
  experience_level experience_level not null default 'beginner',
  /* Unidad preferida SOLO para totales y gráficos. La carga de cada serie se
     muestra siempre en la unidad de la máquina. */
  units_preference text not null default 'kg' check (units_preference in ('kg', 'lb')),
  role member_role not null default 'member',
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create index profiles_gym_idx on profiles (gym_id);

-- Alta automática del perfil cuando se crea la cuenta.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target_gym uuid;
begin
  select id into target_gym from gyms
  where join_code = new.raw_user_meta_data ->> 'join_code'
  limit 1;

  if target_gym is null then
    select id into target_gym from gyms order by created_at limit 1;
  end if;

  insert into profiles (id, gym_id, display_name)
  values (
    new.id,
    target_gym,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

/* Las columnas de privilegio no las mueve su dueño.

   La política de RLS que deja a cada uno editar su perfil comprueba QUIÉN
   edita (`id = auth.uid()`), nunca QUÉ columnas toca — y `role` y `gym_id`
   viven en esta misma tabla. Sin esto, cualquier socio autenticado podía
   correr `update profiles set role = 'admin' where id = auth.uid()` y quedar
   como administrador del gimnasio, o mudarse a otro gimnasio cambiando su
   `gym_id`. Un `with check` no alcanza: la fila resultante sigue siendo suya,
   que es lo único que esa cláusula sabe mirar.

   Un admin sí puede cambiarle el rol a otro; lo que se bloquea es
   promoverse a uno mismo. `security definer` para que `is_gym_admin()` lea la
   fila vieja sin toparse con la política de lectura. */
create function guard_profile_privileges() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not is_gym_admin() then
    raise exception 'El rol de un perfil no se cambia desde la aplicación.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.gym_id is distinct from old.gym_id and not is_gym_admin() then
    raise exception 'El gimnasio de un perfil no se cambia desde la aplicación.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$$;

create trigger profiles_guard_privileges
  before update on profiles
  for each row execute function guard_profile_privileges();

-- Helpers usados por las políticas de RLS.
create function current_gym_id() returns uuid
language sql stable security definer set search_path = public as $$
  select gym_id from profiles where id = auth.uid();
$$;

create function is_gym_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('staff', 'admin')
  );
$$;
