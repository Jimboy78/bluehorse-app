/**
 * LAS REGLAS DURAS, PREGUNTADAS A LA BASE
 *
 * Cada chequeo de acá es una regla de CLAUDE.md convertida en consulta. No es
 * un linter de esquema: son preguntas sobre los datos que hay, del tipo que
 * solo se puede contestar mirándolos.
 *
 * Sirve porque ya encontró algo. Barriendo esto aparecieron dos `set_logs` con
 * el mismo `workout_log_id`, `exercise_id`, `plan_session_item_id` y
 * `set_index`, once segundos aparte: la misma serie registrada dos veces, con
 * `client_id` distinto, contando doble en Progreso y doble en la adaptación.
 * Leyendo código no se veía.
 *
 * Un hallazgo acá no siempre es un bug de la app: puede ser data vieja de dev
 * que quedó de antes de un arreglo. Por eso la salida dice qué encontró y
 * dónde, y no intenta arreglar nada.
 */
import { baseArriba, consultar } from './lib/base.mjs';
import { chequeo, hallazgo, noSePudo } from './lib/reporte.mjs';

/**
 * Cada entrada: un nombre, la consulta que busca filas mal, y de qué regla sale.
 *
 * La consulta devuelve **las filas problemáticas**, no un `count`: el número
 * solo dice que hay algo, y para arreglarlo hace falta saber cuál.
 */
const INVARIANTES = [
  {
    nombre: 'series duplicadas (regla 7)',
    porque: 'la misma serie dos veces cuenta doble en Progreso y en la adaptación',
    sql: `select s.workout_log_id, s.exercise_id, s.set_index, count(*) as veces
          from set_logs s
          group by 1, 2, 3
          having count(*) > 1
          order by count(*) desc limit 20`,
    describir: (f) =>
      hallazgo(`${f.veces}× set_index ${f.set_index}`, `wl ${f.workout_log_id.slice(0, 8)}`),
  },
  {
    nombre: 'carga normalizada sin cruda (regla 6)',
    porque:
      'load_kg_normalized existe solo para gráficos; sin el crudo no hay qué mostrarle al socio',
    sql: `select id, load_kg_normalized from set_logs
          where load_kg_normalized is not null and load_value is null limit 20`,
    describir: (f) => hallazgo(`normalizado ${f.load_kg_normalized} sin crudo`, f.id.slice(0, 8)),
  },
  {
    nombre: 'kg convertido a otra cosa (regla 6)',
    porque: 'una carga ya en kg no se convierte: si el normalizado difiere del crudo, algo inventó',
    sql: `select id, load_value, load_kg_normalized from set_logs
          where load_unit = 'kg' and load_kg_normalized is not null
            and load_kg_normalized <> load_value limit 20`,
    describir: (f) => hallazgo(`${f.load_value} kg → ${f.load_kg_normalized}`, f.id.slice(0, 8)),
  },
  {
    nombre: 'carga sin unidad (constraint)',
    porque: 'un número sin unidad no se puede mostrar ni convertir',
    sql: `select id, load_value from set_logs
          where load_value is not null and load_unit is null limit 20`,
    describir: (f) => hallazgo(`${f.load_value} sin unidad`, f.id.slice(0, 8)),
  },
  {
    nombre: 'series huérfanas',
    porque: 'un set_log sin su workout_log no aparece en ninguna pantalla, pero ocupa lugar',
    sql: `select s.id from set_logs s
          left join workout_logs w on w.id = s.workout_log_id
          where w.id is null limit 20`,
    describir: (f) => hallazgo('sin workout_log', f.id.slice(0, 8)),
  },
  {
    nombre: 'sesiones cerradas y vacías',
    porque:
      'un workout_log con ended_at y ninguna serie es una sesión que se cerró sin registrar nada',
    sql: `select w.id, w.started_at from workout_logs w
          where w.ended_at is not null
            and not exists (select 1 from set_logs s where s.workout_log_id = w.id) limit 20`,
    describir: (f) => hallazgo('cerrada sin series', f.id.slice(0, 8), f.started_at?.slice(0, 10)),
  },
  {
    nombre: 'dos planes activos a la vez',
    porque: '"Hoy" toma el primero que encuentra: con dos, cuál toca es una lotería',
    sql: `select user_id, count(*) as planes from plans
          where status = 'active' group by 1 having count(*) > 1 limit 20`,
    describir: (f) => hallazgo(`${f.planes} activos`, `user ${f.user_id.slice(0, 8)}`),
  },
  {
    nombre: 'plan sin la versión del ruleset (regla 4)',
    porque: 'sin rulesetVersion no se puede saber con qué números se armó ese plan',
    sql: `select id, name from plans
          where origin = 'engine' and ruleset_version is null limit 20`,
    describir: (f) => hallazgo('ruleset_version null', f.id.slice(0, 8), f.name),
  },
  {
    nombre: 'ruleset citado que no existe',
    porque: 'un plan que apunta a una versión que no está en la tabla no se puede explicar',
    sql: `select distinct p.ruleset_version from plans p
          where p.ruleset_version is not null
            and not exists (select 1 from rulesets r where r.version = p.ruleset_version) limit 20`,
    describir: (f) => hallazgo(`versión "${f.ruleset_version}" no está en rulesets`),
  },
  {
    // NO va acá "sesión completada sin workout_log": cerrar una sesión sin haber
    // marcado ninguna serie es un flujo soportado —`CloseSessionInput.workoutLogId`
    // es `string | null` justamente por eso—. Marcaba cinco filas normales, y un
    // chequeo que señala lo esperado entrena a ignorar la salida entera.
    nombre: 'series apuntando a otra sesión',
    porque: 'un set_log cuyo item pertenece a otro plan_session parte el entrenamiento en dos',
    sql: `select s.id from set_logs s
          join workout_logs w on w.id = s.workout_log_id
          join plan_session_items i on i.id = s.plan_session_item_id
          where w.plan_session_id is not null
            and i.plan_session_id <> w.plan_session_id limit 20`,
    describir: (f) => hallazgo('item de otra sesión', f.id.slice(0, 8)),
  },
  {
    nombre: 'planificado pisado por lo real (regla 7)',
    porque: 'plan_session_items es lo que el motor propuso y no se toca al entrenar',
    sql: `select i.id from plan_session_items i
          join set_logs s on s.plan_session_item_id = i.id
          where i.target_sets is not null and s.reps is not null
            and i.target_sets = 0 limit 20`,
    describir: (f) => hallazgo('item con 0 series y registros', f.id.slice(0, 8)),
  },
];

export function correrBase() {
  if (!baseArriba()) {
    noSePudo(
      'la base local no está levantada.',
      'Arrancala con `npm run db:start` (necesita Docker).',
    );
  }

  return INVARIANTES.map((inv) => {
    const filas = consultar(inv.sql);
    return chequeo(inv.nombre, filas.length, filas.map(inv.describir));
  });
}

/**
 * Cuántas tablas de negocio no llevan `gym_id` (regla 5).
 *
 * Va aparte de los invariantes porque no es un dato mal escrito: es una
 * decisión de esquema. Hoy son 17 de 22 y funcionan por cadena de claves
 * foráneas, que es una arquitectura posible — pero no es la que dice la regla,
 * y la diferencia tiene que estar a la vista y no descubrirse cada vez.
 */
export function correrGymId() {
  if (!baseArriba()) noSePudo('la base local no está levantada.');

  const filas = consultar(`
    select t.table_name from information_schema.tables t
    where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
      and t.table_name not in ('gyms', 'rulesets')
      and not exists (
        select 1 from information_schema.columns c
        where c.table_schema = 'public' and c.table_name = t.table_name
          and c.column_name = 'gym_id')
    order by t.table_name`);

  return [
    chequeo(
      'tablas de negocio sin gym_id (regla 5)',
      filas.length,
      filas.map((f) => hallazgo(f.table_name)),
    ),
  ];
}
