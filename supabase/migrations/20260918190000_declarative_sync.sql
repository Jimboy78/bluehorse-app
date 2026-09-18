ALTER TABLE "public"."plan_session_items"
  ADD COLUMN "target_to_failure" boolean NOT NULL DEFAULT false;

ALTER TABLE "public"."plan_session_items"
  ADD COLUMN "target_pct_1rm_min" smallint;

ALTER TABLE "public"."plan_session_items"
  ADD COLUMN "target_pct_1rm_max" smallint;

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_target_pct_1rm_min_check" CHECK (((target_pct_1rm_min >= 1) AND (target_pct_1rm_min <= 100)));

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_target_pct_1rm_max_check" CHECK (((target_pct_1rm_max >= 1) AND (target_pct_1rm_max <= 100)));

ALTER TABLE "public"."plan_session_items"
  ADD CONSTRAINT "plan_session_items_check" CHECK ((target_pct_1rm_min <= target_pct_1rm_max));
