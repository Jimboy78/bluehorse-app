-- Datos base para desarrollo local. Se aplica con `npm run db:reset`.
--
-- Lo cierto y estable: el gimnasio real (Blue Horse) y los ejercicios
-- canónicos globales. El equipamiento de acá abajo es PLACEHOLDER —
-- prefijo "Ejemplo —" a propósito — porque el relevamiento real con fotos
-- (Fase 0, ver docs/06-relevamiento-catalogo.md) todavía no está. Existe
-- para que el panel admin y la generación de plan tengan algo real contra
-- qué probar mientras tanto, sin bloquear el desarrollo. Se borra cuando
-- entre el catálogo real.

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

-- ---------------------------------------------------------------- equipamiento de ejemplo
--
-- NO es el catálogo real de Blue Horse (eso sale del relevamiento con fotos,
-- Fase 0 del roadmap — ver docs/06-relevamiento-catalogo.md). Existe para que
-- el panel admin y la generación de plan tengan algo real contra qué probar
-- mientras tanto. Por eso el prefijo "Ejemplo —": para que nunca se confunda
-- con una máquina real cuando el catálogo verdadero se cargue.

insert into equipment (
  id, gym_id, name, category, load_unit, load_min, load_max, load_increment,
  stack_kg, base_weight_kg, quantity, location_note
)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Prensa de piernas 45°', 'plate_loaded', 'plates_kg', 0, 300, 10, null, 20, 1,
   'sala de máquinas'),
  ('aaaaaaaa-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Rack de sentadilla', 'rack', 'plates_kg', 0, 250, 2.5, null, 20, 2,
   'zona de peso libre'),
  ('aaaaaaaa-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Banco y barra', 'free_weight', 'plates_kg', 0, 200, 2.5, null, 20, 3,
   'zona de peso libre'),
  ('aaaaaaaa-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Press de pecho en máquina', 'selectorized', 'stack_level', 1, 15, 1,
   array[5,10,15,20,25,30,35,40,45,50,55,60,65,70,75]::numeric(7,2)[], null, 1,
   'sala de máquinas'),
  ('aaaaaaaa-0000-4000-8000-000000000005', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Remo sentado en polea', 'selectorized', 'stack_level', 1, 12, 1,
   array[5,10,15,20,25,30,35,40,45,50,55,60]::numeric(7,2)[], null, 1,
   'sala de poleas'),
  ('aaaaaaaa-0000-4000-8000-000000000006', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Dorsalera', 'selectorized', 'stack_level', 1, 12, 1,
   array[5,10,15,20,25,30,35,40,45,50,55,60]::numeric(7,2)[], null, 1,
   'sala de poleas'),
  ('aaaaaaaa-0000-4000-8000-000000000007', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Rack de dominadas', 'rack', 'bodyweight', null, null, null, null, null, 1,
   'zona funcional'),
  ('aaaaaaaa-0000-4000-8000-000000000008', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Press de hombro en máquina', 'selectorized', 'stack_level', 1, 12, 1,
   array[5,10,15,20,25,30,35,40,45,50,55,60]::numeric(7,2)[], null, 1,
   'sala de máquinas'),
  ('aaaaaaaa-0000-4000-8000-000000000009', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Set de mancuernas', 'free_weight', 'kg', 2, 40, 2, null, null, 1,
   'rack de mancuernas'),
  ('aaaaaaaa-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Polea de tríceps', 'selectorized', 'stack_level', 1, 12, 1,
   array[5,10,15,20,25,30,35,40,45,50,55,60]::numeric(7,2)[], null, 1,
   'sala de poleas'),
  ('aaaaaaaa-0000-4000-8000-00000000000b', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Colchonetas', 'accessory', 'none', null, null, null, null, null, 6,
   'zona funcional'),
  ('aaaaaaaa-0000-4000-8000-00000000000c', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Cinta de correr', 'cardio', 'none', null, null, null, null, null, 3,
   'sector cardio'),
  ('aaaaaaaa-0000-4000-8000-00000000000d', '11111111-1111-4111-8111-111111111111',
   'Ejemplo — Bicicleta fija', 'cardio', 'none', null, null, null, null, null, 2,
   'sector cardio')
on conflict (id) do nothing;

-- Qué ejercicio se puede hacer en qué estación de ejemplo. Sin esto el motor
-- considera que el gimnasio está vacío, aunque haya equipamiento cargado.
insert into exercise_equipment (exercise_id, equipment_id, is_primary)
select e.id, eq.equipment_id, true
from exercises e
join (values
  ('Prensa de piernas', 'aaaaaaaa-0000-4000-8000-000000000001'::uuid),
  ('Sentadilla', 'aaaaaaaa-0000-4000-8000-000000000002'::uuid),
  ('Press de banco', 'aaaaaaaa-0000-4000-8000-000000000003'::uuid),
  ('Peso muerto rumano', 'aaaaaaaa-0000-4000-8000-000000000002'::uuid),
  ('Press de pecho en máquina', 'aaaaaaaa-0000-4000-8000-000000000004'::uuid),
  ('Remo sentado', 'aaaaaaaa-0000-4000-8000-000000000005'::uuid),
  ('Dorsalera al pecho', 'aaaaaaaa-0000-4000-8000-000000000006'::uuid),
  ('Dominadas', 'aaaaaaaa-0000-4000-8000-000000000007'::uuid),
  ('Press de hombro', 'aaaaaaaa-0000-4000-8000-000000000008'::uuid),
  ('Curl de bíceps', 'aaaaaaaa-0000-4000-8000-000000000009'::uuid),
  ('Zancadas', 'aaaaaaaa-0000-4000-8000-000000000009'::uuid),
  ('Extensión de tríceps en polea', 'aaaaaaaa-0000-4000-8000-00000000000a'::uuid),
  ('Plancha', 'aaaaaaaa-0000-4000-8000-00000000000b'::uuid),
  ('Abdominales en camilla', 'aaaaaaaa-0000-4000-8000-00000000000b'::uuid),
  ('Caminata en cinta', 'aaaaaaaa-0000-4000-8000-00000000000c'::uuid),
  ('Bicicleta fija', 'aaaaaaaa-0000-4000-8000-00000000000d'::uuid)
) as eq(exercise_name, equipment_id) on eq.exercise_name = e.name
on conflict do nothing;
