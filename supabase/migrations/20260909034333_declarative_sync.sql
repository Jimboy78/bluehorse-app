ALTER TABLE "public"."plans"
  ADD COLUMN "warnings" text[] NOT NULL DEFAULT '{}'::text[];
