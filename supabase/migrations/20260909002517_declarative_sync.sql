CREATE TABLE "public"."body_metrics" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "gym_id"      uuid                     NOT NULL,
  "weight_kg"   numeric(5,2),
  "height_cm"   numeric(5,1),
  "recorded_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "body_metrics_height_cm_check" CHECK (((height_cm >= (100)::numeric) AND (height_cm <= (250)::numeric))),
  CONSTRAINT "body_metrics_pkey" PRIMARY KEY (id),
  CONSTRAINT "body_metrics_weight_kg_check" CHECK (((weight_kg >= (25)::numeric) AND (weight_kg <= (350)::numeric)))
);

ALTER TABLE "public"."body_metrics"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."body_metrics"
  ADD CONSTRAINT "body_metrics_gym_id_fkey" FOREIGN KEY (gym_id) REFERENCES public.gyms(id) ON DELETE RESTRICT;

ALTER TABLE "public"."body_metrics"
  ADD CONSTRAINT "body_metrics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX body_metrics_recent_idx ON public.body_metrics USING btree (user_id, recorded_at DESC);

CREATE POLICY "borrar mediciones propias" ON "public"."body_metrics"
  FOR DELETE
  TO "authenticated"
  USING ((user_id = auth.uid()));

CREATE POLICY "cargar mediciones propias" ON "public"."body_metrics"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((user_id = auth.uid()));

CREATE POLICY "mediciones propias" ON "public"."body_metrics"
  FOR SELECT
  TO "authenticated"
  USING ((user_id = auth.uid()));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."body_metrics" TO "anon", "authenticated", "postgres", "service_role";
