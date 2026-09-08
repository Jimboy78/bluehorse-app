#!/usr/bin/env node
/**
 * Lo mínimo indispensable para que un proyecto Supabase nuevo (cloud) tenga
 * lo que `seed.sql` le da al local: el bucket de Storage y la fila del
 * gimnasio. `supabase db push` no corre `seed.sql`, así que sin esto
 * `push-catalog.mjs` no tiene a qué gimnasio atar las estaciones.
 *
 *   node scripts/seed-cloud-base.mjs
 *
 * Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY del proyecto de destino.
 */
import { env, exit } from 'node:process';
import { createClient } from '@supabase/supabase-js';

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.');
  exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

const { error: bucketError } = await db.storage.createBucket('equipment-photos', {
  public: true,
  fileSizeLimit: 8388608,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
});
if (bucketError && !bucketError.message.includes('already exists')) {
  console.error('No se pudo crear el bucket:', bucketError.message);
  exit(1);
}
console.log('Bucket equipment-photos: ok');

const { error: gymError } = await db.from('gyms').upsert(
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'blue-horse',
    name: 'Blue Horse Gym',
    address: 'Islas Malvinas 370 BIS, Arroyo Seco, Santa Fe',
    timezone: 'America/Argentina/Buenos_Aires',
    join_code: 'BLUEHORSE',
  },
  { onConflict: 'slug' },
);
if (gymError) {
  console.error('No se pudo crear el gimnasio:', gymError.message);
  exit(1);
}
console.log('Gimnasio Blue Horse Gym: ok');
