import type { Goal } from '@bh/domain';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { requireSupabase } from './supabase.ts';

/**
 * El objetivo activo del socio. Lo usa la pantalla "Hoy" para saber si tiene
 * que avisar que ese objetivo se apoya en evidencia floja.
 *
 * Va aparte de `useActivePlan` a propósito: el aviso sobre la calidad de la
 * evidencia corresponde aunque todavía no haya un plan generado.
 */
export function useActiveGoal() {
  const { user, status } = useAuth();

  return useQuery<Goal | null>({
    queryKey: ['active-goal', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from('user_goals')
        .select('goal')
        .eq('user_id', user?.id as string)
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data?.goal as Goal | undefined) ?? null;
    },
  });
}
