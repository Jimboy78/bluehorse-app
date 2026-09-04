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
