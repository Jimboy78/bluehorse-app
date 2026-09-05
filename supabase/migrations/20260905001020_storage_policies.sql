CREATE POLICY "cualquiera ve fotos de equipamiento" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'equipment-photos'::text));

CREATE POLICY "solo staff borra fotos de equipamiento" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'equipment-photos'::text) AND public.is_gym_admin()));

CREATE POLICY "solo staff reemplaza fotos de equipamiento" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'equipment-photos'::text) AND public.is_gym_admin()));

CREATE POLICY "solo staff sube fotos de equipamiento" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'equipment-photos'::text) AND public.is_gym_admin()));
