-- CATÁLOGO DEL GIMNASIO — lo cargás vos con fotos.
--
-- Decisión central: un ejercicio NO es una máquina. El ejercicio es un patrón
-- ejecutable ("press horizontal"); la máquina es un fierro que existe en Blue
-- Horse. La relación es N:N. Eso permite sustituir cuando está ocupada, que la
-- investigación hable de patrones sin conocer este gimnasio, y que sumar un
-- segundo gimnasio sea mapear su equipamiento y nada más.

create table equipment (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references gyms (id) on delete cascade,
  name text not null,
  category equipment_category not null,
  brand text,
  model text,
  photo_url text,
  /* Dónde está, en castellano: "fondo a la derecha, al lado de las poleas". */
  location_note text,
  /* Ajustes de la estación: "asiento 5 posiciones, respaldo regulable". */
  setup_notes text,

  -- Cómo carga esta estación en particular.
  load_unit load_unit not null,
  load_min numeric(7, 2),
  load_max numeric(7, 2),
  /* Escalón mínimo REAL: 2.5 kg de disco, 5 lb de placa, 1 nivel de pin. */
  load_increment numeric(7, 2),
  /* Para pines: kg reales de cada nivel, en orden. Si está vacío, la carga de
     esta estación no se puede normalizar a kg y los gráficos lo omiten. */
  stack_kg numeric(7, 2)[],
  /* Peso de la barra, el carro o la plataforma, para estaciones con discos. */
  base_weight_kg numeric(7, 2),

  /* Cuántas unidades idénticas hay. Define si dos socios la usan a la vez. */
  quantity smallint not null default 1 check (quantity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint equipment_range_ok check (load_max is null or load_min is null or load_max >= load_min)
);

create index equipment_gym_idx on equipment (gym_id) where is_active;

create table exercises (
  id uuid primary key default gen_random_uuid(),
  /* null = ejercicio global, reutilizable en cualquier gimnasio. */
  gym_id uuid references gyms (id) on delete cascade,
  name text not null,
  pattern movement_pattern not null,
  primary_muscles muscle_group[] not null default '{}',
  secondary_muscles muscle_group[] not null default '{}',
  modality exercise_modality not null default 'reps_weight',
  is_compound boolean not null default false,
  is_unilateral boolean not null default false,
  skill_level experience_level not null default 'beginner',
  /* Indicaciones de ejecución, en castellano. */
  cues text,
  media_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index exercises_pattern_idx on exercises (pattern) where is_active;
create index exercises_gym_idx on exercises (gym_id);

-- En qué estaciones se puede hacer cada ejercicio.
create table exercise_equipment (
  exercise_id uuid not null references exercises (id) on delete cascade,
  equipment_id uuid not null references equipment (id) on delete cascade,
  is_primary boolean not null default false,
  primary key (exercise_id, equipment_id)
);

-- Equivalencias curadas a mano, para el flujo de "máquina ocupada".
-- Lo que no esté acá, el motor lo calcula por patrón y músculos.
create table exercise_substitutions (
  exercise_id uuid not null references exercises (id) on delete cascade,
  substitute_id uuid not null references exercises (id) on delete cascade,
  equivalence numeric(3, 2) not null check (equivalence between 0 and 1),
  note text,
  primary key (exercise_id, substitute_id),
  constraint no_self_substitution check (exercise_id <> substitute_id)
);
