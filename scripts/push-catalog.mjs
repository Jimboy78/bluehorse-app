#!/usr/bin/env node
/**
 * Aplica el catálogo real del gimnasio (estaciones + ejercicios + mapeo) a la base.
 *
 *   node scripts/push-catalog.mjs [ruta-al-json]
 *
 * Por qué existe: el relevamiento son decenas de filas cargadas a mano. Si viven
 * solo en Postgres, un `db:reset` las borra y no queda rastro en git de qué tiene
 * el gimnasio. Acá el archivo es la fuente de verdad y la base es su copia.
 *
 * Es idempotente y no destructivo: resuelve por nombre, actualiza lo que cambió,
 * inserta lo que falta, y lo que ya no está en el archivo lo DESACTIVA
 * (`is_active = false`) en vez de borrarlo — los `set_logs` de quien ya usó esa
 * estación siguen apuntando a su fila.
 *
 * Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY: escribir el catálogo es una
 * operación de administración, no algo que haga el cliente.
 */
import { readFile } from 'node:fs/promises';
import { argv, env, exit } from 'node:process';
import { createClient } from '@supabase/supabase-js';

const file = argv[2] ?? new URL('../supabase/catalog/blue-horse.json', import.meta.url);
const url = env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  console.error('Para la base local, los imprime `npx supabase status -o env`.');
  exit(1);
}

const catalog = JSON.parse(await readFile(file, 'utf8'));
if (!Array.isArray(catalog.equipment) || !Array.isArray(catalog.exercises)) {
  console.error('El archivo no parece un catálogo: le faltan "equipment" y/o "exercises".');
  exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

function fail(step, error) {
  console.error(`Falló ${step}: ${error.message}`);
  exit(1);
}

// --- gimnasio ---------------------------------------------------------------

const { data: gyms, error: gymError } = await db.from('gyms').select('id, name');
if (gymError) fail('leer gyms', gymError);

const gym = gyms.find((g) => g.name === catalog.gym?.name) ?? gyms[0];
if (!gym) {
  console.error('No hay ningún gimnasio en la base. Corré `npm run db:reset` primero.');
  exit(1);
}

// --- estaciones -------------------------------------------------------------

const { data: existingEquipment, error: eqReadError } = await db
  .from('equipment')
  .select('id, name, is_active')
  .eq('gym_id', gym.id);
if (eqReadError) fail('leer equipment', eqReadError);

const equipmentIdByName = new Map(existingEquipment.map((e) => [e.name, e.id]));
const stats = { eqNew: 0, eqUpdated: 0, eqOff: 0, exNew: 0, exUpdated: 0, exOff: 0, links: 0 };

for (const item of catalog.equipment) {
  const row = {
    gym_id: gym.id,
    name: item.name,
    brand: item.brand ?? null,
    model: item.model ?? null,
    category: item.category,
    load_unit: item.load_unit,
    load_min: item.load_min ?? null,
    load_max: item.load_max ?? null,
    load_increment: item.load_increment ?? null,
    stack_kg: item.stack_kg ?? null,
    base_weight_kg: item.base_weight_kg ?? null,
    quantity: item.quantity ?? 1,
    location_note: item.location_note ?? null,
    setup_notes: item.setup_notes ?? null,
    is_active: true,
  };

  const id = equipmentIdByName.get(item.name);
  if (id) {
    const { error } = await db.from('equipment').update(row).eq('id', id);
    if (error) fail(`actualizar estación "${item.name}"`, error);
    stats.eqUpdated += 1;
  } else {
    const { data, error } = await db.from('equipment').insert(row).select('id').single();
    if (error) fail(`insertar estación "${item.name}"`, error);
    equipmentIdByName.set(item.name, data.id);
    stats.eqNew += 1;
  }
}

const catalogEquipmentNames = new Set(catalog.equipment.map((e) => e.name));
const equipmentToDeactivate = existingEquipment
  .filter((e) => e.is_active && !catalogEquipmentNames.has(e.name))
  .map((e) => e.id);

if (equipmentToDeactivate.length > 0) {
  const { error } = await db
    .from('equipment')
    .update({ is_active: false })
    .in('id', equipmentToDeactivate);
  if (error) fail('desactivar estaciones fuera del catálogo', error);
  stats.eqOff = equipmentToDeactivate.length;
}

// --- ejercicios -------------------------------------------------------------
// Van con gym_id null (son universales); lo que los ata a este gimnasio es el
// mapeo a sus estaciones.

const { data: existingExercises, error: exReadError } = await db
  .from('exercises')
  .select('id, name, is_active');
if (exReadError) fail('leer exercises', exReadError);

const exerciseIdByName = new Map(existingExercises.map((e) => [e.name, e.id]));
const linkRows = [];

for (const item of catalog.exercises) {
  const row = {
    gym_id: null,
    name: item.name,
    pattern: item.pattern,
    primary_muscles: item.primaryMuscles,
    secondary_muscles: item.secondaryMuscles ?? [],
    modality: item.modality,
    is_compound: item.isCompound,
    is_unilateral: item.isUnilateral,
    skill_level: item.skillLevel,
    cues: item.cues ?? null,
    is_active: true,
  };

  const id = exerciseIdByName.get(item.name);
  let exerciseId = id;
  if (id) {
    const { error } = await db.from('exercises').update(row).eq('id', id);
    if (error) fail(`actualizar ejercicio "${item.name}"`, error);
    stats.exUpdated += 1;
  } else {
    const { data, error } = await db.from('exercises').insert(row).select('id').single();
    if (error) fail(`insertar ejercicio "${item.name}"`, error);
    exerciseId = data.id;
    exerciseIdByName.set(item.name, exerciseId);
    stats.exNew += 1;
  }

  item.equipment.forEach((equipmentName, index) => {
    const equipmentId = equipmentIdByName.get(equipmentName);
    if (!equipmentId) {
      console.error(`"${item.name}" apunta a una estación que no existe: "${equipmentName}".`);
      exit(1);
    }
    // La primera estación de la lista es la preferida: es la que el motor propone
    // cuando hay varias donde se puede hacer el mismo ejercicio.
    linkRows.push({
      exercise_id: exerciseId,
      equipment_id: equipmentId,
      is_primary: index === 0,
    });
  });
}

const catalogExerciseNames = new Set(catalog.exercises.map((e) => e.name));
const exercisesToDeactivate = existingExercises
  .filter((e) => e.is_active && !catalogExerciseNames.has(e.name))
  .map((e) => e.id);

if (exercisesToDeactivate.length > 0) {
  const { error } = await db
    .from('exercises')
    .update({ is_active: false })
    .in('id', exercisesToDeactivate);
  if (error) fail('desactivar ejercicios fuera del catálogo', error);
  stats.exOff = exercisesToDeactivate.length;
}

// --- mapeo ejercicio ↔ estación --------------------------------------------
// Se reemplaza entero para los ejercicios del catálogo: es la única forma de que
// sacar una estación del archivo saque también su mapeo.

const catalogExerciseIds = catalog.exercises
  .map((e) => exerciseIdByName.get(e.name))
  .filter((id) => id !== undefined);

const { error: unlinkError } = await db
  .from('exercise_equipment')
  .delete()
  .in('exercise_id', catalogExerciseIds);
if (unlinkError) fail('limpiar el mapeo anterior', unlinkError);

const { error: linkError } = await db.from('exercise_equipment').insert(linkRows);
if (linkError) fail('insertar el mapeo', linkError);
stats.links = linkRows.length;

// --- resumen ----------------------------------------------------------------

console.log(`Catálogo de ${gym.name} aplicado.`);
console.log(
  `  estaciones: ${stats.eqNew} nuevas, ${stats.eqUpdated} actualizadas, ${stats.eqOff} desactivadas`,
);
console.log(
  `  ejercicios: ${stats.exNew} nuevos, ${stats.exUpdated} actualizados, ${stats.exOff} desactivados`,
);
console.log(`  mapeos ejercicio↔estación: ${stats.links}`);
