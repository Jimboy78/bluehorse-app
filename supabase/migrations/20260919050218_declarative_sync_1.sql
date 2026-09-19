ALTER TABLE "public"."user_constraints"
  ADD COLUMN "surgery_on" date;

ALTER TABLE "public"."user_constraints"
  ADD COLUMN "rehab_done" boolean;

ALTER TYPE "public"."constraint_type" ADD VALUE 'surgery' AFTER 'tendinopathy';

