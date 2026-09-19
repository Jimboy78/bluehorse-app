CREATE TYPE "public"."movement_limit" AS ENUM (
  'overhead',
  'floor',
  'hanging',
  'jumping'
);

ALTER TABLE "public"."exercises"
  ADD COLUMN "requires_movements" public.movement_limit[] NOT NULL DEFAULT '{}'::public.movement_limit[];

ALTER TABLE "public"."user_constraints"
  ADD COLUMN "movement" public.movement_limit;

