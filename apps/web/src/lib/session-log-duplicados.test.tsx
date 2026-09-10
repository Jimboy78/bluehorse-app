import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * LA MISMA SERIE, DOS VECES
 *
 * `client_id` es único en la base y hace que reintentar un envío de la cola
 * sea un no-op. Lo que NO cubre es la misma serie mandada dos veces con
 * identidades distintas: ahí son dos `client_id` diferentes y la base los
 * acepta a los dos como si fueran series distintas.
 *
 * Medido en la base local antes de arreglarlo — dos filas reales:
 *
 *   workout_log 14d04aec…  exercise cbc0a99f…  set_index 2  reps 12
 *   client_id e6a28dd3…    13:47:37
 *   client_id 36319fe2…    13:47:48
 *
 * Mismo `plan_session_item_id`, once segundos de diferencia. La primera
 * quedaba además huérfana: `writtenSetsRef` la pisaba, así que destildarla ya
 * no la borraba de ningún lado. Contaba doble en Progreso y alimentaba doble
 * la adaptación, que es la señal de la que vive el motor.
 */

const enqueue = vi.fn(async () => 'client-id');
const dequeue = vi.fn(async () => true);

vi.mock('./outbox.ts', () => ({
  enqueue: (...args: unknown[]) => enqueue(...(args as [])),
  dequeue: (...args: unknown[]) => dequeue(...(args as [])),
  flush: vi.fn(),
  newClientId: () => 'client-id',
  startAutoFlush: vi.fn(),
}));
vi.mock('./celebrate.ts', () => ({ celebratePersonalRecord: vi.fn() }));
vi.mock('./supabase.ts', () => ({ requireSupabase: () => ({}) }));

const { useSessionLog } = await import('./session-log.ts');

type Item = Parameters<ReturnType<typeof useSessionLog>['markSetDone']>[0];
type Actual = Parameters<ReturnType<typeof useSessionLog>['markSetDone']>[3];

const ITEM = {
  id: 'item-1',
  exerciseId: 'ex-1',
  equipmentId: null,
  targetLoad: null,
  equipmentLoadSpec: null,
  repsTarget: 12,
  restSeconds: 90,
} as unknown as Item;

const HECHA = { load: null, reps: 12, rir: null } as unknown as Actual;

function envoltorio({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function montar() {
  return renderHook(() => useSessionLog('user-1', 'plan-session-1'), { wrapper: envoltorio });
}

/** Cuántas veces se encoló algo de este tipo. El `workout_log` va aparte. */
function encoladas(tipo: string): number {
  return enqueue.mock.calls.filter((c) => (c as unknown[])[0] === tipo).length;
}

describe('marcar la misma serie dos veces', () => {
  beforeEach(() => {
    enqueue.mockClear();
    dequeue.mockClear();
  });

  it('escribe una sola vez aunque se marque dos', async () => {
    const { result } = montar();

    await act(async () => {
      await result.current.markSetDone(ITEM, 2, 90, HECHA);
    });
    await act(async () => {
      await result.current.markSetDone(ITEM, 2, 90, HECHA);
    });

    expect(encoladas('set_log')).toBe(1);
  });

  it('no abre un segundo workout_log para la misma sesión', async () => {
    const { result } = montar();

    await act(async () => {
      await result.current.markSetDone(ITEM, 0, 90, HECHA);
      await result.current.markSetDone(ITEM, 0, 90, HECHA);
    });

    expect(encoladas('workout_log')).toBe(1);
  });

  it('destildar y volver a marcar sí vuelve a escribir', async () => {
    const { result } = montar();

    await act(async () => {
      await result.current.markSetDone(ITEM, 1, 90, HECHA);
    });
    await act(async () => {
      await result.current.undoSetDone(ITEM, 1);
    });
    await act(async () => {
      await result.current.markSetDone(ITEM, 1, 90, HECHA);
    });

    // La guarda protege de la repetición, no del arrepentimiento.
    expect(encoladas('set_log')).toBe(2);
  });
});
