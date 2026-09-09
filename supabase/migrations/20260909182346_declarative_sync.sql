CREATE TYPE "public"."season_phase" AS ENUM (
  'preseason',
  'in_season',
  'off_season',
  'none'
);

ALTER TABLE "public"."user_goals"
  ADD COLUMN "season_phase" public.season_phase NOT NULL DEFAULT 'none'::public.season_phase;

GRANT USAGE ON TYPE "public"."season_phase" TO "postgres";
