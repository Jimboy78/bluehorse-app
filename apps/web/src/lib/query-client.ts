import { QueryClient } from '@tanstack/react-query';
import { PlazoVencido } from './con-plazo.ts';

/**
 * Lecturas del servidor. Las escrituras del entrenamiento NO pasan por acá:
 * van a la cola de `outbox.ts`, que sobrevive a que se cierre la app.
 *
 * SIN SEÑAL, UNA QUERY NO SE QUEDA ESPERANDO
 *
 * Por defecto TanStack Query usa `networkMode: 'online'`: cuando
 * `navigator.onLine` es `false`, **pausa** la query en vez de ejecutarla. Una
 * query pausada queda en `isPending` para siempre, así que toda pantalla que
 * dibuja un esqueleto mientras `isPending` dibuja ese esqueleto hasta que
 * vuelva la señal. Medido en el navegador: sin señal, "Progreso" quedaba con
 * ocho esqueletos y ningún mensaje, y el `isError` que esas pantallas sí
 * manejan no llegaba a correr nunca — porque la query no falla, no arranca.
 *
 * Es la misma trampa de `enabled: false` que documenta CLAUDE.md, con otra
 * causa: una promesa que no resuelve ni rechaza es una pantalla que promete
 * algo que nunca va a llegar.
 *
 * `offlineFirst` la deja intentar. Si hay caché, se ve la caché; si no, el
 * `fetch` falla y la pantalla dice que falló, que es la verdad. Además es lo
 * correcto para una PWA con service worker: la respuesta puede estar cacheada
 * y no hacer falta red en absoluto.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // El catálogo del gimnasio cambia una vez por mes, no cada foco.
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Reintentar una lectura que se pasó del plazo solo multiplica la
      // espera: si no volvió en ocho segundos, no va a volver en los próximos
      // ocho. Con tres intentos, un guard de ruta tardaba casi medio minuto en
      // rendirse, y son dos guards en fila.
      retry: (intentos, error) => !(error instanceof PlazoVencido) && intentos < 2,
      networkMode: 'offlineFirst',
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
