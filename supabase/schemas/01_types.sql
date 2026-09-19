-- Tipos del dominio. Espejo exacto de packages/domain/src/enums.ts.
-- Si cambia uno, cambian los dos.

create extension if not exists "pgcrypto";

create type training_goal as enum (
  'strength', 'hypertrophy', 'power', 'cardio', 'endurance', 'recomposition'
);

create type experience_level as enum ('beginner', 'novice', 'intermediate', 'advanced');

create type sex as enum ('female', 'male', 'other', 'undisclosed');

-- Momento de la temporada. Espejo de SEASON_PHASES en packages/domain.
create type season_phase as enum ('preseason', 'in_season', 'off_season', 'none');

create type movement_pattern as enum (
  'squat', 'hinge', 'lunge', 'horizontal_push', 'horizontal_pull',
  'vertical_push', 'vertical_pull', 'carry', 'core', 'isolation', 'cardio', 'mobility',
  'balance', 'impact'
);

create type exercise_modality as enum ('reps_weight', 'reps_bodyweight', 'time', 'distance');

create type equipment_category as enum (
  'selectorized', 'plate_loaded', 'free_weight', 'rack', 'cardio', 'bodyweight', 'accessory'
);

-- La unidad es propiedad de CADA estación: Blue Horse mezcla kg, lb y pines.
create type load_unit as enum (
  'kg', 'lb', 'stack_level', 'plates_kg', 'plates_lb', 'band', 'bodyweight', 'none'
);

create type muscle_group as enum (
  'quads', 'hamstrings', 'glutes', 'calves', 'chest', 'back', 'lats', 'traps',
  'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'forearms',
  'abs', 'obliques', 'lower_back', 'full_body'
);

create type body_region as enum (
  'neck', 'shoulder', 'elbow', 'wrist', 'upper_back', 'lower_back', 'hip', 'knee', 'ankle', 'other'
);

create type session_status as enum ('pending', 'in_progress', 'completed', 'skipped');

create type proposal_type as enum (
  'load_increase', 'load_decrease', 'deload', 'swap_exercise', 'volume_change'
);

create type proposal_status as enum ('pending', 'accepted', 'rejected', 'expired');

-- 'placeholder' = contenido provisorio. 'research' = contenido real validado.
create type ruleset_source as enum ('placeholder', 'research');

-- Quién armó el plan. 'engine' es el motor a partir de un ruleset; 'manual' es
-- el socio, ejercicio por ejercicio. Los números de un plan manual los eligió
-- una persona: no salen de la investigación y la pantalla no puede presentarlos
-- como si salieran (regla dura 4).
create type plan_origin as enum ('engine', 'manual');

create type baseline_source as enum ('declared', 'calibrated', 'estimated');

create type constraint_type as enum ('injury', 'pain', 'avoid_exercise', 'avoid_equipment', 'tendinopathy', 'surgery', 'sprain', 'avoid_movement');

-- Movimientos que el socio no puede hacer (docs/research/58). Espejo de
-- MOVEMENT_LIMITS en packages/domain/src/enums.ts.
create type movement_limit as enum ('overhead', 'floor', 'hanging', 'jumping');

-- Programas de prevención de lesiones por deporte (docs/research/62). Espejo
-- de PREVENTION_PROGRAMS en packages/domain/src/enums.ts.
create type prevention_program as enum ('hamstring', 'knee');

-- Espejo de HEALTH_CONDITIONS en packages/domain/src/enums.ts.
create type health_condition as enum (
  'hypertension', 'heart_disease', 'beta_blockers', 'anticoagulants', 'diabetes', 'asthma',
  'copd', 'osteoarthritis', 'osteoporosis', 'back_problem', 'abdominal_hernia', 'pelvic_floor',
  'glaucoma_retina', 'epilepsy_vertigo', 'pregnancy', 'postpartum', 'joint_replacement'
);

create type session_feel as enum ('easy', 'right', 'hard');

create type member_role as enum ('member', 'staff', 'admin');
