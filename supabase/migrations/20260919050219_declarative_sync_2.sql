ALTER TABLE "public"."user_constraints"
  ADD CONSTRAINT "user_constraints_surgery_fields" CHECK (((type = 'surgery'::public.constraint_type) = ((surgery_on IS NOT NULL) AND (rehab_done IS NOT NULL))));

