ALTER TABLE "public"."user_constraints"
  ADD CONSTRAINT "user_constraints_occurred_on" CHECK (((type = ANY (ARRAY['surgery'::public.constraint_type, 'sprain'::public.constraint_type])) = (occurred_on IS NOT NULL)));

ALTER TABLE "public"."user_constraints"
  ADD CONSTRAINT "user_constraints_surgery_fields" CHECK (((type = 'surgery'::public.constraint_type) = (rehab_done IS NOT NULL)));

