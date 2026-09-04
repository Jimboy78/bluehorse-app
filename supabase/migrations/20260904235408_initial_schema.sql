SET local check_function_bodies = off;

ALTER EXTENSION "pgcrypto" SET SCHEMA "public";

CREATE TABLE "public"."adaptation_proposals" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid                     NOT NULL,
  "plan_id"         uuid                     NOT NULL,
  "target_ref"      jsonb                    NOT NULL,
  "from_value"      text,
  "to_value"        text,
  "reason_code"     text                     NOT NULL,
  "reason_text"     text                     NOT NULL,
  "ruleset_version" text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "resolved_at"     timestamp with time zone,
  CONSTRAINT "adaptation_proposals_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."adaptation_proposals"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."equipment" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"         uuid                     NOT NULL,
  "name"           text                     NOT NULL,
  "brand"          text,
  "model"          text,
  "photo_url"      text,
  "location_note"  text,
  "setup_notes"    text,
  "load_min"       numeric(7,2),
  "load_max"       numeric(7,2),
  "load_increment" numeric(7,2),
  "stack_kg"       numeric(7,2)[],
  "base_weight_kg" numeric(7,2),
  "quantity"       smallint                 NOT NULL DEFAULT 1,
  "is_active"      boolean                  NOT NULL DEFAULT true,
  "created_at"     timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "equipment_pkey" PRIMARY KEY (id),
  CONSTRAINT "equipment_quantity_check" CHECK ((quantity > 0)),
  CONSTRAINT "equipment_range_ok" CHECK (((load_max IS NULL) OR (load_min IS NULL) OR (load_max >= load_min)))
);

ALTER TABLE "public"."equipment"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."exercise_equipment" (
  "exercise_id"  uuid    NOT NULL,
  "equipment_id" uuid    NOT NULL,
  "is_primary"   boolean NOT NULL DEFAULT false,
  CONSTRAINT "exercise_equipment_pkey" PRIMARY KEY (exercise_id, equipment_id)
);

ALTER TABLE "public"."exercise_equipment"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."exercise_substitutions" (
  "exercise_id"   uuid         NOT NULL,
  "substitute_id" uuid         NOT NULL,
  "equivalence"   numeric(3,2) NOT NULL,
  "note"          text,
  CONSTRAINT "exercise_substitutions_equivalence_check" CHECK (((equivalence >= (0)::numeric) AND (equivalence <= (1)::numeric))),
  CONSTRAINT "exercise_substitutions_pkey" PRIMARY KEY (exercise_id, substitute_id),
  CONSTRAINT "no_self_substitution" CHECK ((exercise_id <> substitute_id))
);

ALTER TABLE "public"."exercise_substitutions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."exercises" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "gym_id"        uuid,
  "name"          text                     NOT NULL,
  "is_compound"   boolean                  NOT NULL DEFAULT false,
  "is_unilateral" boolean                  NOT NULL DEFAULT false,
  "cues"          text,
  "media_url"     text,
  "is_active"     boolean                  NOT NULL DEFAULT true,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "exercises_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."exercises"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."gyms" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "slug"       text                     NOT NULL,
  "name"       text                     NOT NULL,
  "address"    text,
  "timezone"   text                     NOT NULL DEFAULT 'America/Argentina/Buenos_Aires'::text,
  "join_code"  text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "gyms_join_code_key" UNIQUE (join_code),
  CONSTRAINT "gyms_pkey" PRIMARY KEY (id),
  CONSTRAINT "gyms_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."gyms"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."pain_reports" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "workout_log_id" uuid,
  "exercise_id"    uuid,
  "severity"       smallint                 NOT NULL,
  "note"           text,
  "reported_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "pain_reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "pain_reports_severity_check" CHECK (((severity >= 1) AND (severity <= 5)))
);

ALTER TABLE "public"."pain_reports"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."personal_records" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "exercise_id" uuid                     NOT NULL,
  "type"        text                     NOT NULL,
  "value"       numeric(9,2)             NOT NULL,
  "set_log_id"  uuid,
  "achieved_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "personal_records_pkey" PRIMARY KEY (id),
  CONSTRAINT "personal_records_type_check" CHECK ((type = ANY (ARRAY['max_load'::text, 'max_reps'::text, 'max_volume'::text, 'est_1rm'::text])))
);

ALTER TABLE "public"."personal_records"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."plan_session_items" (
  "id"              uuid         NOT NULL DEFAULT gen_random_uuid(),
  "plan_session_id" uuid         NOT NULL,
  "order_index"     smallint     NOT NULL,
  "exercise_id"     uuid         NOT NULL,
  "equipment_id"    uuid,
  "target_sets"     smallint     NOT NULL,
  "target_reps_min" smallint     NOT NULL,
  "target_reps_max" smallint     NOT NULL,
  "target_load"     numeric(7,2),
  "target_rir"      smallint,
  "rest_seconds"    smallint     NOT NULL,
  "rationale"       text         NOT NULL,
  "is_placeholder"  boolean      NOT NULL DEFAULT true,
  "superset_group"  smallint,
  CONSTRAINT "plan_session_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "plan_session_items_plan_session_id_order_index_key" UNIQUE (plan_session_id, order_index)
);

ALTER TABLE "public"."plan_session_items"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."plan_sessions" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "plan_id"           uuid                     NOT NULL,
  "sequence_index"    smallint                 NOT NULL,
  "label"             text                     NOT NULL,
  "focus"             text                     NOT NULL,
  "estimated_minutes" smallint                 NOT NULL,
  "completed_at"      timestamp with time zone,
  CONSTRAINT "plan_sessions_pkey" PRIMARY KEY (id),
  CONSTRAINT "plan_sessions_plan_id_sequence_index_key" UNIQUE (plan_id, sequence_index)
);

ALTER TABLE "public"."plan_sessions"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."plans" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid                     NOT NULL,
  "gym_id"          uuid                     NOT NULL,
  "ruleset_version" text                     NOT NULL,
  "template_id"     text                     NOT NULL,
  "goal_snapshot"   jsonb                    NOT NULL,
  "status"          text                     NOT NULL DEFAULT 'active'::text,
  "generated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "plans_pkey" PRIMARY KEY (id),
  CONSTRAINT "plans_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'archived'::text])))
);

ALTER TABLE "public"."plans"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"               uuid                     NOT NULL,
  "gym_id"           uuid                     NOT NULL,
  "display_name"     text                     NOT NULL,
  "birth_date"       date,
  "units_preference" text                     NOT NULL DEFAULT 'kg'::text,
  "onboarded_at"     timestamp with time zone,
  "created_at"       timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_units_preference_check" CHECK ((units_preference = ANY (ARRAY['kg'::text, 'lb'::text])))
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."rulesets" (
  "version"    text                     NOT NULL,
  "content"    jsonb                    NOT NULL,
  "is_active"  boolean                  NOT NULL DEFAULT false,
  "notes"      text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "rulesets_pkey" PRIMARY KEY (VERSION)
);

ALTER TABLE "public"."rulesets"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."session_events" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "workout_log_id" uuid                     NOT NULL,
  "type"           text                     NOT NULL,
  "payload"        jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "occurred_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "session_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "session_events_type_check" CHECK ((type = ANY (ARRAY['machine_occupied'::text, 'substituted'::text, 'reordered'::text, 'skipped_exercise'::text])))
);

ALTER TABLE "public"."session_events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."set_logs" (
  "id"                      uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "workout_log_id"          uuid                     NOT NULL,
  "plan_session_item_id"    uuid,
  "exercise_id"             uuid                     NOT NULL,
  "equipment_id"            uuid,
  "set_index"               smallint                 NOT NULL,
  "load_value"              numeric(7,2),
  "load_kg_normalized"      numeric(7,2),
  "reps"                    smallint,
  "reps_target"             smallint,
  "rir"                     smallint,
  "duration_seconds"        integer,
  "distance_meters"         numeric(8,2),
  "rest_prescribed_seconds" smallint,
  "rest_actual_seconds"     smallint,
  "is_warmup"               boolean                  NOT NULL DEFAULT false,
  "completed_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "client_id"               text                     NOT NULL,
  CONSTRAINT "set_logs_client_id_key" UNIQUE (client_id),
  CONSTRAINT "set_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "set_logs_rir_check" CHECK (((rir >= 0) AND (rir <= 10)))
);

ALTER TABLE "public"."set_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_baselines" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"            uuid                     NOT NULL,
  "exercise_id"        uuid                     NOT NULL,
  "load_value"         numeric(7,2),
  "load_kg_normalized" numeric(7,2),
  "reps"               smallint,
  "recorded_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_baselines_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."user_baselines"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_constraints" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      uuid                     NOT NULL,
  "exercise_id"  uuid,
  "equipment_id" uuid,
  "severity"     smallint                 NOT NULL DEFAULT 3,
  "note"         text,
  "active_from"  timestamp with time zone NOT NULL DEFAULT now(),
  "active_to"    timestamp with time zone,
  CONSTRAINT "user_constraints_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_constraints_severity_check" CHECK (((severity >= 1) AND (severity <= 5)))
);

ALTER TABLE "public"."user_constraints"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_equipment_settings" (
  "user_id"      uuid                     NOT NULL,
  "equipment_id" uuid                     NOT NULL,
  "settings"     jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_equipment_settings_pkey" PRIMARY KEY (user_id, equipment_id)
);

ALTER TABLE "public"."user_equipment_settings"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_goals" (
  "id"                       uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                  uuid                     NOT NULL,
  "sport"                    text,
  "priority"                 smallint                 NOT NULL DEFAULT 1,
  "sessions_per_week_target" smallint                 NOT NULL,
  "session_minutes_target"   smallint                 NOT NULL DEFAULT 60,
  "is_active"                boolean                  NOT NULL DEFAULT true,
  "started_at"               timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_goals_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_goals_session_minutes_target_check" CHECK (((session_minutes_target >= 15) AND (session_minutes_target <= 180))),
  CONSTRAINT "user_goals_sessions_per_week_target_check" CHECK (((sessions_per_week_target >= 1) AND (sessions_per_week_target <= 7)))
);

ALTER TABLE "public"."user_goals"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."workout_logs" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid                     NOT NULL,
  "plan_session_id" uuid,
  "started_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "ended_at"        timestamp with time zone,
  "pre_sleep"       smallint,
  "pre_energy"      smallint,
  "session_rpe"     smallint,
  "notes"           text,
  "client_id"       text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "workout_logs_client_id_key" UNIQUE (client_id),
  CONSTRAINT "workout_logs_pkey" PRIMARY KEY (id),
  CONSTRAINT "workout_logs_pre_energy_check" CHECK (((pre_energy >= 1) AND (pre_energy <= 5))),
  CONSTRAINT "workout_logs_pre_sleep_check" CHECK (((pre_sleep >= 1) AND (pre_sleep <= 5))),
  CONSTRAINT "workout_logs_session_rpe_check" CHECK (((session_rpe >= 1) AND (session_rpe <= 10)))
);

ALTER TABLE "public"."workout_logs"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."baseline_source" AS ENUM (
  'declared',
  'calibrated',
  'estimated'
);

ALTER TABLE "public"."user_baselines"
  ADD COLUMN "source" public.baseline_source NOT NULL;

CREATE TYPE "public"."body_region" AS ENUM (
  'neck',
  'shoulder',
  'elbow',
  'wrist',
  'upper_back',
  'lower_back',
  'hip',
  'knee',
  'ankle',
  'other'
);

ALTER TABLE "public"."pain_reports"
  ADD COLUMN "body_region" public.body_region NOT NULL;

ALTER TABLE "public"."user_constraints"
  ADD COLUMN "body_region" public.body_region;

CREATE TYPE "public"."constraint_type" AS ENUM (
  'injury',
  'pain',
  'avoid_exercise',
  'avoid_equipment'
);

ALTER TABLE "public"."user_constraints"
  ADD COLUMN "type" public.constraint_type NOT NULL;

CREATE TYPE "public"."equipment_category" AS ENUM (
  'selectorized',
  'plate_loaded',
  'free_weight',
  'rack',
  'cardio',
  'bodyweight',
  'accessory'
);

ALTER TABLE "public"."equipment"
  ADD COLUMN "category" public.equipment_category NOT NULL;

CREATE TYPE "public"."exercise_modality" AS ENUM (
  'reps_weight',
  'reps_bodyweight',
  'time',
  'distance'
);

ALTER TABLE "public"."exercises"
  ADD COLUMN "modality" public.exercise_modality NOT NULL DEFAULT 'reps_weight'::public.exercise_modality;

CREATE TYPE "public"."experience_level" AS ENUM (
  'beginner',
  'novice',
  'intermediate',
  'advanced'
);

ALTER TABLE "public"."exercises"
  ADD COLUMN "skill_level" public.experience_level NOT NULL DEFAULT 'beginner'::public.experience_level;

ALTER TABLE "public"."profiles"
  ADD COLUMN "experience_level" public.experience_level NOT NULL DEFAULT 'beginner'::public.experience_level;

CREATE TYPE "public"."load_unit" AS ENUM (
  'kg',
  'lb',
  'stack_level',
  'plates_kg',
  'plates_lb',
  'band',
  'bodyweight',
  'none'
);

ALTER TABLE "public"."equipment"
  ADD COLUMN "load_unit" public.load_unit NOT NULL;

ALTER TABLE "public"."plan_session_items"
  ADD COLUMN "target_load_unit" public.load_unit;

ALTER TABLE "public"."set_logs"
  ADD COLUMN "load_unit" public.load_unit NOT NULL;

ALTER TABLE "public"."user_baselines"
  ADD COLUMN "load_unit" public.load_unit NOT NULL;

CREATE TYPE "public"."member_role" AS ENUM (
  'member',
  'staff',
  'admin'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "role" public.member_role NOT NULL DEFAULT 'member'::public.member_role;

CREATE TYPE "public"."movement_pattern" AS ENUM (
  'squat',
  'hinge',
  'lunge',
  'horizontal_push',
  'horizontal_pull',
  'vertical_push',
  'vertical_pull',
  'carry',
  'core',
  'isolation',
  'cardio'
);

ALTER TABLE "public"."exercises"
  ADD COLUMN "pattern" public.movement_pattern NOT NULL;

CREATE TYPE "public"."muscle_group" AS ENUM (
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'chest',
  'back',
  'lats',
  'traps',
  'front_delts',
  'side_delts',
  'rear_delts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'lower_back',
  'full_body'
);

ALTER TABLE "public"."exercises"
  ADD COLUMN "primary_muscles" public.muscle_group[] NOT NULL DEFAULT '{}'::public.muscle_group[];

ALTER TABLE "public"."exercises"
  ADD COLUMN "secondary_muscles" public.muscle_group[] NOT NULL DEFAULT '{}'::public.muscle_group[];

CREATE TYPE "public"."proposal_status" AS ENUM (
  'pending',
  'accepted',
  'rejected',
  'expired'
);

ALTER TABLE "public"."adaptation_proposals"
  ADD COLUMN "status" public.proposal_status NOT NULL DEFAULT 'pending'::public.proposal_status;

CREATE TYPE "public"."proposal_type" AS ENUM (
  'load_increase',
  'load_decrease',
  'deload',
  'swap_exercise',
  'volume_change'
);

ALTER TABLE "public"."adaptation_proposals"
  ADD COLUMN "type" public.proposal_type NOT NULL;

CREATE TYPE "public"."ruleset_source" AS ENUM (
  'placeholder',
  'research'
);

ALTER TABLE "public"."rulesets"
  ADD COLUMN "source" public.ruleset_source NOT NULL;

CREATE TYPE "public"."session_feel" AS ENUM (
  'easy',
  'right',
  'hard'
);

ALTER TABLE "public"."workout_logs"
  ADD COLUMN "session_feel" public.session_feel;

CREATE TYPE "public"."session_status" AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'skipped'
);

ALTER TABLE "public"."plan_sessions"
  ADD COLUMN "status" public.session_status NOT NULL DEFAULT 'pending'::public.session_status;

CREATE TYPE "public"."sex" AS ENUM (
  'female',
  'male',
  'other',
  'undisclosed'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "sex" public.sex NOT NULL DEFAULT 'undisclosed'::public.sex;

CREATE TYPE "public"."training_goal" AS ENUM (
  'strength',
  'hypertrophy',
  'power',
  'cardio',
  'endurance',
  'recomposition'
);

ALTER TABLE "public"."user_goals"
  ADD COLUMN "goal" public.training_goal NOT NULL;

CREATE OR REPLACE FUNCTION public.current_gym_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select gym_id from profiles where id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.is_gym_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select exists (
    select 1 from profiles where id = auth.uid() and role in ('staff', 'admin')
  );
$function$;

ALTER TABLE "public"."exercise_equipment"
  ADD CONSTRAINT "exercise_equipment_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;

ALTER TABLE "public"."exercise_equipment"
  ADD CONSTRAINT "exercise_equipment_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE "public"."exercise_substitutions"
  ADD CONSTRAINT "exercise_substitutions_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE "public"."exercise_substitutions"
  ADD CONSTRAINT "exercise_substitutions_substitute_id_fkey" FOREIGN KEY (substitute_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE "public"."equipment"
  ADD CONSTRAINT "equipment_gym_id_fkey" FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE "public"."exercises"
  ADD CONSTRAINT "exercises_gym_id_fkey" FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE "public"."pain_reports"
  ADD CONSTRAINT "pain_reports_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE SET NULL;

ALTER TABLE "public"."personal_records"
  ADD CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE RESTRICT;

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_plan_session_id_fkey" FOREIGN KEY (plan_session_id) REFERENCES public.plan_sessions(id) ON DELETE CASCADE;

ALTER TABLE "public"."plans"
  ADD CONSTRAINT "plans_gym_id_fkey" FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE "public"."adaptation_proposals"
  ADD CONSTRAINT "adaptation_proposals_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;

ALTER TABLE "public"."plan_sessions"
  ADD CONSTRAINT "plan_sessions_plan_id_fkey" FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_gym_id_fkey" FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE RESTRICT;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."adaptation_proposals"
  ADD CONSTRAINT "adaptation_proposals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."pain_reports"
  ADD CONSTRAINT "pain_reports_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."personal_records"
  ADD CONSTRAINT "personal_records_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."plans"
  ADD CONSTRAINT "plans_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."adaptation_proposals"
  ADD CONSTRAINT "adaptation_proposals_ruleset_version_fkey" FOREIGN KEY (ruleset_version) REFERENCES public.rulesets(VERSION);

ALTER TABLE "public"."plans"
  ADD CONSTRAINT "plans_ruleset_version_fkey" FOREIGN KEY (ruleset_version) REFERENCES public.rulesets(VERSION);

ALTER TABLE "public"."set_logs"
  ADD CONSTRAINT "set_logs_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE SET NULL;

ALTER TABLE "public"."set_logs"
  ADD CONSTRAINT "set_logs_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE RESTRICT;

ALTER TABLE "public"."personal_records"
  ADD CONSTRAINT "personal_records_set_log_id_fkey" FOREIGN KEY (set_log_id) REFERENCES public.set_logs(id) ON DELETE SET NULL;

ALTER TABLE "public"."set_logs"
  ADD CONSTRAINT "set_logs_plan_session_item_id_fkey" FOREIGN KEY (plan_session_item_id) REFERENCES public.plan_session_items(id) ON DELETE SET NULL;

ALTER TABLE "public"."user_baselines"
  ADD CONSTRAINT "user_baselines_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_baselines"
  ADD CONSTRAINT "user_baselines_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_constraints"
  ADD CONSTRAINT "user_constraints_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_constraints"
  ADD CONSTRAINT "user_constraints_exercise_id_fkey" FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_constraints"
  ADD CONSTRAINT "user_constraints_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_equipment_settings"
  ADD CONSTRAINT "user_equipment_settings_equipment_id_fkey" FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_equipment_settings"
  ADD CONSTRAINT "user_equipment_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_goals"
  ADD CONSTRAINT "user_goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."pain_reports"
  ADD CONSTRAINT "pain_reports_workout_log_id_fkey" FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id) ON DELETE SET NULL;

ALTER TABLE "public"."session_events"
  ADD CONSTRAINT "session_events_workout_log_id_fkey" FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id) ON DELETE CASCADE;

ALTER TABLE "public"."set_logs"
  ADD CONSTRAINT "set_logs_workout_log_id_fkey" FOREIGN KEY (workout_log_id) REFERENCES public.workout_logs(id) ON DELETE CASCADE;

ALTER TABLE "public"."workout_logs"
  ADD CONSTRAINT "workout_logs_plan_session_id_fkey" FOREIGN KEY (plan_session_id) REFERENCES public.plan_sessions(id) ON DELETE SET NULL;

ALTER TABLE "public"."workout_logs"
  ADD CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX equipment_gym_idx ON public.equipment USING btree (gym_id)
  WHERE is_active;

CREATE INDEX exercises_gym_idx ON public.exercises USING btree (gym_id);

CREATE INDEX exercises_pattern_idx ON public.exercises USING btree (pattern)
  WHERE is_active;

CREATE INDEX pain_reports_user_idx ON public.pain_reports USING btree (user_id, reported_at DESC);

CREATE INDEX personal_records_user_idx ON public.personal_records USING btree (user_id, achieved_at DESC);

CREATE INDEX plan_sessions_queue_idx ON public.plan_sessions USING btree (plan_id, sequence_index)
  WHERE (status = 'pending'::public.session_status);

CREATE UNIQUE INDEX plans_one_active_per_user_idx ON public.plans USING btree (user_id)
  WHERE (status = 'active'::text);

CREATE INDEX profiles_gym_idx ON public.profiles USING btree (gym_id);

CREATE INDEX proposals_pending_idx ON public.adaptation_proposals USING btree (user_id, created_at DESC)
  WHERE (status = 'pending'::public.proposal_status);

CREATE UNIQUE INDEX rulesets_single_active_idx ON public.rulesets USING btree ((true))
  WHERE is_active;

CREATE INDEX session_events_type_idx ON public.session_events USING btree (TYPE, occurred_at DESC);

CREATE INDEX set_logs_progress_idx ON public.set_logs USING btree (exercise_id, completed_at DESC);

CREATE INDEX set_logs_session_idx ON public.set_logs USING btree (workout_log_id, set_index);

CREATE UNIQUE INDEX user_baselines_current_idx ON public.user_baselines USING btree (user_id, exercise_id, recorded_at DESC);

CREATE INDEX user_constraints_active_idx ON public.user_constraints USING btree (user_id)
  WHERE (active_to IS NULL);

CREATE INDEX user_goals_active_idx ON public.user_goals USING btree (user_id)
  WHERE is_active;

CREATE INDEX workout_logs_user_idx ON public.workout_logs USING btree (user_id, started_at DESC);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "propuestas propias" ON "public"."adaptation_proposals"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "el gimnasio lee su equipamiento" ON "public"."equipment"
  FOR SELECT
  TO "authenticated"
  USING ((gym_id = public.current_gym_id()));

CREATE POLICY "solo staff edita equipamiento" ON "public"."equipment"
  FOR ALL
  TO "authenticated"
  USING ((public.is_gym_admin() AND (gym_id = public.current_gym_id())))
  WITH CHECK ((public.is_gym_admin() AND (gym_id = public.current_gym_id())));

CREATE POLICY "lectura del mapeo ejercicio-equipamiento" ON "public"."exercise_equipment"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "solo staff edita el mapeo" ON "public"."exercise_equipment"
  FOR ALL
  TO "authenticated"
  USING (public.is_gym_admin())
  WITH CHECK (public.is_gym_admin());

CREATE POLICY "lectura de sustituciones" ON "public"."exercise_substitutions"
  FOR SELECT
  TO "authenticated"
  USING (true);

CREATE POLICY "solo staff edita sustituciones" ON "public"."exercise_substitutions"
  FOR ALL
  TO "authenticated"
  USING (public.is_gym_admin())
  WITH CHECK (public.is_gym_admin());

CREATE POLICY "ejercicios globales y del gimnasio" ON "public"."exercises"
  FOR SELECT
  TO "authenticated"
  USING (((gym_id IS NULL) OR (gym_id = public.current_gym_id())));

CREATE POLICY "solo staff edita ejercicios" ON "public"."exercises"
  FOR ALL
  TO "authenticated"
  USING (public.is_gym_admin())
  WITH CHECK (public.is_gym_admin());

CREATE POLICY "socios ven su gimnasio" ON "public"."gyms"
  FOR SELECT
  TO "authenticated"
  USING ((id = public.current_gym_id()));

CREATE POLICY "dolor: solo el propio socio" ON "public"."pain_reports"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "records propios" ON "public"."personal_records"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "items del plan propio" ON "public"."plan_session_items"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM (public.plan_sessions s
     JOIN public.plans p ON ((p.id = s.plan_id)))
  WHERE ((s.id = plan_session_items.plan_session_id) AND (p.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.plan_sessions s
     JOIN public.plans p ON ((p.id = s.plan_id)))
  WHERE ((s.id = plan_session_items.plan_session_id) AND (p.user_id = auth.uid())))));

CREATE POLICY "sesiones del plan propio" ON "public"."plan_sessions"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.plans p
  WHERE ((p.id = plan_sessions.plan_id) AND (p.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.plans p
  WHERE ((p.id = plan_sessions.plan_id) AND (p.user_id = auth.uid())))));

CREATE POLICY "planes propios" ON "public"."plans"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "cada uno edita su perfil" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((id = auth.uid()))
  WITH CHECK ((id = auth.uid()));

CREATE POLICY "cada uno ve su perfil" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (((id = auth.uid()) OR public.is_gym_admin()));

CREATE POLICY "solo admin escribe rulesets" ON "public"."rulesets"
  FOR ALL
  TO "authenticated"
  USING (public.is_gym_admin())
  WITH CHECK (public.is_gym_admin());

CREATE POLICY "todos leen el ruleset activo" ON "public"."rulesets"
  FOR SELECT
  TO "authenticated"
  USING (is_active);

CREATE POLICY "eventos propios" ON "public"."session_events"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.workout_logs w
  WHERE ((w.id = session_events.workout_log_id) AND (w.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.workout_logs w
  WHERE ((w.id = session_events.workout_log_id) AND (w.user_id = auth.uid())))));

CREATE POLICY "series propias" ON "public"."set_logs"
  FOR ALL
  TO "authenticated"
  USING ((EXISTS ( SELECT 1
   FROM public.workout_logs w
  WHERE ((w.id = set_logs.workout_log_id) AND (w.user_id = auth.uid())))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.workout_logs w
  WHERE ((w.id = set_logs.workout_log_id) AND (w.user_id = auth.uid())))));

CREATE POLICY "baselines propios" ON "public"."user_baselines"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "restricciones propias" ON "public"."user_constraints"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "ajustes de maquina propios" ON "public"."user_equipment_settings"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "objetivos propios" ON "public"."user_goals"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "sesiones propias" ON "public"."workout_logs"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

GRANT EXECUTE ON FUNCTION "public"."current_gym_id"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_gym_admin"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."adaptation_proposals" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."equipment" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exercise_equipment" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exercise_substitutions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exercises" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gyms" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pain_reports" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."personal_records" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."plan_session_items" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."plan_sessions" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."plans" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."rulesets" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."session_events" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."set_logs" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_baselines" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_constraints" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_equipment_settings" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_goals" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."workout_logs" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."baseline_source" TO "postgres";

GRANT USAGE ON TYPE "public"."body_region" TO "postgres";

GRANT USAGE ON TYPE "public"."constraint_type" TO "postgres";

GRANT USAGE ON TYPE "public"."equipment_category" TO "postgres";

GRANT USAGE ON TYPE "public"."exercise_modality" TO "postgres";

GRANT USAGE ON TYPE "public"."experience_level" TO "postgres";

GRANT USAGE ON TYPE "public"."load_unit" TO "postgres";

GRANT USAGE ON TYPE "public"."member_role" TO "postgres";

GRANT USAGE ON TYPE "public"."movement_pattern" TO "postgres";

GRANT USAGE ON TYPE "public"."muscle_group" TO "postgres";

GRANT USAGE ON TYPE "public"."proposal_status" TO "postgres";

GRANT USAGE ON TYPE "public"."proposal_type" TO "postgres";

GRANT USAGE ON TYPE "public"."ruleset_source" TO "postgres";

GRANT USAGE ON TYPE "public"."session_feel" TO "postgres";

GRANT USAGE ON TYPE "public"."session_status" TO "postgres";

GRANT USAGE ON TYPE "public"."sex" TO "postgres";

GRANT USAGE ON TYPE "public"."training_goal" TO "postgres";
