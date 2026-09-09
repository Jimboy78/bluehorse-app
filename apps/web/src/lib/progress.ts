import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import {
  type AdherenceSummary,
  computeAdherence,
  computeRecords,
  computeWeeklyVolume,
  type PersonalRecord,
  type SetRecord,
  setLogRowSchema,
  toSetRecord,
  type WeeklyVolumePoint,
  workoutLogRowSchema,
} from './mappers/progress.ts';
import { requireSupabase } from './supabase.ts';

/**
 * Progreso real, leído de lo que la persona hizo (`set_logs`/`workout_logs`),
 * nunca de lo planificado. Trae hasta 90 días de historia — suficiente para
 * adherencia, volumen semanal y récords sin traer la tabla entera.
 */

const HISTORY_DAYS = 90;

export interface ProgressSummary {
  readonly adherence: AdherenceSummary;
  readonly weeklyVolume: readonly WeeklyVolumePoint[];
  readonly records: readonly PersonalRecord[];
  readonly setsByExercise: ReadonlyMap<string, readonly SetRecord[]>;
}

export function useProgress() {
  const { user, status } = useAuth();

  return useQuery<ProgressSummary>({
    queryKey: ['progress', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const since = new Date(Date.now() - HISTORY_DAYS * 86_400_000).toISOString();

      const { data: workoutRows, error: workoutError } = await client
        .from('workout_logs')
        .select('id, started_at')
        .eq('user_id', user?.id as string)
        .gte('started_at', since)
        .order('started_at', { ascending: false });
      if (workoutError) throw workoutError;

      const workoutLogs = (workoutRows ?? []).map((raw) => workoutLogRowSchema.parse(raw));
      const adherence = computeAdherence(workoutLogs.map((w) => ({ startedAt: w.started_at })));

      if (workoutLogs.length === 0) {
        return { adherence, weeklyVolume: [], records: [], setsByExercise: new Map() };
      }

      const workoutLogIds = workoutLogs.map((w) => w.id);
      const { data: setRows, error: setError } = await client
        .from('set_logs')
        .select(
          'id, exercise_id, load_value, load_unit, load_kg_normalized, reps, rir, is_warmup, completed_at, exercises(name, primary_muscles)',
        )
        .in('workout_log_id', workoutLogIds)
        .order('completed_at');
      if (setError) throw setError;

      const sets = (setRows ?? []).map((raw) => toSetRecord(setLogRowSchema.parse(raw)));

      const setsByExercise = new Map<string, SetRecord[]>();
      for (const set of sets) {
        const list = setsByExercise.get(set.exerciseId) ?? [];
        list.push(set);
        setsByExercise.set(set.exerciseId, list);
      }

      return {
        adherence,
        weeklyVolume: computeWeeklyVolume(sets),
        records: computeRecords(sets),
        setsByExercise,
      };
    },
  });
}
