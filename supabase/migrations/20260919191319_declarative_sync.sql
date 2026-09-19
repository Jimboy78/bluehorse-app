CREATE TABLE "public"."match_exceptions" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "gym_id"     uuid                     NOT NULL,
  "day"        date                     NOT NULL,
  "plays"      boolean                  NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "match_exceptions_pkey" PRIMARY KEY (id),
  CONSTRAINT "match_exceptions_user_id_day_key" UNIQUE (user_id, day)
);

ALTER TABLE "public"."match_exceptions"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_goals"
  ADD COLUMN "match_weekday" smallint;

CREATE TYPE "public"."match_day_state" AS ENUM (
  'normal',
  'day_after',
  'two_days_after',
  'day_before',
  'match_day'
);

ALTER TABLE "public"."workout_logs"
  ADD COLUMN "match_day_state" public.match_day_state;

ALTER TABLE "public"."match_exceptions"
  ADD CONSTRAINT "match_exceptions_gym_id_fkey" FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE RESTRICT;

ALTER TABLE "public"."match_exceptions"
  ADD CONSTRAINT "match_exceptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_goals"
  ADD CONSTRAINT "user_goals_match_weekday_check" CHECK (((match_weekday >= 1) AND (match_weekday <= 7)));

CREATE POLICY "borrar partido propio" ON "public"."match_exceptions"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "corregir partido propio" ON "public"."match_exceptions"
  FOR UPDATE
  TO "authenticated"
  USING ((user_id = auth.uid()))
  WITH CHECK (((user_id = auth.uid()) AND (gym_id = public.current_gym_id())));

CREATE POLICY "declarar partido propio" ON "public"."match_exceptions"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = auth.uid()) AND (gym_id = public.current_gym_id())));

CREATE POLICY "partidos propios" ON "public"."match_exceptions"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."match_exceptions" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."match_day_state" TO "postgres";
