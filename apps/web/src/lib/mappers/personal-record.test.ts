import { describe, expect, it } from 'vitest';
import { toPersonalRecordInsert } from './personal-record.ts';

describe('toPersonalRecordInsert', () => {
  it('arma la fila de max_load con el set_log que la logró', () => {
    expect(
      toPersonalRecordInsert('pr-1', 'u-1', 'ex-1', 82.5, 's-1', '2026-09-05T12:00:00Z'),
    ).toEqual({
      id: 'pr-1',
      user_id: 'u-1',
      exercise_id: 'ex-1',
      type: 'max_load',
      value: 82.5,
      set_log_id: 's-1',
      achieved_at: '2026-09-05T12:00:00Z',
    });
  });

  it('lleva id propio: sin él, reintentar la cola duplica el récord', () => {
    // Es la única fila de la cola offline que se mandaba con `insert`. Sin un
    // id generado en el cliente no hay `onConflict` posible, y una respuesta
    // perdida (túnel, señal que vuelve) escribe el mismo récord dos veces.
    const fila = toPersonalRecordInsert('pr-1', 'u-1', 'ex-1', 82.5, 's-1', '2026-09-05T12:00:00Z');
    expect(fila.id).toBe('pr-1');
  });
});
