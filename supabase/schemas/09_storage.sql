-- Políticas de Storage para fotos de equipamiento.
--
-- El bucket en sí (`equipment-photos`, público de lectura) se crea en
-- `seed.sql`: el motor de esquemas declarativos no acepta INSERT sobre
-- tablas de sistema como `storage.buckets`, solo DDL. Acá van las políticas,
-- que sí son DDL. Lectura pública porque las fotos de máquinas no son
-- sensibles y hay que poder mostrarlas sin autenticar (splash, compartir).
-- La escritura queda restringida a staff/admin, igual que el resto del
-- catálogo (ver 08_rls.sql).

create policy "cualquiera ve fotos de equipamiento"
  on storage.objects for select
  using (bucket_id = 'equipment-photos');

create policy "solo staff sube fotos de equipamiento"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'equipment-photos' and is_gym_admin());

create policy "solo staff reemplaza fotos de equipamiento"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'equipment-photos' and is_gym_admin());

create policy "solo staff borra fotos de equipamiento"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'equipment-photos' and is_gym_admin());
