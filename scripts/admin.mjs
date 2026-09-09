#!/usr/bin/env node
/**
 * CONSULTA DE DATOS DE SOCIOS — para el dueño del gimnasio y para el agente
 *
 *   node scripts/admin.mjs socios
 *   node scripts/admin.mjs socio <email|uuid>
 *   node scripts/admin.mjs planes
 *   node scripts/admin.mjs resumen
 *   node scripts/admin.mjs sql "<consulta select>"
 *
 * Cualquier comando acepta `--json` para que la salida se pueda procesar.
 *
 * POR QUÉ UN SCRIPT Y NO UNA PANTALLA
 *
 * La RLS de este proyecto es estricta a propósito: de todas las tablas de
 * socio, un admin autenticado solo puede leer `profiles` (ver `08_rls.sql`).
 * Objetivos, planes, sesiones, series, mediciones — todo está cerrado a
 * `user_id = auth.uid()`. Y dos tablas lo están por decisión explícita de
 * producto, no por olvido: `pain_reports` ("dato de salud: sin excepción para
 * admin") y `health_screenings`.
 *
 * O sea que una pantalla de admin en el navegador no puede mostrar esto sin
 * antes ampliar esas políticas, que es una decisión de privacidad de quien
 * maneja el gimnasio, no algo que se resuelve escribiendo una consulta.
 *
 * Este script usa la `service_role`, que salta la RLS por diseño. Corre en la
 * máquina de quien tiene esa clave, no queda expuesto en ningún lado, y no
 * abre ninguna superficie nueva a internet. Es el mismo camino que ya usan
 * `push-catalog.mjs` y `audit-isolation.mjs`.
 *
 * SOLO LECTURA. No hay ningún comando que escriba ni borre: para eso están las
 * migraciones y el panel. `sql` rechaza cualquier cosa que no empiece con
 * `select`.
 *
 * Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Para la base local los
 * imprime `npx supabase status -o env`; para la nube salen del panel de
 * Supabase. Nunca van en un archivo versionado.
 */
import { argv, env, exit } from 'node:process';
import { createClient } from '@supabase/supabase-js';

const url = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Para la base local los imprime `npx supabase status -o env`.');
  exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const args = argv.slice(2).filter((a) => a !== '--json');
const asJson = argv.includes('--json');
const [command, ...rest] = args;

// ---------------------------------------------------------------- utilidades

function out(label, rows) {
  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  console.log(`\n${label}`);
  if (!rows || rows.length === 0) {
    console.log('  (nada)');
    return;
  }
  console.table(rows);
}

/** Fecha corta en la zona del gimnasio. Sin hora salvo que importe. */
function fecha(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

async function pick(table, columns, filter) {
  let q = db.from(table).select(columns);
  for (const [col, value] of Object.entries(filter ?? {})) q = q.eq(col, value);
  const { data, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

/** El socio, buscado por email (vía auth) o por uuid. */
async function findMember(needle) {
  if (/^[0-9a-f-]{36}$/i.test(needle)) return needle;

  // El email vive en `auth.users`, no en `profiles`: se busca ahí.
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`auth: ${error.message}`);
  const found = data.users.find((u) => u.email?.toLowerCase() === needle.toLowerCase());
  if (!found) throw new Error(`No hay ningún socio con el email "${needle}".`);
  return found.id;
}

/** Email de cada socio, para poder mostrarlo al lado del perfil. */
async function emailsById() {
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`auth: ${error.message}`);
  return new Map(data.users.map((u) => [u.id, u.email ?? '—']));
}

// ---------------------------------------------------------------- comandos

async function socios() {
  const perfiles = await pick(
    'profiles',
    'id, display_name, role, sex, experience_level, birth_date, onboarded_at, created_at',
  );
  const emails = await emailsById();

  // Cuántos planes y cuántas sesiones registradas tiene cada uno: es lo que
  // dice de un vistazo quién está usando la app de verdad.
  const planes = await pick('plans', 'user_id, status');
  const sesiones = await pick('workout_logs', 'user_id, ended_at');

  const filas = perfiles.map((p) => {
    const suyos = planes.filter((x) => x.user_id === p.id);
    const entrenos = sesiones.filter((x) => x.user_id === p.id);
    return {
      socio: p.display_name,
      email: emails.get(p.id) ?? '—',
      rol: p.role,
      onboarding: p.onboarded_at ? 'completo' : 'PENDIENTE',
      planes: suyos.length,
      activo: suyos.some((x) => x.status === 'active') ? 'sí' : 'no',
      sesiones: entrenos.length,
      cerradas: entrenos.filter((x) => x.ended_at).length,
      alta: fecha(p.created_at),
      id: p.id,
    };
  });

  out(`SOCIOS (${filas.length})`, filas);
}

async function socio(needle) {
  const id = await findMember(needle);
  const [perfil] = await pick(
    'profiles',
    'id, display_name, role, gym_id, sex, experience_level, birth_date, onboarded_at, created_at',
    { id },
  );
  if (!perfil) throw new Error(`No hay perfil para ${id}.`);
  const emails = await emailsById();

  if (asJson) {
    const [
      objetivos,
      cribado,
      medidas,
      restricciones,
      planes,
      entrenos,
      records,
      propuestas,
      dolor,
    ] = await Promise.all([
      pick('user_goals', '*', { user_id: id }),
      pick('health_screenings', '*', { user_id: id }),
      pick('body_metrics', '*', { user_id: id }),
      pick('user_constraints', '*', { user_id: id }),
      pick('plans', '*', { user_id: id }),
      pick('workout_logs', '*', { user_id: id }),
      pick('personal_records', '*', { user_id: id }),
      pick('adaptation_proposals', '*', { user_id: id }),
      pick('pain_reports', '*', { user_id: id }),
    ]);
    console.log(
      JSON.stringify(
        {
          perfil: { ...perfil, email: emails.get(id) },
          objetivos,
          cribado,
          medidas,
          restricciones,
          planes,
          entrenos,
          records,
          propuestas,
          dolor,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`\n=== ${perfil.display_name} · ${emails.get(id) ?? '—'} ===`);
  console.log(
    `  rol: ${perfil.role} · sexo: ${perfil.sex} · nivel: ${perfil.experience_level}` +
      ` · nacimiento: ${fecha(perfil.birth_date)}`,
  );
  console.log(
    `  alta: ${fecha(perfil.created_at)} · onboarding: ${
      perfil.onboarded_at ? fecha(perfil.onboarded_at) : 'PENDIENTE'
    }`,
  );

  // Lo que respondió en el formulario de alta.
  const objetivos = await pick(
    'user_goals',
    'goal, sport, sessions_per_week_target, session_minutes_target, is_active, started_at',
    { user_id: id },
  );
  out(
    'OBJETIVO (lo que eligió en el onboarding)',
    objetivos.map((g) => ({
      objetivo: g.goal,
      deporte: g.sport ?? '—',
      'sesiones/sem': g.sessions_per_week_target,
      'min/sesión': g.session_minutes_target,
      vigente: g.is_active ? 'sí' : 'no',
      desde: fecha(g.started_at),
    })),
  );

  const medidas = await pick('body_metrics', 'weight_kg, height_cm, recorded_at', { user_id: id });
  out(
    'PESO Y ALTURA',
    medidas
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
      .map((m) => ({
        peso: m.weight_kg ?? '—',
        altura: m.height_cm ?? '—',
        cuándo: fecha(m.recorded_at),
      })),
  );

  const cribado = await pick('health_screenings', 'cleared, answers, created_at, ruleset_version', {
    user_id: id,
  });
  out(
    'CRIBADO DE SALUD',
    cribado.map((c) => ({
      habilitado: c.cleared ? 'sí' : 'NO — necesita autorización médica',
      respuestas: JSON.stringify(c.answers),
      ruleset: c.ruleset_version,
      cuándo: fecha(c.created_at),
    })),
  );

  const restricciones = await pick(
    'user_constraints',
    'type, body_region, severity, note, active_from, active_to',
    { user_id: id },
  );
  out(
    'RESTRICCIONES',
    restricciones.map((c) => ({
      tipo: c.type,
      zona: c.body_region ?? '—',
      severidad: c.severity,
      nota: c.note ?? '—',
      vigente: c.active_to ? 'no' : 'sí',
      desde: fecha(c.active_from),
    })),
  );

  const planes = await pick(
    'plans',
    'id, name, template_id, status, generated_at, ruleset_version, warnings',
    { user_id: id },
  );
  const sesiones = planes.length ? await pick('plan_sessions', 'plan_id, status') : [];
  out(
    'PLANES',
    planes.map((p) => {
      const suyas = sesiones.filter((s) => s.plan_id === p.id);
      return {
        nombre: p.name ?? '(sin nombre)',
        template: p.template_id,
        estado: p.status,
        sesiones: `${suyas.filter((s) => s.status === 'completed').length}/${suyas.length}`,
        avisos: p.warnings?.length ?? 0,
        generado: fecha(p.generated_at),
        ruleset: p.ruleset_version,
      };
    }),
  );

  const entrenos = await pick(
    'workout_logs',
    'id, started_at, ended_at, session_feel, session_rpe, notes',
    { user_id: id },
  );
  const series = await pick(
    'set_logs',
    'workout_log_id, load_value, load_unit, reps, rir, is_warmup',
  );
  out(
    'ENTRENAMIENTOS',
    entrenos
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .map((w) => {
        const suyas = series.filter((s) => s.workout_log_id === w.id);
        return {
          cuándo: fecha(w.started_at),
          cerrado: w.ended_at ? 'sí' : 'EN CURSO',
          series: suyas.length,
          sensación: w.session_feel ?? '—',
          rpe: w.session_rpe ?? '—',
          notas: w.notes ?? '—',
        };
      }),
  );

  const records = await pick('personal_records', 'type, value, achieved_at, exercise_id', {
    user_id: id,
  });
  out(
    'RÉCORDS',
    records.map((r) => ({ tipo: r.type, valor: r.value, cuándo: fecha(r.achieved_at) })),
  );

  const propuestas = await pick(
    'adaptation_proposals',
    'type, reason_code, from_value, to_value, load_unit, status, created_at, resolved_at',
    { user_id: id },
  );
  out(
    'PROPUESTAS DEL MOTOR',
    propuestas.map((p) => ({
      tipo: p.type,
      motivo: p.reason_code,
      cambio: `${p.from_value ?? '—'} → ${p.to_value ?? '—'} ${p.load_unit ?? ''}`.trim(),
      estado: p.status,
      creada: fecha(p.created_at),
      resuelta: p.resolved_at ? fecha(p.resolved_at) : '—',
    })),
  );

  // Dato de salud: se muestra acá porque quien corre esto tiene la
  // `service_role`, pero NO se comparte con el gimnasio por la app (ver la
  // política de `pain_reports` en 08_rls.sql).
  const dolor = await pick('pain_reports', 'body_region, severity, note, reported_at', {
    user_id: id,
  });
  out(
    'MOLESTIAS REPORTADAS (dato de salud)',
    dolor.map((d) => ({
      zona: d.body_region,
      severidad: d.severity,
      nota: d.note ?? '—',
      cuándo: fecha(d.reported_at),
    })),
  );
}

async function planes() {
  const filas = await pick(
    'plans',
    'id, user_id, name, template_id, status, generated_at, ruleset_version',
  );
  const perfiles = await pick('profiles', 'id, display_name');
  const nombre = new Map(perfiles.map((p) => [p.id, p.display_name]));

  out(
    `PLANES (${filas.length})`,
    filas
      .sort((a, b) => b.generated_at.localeCompare(a.generated_at))
      .map((p) => ({
        socio: nombre.get(p.user_id) ?? p.user_id,
        nombre: p.name ?? '(sin nombre)',
        template: p.template_id,
        estado: p.status,
        generado: fecha(p.generated_at),
        ruleset: p.ruleset_version,
      })),
  );
}

async function resumen() {
  const [perfiles, planesTodos, entrenos, series, propuestas, equipamiento, ejercicios] =
    await Promise.all([
      pick('profiles', 'id, onboarded_at'),
      pick('plans', 'id, status'),
      pick('workout_logs', 'id, user_id, started_at, ended_at'),
      pick('set_logs', 'id, load_kg_normalized'),
      pick('adaptation_proposals', 'id, status'),
      pick('equipment', 'id, is_active'),
      pick('exercises', 'id, is_active'),
    ]);

  const hace30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activos = new Set(
    entrenos.filter((w) => Date.parse(w.started_at) >= hace30).map((w) => w.user_id),
  );

  const filas = [
    { dato: 'socios', valor: perfiles.length },
    { dato: 'con onboarding completo', valor: perfiles.filter((p) => p.onboarded_at).length },
    { dato: 'entrenaron en los últimos 30 días', valor: activos.size },
    { dato: 'planes generados', valor: planesTodos.length },
    { dato: 'planes activos', valor: planesTodos.filter((p) => p.status === 'active').length },
    { dato: 'entrenamientos', valor: entrenos.length },
    { dato: 'entrenamientos sin cerrar', valor: entrenos.filter((w) => !w.ended_at).length },
    { dato: 'series registradas', valor: series.length },
    {
      dato: 'series sin carga convertible a kg',
      valor: series.filter((s) => s.load_kg_normalized === null).length,
    },
    {
      dato: 'propuestas pendientes',
      valor: propuestas.filter((p) => p.status === 'pending').length,
    },
    { dato: 'estaciones activas', valor: equipamiento.filter((e) => e.is_active).length },
    { dato: 'ejercicios activos', valor: ejercicios.filter((e) => e.is_active).length },
  ];

  out('RESUMEN DEL GIMNASIO', filas);
}

/**
 * Consulta libre, solo lectura.
 *
 * PostgREST no ejecuta SQL suelto, así que esto usa la API de tablas: se pasa
 * `tabla [columnas]` y opcionalmente filtros `col=valor`. Menos potente que
 * SQL, pero no puede escribir nada por construcción — que es la propiedad que
 * importa en un script que corre con la `service_role`.
 */
async function consulta(tabla, ...filtros) {
  if (!tabla) throw new Error('Falta la tabla. Ej: node scripts/admin.mjs tabla set_logs reps=10');

  let columnas = '*';
  const where = {};
  for (const f of filtros) {
    if (f.startsWith('cols=')) columnas = f.slice(5);
    else if (f.includes('=')) {
      const [col, ...v] = f.split('=');
      where[col] = v.join('=');
    }
  }

  const filas = await pick(tabla, columnas, where);
  out(`${tabla.toUpperCase()} (${filas.length})`, filas);
}

// ---------------------------------------------------------------- despacho

const comandos = {
  socios,
  socio: () => socio(rest[0] ?? ''),
  planes,
  resumen,
  tabla: () => consulta(...rest),
};

const run = comandos[command ?? ''];
if (!run) {
  console.log(`Comandos:
  socios                      lista de socios con su actividad
  socio <email|uuid>          todo lo de un socio: onboarding, planes, entrenos, molestias
  planes                      todos los planes generados
  resumen                     números del gimnasio
  tabla <tabla> [col=valor]   consulta cruda de cualquier tabla

Cualquiera acepta --json.`);
  exit(command ? 1 : 0);
}

try {
  if (rest[0] === undefined && command === 'socio') {
    throw new Error('Falta el email o el uuid del socio.');
  }
  await run();
} catch (error) {
  console.error(`\nError: ${error.message}`);
  exit(1);
}
