import { useRef } from 'react';
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

  // proposal_response / session_event: todavía no tienen escritor. Se drenan
  // cuando llegue esa parte del roadmap; hasta entonces quedan en cola sin
  // romper el flush de lo que sí sabemos mandar.
}

/** Arranca el reintento automático al recuperar señal. Se llama una sola vez, en la raíz de la app. */
export function startSessionOutbox(): () => void {
  return startAutoFlush(sendOutboxItem);
}

/**
 * Registra series completadas de una sesión. El `workout_log` se crea recién
 * cuando se marca la primera serie — si el socio abre la sesión y no hace
 * nada, no queda un registro vacío en la base.
 */
export function useSessionLog(userId: string | undefined, planSessionId: string) {
  const workoutLogIdRef = useRef<{ sessionId: string; workoutLogId: string } | null>(null);

  async function markSetDone(
    item: ActiveSessionItem,
    setIndex: number,
    restActualSeconds: number,
  ): Promise<void> {
    if (!userId) return; // sin sesión no hay a quién atribuirle el registro

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

    await enqueue(
      'set_log',
      toSetLogInsert(
        crypto.randomUUID(),
        workoutLogIdRef.current.workoutLogId,
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
        new Date().toISOString(),
      ),
    );

    void flush(sendOutboxItem);
  }

  return { markSetDone };
}
