import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from './auth/AuthProvider.tsx';
import { conPlazo } from './con-plazo.ts';
import { retomarDesde, type SesionDeCola, tandasDeEscritura } from './mappers/retomar.ts';
import { requireSupabase } from './supabase.ts';

/** Ver `mappers/retomar.ts`: por qué se rota la cola y cuándo se reinicia. */

const sesionRowSchema = z.object({
  id: z.uuid(),
  sequence_index: z.number().int(),
  label: z.string(),
  focus: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped']),
});

export interface SesionDelPlan extends SesionDeCola {
  readonly label: string;
  readonly focus: string;
}

export function useSesionesDelPlan(planId: string | null) {
  const { user, status } = useAuth();
  return useQuery<SesionDelPlan[]>({
    queryKey: ['plan-sessions', user?.id, planId],
    enabled: status === 'signed-in' && !!user && !!planId,
    queryFn: async () => {
      const { data, error } = await conPlazo(
        requireSupabase()
          .from('plan_sessions')
          .select('id, sequence_index, label, focus, status')
          .eq('plan_id', planId as string)
          .order('sequence_index'),
      );
      if (error) throw error;
      return (data ?? []).map((raw) => {
        const row = sesionRowSchema.parse(raw);
        return {
          id: row.id,
          sequenceIndex: row.sequence_index,
          label: row.label,
          focus: row.focus,
          status: row.status,
        };
      });
    },
  });
}

export function useRetomarDesde() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      sesiones: readonly SesionDelPlan[];
      elegidaId: string;
      reiniciar: boolean;
    }) => {
      const cambios = retomarDesde(input.sesiones, input.elegidaId, input.reiniciar);
      if (!cambios) throw new Error('Esa sesión no se puede elegir.');
      const client = requireSupabase();

      for (const tanda of tandasDeEscritura(cambios, input.sesiones)) {
        for (const c of tanda) {
          const { error } = await client
            .from('plan_sessions')
            .update({
              sequence_index: c.sequenceIndex,
              status: c.status,
              ...(input.reiniciar && { completed_at: null }),
            })
            .eq('id', c.id);
          if (error) throw error;
        }
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['plan-sessions', user?.id] });
    },
  });
}
