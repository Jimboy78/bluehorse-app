import type { BodyRegion } from '@bh/domain';
import { toKg } from '@bh/domain';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useAuth } from './auth/AuthProvider.tsx';
import { celebratePersonalRecord } from './celebrate.ts';
import { toPersonalRecordInsert } from './mappers/personal-record.ts';
import {
  type SessionFeel,
  toPainReportInsert,
  toPlanSessionComplete,
  toWorkoutLogClose,
} from './mappers/session-close.ts';
import { toSubstitutionEvent } from './mappers/session-event.ts';
import { toSetLogInsert, toWorkoutLogInsert } from './mappers/session-log.ts';
import { enqueue, flush, newClientId, type OutboxItem, startAutoFlush } from './outbox.ts';
import type { ActiveSessionItem } from './plan.ts';
import { requireSupabase } from './supabase.ts';

/**
 * El envío real de la cola offline hacia Supabase. `upsert` con el `id` que
 * generó el cliente hace que reintentar un item ya enviado sea un no-op en
 * vez de un error de clave duplicada o una sobreescritura con datos viejos.
 */
export async function sendOutboxItem(item: OutboxItem): Promise<void> {
  const client = requireSupabase();

  if (item.kind === 'workout_log') {
    const { error } = await client
      .from('workout_logs')
      .upsert(item.payload as never, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    return;
  }

  if (item.kind === 'set_log') {
    const { error } = await client
      .from('set_logs')
      .upsert(item.payload as never, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    return;
  }

  if (item.kind === 'session_event') {
    const { error } = await client
      .from('session_events')
      .upsert(item.payload as never, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    return;
  }

  // proposal_response: todavía no tiene escritor. Se drena cuando llegue esa
  // parte del roadmap; hasta entonces queda en cola sin romper el flush de
  // lo que sí sabemos mandar.
}

/** Arranca el reintento automático al recuperar señal. Se llama una sola vez, en la raíz de la app. */
export function startSessionOutbox(): () => void {
  return startAutoFlush(sendOutboxItem);
}

/**
 * Récord real, no de mentira: compara contra el máximo `load_kg_normalized`
 * ya registrado para ese ejercicio ANTES de encolar esta serie (evita
 * compararla contra sí misma si ya llegó al servidor). Best-effort a
 * propósito — sin conexión, o con Supabase sin configurar, simplemente no
 * hay celebración esta vez; nunca rompe el registro de la serie en sí.
 *
 * Exige un récord anterior real (no solo un valor): la primera vez que se
 * hace un ejercicio no es un "récord", es el punto de partida.
 */
async function celebrateIfRecord(
  userId: string,
  exerciseId: string,
  setLogId: string,
  loadKg: number | null,
  achievedAt: string,
): Promise<void> {
  if (loadKg === null) return;

  try {
    const client = requireSupabase();
    const { data, error } = await client
      .from('set_logs')
      .select('load_kg_normalized, workout_logs!inner(user_id)')
      .eq('exercise_id', exerciseId)
      .eq('workout_logs.user_id', userId)
      .eq('is_warmup', false)
      .not('load_kg_normalized', 'is', null)
      .order('load_kg_normalized', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return;

    const previousBest = data?.load_kg_normalized as number | null | undefined;
    if (previousBest === null || previousBest === undefined || loadKg <= previousBest) return;

    celebratePersonalRecord();
    await client
      .from('personal_records')
      .insert(toPersonalRecordInsert(userId, exerciseId, loadKg, setLogId, achievedAt));
  } catch {
    // la celebración es un nice-to-have: nunca bloquea ni rompe marcar la serie.
  }
}

/**
 * Registra series completadas de una sesión. El `workout_log` se crea recién
 * cuando se marca la primera serie — si el socio abre la sesión y no hace
 * nada, no queda un registro vacío en la base.
 */
export function useSessionLog(userId: string | undefined, planSessionId: string) {
  const workoutLogIdRef = useRef<{ sessionId: string; workoutLogId: string } | null>(null);

  /** Crea el `workout_log` recién en el primer evento de la sesión (serie o sustitución). */
  async function ensureWorkoutLog(): Promise<string | null> {
    if (!userId) return null; // sin sesión no hay a quién atribuirle el registro

    if (workoutLogIdRef.current?.sessionId !== planSessionId) {
      const workoutLogId = crypto.randomUUID();
      await enqueue(
        'workout_log',
        toWorkoutLogInsert(
          workoutLogId,
          userId,
          planSessionId,
          newClientId(),
          new Date().toISOString(),
        ),
      );
      workoutLogIdRef.current = { sessionId: planSessionId, workoutLogId };
    }

    return workoutLogIdRef.current.workoutLogId;
  }

  async function markSetDone(
    item: ActiveSessionItem,
    setIndex: number,
    restActualSeconds: number,
  ): Promise<void> {
    const workoutLogId = await ensureWorkoutLog();
    if (!workoutLogId) return;

    const setLogId = crypto.randomUUID();
    const completedAt = new Date().toISOString();
    const loadKg =
      item.targetLoad && item.equipmentLoadSpec
        ? toKg(item.targetLoad, item.equipmentLoadSpec)
        : null;

    // Se dispara ANTES de encolar esta serie: compara contra el historial
    // real, no contra sí misma. Sin `await`: no hace esperar el toque de
    // "hecha" a una consulta de red.
    if (userId) void celebrateIfRecord(userId, item.exerciseId, setLogId, loadKg, completedAt);

    await enqueue(
      'set_log',
      toSetLogInsert(
        setLogId,
        workoutLogId,
        {
          planSessionItemId: item.id,
          exerciseId: item.exerciseId,
          equipmentId: item.equipmentId,
          targetLoad: item.targetLoad,
          equipmentLoadSpec: item.equipmentLoadSpec,
          repsTarget: item.repsTarget,
          restPrescribedSeconds: item.restSeconds,
        },
        setIndex,
        restActualSeconds,
        newClientId(),
        completedAt,
      ),
    );

    void flush(sendOutboxItem);
  }

  /** Registra que se cambió de estación por estar ocupada. No pisa `plan_session_items`. */
  async function logSubstitution(
    planSessionItemId: string,
    fromExerciseId: string,
    toExerciseId: string,
    fromEquipmentId: string | null,
    toEquipmentId: string | null,
  ): Promise<void> {
    const workoutLogId = await ensureWorkoutLog();
    if (!workoutLogId) return;

    await enqueue(
      'session_event',
      toSubstitutionEvent(
        crypto.randomUUID(),
        workoutLogId,
        planSessionItemId,
        fromExerciseId,
        toExerciseId,
        fromEquipmentId,
        toEquipmentId,
        new Date().toISOString(),
      ),
    );

    void flush(sendOutboxItem);
  }

  const current = workoutLogIdRef.current;
  const workoutLogId = current?.sessionId === planSessionId ? current.workoutLogId : null;

  return { markSetDone, logSubstitution, workoutLogId };
}

export interface CloseSessionInput {
  readonly planSessionId: string;
  /** `null` si no se marcó ninguna serie: no hay `workout_log` que cerrar. */
  readonly workoutLogId: string | null;
  readonly feel: SessionFeel;
  readonly notes: string;
  readonly pain: { readonly region: BodyRegion; readonly severity: number } | null;
}

/**
 * Cierra la sesión: marca `plan_sessions` como completada (así la cola
 * avanza a la siguiente) y, si hubo alguna serie, cierra su `workout_log`.
 *
 * A diferencia de `markSetDone`, esto NO pasa por la cola offline: es una
 * acción deliberada al terminar, no algo que tenga que sobrevivir un corte de
 * señal a mitad de una serie. Igual intenta vaciar la cola primero — si el
 * `workout_log` de esta sesión todavía no llegó al servidor, actualizarlo
 * de una no tendría ninguna fila que tocar.
 */
export function useCloseSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CloseSessionInput) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();
      const now = new Date().toISOString();

      await flush(sendOutboxItem);

      const { error: sessionError } = await client
        .from('plan_sessions')
        .update(toPlanSessionComplete(now))
        .eq('id', input.planSessionId);
      if (sessionError) throw sessionError;

      if (input.workoutLogId) {
        const { error: workoutError } = await client
          .from('workout_logs')
          .update(toWorkoutLogClose(input.feel, input.notes, now))
          .eq('id', input.workoutLogId);
        if (workoutError) throw workoutError;
      }

      if (input.pain) {
        const { error: painError } = await client
          .from('pain_reports')
          .insert(
            toPainReportInsert(
              user.id,
              input.workoutLogId,
              input.pain.region,
              input.pain.severity,
              now,
            ),
          );
        if (painError) throw painError;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['active-plan', user?.id] });
    },
  });
}
