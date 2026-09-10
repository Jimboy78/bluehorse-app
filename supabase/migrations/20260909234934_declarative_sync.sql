SET local check_function_bodies = off;

ALTER TABLE "public"."plan_session_items"
  ALTER COLUMN "rationale" DROP NOT NULL;

ALTER TABLE "public"."plans"
  ALTER COLUMN "ruleset_version" DROP NOT NULL;

ALTER TABLE "public"."plans"
  ALTER COLUMN "template_id" DROP NOT NULL;

CREATE TYPE "public"."plan_origin" AS ENUM (
  'engine',
  'manual'
);

ALTER TABLE "public"."plans"
  ADD COLUMN "origin" public.plan_origin NOT NULL DEFAULT 'engine'::public.plan_origin;

CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
begin
  if new.role is distinct from old.role and not is_gym_admin() then
    raise exception 'El rol de un perfil no se cambia desde la aplicación.'
      using errcode = 'insufficient_privilege';
  end if;

  if new.gym_id is distinct from old.gym_id and not is_gym_admin() then
    raise exception 'El gimnasio de un perfil no se cambia desde la aplicación.'
      using errcode = 'insufficient_privilege';
  end if;

  return new;
end;
$function$;

ALTER TABLE "public"."plans"
  ADD CONSTRAINT "plans_engine_needs_ruleset" CHECK (((origin <> 'engine'::public.plan_origin) OR ((ruleset_version IS NOT NULL) AND (template_id IS NOT NULL))));

CREATE TRIGGER profiles_guard_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileges();

GRANT EXECUTE ON FUNCTION "public"."guard_profile_privileges"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."plan_origin" TO "postgres";
