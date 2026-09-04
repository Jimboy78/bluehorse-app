import { QueryClient } from '@tanstack/react-query';

/**
 * Lecturas del servidor. Las escrituras del entrenamiento NO pasan por acá:
 * van a la cola de `outbox.ts`, que sobrevive a que se cierre la app.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // El catálogo del gimnasio cambia una vez por mes, no cada foco.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export const queryKeys = {
  gym: (gymId: string) => ['gym', gymId] as const,
  equipment: (gymId: string) => ['gym', gymId, 'equipment'] as const,
  exercises: (gymId: string) => ['gym', gymId, 'exercises'] as const,
  plan: (userId: string) => ['plan', userId] as const,
  nextSession: (userId: string) => ['plan', userId, 'next-session'] as const,
  history: (userId: string, exerciseId?: string) =>
    ['history', userId, exerciseId ?? 'all'] as const,
  proposals: (userId: string) => ['proposals', userId] as const,
} as const;
