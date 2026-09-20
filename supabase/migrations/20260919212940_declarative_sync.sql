CREATE TYPE "public"."secondary_goal" AS ENUM (
  'fat_loss',
  'health'
);

ALTER TABLE "public"."user_goals"
  ADD COLUMN "secondary_goals" public.secondary_goal[] NOT NULL DEFAULT '{}'::public.secondary_goal[];

GRANT USAGE ON TYPE "public"."secondary_goal" TO "postgres";
