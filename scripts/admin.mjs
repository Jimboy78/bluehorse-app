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
import { execFileSync } from 'node:child_process';
import { argv, env, exit } from 'node:process';
import { createClient } from '@supabase/supabase-js';

const url = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Si esto apunta a la base LOCAL.
 *
 * Los comandos que escriben, borran o corren SQL suelto solo funcionan acá.
 * La misma clave y el mismo script pueden apuntar a la base de producción con
 * cambiar una variable de entorno, y "sembrar datos de prueba" contra la base
 * donde entrenan socios reales es la clase de error que no se deshace. La
 * puerta la abre la URL, no una bandera que uno se puede olvidar de sacar.
 */
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url ?? '');

function requireLocal(comando) {
  if (isLocal) return;
  console.error(
    `"${comando}" solo corre contra la base local (127.0.0.1).\n` +
      `SUPABASE_URL apunta a ${url}.\n` +
      'Escribir o borrar en producción se hace por migración o por el panel, a mano y a la vista.',
  );
  exit(1);
}

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

// ------------------------------------------------- análisis del motor (anónimo)

/**
 * DE QUÉ ENTRADA SALIÓ CADA PLAN — sin saber de quién es
 *
 * La pregunta que estos comandos contestan no es "qué hizo Fulano" sino "con
 * esta entrada, ¿el motor prescribe bien?". Por eso no sale ni un nombre, ni un
 * email, ni un id de socio: la unidad de análisis es la RUTA (objetivo, nivel,
 * frecuencia, minutos por sesión), no la persona.
 *
 * Tampoco toca cribado de salud ni molestias. No es solo privacidad: no hacen
 * falta para juzgar un plan, y traerlos convertiría una herramienta de calidad
 * del motor en una de vigilancia.
 *
 * `goal_snapshot` es lo que hace que esto sea posible y honesto: guarda el
 * objetivo TAL COMO ERA cuando se generó el plan. Mirar `user_goals` hoy
 * mostraría la entrada equivocada para todo plan de alguien que después cambió
 * de objetivo.
 */

/** La entrada que produjo un plan, en una línea. Es la clave de agrupación. */
function rutaDe(plan, nivelPorSocio) {
  const g = plan.goal_snapshot ?? {};
  return [
    g.goal ?? '?',
    nivelPorSocio.get(plan.user_id) ?? '?',
    `${g.sessionsPerWeekTarget ?? '?'}x/sem`,
    `${g.sessionMinutesTarget ?? '?'}min`,
  ].join(' · ');
}

/** Todo lo que hace falta para analizar planes, cargado de una. */
async function datosDePlanes() {
  const [planes, perfiles, sesiones, items, ejercicios] = await Promise.all([
    pick(
      'plans',
      'id, user_id, template_id, goal_snapshot, warnings, ruleset_version, generated_at',
    ),
    pick('profiles', 'id, experience_level'),
    pick('plan_sessions', 'id, plan_id, label, focus, status, estimated_minutes'),
    pick(
      'plan_session_items',
      'plan_session_id, exercise_id, target_sets, target_reps_min, target_reps_max, target_rir, rest_seconds, target_load, is_placeholder',
    ),
    pick('exercises', 'id, name, pattern, primary_muscles'),
  ]);

  const nivelPorSocio = new Map(perfiles.map((p) => [p.id, p.experience_level]));
  const sesionesPorPlan = new Map();
  for (const s of sesiones) {
    sesionesPorPlan.set(s.plan_id, [...(sesionesPorPlan.get(s.plan_id) ?? []), s]);
  }
  const itemsPorSesion = new Map();
  for (const i of items) {
    itemsPorSesion.set(i.plan_session_id, [...(itemsPorSesion.get(i.plan_session_id) ?? []), i]);
  }
  const ejercicioPorId = new Map(ejercicios.map((e) => [e.id, e]));

  return { planes, nivelPorSocio, sesionesPorPlan, itemsPorSesion, ejercicioPorId };
}

/** Los ítems de un plan, aplanados. */
function itemsDePlan(plan, sesionesPorPlan, itemsPorSesion) {
  const suyas = sesionesPorPlan.get(plan.id) ?? [];
  return suyas.flatMap((s) => itemsPorSesion.get(s.id) ?? []);
}

/** Series por músculo en el plan: es la métrica sobre la que avisa el motor. */
function seriesPorMusculo(items, ejercicioPorId) {
  const porSesion = new Map();
  for (const i of items) {
    const ej = ejercicioPorId.get(i.exercise_id);
    for (const m of ej?.primary_muscles ?? []) {
      porSesion.set(m, (porSesion.get(m) ?? 0) + i.target_sets);
    }
  }
  return porSesion;
}

async function recetas() {
  const { planes, nivelPorSocio, sesionesPorPlan, itemsPorSesion } = await datosDePlanes();

  const porRuta = new Map();
  for (const p of planes) {
    const ruta = rutaDe(p, nivelPorSocio);
    const suyas = sesionesPorPlan.get(p.id) ?? [];
    const items = itemsDePlan(p, sesionesPorPlan, itemsPorSesion);
    const acc = porRuta.get(ruta) ?? {
      planes: 0,
      templates: new Set(),
      rulesets: new Set(),
      sesiones: 0,
      completadas: 0,
      items: 0,
      series: 0,
      conAviso: 0,
      placeholders: 0,
      sinCarga: 0,
    };
    acc.planes += 1;
    acc.templates.add(p.template_id);
    acc.rulesets.add(p.ruleset_version);
    acc.sesiones += suyas.length;
    acc.completadas += suyas.filter((s) => s.status === 'completed').length;
    acc.items += items.length;
    acc.series += items.reduce((n, i) => n + i.target_sets, 0);
    acc.conAviso += (p.warnings?.length ?? 0) > 0 ? 1 : 0;
    acc.placeholders += items.filter((i) => i.is_placeholder).length;
    acc.sinCarga += items.filter((i) => i.target_load === null).length;
    porRuta.set(ruta, acc);
  }

  const filas = [...porRuta.entries()]
    .sort((a, b) => b[1].planes - a[1].planes)
    .map(([ruta, a], i) => ({
      '#': i + 1,
      'ruta (objetivo · nivel · frecuencia · duración)': ruta,
      template: [...a.templates].join(', '),
      planes: a.planes,
      'ses/plan': (a.sesiones / a.planes).toFixed(1),
      'ejerc/ses': a.sesiones ? (a.items / a.sesiones).toFixed(1) : '—',
      'series/ses': a.sesiones ? (a.series / a.sesiones).toFixed(1) : '—',
      completó: a.sesiones ? `${Math.round((a.completadas / a.sesiones) * 100)}%` : '—',
      'con aviso': `${Math.round((a.conAviso / a.planes) * 100)}%`,
      'sin carga': a.items ? `${Math.round((a.sinCarga / a.items) * 100)}%` : '—',
      ruleset: [...a.rulesets].join(', '),
    }));

  out(`RUTAS QUE GENERARON PLANES (${filas.length} rutas, ${planes.length} planes)`, filas);
  if (!asJson) {
    console.log(
      '  "completó" es la señal más dura de si el plan está bien calibrado: un plan\n' +
        '  que nadie termina está mal armado, aunque los números cierren.\n' +
        '  Detalle de una ruta: npm run admin receta <#>',
    );
  }
}

async function receta(numero) {
  const n = Number(numero);
  if (!Number.isInteger(n) || n < 1) throw new Error('Pasá el número de ruta que lista `recetas`.');

  const { planes, nivelPorSocio, sesionesPorPlan, itemsPorSesion, ejercicioPorId } =
    await datosDePlanes();

  const rutas = new Map();
  for (const p of planes) {
    const r = rutaDe(p, nivelPorSocio);
    rutas.set(r, [...(rutas.get(r) ?? []), p]);
  }
  const ordenadas = [...rutas.entries()].sort((a, b) => b[1].length - a[1].length);
  const elegida = ordenadas[n - 1];
  if (!elegida) throw new Error(`No hay ruta #${n}. Son ${ordenadas.length}.`);

  const [ruta, susPlanes] = elegida;
  const items = susPlanes.flatMap((p) => itemsDePlan(p, sesionesPorPlan, itemsPorSesion));

  if (asJson) {
    console.log(JSON.stringify({ ruta, planes: susPlanes.length, items }, null, 2));
    return;
  }

  console.log(`\nRUTA #${n}: ${ruta}`);
  console.log(
    `  ${susPlanes.length} plan(es) · template: ${[...new Set(susPlanes.map((p) => p.template_id))].join(', ')}`,
  );

  // Qué prescribió el motor, por ejercicio.
  const porEjercicio = new Map();
  for (const i of items) {
    const key = i.exercise_id;
    const acc = porEjercicio.get(key) ?? {
      veces: 0,
      series: 0,
      reps: new Set(),
      rir: new Set(),
      rest: new Set(),
    };
    acc.veces += 1;
    acc.series += i.target_sets;
    acc.reps.add(`${i.target_reps_min}-${i.target_reps_max}`);
    if (i.target_rir !== null) acc.rir.add(i.target_rir);
    acc.rest.add(i.rest_seconds);
    porEjercicio.set(key, acc);
  }

  out(
    'QUÉ PRESCRIBIÓ',
    [...porEjercicio.entries()]
      .sort((a, b) => b[1].veces - a[1].veces)
      .map(([id, a]) => ({
        ejercicio: ejercicioPorId.get(id)?.name ?? id,
        patrón: ejercicioPorId.get(id)?.pattern ?? '—',
        'veces en el plan': a.veces,
        series: a.series,
        reps: [...a.reps].join(' / '),
        rir: [...a.rir].join(' / ') || '—',
        descanso: [...a.rest].map((r) => `${r}s`).join(' / '),
      })),
  );

  // Volumen por músculo, que es sobre lo que avisa el motor y sobre lo que
  // habla la investigación.
  const sesiones = susPlanes.reduce((n2, p) => n2 + (sesionesPorPlan.get(p.id)?.length ?? 0), 0);
  const porMusculo = seriesPorMusculo(items, ejercicioPorId);
  out(
    'SERIES POR MÚSCULO (en todo el plan)',
    [...porMusculo.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([musculo, series]) => ({
        músculo: musculo,
        series: Math.round(series / susPlanes.length),
        'por sesión': sesiones ? (series / sesiones).toFixed(1) : '—',
      })),
  );

  const avisos = susPlanes.flatMap((p) => p.warnings ?? []);
  out(
    'AVISOS DEL MOTOR',
    [...new Set(avisos)].map((a) => ({
      aviso: a,
      veces: avisos.filter((x) => x === a).length,
    })),
  );
}

/**
 * Los avisos ordenados por frecuencia.
 *
 * Cada aviso es el motor diciendo que el plan que acaba de armar tiene un
 * hueco. Si uno se repite en la mayoría de los planes, el problema no es de
 * esos planes: es del ruleset o del catálogo.
 */
async function avisos() {
  const planes = await pick('plans', 'warnings, template_id, ruleset_version');
  const todos = planes.flatMap((p) => (p.warnings ?? []).map((w) => ({ w, t: p.template_id })));

  const porAviso = new Map();
  for (const { w, t } of todos) {
    const acc = porAviso.get(w) ?? { veces: 0, templates: new Set() };
    acc.veces += 1;
    acc.templates.add(t);
    porAviso.set(w, acc);
  }

  const filas = [...porAviso.entries()]
    .sort((a, b) => b[1].veces - a[1].veces)
    .map(([aviso, a]) => ({
      veces: a.veces,
      'de los planes': `${Math.round((a.veces / planes.length) * 100)}%`,
      templates: [...a.templates].join(', '),
      aviso,
    }));

  out(`AVISOS DEL MOTOR (${planes.length} planes)`, filas);
  if (!asJson && filas.length > 0) {
    console.log(
      '  Un aviso que aparece en la mayoría de los planes no es un problema de\n' +
        '  esos planes: es el ruleset o el catálogo pidiendo una corrección.',
    );
  }
}

/**
 * ¿SE SOBRECARGA UNA MÁQUINA SI ENTRAN N SOCIOS?
 *
 * Corre el motor real contra el catálogo real para N socios simulados, con una
 * mezcla de objetivos, niveles y frecuencias, y cuenta cuánta demanda cae sobre
 * cada estación. No escribe nada ni crea usuarios: es el motor, que es puro,
 * corriendo N veces.
 *
 * Sirve para contestar con datos —y no de memoria— si hace falta balancear la
 * distribución de ejercicios entre planes, y cuánto. Medir antes de construir:
 * si veinte socios ya se reparten solos, un optimizador de distribución es
 * complejidad que se paga sin comprar nada.
 *
 * Los atributos de los socios simulados son ENTRADAS de la simulación, no
 * prescripción: los números del plan los sigue poniendo el ruleset.
 */
const MEZCLA_OBJETIVOS = ['hypertrophy', 'strength', 'recomposition', 'power', 'endurance'];
const MEZCLA_NIVELES = ['beginner', 'intermediate', 'advanced'];
const MEZCLA_FRECUENCIA = [3, 4, 5];

/**
 * Suma un plan a la demanda por estación.
 *
 * Una estación cuenta UNA vez por plan, no una por repetición de la cola: la
 * pregunta es cuánta gente la necesita, no cuántas veces la usa cada una.
 */
function acumularDemanda(demanda, plan) {
  const enEstePlan = new Map();
  for (const s of plan.sessions) {
    for (const item of s.items) {
      if (!item.equipmentId) continue;
      enEstePlan.set(item.equipmentId, (enEstePlan.get(item.equipmentId) ?? 0) + item.targetSets);
    }
  }
  for (const [eqId, series] of enEstePlan) {
    const acc = demanda.get(eqId) ?? { planes: 0, series: 0 };
    acc.planes += 1;
    acc.series += series;
    demanda.set(eqId, acc);
  }
}

async function simular(cuantos = '20') {
  const n = Number(cuantos);
  if (!Number.isInteger(n) || n < 1) throw new Error('Pasá cuántos socios simular. Ej: simular 30');

  const [perfil] = await pick('profiles', 'gym_id');
  if (!perfil) throw new Error('No hay ningún perfil cargado: no se sabe qué gimnasio simular.');

  const { createPlaceholderEngine, V1_RESEARCH } = await import('../packages/engine/src/index.ts');
  const base = await snapshotDe(
    (await pick('profiles', 'id', { gym_id: perfil.gym_id }))[0].id,
  ).catch(() => null);
  if (!base) throw new Error('No se pudo armar el snapshot del gimnasio.');

  const equipos = await pick('equipment', 'id, name, category, quantity', {
    gym_id: perfil.gym_id,
    is_active: true,
  });
  const nombreEquipo = new Map(equipos.map((e) => [e.id, e.name]));
  const cantidad = new Map(equipos.map((e) => [e.id, e.quantity]));

  const motorReal = createPlaceholderEngine();
  const demanda = new Map(); // equipmentId -> { planes, series }
  const porObjetivo = new Map();

  for (let i = 0; i < n; i += 1) {
    const goal = MEZCLA_OBJETIVOS[i % MEZCLA_OBJETIVOS.length];
    const nivel = MEZCLA_NIVELES[i % MEZCLA_NIVELES.length];
    const frecuencia = MEZCLA_FRECUENCIA[i % MEZCLA_FRECUENCIA.length];

    const user = {
      ...base.user,
      profile: { ...base.user.profile, id: `sim-${i}`, experienceLevel: nivel },
      goals: [
        {
          goal,
          sport: null,
          priority: 1,
          sessionsPerWeekTarget: frecuencia,
          sessionMinutesTarget: 60,
        },
      ],
      // Sin restricciones ni baselines: se simula el caso base, no el de nadie.
      constraints: [],
      baselines: [],
    };

    let plan;
    try {
      // Semilla distinta por socio, como en la app real (`engineContext` la
      // deriva del id): es lo que hoy reparte entre opciones equivalentes.
      plan = motorReal.generatePlan({
        context: { now: new Date().toISOString(), seed: 1000 + i * 7919 },
        user,
        gym: base.gym,
        ruleset: V1_RESEARCH,
      });
    } catch {
      continue; // un objetivo sin plantilla no rompe la simulación entera
    }

    porObjetivo.set(goal, (porObjetivo.get(goal) ?? 0) + 1);
    acumularDemanda(demanda, plan);
  }

  const filas = [...demanda.entries()]
    .sort((a, b) => b[1].planes - a[1].planes)
    .map(([eqId, a]) => ({
      estación: nombreEquipo.get(eqId) ?? eqId,
      unidades: cantidad.get(eqId) ?? 1,
      'en planes': a.planes,
      'de los socios': `${Math.round((a.planes / n) * 100)}%`,
      'socios por unidad': (a.planes / (cantidad.get(eqId) || 1) || 0).toFixed(1),
    }));

  out(`DEMANDA SIMULADA · ${n} socios · ${equipos.length} estaciones activas`, filas);

  if (!asJson) {
    const usadas = demanda.size;
    const top = filas[0];
    console.log(
      `\n  Estaciones con demanda: ${usadas} de ${equipos.length}` +
        ` (${Math.round((usadas / equipos.length) * 100)}%)` +
        `\n  Sin ningún plan: ${equipos.length - usadas}`,
    );
    if (top) {
      console.log(
        `  La más pedida: ${top.estación} — ${top['en planes']} de ${n} socios (${top['de los socios']}).`,
      );
    }
    console.log(
      '\n  Cómo leerlo: "socios por unidad" es la señal de cuello de botella. Que una\n' +
        '  estación aparezca en muchos planes no molesta si la gente entrena en horarios\n' +
        '  distintos — la congestión real es por hora, no por plan.',
    );
  }
}

// ------------------------------------------------------- herramientas del agente

/**
 * SQL de solo lectura contra la base local.
 *
 * `tabla` alcanza para mirar filas, pero no para un join ni un `group by`, y
 * la mitad de las preguntas que valen la pena son eso. PostgREST no ejecuta
 * SQL suelto, así que esto va por `psql` adentro del contenedor.
 *
 * Dos candados: solo local (ver `requireLocal`) y solo lectura. Se exige que
 * empiece con `select` o `with`, y se rechaza el `;` — sin eso, un
 * `select 1; drop table plans` pasaría como si nada.
 */
function sql(...partes) {
  requireLocal('sql');
  const consulta = partes.join(' ').trim();
  if (!consulta) throw new Error('Falta la consulta.');

  const empieza = consulta.toLowerCase();
  if (!empieza.startsWith('select') && !empieza.startsWith('with')) {
    throw new Error('Solo `select` o `with`: este comando no escribe.');
  }
  if (consulta.includes(';')) {
    throw new Error('Sin `;`: encadenar consultas es la forma de colar una escritura.');
  }

  const salida = execFileSync(
    'docker',
    [
      'exec',
      'supabase_db_bluehorse-app',
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-c',
      consulta,
    ],
    { encoding: 'utf8' },
  );
  console.log(salida);
}

/**
 * Un socio de prueba completo, listo para usar la app.
 *
 * Reproducir un bug a mano son seis INSERT con todas sus columnas NOT NULL, y
 * cada vez que falta una hay que descubrirlo por el error de Postgres. Esto
 * arma perfil, objetivo, cribado y medidas de una, y devuelve el email para
 * entrar. El plan lo genera la app (o `motor`), que es como se genera de
 * verdad.
 *
 * El email lleva el prefijo de prueba a propósito: es lo que después reconoce
 * `limpiar` para poder borrarlos sin tocar a nadie real.
 */
const PREFIJO_PRUEBA = 'prueba-';
const DOMINIO_PRUEBA = '@bluehorse.test';

async function sembrar(nombre = 'Socio de prueba') {
  requireLocal('sembrar');

  const email = `${PREFIJO_PRUEBA}${Date.now()}${DOMINIO_PRUEBA}`;
  const password = 'prueba-1234';

  const { data: creado, error: authError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) throw new Error(`auth: ${authError.message}`);
  const id = creado.user.id;

  // El trigger de la base ya creó el `profiles`: acá se completa lo que el
  // onboarding completaría.
  const [gym] = await pick('gyms', 'id');
  if (!gym) throw new Error('No hay ningún gimnasio cargado.');

  const { error: perfilError } = await db
    .from('profiles')
    .update({
      display_name: nombre,
      birth_date: '1995-06-15',
      sex: 'male',
      experience_level: 'intermediate',
      onboarded_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (perfilError) throw new Error(`profiles: ${perfilError.message}`);

  const { error: goalError } = await db.from('user_goals').insert({
    user_id: id,
    goal: 'hypertrophy',
    sessions_per_week_target: 3,
    session_minutes_target: 60,
  });
  if (goalError) throw new Error(`user_goals: ${goalError.message}`);

  const { error: metricError } = await db.from('body_metrics').insert({
    user_id: id,
    gym_id: gym.id,
    weight_kg: 78,
    height_cm: 176,
  });
  if (metricError) throw new Error(`body_metrics: ${metricError.message}`);

  console.log(`\nSocio de prueba listo:
  email: ${email}
  clave: ${password}
  uuid:  ${id}

Ya tiene objetivo, peso y altura, y el onboarding marcado. El plan lo genera
la app al entrar, o \`npm run admin motor ${email}\`.`);
}

/**
 * Borra los socios de prueba y todo lo que cuelga de ellos.
 *
 * Hoy la base local tiene usuarios `audit-*` de una corrida vieja de
 * `audit-isolation.mjs` cuya limpieza no llegó a correr. Sin una forma de
 * barrerlos, cada consulta de socios los muestra mezclados con los reales.
 *
 * Borra por patrón de email, nunca por "todo lo que no reconozco": el criterio
 * está a la vista y no puede llevarse puesto a alguien real por descuido.
 */
async function limpiar() {
  requireLocal('limpiar');

  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(`auth: ${error.message}`);

  const dePrueba = data.users.filter(
    (u) =>
      u.email?.endsWith(DOMINIO_PRUEBA) &&
      (u.email.startsWith(PREFIJO_PRUEBA) || u.email.startsWith('audit-')),
  );

  if (dePrueba.length === 0) {
    console.log('No hay socios de prueba para borrar.');
    return;
  }

  for (const u of dePrueba) {
    // `profiles` cascadea desde `auth.users`, y de ahí cascadean planes,
    // sesiones y series. Borrar el usuario alcanza.
    const { error: delError } = await db.auth.admin.deleteUser(u.id);
    if (delError) throw new Error(`no se pudo borrar ${u.email}: ${delError.message}`);
    console.log(`  borrado ${u.email}`);
  }
  console.log(`\n${dePrueba.length} socio(s) de prueba borrados.`);
}

/**
 * Qué le arma el motor REAL a un socio, sin pasar por la app.
 *
 * Es la forma de ver una prescripción completa (ejercicios, series, cargas,
 * descansos, avisos) para una persona concreta con el catálogo real, sin
 * generar nada ni tocar la base. Corre el mismo `generatePlan` que usa la PWA:
 * el motor es puro, así que darle el mismo snapshot da el mismo plan.
 *
 * Necesita Node ≥22.6 para importar `.ts` directo (el portátil del proyecto es
 * 24, ver README).
 */
async function motor(needle) {
  const id = await findMember(needle);

  const [{ createPlaceholderEngine, V1_RESEARCH }, snapshot] = await Promise.all([
    import('../packages/engine/src/index.ts'),
    snapshotDe(id),
  ]);

  const plan = createPlaceholderEngine().generatePlan({
    context: { now: new Date().toISOString(), seed: 1 },
    user: snapshot.user,
    gym: snapshot.gym,
    ruleset: V1_RESEARCH,
  });

  if (asJson) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  console.log(`\nPLAN QUE ARMARÍA EL MOTOR para ${needle}`);
  console.log(`  template: ${plan.templateId} · ruleset: ${plan.rulesetVersion}`);
  if (plan.warnings.length > 0) {
    console.log('\n  AVISOS:');
    for (const w of plan.warnings) console.log(`   · ${w}`);
  }

  for (const sesion of plan.sessions) {
    console.log(`\n  ${sesion.label} — ${sesion.focus}`);
    console.table(
      sesion.items.map((i) => ({
        ejercicio: snapshot.nombre.get(i.exerciseId) ?? i.exerciseId,
        series: i.targetSets,
        reps: `${i.targetRepsMin}-${i.targetRepsMax}`,
        rir: i.targetRir ?? '—',
        carga: i.targetLoad ? `${i.targetLoad.value} ${i.targetLoad.unit}` : 'sin baseline',
        descanso: `${i.restSeconds}s`,
      })),
    );
  }
}

/** El mismo snapshot que arma la app para el motor: socio + gimnasio. */
async function snapshotDe(id) {
  const [perfil] = await pick(
    'profiles',
    'id, gym_id, display_name, birth_date, sex, experience_level',
    { id },
  );
  if (!perfil) throw new Error(`No hay perfil para ${id}.`);

  const [goals, constraints, baselines, equipment, exercises, mapeos] = await Promise.all([
    pick('user_goals', 'goal, sport, priority, sessions_per_week_target, session_minutes_target', {
      user_id: id,
      is_active: true,
    }),
    pick('user_constraints', 'type, body_region, exercise_id, equipment_id, severity', {
      user_id: id,
    }),
    pick('user_baselines', 'exercise_id, source, load_value, load_unit, reps, recorded_at', {
      user_id: id,
    }),
    pick(
      'equipment',
      'id, gym_id, name, category, brand, model, photo_url, location_note, setup_notes, load_unit, load_min, load_max, load_increment, stack_kg, base_weight_kg, quantity, is_active',
      { gym_id: perfil.gym_id, is_active: true },
    ),
    pick(
      'exercises',
      'id, gym_id, name, pattern, primary_muscles, secondary_muscles, modality, is_compound, is_unilateral, skill_level, cues, is_active',
      { is_active: true },
    ),
    pick('exercise_equipment', 'exercise_id, equipment_id'),
  ]);

  if (goals.length === 0)
    throw new Error('El socio no tiene objetivo cargado (falta el onboarding).');

  const propias = new Set(equipment.map((e) => e.id));
  const porEjercicio = new Map();
  for (const m of mapeos) {
    if (!propias.has(m.equipment_id)) continue;
    porEjercicio.set(m.exercise_id, [...(porEjercicio.get(m.exercise_id) ?? []), m.equipment_id]);
  }

  return {
    nombre: new Map(exercises.map((e) => [e.id, e.name])),
    user: {
      profile: {
        id: perfil.id,
        gymId: perfil.gym_id,
        displayName: perfil.display_name,
        birthDate: perfil.birth_date,
        sex: perfil.sex,
        experienceLevel: perfil.experience_level,
      },
      goals: goals.map((g) => ({
        goal: g.goal,
        sport: g.sport,
        priority: g.priority,
        sessionsPerWeekTarget: g.sessions_per_week_target,
        sessionMinutesTarget: g.session_minutes_target,
      })),
      constraints: constraints.map((c) => ({
        type: c.type,
        bodyRegion: c.body_region,
        exerciseId: c.exercise_id,
        equipmentId: c.equipment_id,
        severity: c.severity,
      })),
      baselines: baselines.map((b) => ({
        exerciseId: b.exercise_id,
        source: b.source,
        load: { value: b.load_value, unit: b.load_unit },
        reps: b.reps ?? 0,
        recordedAt: b.recorded_at,
      })),
    },
    gym: {
      gymId: perfil.gym_id,
      equipment: equipment.map((e) => ({
        id: e.id,
        gymId: e.gym_id,
        name: e.name,
        category: e.category,
        brand: e.brand,
        model: e.model,
        photoUrl: e.photo_url,
        locationNote: e.location_note,
        setupNotes: e.setup_notes,
        load: {
          unit: e.load_unit,
          ...(e.load_min !== null && { min: Number(e.load_min) }),
          ...(e.load_max !== null && { max: Number(e.load_max) }),
          ...(e.load_increment !== null && { increment: Number(e.load_increment) }),
          ...(e.stack_kg?.length && { stackKg: e.stack_kg.map(Number) }),
          ...(e.base_weight_kg !== null && { baseWeightKg: Number(e.base_weight_kg) }),
        },
        quantity: e.quantity,
        isActive: e.is_active,
      })),
      exercises: exercises.map((e) => ({
        id: e.id,
        gymId: e.gym_id,
        name: e.name,
        pattern: e.pattern,
        primaryMuscles: e.primary_muscles,
        secondaryMuscles: e.secondary_muscles,
        modality: e.modality,
        isCompound: e.is_compound,
        isUnilateral: e.is_unilateral,
        skillLevel: e.skill_level,
        cues: e.cues,
        equipmentIds: porEjercicio.get(e.id) ?? [],
      })),
      substitutions: [],
    },
  };
}

// ---------------------------------------------------------------- despacho

const comandos = {
  socios,
  socio: () => socio(rest[0] ?? ''),
  planes,
  resumen,
  tabla: () => consulta(...rest),
  recetas,
  receta: () => receta(rest[0] ?? ''),
  avisos,
  simular: () => simular(rest[0] ?? '20'),
  sql: () => sql(...rest),
  motor: () => motor(rest[0] ?? ''),
  sembrar: () => sembrar(rest.join(' ') || undefined),
  limpiar,
};

const run = comandos[command ?? ''];
if (!run) {
  console.log(`Consultar (local o nube):
  socios                      lista de socios con su actividad
  socio <email|uuid>          todo lo de un socio: onboarding, planes, entrenos, molestias
  planes                      todos los planes generados
  resumen                     números del gimnasio
  tabla <tabla> [col=valor]   filas de cualquier tabla
  motor <email|uuid>          qué plan le armaría el motor real, sin guardarlo

Analizar el motor (anónimo: sin nombres, sin salud):
  recetas                     de qué entrada salió cada plan, agrupado
  receta <#>                  qué prescribió una ruta: ejercicios, volumen, avisos
  avisos                      qué le viene avisando el motor a los planes
  simular [n]                 si entran n socios, cuánta demanda cae en cada estación

Solo contra la base LOCAL (escriben o corren SQL suelto):
  sql "<select ...>"          consulta libre de solo lectura
  sembrar [nombre]            crea un socio de prueba listo para entrar
  limpiar                     borra los socios de prueba y todo lo suyo

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
