import { describe, expect, it } from 'vitest';
import { toSubstitutionEvent } from './session-event.ts';

describe('toSubstitutionEvent', () => {
  it('mapea camelCase a snake_case con el id generado por el cliente', () => {
    const row = toSubstitutionEvent(
      'evt-1',
      'w-1',
      'item-1',
      'ex-original',
      'ex-sustituto',
      'eq-original',
      'eq-sustituto',
      '2026-09-05T12:00:00Z',
    );
    expect(row).toEqual({
      id: 'evt-1',
      workout_log_id: 'w-1',
      type: 'substituted',
      payload: {
        plan_session_item_id: 'item-1',
        from_exercise_id: 'ex-original',
        to_exercise_id: 'ex-sustituto',
        from_equipment_id: 'eq-original',
        to_equipment_id: 'eq-sustituto',
      },
      occurred_at: '2026-09-05T12:00:00Z',
    });
  });

  it('acepta equipment_id null (ejercicio de peso corporal)', () => {
    const row = toSubstitutionEvent(
      'evt-1',
      'w-1',
      'item-1',
      'ex-original',
      'ex-sustituto',
      null,
      null,
      '2026-09-05T12:00:00Z',
    );
    expect(row.payload.from_equipment_id).toBeNull();
    expect(row.payload.to_equipment_id).toBeNull();
  });
});
