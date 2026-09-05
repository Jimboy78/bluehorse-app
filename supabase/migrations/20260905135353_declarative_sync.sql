ALTER TABLE "public"."set_logs"
  ALTER COLUMN "load_unit" DROP NOT NULL;

ALTER TABLE "public"."set_logs"
  ADD CONSTRAINT "set_logs_load_unit_con_valor" CHECK (((load_value IS NULL) OR (load_unit IS NOT NULL)));
