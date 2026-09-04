-- Datos base para desarrollo local. Se aplica con `npm run db:reset`.
--
-- Acá va SOLO lo que es cierto y estable: el gimnasio real y un punto de
-- partida de ejercicios canónicos (globales, sin gym_id). El equipamiento NO
-- se inventa: sale del relevamiento con fotos, cargado desde el panel admin.
-- Ver docs/06-relevamiento-catalogo.md.

insert into gyms (id, slug, name, address, timezone, join_code)
values (
  '11111111-1111-4111-8111-111111111111',
  'blue-horse',
  'Blue Horse Gym',
  'Islas Malvinas 370 BIS, Arroyo Seco, Santa Fe',
  'America/Argentina/Buenos_Aires',
  'BLUEHORSE'
)
on conflict (slug) do nothing;

-- Ejercicios canónicos globales: vocabulario compartido entre la investigación
-- y el catálogo. Son descripciones de movimientos, no prescripción.
insert into exercises (name, pattern, primary_muscles, secondary_muscles, modality, is_compound, skill_level, cues)
values
  ('Sentadilla', 'squat', '{quads,glutes}', '{lower_back,hamstrings}', 'reps_weight', true, 'intermediate',
   'Pies al ancho de hombros, rodillas siguiendo la punta del pie, bajás hasta que el muslo quede paralelo al piso.'),
  ('Prensa de piernas', 'squat', '{quads,glutes}', '{hamstrings}', 'reps_weight', true, 'beginner',
   'Espalda baja apoyada en el respaldo durante todo el recorrido. No trabes las rodillas arriba.'),
  ('Peso muerto rumano', 'hinge', '{hamstrings,glutes}', '{lower_back}', 'reps_weight', true, 'intermediate',
   'Cadera hacia atrás con la espalda recta. La barra roza los muslos.'),
  ('Zancadas', 'lunge', '{quads,glutes}', '{hamstrings}', 'reps_weight', true, 'beginner',
   'Paso largo, torso vertical, la rodilla de atrás baja hacia el piso sin tocarlo.'),
  ('Press de banco', 'horizontal_push', '{chest}', '{triceps,front_delts}', 'reps_weight', true, 'intermediate',
   'Omóplatos juntos y apoyados. La barra baja al esternón, no al cuello.'),
  ('Press de pecho en máquina', 'horizontal_push', '{chest}', '{triceps,front_delts}', 'reps_weight', true, 'beginner',
   'Ajustá el asiento para que las manijas queden a la altura del pecho.'),
  ('Remo sentado', 'horizontal_pull', '{back}', '{biceps,rear_delts}', 'reps_weight', true, 'beginner',
   'Llevá los codos hacia atrás pegados al cuerpo. El torso no se balancea.'),
  ('Dorsalera al pecho', 'vertical_pull', '{lats}', '{biceps}', 'reps_weight', true, 'beginner',
   'Agarre un poco más ancho que los hombros. La barra baja al pecho, nunca detrás de la nuca.'),
  ('Dominadas', 'vertical_pull', '{lats}', '{biceps}', 'reps_bodyweight', true, 'advanced',
   'Si no salen completas, usá la máquina asistida o banda.'),
  ('Press de hombro', 'vertical_push', '{front_delts}', '{triceps}', 'reps_weight', true, 'beginner',
   'Sin arquear la espalda baja. Si tenés que arquear, bajá la carga.'),
  ('Curl de bíceps', 'isolation', '{biceps}', '{forearms}', 'reps_weight', false, 'beginner',
   'Codos pegados al cuerpo, sin balanceo.'),
  ('Extensión de tríceps en polea', 'isolation', '{triceps}', '{}', 'reps_weight', false, 'beginner',
   'Codos fijos al costado. Solo se mueve el antebrazo.'),
  ('Plancha', 'core', '{abs}', '{obliques,lower_back}', 'time', false, 'beginner',
   'Cuerpo en línea recta de la cabeza a los talones. Sin hundir la cadera.'),
  ('Abdominales en camilla', 'core', '{abs}', '{}', 'reps_bodyweight', false, 'beginner',
   'Subí enrollando la columna, no tirando del cuello.'),
  ('Caminata en cinta', 'cardio', '{full_body}', '{}', 'time', false, 'beginner',
   'Sin agarrarte de los pasamanos: falsea el esfuerzo real.'),
  ('Bicicleta fija', 'cardio', '{quads}', '{hamstrings}', 'time', false, 'beginner',
   'Altura del asiento: la rodilla queda apenas flexionada abajo del pedaleo.')
on conflict do nothing;
