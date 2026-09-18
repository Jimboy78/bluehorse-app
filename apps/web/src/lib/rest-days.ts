import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from './auth/AuthProvider.tsx';
import { conPlazo } from './con-plazo.ts';
import { diaDelGimnasio } from './gym-time.ts';
import { requireSupabase } from './supabase.ts';

/**
 * Los días que el socio marcó como descanso. Solo lo declarado: los días sin
 * anotar que su frecuencia permite se infieren en `computeAdherence`, al leer.
 *
 * Marcar descanso no toca la cola del plan. El plan no tiene fechas —hoy toca
 * la primera sesión pendiente—, así que mañana sigue tocando la misma.
 */

const restDayRowSchema = z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export function hoyEnElGimnasio(): string {
  return diaDelGimnasio(new Date().toISOString());
}

/** Si hoy está marcado como descanso. */
export function useRestToday() {
  const { user, status } = useAuth();
  const hoy = hoyEnElGimnasio();

  return useQuery<boolean>({
    queryKey: ['rest-days', user?.id, hoy],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const { data, error } = await conPlazo(
        requireSupabase()
          .from('rest_days')
          .select('day')
          .eq('user_id', user?.id as string)
          .eq('day', hoy)
          .maybeSingle(),
      );
      if (error) throw error;
      return data !== null;
    },
  });
}

/** Los días de descanso marcados desde `desde` (clave `YYYY-MM-DD`) en adelante. */
export async function fetchRestDays(userId: string, desde: string): Promise<string[]> {
  const { data, error } = await requireSupabase()
    .from('rest_days')
    .select('day')
    .eq('user_id', userId)
    .gte('day', desde);
  if (error) throw error;
  return (data ?? []).map((row) => restDayRowSchema.parse(row).day);
}

export function useSetRestToday() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (descanso: boolean) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();
      const hoy = hoyEnElGimnasio();

      if (!descanso) {
        const { error } = await client
          .from('rest_days')
          .delete()
          .eq('user_id', user.id)
          .eq('day', hoy);
        if (error) throw error;
        return;
      }

      const { data: profileRow, error: readError } = await client
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .single();
      if (readError) throw readError;

      // Upsert y no insert: tocar dos veces (o desde dos pestañas) no es un error.
      const { error } = await client
        .from('rest_days')
        .upsert(
          { user_id: user.id, gym_id: profileRow.gym_id, day: hoy },
          { onConflict: 'user_id,day', ignoreDuplicates: true },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rest-days', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['progress', user?.id] });
    },
  });
}
