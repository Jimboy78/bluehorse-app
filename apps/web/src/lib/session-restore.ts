import type { LoadReading, LoadUnit } from '@bh/domain';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
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
}

const EMPTY: RestoredSession = {
  workoutLogId: null,
  doneByItem: {},
  setLogIds: new Map(),
  loadByItem: {},
};

interface SetLogRow {
  readonly plan_session_item_id: string | null;
  readonly set_index: number;
  readonly id: string;
  readonly load_value: number | null;
  readonly load_unit: LoadUnit | null;
}

/** Las series registradas → lo que la pantalla necesita para reconstruirse. */
function rebuild(rows: readonly unknown[]): Omit<RestoredSession, 'workoutLogId'> {
  const doneByItem: Record<string, number[]> = {};
  const setLogIds = new Map<string, string>();
  const loadByItem: Record<string, LoadReading> = {};
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

    // La última serie manda: si subió la carga en la tercera, volver a la
    // sesión tiene que traer esa, no la de la primera.
    const desde = loadFromIndex[itemId];
    const esMasNueva = desde === undefined || row.set_index >= desde;
    if (row.load_value !== null && row.load_unit !== null && esMasNueva) {
      loadByItem[itemId] = { value: row.load_value, unit: row.load_unit };
      loadFromIndex[itemId] = row.set_index;
    }
  }

  return { doneByItem, setLogIds, loadByItem };
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
      const client = requireSupabase();

      const { data, error } = await client
        .from('workout_logs')
        .select('id, set_logs(plan_session_item_id, set_index, id, load_value, load_unit)')
        .eq('user_id', userId as string)
        .eq('plan_session_id', planSessionId)
        // Solo el que sigue abierto: uno ya cerrado es un entrenamiento
        // terminado, no la sesión que la persona está haciendo ahora.
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return EMPTY;

      return { workoutLogId: data.id as string, ...rebuild(data.set_logs ?? []) };
    },
  });
}
