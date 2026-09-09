ALTER TABLE "public"."plans"
  ADD COLUMN "name" text;

ALTER TABLE "public"."plans"
  ADD CONSTRAINT "plans_name_check" CHECK (((name IS NULL) OR ((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 60))));
