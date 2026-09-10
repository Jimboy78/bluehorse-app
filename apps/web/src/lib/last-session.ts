import type { LoadReading, LoadUnit } from '@bh/domain';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { requireSupabase } from './supabase.ts';

/**
 * LA VEZ PASADA
 *
 * Parado al lado de una máquina, la pregunta es una sola: **¿con cuánto lo
 * hice la última vez?**. La app tenía el dato desde la primera sesión y no lo
 * mostraba en ninguna parte: "Hoy" enseña `targetLoad`, que es lo que el plan
 * PROPONE, y eso solo se mueve cuando alguien acepta una propuesta de
 * adaptación. Entre medio, la persona levantaba 60, después 65, y la pantalla
 * seguía diciendo lo mismo que el primer día.
 *
 * Esto no reemplaza al objetivo ni lo corrige: son dos cosas distintas y se
 * muestran como dos cosas distintas (regla dura 7). El objetivo es lo que el
 * plan propone; esto es lo que pasó. Que no coincidan es información, no un
 * error a esconder.
 *
 * La carga sale cruda, en la unidad de la estación, como la mostró la máquina
 * ese día (regla dura 6): si aquella vez fue en placas, se lee en placas,
 * aunque hoy el ejercicio se haga en otra estación.
 */

export interface SerieHecha {
  readonly setIndex: number;
  readonly load: LoadReading | null;
  readonly reps: number | null;
  readonly rir: number | null;
}

export interface UltimaVez {
  readonly cuando: string;
  readonly series: readonly SerieHecha[];
}

interface Fila {
  readonly workout_log_id: string;
  readonly set_index: number;
  readonly load_value: number | null;
  readonly load_unit: LoadUnit | null;
  readonly reps: number | null;
  readonly rir: number | null;
  readonly completed_at: string;
}

/**
 * De las series traídas, las del entrenamiento más reciente. Exportada para test.
 *
 * Se agrupa por `workout_log_id` y no por día: dos sesiones del mismo día son
 * dos entrenamientos, y mezclarlas mostraría ocho series donde hubo cuatro.
 */
export function ultimaVezDe(filas: readonly unknown[]): UltimaVez | null {
  const primera = filas[0] as Fila | undefined;
  if (!primera) return null;

  const delMismo = (filas as Fila[]).filter((f) => f.workout_log_id === primera.workout_log_id);
  const series = delMismo
    .map((f) => ({
      setIndex: f.set_index,
      load:
        f.load_value !== null && f.load_unit !== null
          ? { value: f.load_value, unit: f.load_unit }
          : null,
      reps: f.reps,
      rir: f.rir,
    }))
    .sort((a, b) => a.setIndex - b.setIndex);

  return { cuando: primera.completed_at, series };
}

/**
 * Qué se hizo la última vez en este ejercicio, sin contar la sesión de hoy.
 *
 * `workoutLogIdActual` se excluye a propósito: sin eso, apenas se marca la
 * primera serie del día "la vez pasada" pasaría a ser hoy mismo, y el número
 * de referencia se movería en medio del entrenamiento.
 */
export function useUltimaVez(exerciseId: string | null, workoutLogIdActual: string | null) {
  const { user, status } = useAuth();

  return useQuery<UltimaVez | null>({
    queryKey: ['ultima-vez', user?.id, exerciseId, workoutLogIdActual],
    // La trampa de CLAUDE.md: sin esto la query queda deshabilitada y
    // `isPending` no resuelve nunca.
    enabled: status === 'signed-in' && !!user && !!exerciseId,
    // Lo que se hizo en sesiones anteriores ya no cambia.
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const client = requireSupabase();
      let q = client
        .from('set_logs')
        .select(
          'workout_log_id, set_index, load_value, load_unit, reps, rir, completed_at, workout_logs!inner(user_id)',
        )
        .eq('exercise_id', exerciseId as string)
        .eq('is_warmup', false)
        // Solo las de este socio: `set_logs` no tiene `user_id`, cuelga del
        // `workout_log`. Sin este filtro, RLS igual lo taparía — pero
        // apoyarse en RLS para una regla de negocio es dejarla escrita en un
        // solo lado.
        .eq('workout_logs.user_id', user?.id as string)
        .order('completed_at', { ascending: false })
        // Doce alcanza para el entrenamiento más reciente de cualquier
        // ejercicio: ninguna prescripción del ruleset llega a esa cantidad de
        // series, y traer menos correría el riesgo de cortar una sesión al
        // medio.
        .limit(12);

      if (workoutLogIdActual) q = q.neq('workout_log_id', workoutLogIdActual);

      const { data, error } = await q;
      if (error) throw error;
      return ultimaVezDe(data ?? []);
    },
  });
}
