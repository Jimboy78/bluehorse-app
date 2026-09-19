CREATE TYPE "public"."prevention_program" AS ENUM (
  'hamstring'
);

ALTER TABLE "public"."exercises"
  ADD COLUMN "prevents" public.prevention_program[] NOT NULL DEFAULT '{}'::public.prevention_program[];

GRANT USAGE ON TYPE "public"."prevention_program" TO "postgres";
