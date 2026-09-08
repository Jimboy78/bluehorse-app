#!/usr/bin/env node
/**
 * AUDITORÍA DE AISLAMIENTO ENTRE SOCIOS
 *
 *   node scripts/audit-isolation.mjs
 *
 * Crea dos socios de prueba, les da datos, y verifica con JWT de sesión real
 * (no la service key) que ninguno puede leer ni escribir lo del otro. Después
 * borra todo lo que creó.
 *
 * Es la prueba que no se puede hacer leyendo el SQL: una política puede estar
 * escrita y no aplicar, o aplicar a la tabla equivocada. Acá se pregunta
 * exactamente lo que preguntaría alguien que intenta espiar a otro socio.
 *
 * Necesita SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.
 */
import { env, exit } from 'node:process';
import { createClient } from '@supabase/supabase-js';

const url = env.SUPABASE_URL;
const anonKey = env.SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error('Faltan SUPABASE_URL, SUPABASE_ANON_KEY y/o SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Para la base local los imprime `npx supabase status -o env`.');
  exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? '  OK  ' : ' FALLA'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

// Generada en cada corrida, no fija: las cuentas son efímeras (se crean y se
// borran en esta misma ejecución), así que no hay nada que proteger guardando
// una contraseña — pero escribir una fija en el código dispara el escáner de
// secretos igual, así que se genera al vuelo.
const PASSWORD = `audit-${crypto.randomUUID()}`;
const created = [];

async function createMember(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: email.split('@')[0] },
  });
  if (error) throw new Error(`No se pudo crear ${email}: ${error.message}`);
  created.push(data.user.id);
  return data.user.id;
}

/** Cliente con el JWT de esa persona: lo mismo que usa el navegador. */
async function signIn(email) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`No se pudo iniciar sesión como ${email}: ${error.message}`);
  return client;
}

// ---------------------------------------------------------------- montaje

const emailA = `audit-a-${Date.now()}@bluehorse.test`;
const emailB = `audit-b-${Date.now()}@bluehorse.test`;

console.log('\nCreando dos socios de prueba…');
const idA = await createMember(emailA);
const idB = await createMember(emailB);

const { data: gyms } = await admin.from('gyms').select('id').limit(1);
const gymId = gyms[0].id;

const { data: rs } = await admin.from('rulesets').select('version').eq('is_active', true).single();
const { data: ex } = await admin.from('exercises').select('id').eq('is_active', true).limit(1);
const exerciseId = ex[0].id;

// Datos de A, escritos con la service key para no depender de la app.
const { data: planA } = await admin
  .from('plans')
  .insert({
    user_id: idA,
    gym_id: gymId,
    ruleset_version: rs.version,
    template_id: 'full_body_ab',
    goal_snapshot: { goal: 'hypertrophy' },
    status: 'active',
  })
  .select('id')
  .single();

const { data: logA, error: logErr } = await admin
  .from('workout_logs')
  .insert({ user_id: idA, client_id: crypto.randomUUID() })
  .select('id')
  .single();
if (logErr) throw new Error(`No se pudo crear el workout_log de A: ${logErr.message}`);

await admin.from('user_goals').insert({
  user_id: idA,
  goal: 'hypertrophy',
  sessions_per_week_target: 3,
  session_minutes_target: 60,
});

await admin.from('user_constraints').insert({
  user_id: idA,
  type: 'pain',
  body_region: 'knee',
  severity: 4,
});

await admin.from('health_screenings').insert({
  user_id: idA,
  ruleset_version: rs.version,
  answers: { heart_condition: true },
  cleared: false,
});

await admin.from('set_logs').insert({
  workout_log_id: logA.id,
  exercise_id: exerciseId,
  set_index: 0,
  reps: 10,
  client_id: crypto.randomUUID(),
});

const clientA = await signIn(emailA);
const clientB = await signIn(emailB);

// ------------------------------------------------- lectura entre socios

console.log('\nB intenta LEER lo de A');

const readTargets = [
  ['plans', 'user_id', idA],
  ['user_goals', 'user_id', idA],
  ['user_constraints', 'user_id', idA],
  ['user_baselines', 'user_id', idA],
  ['workout_logs', 'user_id', idA],
  ['health_screenings', 'user_id', idA],
  ['adaptation_proposals', 'user_id', idA],
  ['personal_records', 'user_id', idA],
];

for (const [table, column, value] of readTargets) {
  const { data, error } = await clientB.from(table).select('*').eq(column, value);
  check(
    `${table}: B no ve nada de A`,
    !error && (data?.length ?? 0) === 0,
    error ? error.message : `devolvió ${data?.length} filas`,
  );
}

// set_logs no tiene user_id: cuelga de workout_logs. Es la que más fácil se
// escapa de una auditoría hecha "por columna".
{
  const { data, error } = await clientB.from('set_logs').select('*').eq('workout_log_id', logA.id);
  check(
    'set_logs: B no ve las series de A (cuelgan de workout_logs, no tienen user_id)',
    !error && (data?.length ?? 0) === 0,
    error ? error.message : `devolvió ${data?.length} filas`,
  );
}

// Y la prueba más importante: un select SIN filtro no debe traer nada ajeno.
console.log('\nB pide TODO, sin filtrar (lo que haría alguien curioso)');
for (const table of ['plans', 'workout_logs', 'health_screenings', 'user_constraints']) {
  const { data, error } = await clientB.from(table).select('user_id');
  const ajenas = (data ?? []).filter((r) => r.user_id !== idB);
  check(
    `${table}: sin filtro, B solo ve lo suyo`,
    !error && ajenas.length === 0,
    error ? error.message : `${ajenas.length} filas ajenas`,
  );
}

// ------------------------------------------------- escritura entre socios

console.log('\nB intenta ESCRIBIR como si fuera A');

{
  const { error } = await clientB.from('workout_logs').insert({
    user_id: idA,
    client_id: crypto.randomUUID(),
  });
  check('workout_logs: B no puede insertar con el user_id de A', !!error, error?.code);
}

{
  const { error } = await clientB.from('health_screenings').insert({
    user_id: idA,
    ruleset_version: rs.version,
    answers: {},
    cleared: true,
  });
  check('health_screenings: B no puede responder el cribado de A', !!error, error?.code);
}

{
  const { data, error } = await clientB
    .from('plans')
    .update({ status: 'archived' })
    .eq('id', planA.id)
    .select('id');
  check(
    'plans: B no puede archivar el plan de A',
    !error && (data?.length ?? 0) === 0,
    error ? error.message : `afectó ${data?.length} filas`,
  );
}

{
  const { data, error } = await clientB.from('plans').delete().eq('id', planA.id).select('id');
  check(
    'plans: B no puede borrar el plan de A',
    !error && (data?.length ?? 0) === 0,
    error ? error.message : `borró ${data?.length} filas`,
  );
}

{
  // El caso concreto de "activar un plan guardado": B no puede reactivar un
  // plan de A ni siquiera pasándolo a 'active' directamente.
  const { data, error } = await clientB
    .from('plans')
    .update({ status: 'active' })
    .eq('id', planA.id)
    .select('id');
  check(
    'plans: B no puede activar el plan de A como si fuera propio',
    !error && (data?.length ?? 0) === 0,
    error ? error.message : `afectó ${data?.length} filas`,
  );
}

// El cribado es un registro que no se puede reescribir: ni el propio dueño.
{
  const { data: own } = await clientA.from('health_screenings').select('id').limit(1);
  if (own?.length) {
    const { data, error } = await clientA
      .from('health_screenings')
      .update({ cleared: true })
      .eq('id', own[0].id)
      .select('id');
    check(
      'health_screenings: ni el propio dueño puede reescribir su cribado',
      !error && (data?.length ?? 0) === 0,
      error ? error.message : `afectó ${data?.length} filas`,
    );
  }
}

// ------------------------------------------------- sin sesión

console.log('\nSin sesión (clave anon suelta, que viaja en el bundle)');
for (const table of ['plans', 'workout_logs', 'set_logs', 'health_screenings', 'profiles']) {
  const { data, error } = await anon.from(table).select('*').limit(5);
  check(
    `${table}: sin sesión no devuelve nada`,
    !error && (data?.length ?? 0) === 0,
    error ? error.message : `devolvió ${data?.length} filas`,
  );
}

// El catálogo SÍ es público para quien tiene sesión: es del gimnasio, no de
// nadie en particular. Se verifica que se pueda leer pero no escribir.
console.log('\nCatálogo (es del gimnasio, no de un socio)');
{
  const { data, error } = await clientB.from('equipment').select('id').limit(1);
  check(
    'equipment: un socio puede leer el catálogo',
    !error && (data?.length ?? 0) > 0,
    error?.message,
  );
}
{
  const { error } = await clientB
    .from('equipment')
    .insert({ gym_id: gymId, name: 'Máquina falsa', category: 'accessory', load_unit: 'none' });
  check('equipment: un socio NO puede agregar máquinas', !!error, error?.code);
}

// ------------------------------------------------- limpieza

console.log('\nLimpieza…');
for (const id of created) {
  await admin.auth.admin.deleteUser(id);
}
const { data: leftA } = await admin.from('plans').select('id').eq('user_id', idA);
const { data: leftB } = await admin.from('plans').select('id').eq('user_id', idB);
console.log(`  planes de prueba restantes: ${(leftA?.length ?? 0) + (leftB?.length ?? 0)}`);

console.log(failures === 0 ? '\nAISLAMIENTO OK\n' : `\n${failures} FALLA(S) DE AISLAMIENTO\n`);
exit(failures === 0 ? 0 : 1);
