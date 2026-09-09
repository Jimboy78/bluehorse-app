import type { BodyMetric } from '@bh/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { requireSupabase } from './supabase.ts';

/**
 * PESO Y ALTURA
 *
 * Tabla append-only: cada medición es una fila nueva y la vigente es la más
 * reciente. El peso cambia, y en un objetivo de recomposición la serie de
 * mediciones ES el dato — pisarla con un UPDATE lo borraría.
 *
 * Para qué sirve hoy, sin inventar nada: un ejercicio a peso corporal deja de
 * decir "sin carga previa" y pasa a decir con cuánto se está trabajando. Nada
 * de esto entra al motor: no hay ningún número del research que prescriba en
 * función del peso, y meterlo sería romper la regla dura 3 por la ventana.
 */

export interface BodyMetricsState {
  /** La medición vigente, o `null` si nunca cargó ninguna. */
  readonly latest: BodyMetric | null;
  /** Toda la serie, la más reciente primero. Para el gráfico de Progreso. */
  readonly history: readonly BodyMetric[];
}

interface BodyMetricRow {
  readonly weight_kg: number | null;
  readonly height_cm: number | null;
  readonly recorded_at: string;
}

export function toBodyMetric(row: BodyMetricRow): BodyMetric {
  return {
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    heightCm: row.height_cm === null ? null : Number(row.height_cm),
    recordedAt: row.recorded_at,
  };
}

/**
 * La altura viaja en cada fila, pero puede venir nula en una medición que solo
 * registró el peso. La vigente es la última fila que la trae, no la última
 * fila a secas — si no, cargar un peso suelto "borraría" la altura en pantalla.
 */
export function currentMetrics(history: readonly BodyMetric[]): BodyMetric | null {
  const newest = history[0];
  if (!newest) return null;
  return {
    weightKg: history.find((m) => m.weightKg !== null)?.weightKg ?? null,
    heightCm: history.find((m) => m.heightCm !== null)?.heightCm ?? null,
    recordedAt: newest.recordedAt,
  };
}

const GYM_TZ = 'America/Argentina/Buenos_Aires';

/**
 * Cuánto cambió el peso desde la primera medición registrada. No dice si eso
 * es bueno: quien busca recomposición quiere que baje, quien busca hipertrofia
 * quiere que suba, y la app no sabe cuál de las dos cosas está pasando.
 */
export function weightChange(
  history: readonly { weightKg: number | null; recordedAt: string }[],
): { delta: number; since: string } | null {
  const conPeso = history.filter((m) => m.weightKg !== null);
  const ultima = conPeso[0];
  const primera = conPeso.at(-1);
  if (!ultima?.weightKg || !primera?.weightKg || conPeso.length < 2) return null;

  // "−1,3 kg desde 8 sept" el mismo 8 de septiembre no es una tendencia: es
  // haberse pesado dos veces el mismo día. Se muestra recién cuando hay al
  // menos un día de por medio.
  if (sameDay(ultima.recordedAt, primera.recordedAt)) return null;

  const delta = ultima.weightKg - primera.weightKg;
  // Menos de 100 g de diferencia se redondea a "0.0" y decir "+0.0 kg" es ruido.
  if (Math.abs(delta) < 0.1) return null;
  return { delta, since: primera.recordedAt };
}

/** Mismo día en la zona del gimnasio, que es la que se usa al formatear. */
function sameDay(a: string, b: string): boolean {
  const dia = new Intl.DateTimeFormat('es-AR', { timeZone: GYM_TZ, dateStyle: 'short' });
  return dia.format(new Date(a)) === dia.format(new Date(b));
}

export function useBodyMetrics() {
  const { user, status } = useAuth();

  return useQuery<BodyMetricsState>({
    queryKey: ['body-metrics', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from('body_metrics')
        .select('weight_kg, height_cm, recorded_at')
        .eq('user_id', user?.id as string)
        .order('recorded_at', { ascending: false })
        .limit(60);
      if (error) throw error;

      const history = (data ?? []).map((row) => toBodyMetric(row as BodyMetricRow));
      return { latest: currentMetrics(history), history };
    },
  });
}

/** Registrar una medición nueva. No pisa la anterior: agrega una fila. */
export function useRecordBodyMetric() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { weightKg: number | null; heightCm: number | null }) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();

      const { data: profileRow, error: readError } = await client
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .single();
      if (readError) throw readError;

      const { error } = await client.from('body_metrics').insert({
        user_id: user.id,
        gym_id: profileRow.gym_id as string,
        weight_kg: input.weightKg,
        height_cm: input.heightCm,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['body-metrics', user?.id] });
    },
  });
}
