CREATE TYPE "public"."jump_direction" AS ENUM (
  'vertical',
  'horizontal',
  'lateral'
);

ALTER TABLE "public"."exercises"
  ADD COLUMN "jump_direction" public.jump_direction;

ALTER TABLE "public"."exercises"
  ADD CONSTRAINT "exercises_jump_direction_explosive" CHECK (((jump_direction IS NULL) OR is_explosive));

GRANT USAGE ON TYPE "public"."jump_direction" TO "postgres";
