ALTER TABLE "public"."user_constraints"
  ADD CONSTRAINT "user_constraints_movement" CHECK (((type = 'avoid_movement'::public.constraint_type) = (movement IS NOT NULL)));

CREATE UNIQUE INDEX user_constraints_movement_idx ON public.user_constraints USING btree (user_id, movement)
  WHERE ((TYPE = 'avoid_movement'::public.constraint_type) AND (active_to IS NULL));

GRANT USAGE ON TYPE "public"."movement_limit" TO "postgres";

