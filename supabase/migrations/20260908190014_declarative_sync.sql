CREATE TABLE "public"."health_screenings" (
  "id"                     uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                uuid                     NOT NULL,
  "ruleset_version"        text                     NOT NULL,
  "answers"                jsonb                    NOT NULL,
  "cleared"                boolean                  NOT NULL,
  "disclaimer_accepted_at" timestamp with time zone,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "health_screenings_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."health_screenings"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."plan_session_items"
  ADD COLUMN "target_duration_seconds" integer;

ALTER TABLE "public"."plan_session_items"
  ADD COLUMN "target_intensity_zone" smallint;

ALTER TABLE "public"."plan_session_items"
  ADD COLUMN "target_interval_rest_seconds" integer;

ALTER TABLE "public"."health_screenings"
  ADD CONSTRAINT "health_screenings_ruleset_version_fkey" FOREIGN KEY (ruleset_version) REFERENCES public.rulesets(VERSION);

ALTER TABLE "public"."health_screenings"
  ADD CONSTRAINT "health_screenings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_target_duration_seconds_check" CHECK ((target_duration_seconds > 0));

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_target_intensity_zone_check" CHECK (((target_intensity_zone >= 1) AND (target_intensity_zone <= 5)));

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_target_interval_rest_seconds_check" CHECK ((target_interval_rest_seconds > 0));

CREATE INDEX health_screenings_user_idx ON public.health_screenings USING btree (user_id, created_at DESC);

CREATE POLICY "cribado propio" ON "public"."health_screenings"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "responder el cribado propio" ON "public"."health_screenings"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."health_screenings" TO "anon", "authenticated", "postgres", "service_role";
