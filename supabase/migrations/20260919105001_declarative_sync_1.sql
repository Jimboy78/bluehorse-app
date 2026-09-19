ALTER TABLE "public"."user_constraints"
  DROP CONSTRAINT "user_constraints_surgery_fields";

ALTER TABLE "public"."user_constraints"
  DROP COLUMN "surgery_on";

ALTER TABLE "public"."user_constraints"
  ADD COLUMN "occurred_on" date;

ALTER TYPE "public"."constraint_type" ADD VALUE 'sprain' AFTER 'surgery';

