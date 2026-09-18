import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { retomarDesde, tandasDeEscritura } from './mappers/retomar.ts';
import type { PlanSessionSummary } from './plan.ts';
import { requireSupabase } from './supabase.ts';

/** Ver `mappers/retomar.ts`: por qué se rota la cola y cuándo se reinicia. */

/**
 * Las sesiones salen de `usePlanSessions` (lib/plan.ts), no de una consulta
 * propia. Hubo una: usaba la misma clave de caché con otra forma de dato, y
 * abrir "Cambiar de día" en Hoy rompía "Ver las sesiones" en Planes, que leía
 * de la caché filas sin `exercises`. Medido en producción: pantalla de error.
 */
export type SesionDelPlan = PlanSessionSummary;

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
