import type { LoadReading, LoadUnit } from '@bh/domain';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { db, type OutboxItem } from './outbox.ts';
import { requireSupabase } from './supabase.ts';

/**
 * LO QUE YA QUEDÓ REGISTRADO DE LA SESIÓN EN CURSO
 *
 * El progreso de una sesión vivía solo en memoria. Un teléfono en el gimnasio
 * se bloquea, se queda sin batería, o el navegador descarta la pestaña: al
 * volver, las series marcadas aparecían sin marcar y volver a marcarlas
 * escribía un `set_log` duplicado — y, peor, un `workout_log` nuevo para la
 * misma sesión, partiendo el entrenamiento en dos registros.
 *
 * La fuente de verdad es la base, no el estado local: acá se lee qué se
 * registró de verdad para esta sesión y con eso se reconstruye la pantalla.
 */

export interface RestoredSession {
  /** El `workout_log` abierto de esta sesión, si ya se empezó a registrar. */
  readonly workoutLogId: string | null;
  /** Series ya registradas, por `plan_session_item`. */
  readonly doneByItem: Readonly<Record<string, number[]>>;
  /** `itemId:setIndex` → id del `set_log`, para poder deshacer después de recargar. */
  readonly setLogIds: ReadonlyMap<string, string>;
  /**
   * Con cuánto se venía trabajando cada ejercicio: la carga de la última
   * serie registrada, cruda y en la unidad de la estación (regla dura 6).
   *
   * Sin esto, volver a la sesión reseteaba la carga a la del plan — que en la
   * primera sesión de cualquier estación es `null`. O sea: la persona anotaba
   * 60 kg, hacía dos series, se le bloqueaba el teléfono, volvía, y no solo
   * veía "anotá la carga" de nuevo sino que la serie siguiente se registraba
   * con la carga vacía. El dato estaba en la base todo el tiempo; lo que
   * faltaba era traerlo.
   */
  readonly loadByItem: Readonly<Record<string, LoadReading>>;
  /**
   * La carga de CADA serie registrada, por `itemId:setIndex`.
   *
   * `loadByItem` sola no alcanza desde que cada serie lleva la suya: guarda la
   * de la última, así que al volver a la sesión una serie hecha con 60 y otra
   * con 70 se mostraban las dos con 70. Lo que se registró es lo que tiene que
   * verse, sin promediar ni arrastrar.
   */
  readonly loadBySet: Readonly<Record<string, LoadReading>>;
}

export const EMPTY_RESTORED: RestoredSession = {
  workoutLogId: null,
  doneByItem: {},
  setLogIds: new Map(),
  loadByItem: {},
  loadBySet: {},
};

interface SetLogRow {
  readonly plan_session_item_id: string | null;
  readonly set_index: number;
  readonly id: string;
  readonly load_value: number | null;
  readonly load_unit: LoadUnit | null;
}

/** Las series registradas → lo que la pantalla necesita para reconstruirse. Exportada para test. */
export function rebuild(rows: readonly unknown[]): Omit<RestoredSession, 'workoutLogId'> {
  const doneByItem: Record<string, number[]> = {};
  const setLogIds = new Map<string, string>();
  const loadByItem: Record<string, LoadReading> = {};
  const loadBySet: Record<string, LoadReading> = {};
  // De qué serie salió la carga de cada ejercicio, para quedarse con la más
  // avanzada y no con la que llegó primero en el JSON.
  const loadFromIndex: Record<string, number> = {};

  for (const raw of rows) {
    const row = raw as SetLogRow;
    const itemId = row.plan_session_item_id;
    if (itemId === null) continue; // sin ítem no hay dónde mostrarla

    const previas = doneByItem[itemId] ?? [];
    if (!previas.includes(row.set_index)) previas.push(row.set_index);
    doneByItem[itemId] = previas;
    setLogIds.set(`${itemId}:${row.set_index}`, row.id);

    if (row.load_value === null || row.load_unit === null) continue;
    const load: LoadReading = { value: row.load_value, unit: row.load_unit };

    // Cada serie con la suya, tal como se registró.
    loadBySet[`${itemId}:${row.set_index}`] = load;

    // Y la del ejercicio: la de la última serie, que es con la que sigue la
    // próxima si no se anota otra cosa.
    const desde = loadFromIndex[itemId];
    if (desde === undefined || row.set_index >= desde) {
      loadByItem[itemId] = load;
      loadFromIndex[itemId] = row.set_index;
    }
  }

  return { doneByItem, setLogIds, loadByItem, loadBySet };
}

/** Lo que devolvió el servidor para esta sesión, antes de mezclarlo con la cola. */
export interface ServerSession {
  readonly workoutLogId: string | null;
  readonly rows: readonly unknown[];
}

/**
 * LA COLA CUENTA IGUAL QUE EL SERVIDOR
 *
 * Sin esto, la reconstrucción leía solo Postgres. En el gimnasio sin señal la
 * serie marcada queda en la cola offline y todavía no existe del otro lado:
 * al recargar, la pantalla la mostraba SIN marcar. Volver a marcarla escribía
 * un `set_log` nuevo y —como tampoco había `workout_log` del lado del
 * servidor— un SEGUNDO `workout_log` para la misma sesión. O sea, exactamente
 * el bug que este archivo dice prevenir: la protección solo valía una vez que
 * el dato había llegado, que es justo cuando no hacía falta.
 *
 * Una serie escrita es una serie escrita, esté en Postgres o esperando señal
 * en IndexedDB. Acá se mezclan las dos fuentes antes de reconstruir:
 *
 * - Los `workout_log` encolados de ESTA sesión valen como sesión abierta.
 * - Las series encoladas cuyo `workout_log_id` pertenece a esta sesión (el del
 *   servidor o alguno encolado) se suman a las del servidor.
 * - Los borrados encolados sacan la serie de las dos listas: deshacer una
 *   serie sin señal tiene que seguir viéndose deshecha después de recargar.
 *
 * Repetir una serie que está en los dos lados no rompe nada: es la misma fila,
 * con el mismo `id`, y `rebuild` la colapsa.
 */
export function fusionar(
  servidor: ServerSession,
  pendientes: readonly OutboxItem[],
  planSessionId: string,
): RestoredSession {
  const { propios, encolado } = logsDeLaSesion(pendientes, planSessionId, servidor.workoutLogId);
  const { deLaCola, borradas } = seriesDeLaCola(pendientes, propios);

  const todas = [...servidor.rows, ...deLaCola].filter((row) => {
    const { id } = row as { id?: unknown };
    return typeof id !== 'string' || !borradas.has(id);
  });

  // El del servidor manda: si existe, es el que ya tiene series colgando.
  return { workoutLogId: servidor.workoutLogId ?? encolado, ...rebuild(todas) };
}

/** Qué `workout_log` son de esta sesión, contando los que siguen en la cola. */
function logsDeLaSesion(
  pendientes: readonly OutboxItem[],
  planSessionId: string,
  delServidor: string | null,
): { propios: ReadonlySet<string>; encolado: string | null } {
  const propios = new Set<string>();
  if (delServidor) propios.add(delServidor);
  let encolado: string | null = null;

  for (const item of pendientes) {
    if (item.kind !== 'workout_log') continue;
    const payload = item.payload as { id?: unknown; plan_session_id?: unknown };
    if (payload?.plan_session_id !== planSessionId || typeof payload.id !== 'string') continue;
    propios.add(payload.id);
    encolado ??= payload.id;
  }

  return { propios, encolado };
}

/** Las series encoladas de esos `workout_log`, y las que un borrado encolado ya sacó. */
function seriesDeLaCola(
  pendientes: readonly OutboxItem[],
  propios: ReadonlySet<string>,
): { deLaCola: readonly unknown[]; borradas: ReadonlySet<string> } {
  const borradas = new Set<string>();
  const deLaCola: unknown[] = [];

  for (const item of pendientes) {
    if (item.kind === 'set_log_delete') {
      const { id } = item.payload as { id?: unknown };
      if (typeof id === 'string') borradas.add(id);
      continue;
    }
    if (item.kind !== 'set_log') continue;
    const payload = item.payload as { workout_log_id?: unknown };
    if (typeof payload?.workout_log_id === 'string' && propios.has(payload.workout_log_id)) {
      deLaCola.push(payload);
    }
  }

  return { deLaCola, borradas };
}

/**
 * El `workout_log` abierto de esta sesión y sus series, del servidor.
 *
 * Cuando el servidor no contesta —el subsuelo del gimnasio, no un
 * `navigator.onLine` en `false`— la lectura falla. Antes eso reventaba la
 * query entera: `restored.data` quedaba en `undefined`, la pantalla no
 * reenganchaba nada y volver a marcar las series abría un segundo
 * `workout_log`. O sea, la cola tenía la sesión entera guardada al lado y no
 * se usaba, justo en el caso para el que existe.
 *
 * Con algo en la cola se sigue con eso solo: es una foto parcial, pero cierta,
 * y evita partir el entrenamiento en dos registros. Con la cola vacía no hay
 * nada que mostrar y el error tiene que salir a la superficie — tragárselo
 * ahí sería convertir un problema de permisos o un bug en "todavía no
 * entrenaste".
 */
async function leerDelServidor(
  userId: string,
  planSessionId: string,
  enCola: number,
): Promise<ServerSession> {
  const client = requireSupabase();

  const { data, error } = await client
    .from('workout_logs')
    .select('id, set_logs(plan_session_item_id, set_index, id, load_value, load_unit)')
    .eq('user_id', userId)
    .eq('plan_session_id', planSessionId)
    // Solo el que sigue abierto: uno ya cerrado es un entrenamiento terminado,
    // no la sesión que la persona está haciendo ahora.
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (enCola === 0) throw error;
    return { workoutLogId: null, rows: [] };
  }

  return { workoutLogId: (data?.id as string | undefined) ?? null, rows: data?.set_logs ?? [] };
}

export function useRestoredSession(userId: string | undefined, planSessionId: string) {
  const { status } = useAuth();

  return useQuery<RestoredSession>({
    queryKey: ['restored-session', userId, planSessionId],
    // Sin esto la query queda deshabilitada y `isPending` no resuelve nunca:
    // la trampa documentada en CLAUDE.md.
    enabled: status === 'signed-in' && !!userId && !!planSessionId,
    // La sesión en curso cambia por lo que hace esta misma pantalla; no hace
    // falta revalidarla sola.
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      // Lo que todavía no salió de la cola cuenta igual que lo que ya llegó:
      // ver `fusionar`. Se lee primero porque es local y no puede fallar por
      // falta de señal — es lo único que queda si el servidor no contesta.
      const pendientes = await db.pending
        .where('ownerId')
        .equals(userId as string)
        .sortBy('createdAt');

      const servidor = await leerDelServidor(userId as string, planSessionId, pendientes.length);
      return fusionar(servidor, pendientes, planSessionId);
    },
  });
}
