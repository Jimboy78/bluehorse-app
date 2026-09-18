CREATE TABLE "public"."rest_days" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "gym_id"     uuid                     NOT NULL,
  "day"        date                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "rest_days_pkey" PRIMARY KEY (id),
  CONSTRAINT "rest_days_user_id_day_key" UNIQUE (user_id, day)
);

ALTER TABLE "public"."rest_days"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rest_days"
  ADD CONSTRAINT "rest_days_gym_id_fkey" FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE RESTRICT;

ALTER TABLE "public"."rest_days"
  ADD CONSTRAINT "rest_days_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE POLICY "descansos propios" ON "public"."rest_days"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "desmarcar descanso propio" ON "public"."rest_days"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "marcar descanso propio" ON "public"."rest_days"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((user_id = auth.uid()) AND (gym_id = public.current_gym_id())));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."rest_days" TO "anon", "authenticated", "postgres", "service_role";
