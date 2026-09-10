import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from './auth/AuthProvider.tsx';
import { requireSupabase } from './supabase.ts';

/**
 * Qué ejercicios se sustituyen más seguido. `session_events` existe desde el
 * modelado inicial para esto — el comentario de `06_logs.sql` dice "a los
 * seis meses, esto es un dato que le podés vender al gimnasio" — pero
 * `logSubstitution` (`session-log.ts`) solo lo escribía: ninguna pantalla lo
 * leía nunca.
 *
 * Ojo: la RLS de `session_events` ("eventos propios", `08_rls.sql`) es
 * estrictamente por socio, sin excepción para `is_gym_admin()` como sí tiene
 * `profiles` — a diferencia de equipment/exercises, acá el staff NO puede
 * agregar entre socios todavía. Mostrarle el agregado al gimnasio (lo que
 * dice el comentario del schema) requiere ampliar esa política a propósito,
 * una decisión de seguridad que no toca este hook: esto es la versión que SÍ
 * se puede hacer hoy sin tocar RLS — cada socio viendo su propio patrón.
 */

const substitutedEventSchema = z.object({
  payload: z.object({ from_exercise_id: z.uuid() }),
});

export interface SubstitutionInsight {
  readonly exerciseId: string;
  readonly exerciseName: string;
  readonly count: number;
}

const TOP_N = 3;

export function useSubstitutionInsights() {
  const { user, status } = useAuth();

  return useQuery<readonly SubstitutionInsight[]>({
    queryKey: ['substitution-insights', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const userId = user?.id as string;

      const { data, error } = await client
        .from('session_events')
        .select('payload, workout_logs!inner(user_id)')
        .eq('type', 'substituted')
        .eq('workout_logs.user_id', userId);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const raw of data ?? []) {
        const parsed = substitutedEventSchema.safeParse(raw);
        if (!parsed.success) continue;
        const id = parsed.data.payload.from_exercise_id;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      if (counts.size === 0) return [];

      const topIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP_N)
        .map(([id]) => id);

      const { data: exerciseRows, error: exerciseError } = await client
        .from('exercises')
        .select('id, name')
        .in('id', topIds);
      if (exerciseError) throw exerciseError;

      const nameById = new Map((exerciseRows ?? []).map((e) => [e.id, e.name]));

      return topIds.map((id) => ({
        exerciseId: id,
        exerciseName: nameById.get(id) ?? 'Ejercicio',
        count: counts.get(id) as number,
      }));
    },
  });
}
