import { describe, expect, it } from 'vitest';
import { toPainReportInsert, toPlanSessionComplete, toWorkoutLogClose } from './session-close.ts';

describe('toWorkoutLogClose', () => {
  it('mapea camelCase a snake_case y recorta las notas', () => {
    const row = toWorkoutLogClose('right', '  Buena sesión  ', '2026-09-05T11:00:00Z');
    expect(row).toEqual({
      ended_at: '2026-09-05T11:00:00Z',
      session_feel: 'right',
      notes: 'Buena sesión',
    });
  });

  it('guarda null cuando no hay notas', () => {
    expect(toWorkoutLogClose('easy', '   ', '2026-09-05T11:00:00Z').notes).toBeNull();
  });
});

describe('toPlanSessionComplete', () => {
  it('siempre marca completed con la fecha dada', () => {
    expect(toPlanSessionComplete('2026-09-05T11:00:00Z')).toEqual({
      status: 'completed',
      completed_at: '2026-09-05T11:00:00Z',
    });
  });
});

describe('toPainReportInsert', () => {
  it('mapea camelCase a snake_case sin nota adicional', () => {
    expect(toPainReportInsert('user-1', 'w-1', 'knee', 3, '2026-09-05T11:00:00Z')).toEqual({
      user_id: 'user-1',
      workout_log_id: 'w-1',
      body_region: 'knee',
      severity: 3,
      note: null,
      reported_at: '2026-09-05T11:00:00Z',
    });
  });

  it('acepta workout_log_id null cuando no se registró ninguna serie', () => {
    expect(
      toPainReportInsert('user-1', null, 'shoulder', 2, '2026-09-05T11:00:00Z').workout_log_id,
    ).toBeNull();
  });
});
