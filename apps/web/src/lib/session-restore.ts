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
}

const EMPTY: RestoredSession = { workoutLogId: null, doneByItem: {}, setLogIds: new Map() };

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
        .select('id, set_logs(plan_session_item_id, set_index, id)')
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

      const doneByItem: Record<string, number[]> = {};
      const setLogIds = new Map<string, string>();

      for (const raw of data.set_logs ?? []) {
        const row = raw as { plan_session_item_id: string | null; set_index: number; id: string };
        if (row.plan_session_item_id === null) continue; // sin ítem no hay dónde mostrarla
        const previas = doneByItem[row.plan_session_item_id] ?? [];
        if (!previas.includes(row.set_index)) previas.push(row.set_index);
        doneByItem[row.plan_session_item_id] = previas;
        setLogIds.set(`${row.plan_session_item_id}:${row.set_index}`, row.id);
      }

      return { workoutLogId: data.id as string, doneByItem, setLogIds };
    },
  });
}
