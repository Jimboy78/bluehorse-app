CREATE TABLE "public"."user_health_conditions" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "gym_id"     uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_health_conditions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."user_health_conditions"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."health_condition" AS ENUM (
  'hypertension',
  'heart_disease',
  'beta_blockers',
  'anticoagulants',
  'diabetes',
  'asthma',
  'copd',
  'osteoarthritis',
  'osteoporosis',
  'back_problem',
  'abdominal_hernia',
  'pelvic_floor',
  'glaucoma_retina',
  'epilepsy_vertigo',
  'pregnancy',
  'postpartum'
);

ALTER TABLE "public"."user_health_conditions"
  ADD COLUMN "condition" public.health_condition NOT NULL;

ALTER TABLE "public"."user_health_conditions"
  ADD CONSTRAINT "user_health_conditions_gym_id_fkey" FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_health_conditions"
  ADD CONSTRAINT "user_health_conditions_user_id_condition_key" UNIQUE (user_id, condition);

ALTER TABLE "public"."user_health_conditions"
  ADD CONSTRAINT "user_health_conditions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE POLICY "condiciones de salud propias" ON "public"."user_health_conditions"
  FOR ALL
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_health_conditions" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."health_condition" TO "postgres";
