import type { BodyRegion } from '@bh/domain';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { requireSupabase } from './supabase.ts';

/**
 * HISTORIAL DE MOLESTIAS REPORTADAS
 *
 * Cada vez que alguien cierra una sesión y marca una molestia (`SessionClose`),
 * queda una fila en `pain_reports` — y hasta acá esa fila no se volvía a leer
 * en ningún lado. Se escribía, quedaba protegida por RLS (nadie más la ve, ni
 * el staff), y desaparecía de la vista de la propia persona que la reportó.
 *
 * Es distinto de `user_constraints` (`profile.ts`, `ConstraintsSection`): eso
 * es lo VIGENTE, lo que el motor esquiva ahora. Esto es el HISTORIAL, lo que
 * se fue reportando sesión a sesión — y es justo el patrón que a la persona
 * le sirve ver: "rodilla, tres veces este mes" es una señal de ir al médico
 * que una sola fila nunca muestra por sí sola.
 */

export interface PainReport {
  readonly id: string;
  readonly bodyRegion: BodyRegion;
  readonly severity: number;
  readonly note: string | null;
  readonly reportedAt: string;
}

const HISTORY_LIMIT = 20;

export function usePainHistory() {
  const { user, status } = useAuth();

  return useQuery<readonly PainReport[]>({
    queryKey: ['pain-history', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from('pain_reports')
        .select('id, body_region, severity, note, reported_at')
        .eq('user_id', user?.id as string)
        .order('reported_at', { ascending: false })
        .limit(HISTORY_LIMIT);
      if (error) throw error;

      return (data ?? []).map((raw) => {
        const row = raw as {
          id: string;
          body_region: BodyRegion;
          severity: number;
          note: string | null;
          reported_at: string;
        };
        return {
          id: row.id,
          bodyRegion: row.body_region,
          severity: row.severity,
          note: row.note,
          reportedAt: row.reported_at,
        };
      });
    },
  });
}

/**
 * Cuántas veces se repitió cada zona en el historial leído. Es lo que
 * convierte una lista de filas sueltas en la señal que importa: una vez en
 * el hombro no dice nada; tres veces en dos semanas sí.
 */
export function countByRegion(reports: readonly PainReport[]): ReadonlyMap<BodyRegion, number> {
  const counts = new Map<BodyRegion, number>();
  for (const report of reports) {
    counts.set(report.bodyRegion, (counts.get(report.bodyRegion) ?? 0) + 1);
  }
  return counts;
}
