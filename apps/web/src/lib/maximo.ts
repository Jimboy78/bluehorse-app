import {
  cargaParaPorcentaje,
  type EquipmentLoadSpec,
  estimarMaximo,
  impedimento,
  loadUnitSchema,
  type MaximoEstimado,
  type SinMaximo,
} from '@bh/domain';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from './auth/AuthProvider.tsx';
import { conPlazo } from './con-plazo.ts';
import { activeRuleset } from './engine.ts';
import { requireSupabase } from './supabase.ts';

/**
 * "80-85 % 1RM" traducido a lo que dice la estación, contra el máximo estimado
 * de lo que el socio levantó ahí. Ver `packages/domain/src/one-rep-max.ts`.
 *
 * Las series se piden de la MISMA estación: la misma sentadilla en el Smith y
 * en el rack no pesan lo mismo, porque las barras no pesan lo mismo.
 */

const HISTORIAL = 60;

const serieRowSchema = z.object({
  load_value: z.coerce.number().nullable(),
  load_unit: loadUnitSchema.nullable(),
  reps: z.number().int().nullable(),
  rir: z.number().int().nullable(),
  is_warmup: z.boolean(),
  completed_at: z.string(),
  workout_log_id: z.uuid(),
});

export type CargaDelPorcentaje =
  | {
      readonly kind: 'carga';
      readonly maximo: MaximoEstimado;
      readonly min: number;
      readonly max: number;
    }
  | { readonly kind: 'sin'; readonly motivo: SinMaximo };

export function useCargaDelPorcentaje(input: {
  exerciseId: string;
  equipmentId: string | null;
  spec: EquipmentLoadSpec | null;
  pct: { min: number; max: number } | null;
}) {
  const { user, status } = useAuth();
  const params = activeRuleset.oneRepMax;
  const bloqueo = impedimento(input.spec);
  const habilitada =
    status === 'signed-in' &&
    !!user &&
    input.pct !== null &&
    input.equipmentId !== null &&
    bloqueo === null &&
    params !== undefined;

  return useQuery<CargaDelPorcentaje>({
    queryKey: ['carga-del-porcentaje', user?.id, input.exerciseId, input.equipmentId],
    enabled: habilitada,
    queryFn: async () => {
      const { data, error } = await conPlazo(
        requireSupabase()
          .from('set_logs')
          .select('load_value, load_unit, reps, rir, is_warmup, completed_at, workout_log_id')
          .eq('exercise_id', input.exerciseId)
          .eq('equipment_id', input.equipmentId as string)
          .order('completed_at', { ascending: false })
          .limit(HISTORIAL),
      );
      if (error) throw error;
      const series = (data ?? []).flatMap((raw) => {
        const r = serieRowSchema.parse(raw);
        if (r.load_unit === null) return [];
        return [
          {
            load: { value: r.load_value, unit: r.load_unit },
            reps: r.reps,
            rir: r.rir,
            isWarmup: r.is_warmup,
            completedAt: r.completed_at,
            workoutLogId: r.workout_log_id,
          },
        ];
      });
      const spec = input.spec as EquipmentLoadSpec;
      const maximo = params ? estimarMaximo(series, spec, params) : null;
      if (!maximo || !input.pct) return { kind: 'sin', motivo: 'sin-series' };
      const carga = cargaParaPorcentaje(maximo.total, input.pct, spec);
      if (!carga) return { kind: 'sin', motivo: 'barra' };
      return { kind: 'carga', maximo, ...carga };
    },
  });
}

/** Lo que impide el cálculo antes de consultar nada, o `null`. */
export function bloqueoDelPorcentaje(
  equipmentId: string | null,
  spec: EquipmentLoadSpec | null,
): SinMaximo | null {
  if (equipmentId === null) return 'unidad';
  return impedimento(spec);
}
