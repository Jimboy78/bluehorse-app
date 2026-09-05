import type { PlanBlueprint, SessionBlueprint, SessionItemBlueprint } from '@bh/engine';
import { describe, expect, it } from 'vitest';
import { toPlanInsert, toPlanSessionInserts, toPlanSessionItemInserts } from './plan.ts';

const item: SessionItemBlueprint = {
  exerciseId: 'ex-1',
  equipmentId: 'eq-1',
  orderIndex: 0,
  targetSets: 3,
  targetRepsMin: 8,
  targetRepsMax: 12,
  targetLoad: { value: 60, unit: 'kg' },
  targetRir: 2,
  restSeconds: 90,
  rationale: 'Va primero.',
  isPlaceholder: true,
};

const itemSinCarga: SessionItemBlueprint = { ...item, exerciseId: 'ex-2', targetLoad: null };

const session: SessionBlueprint = {
  sequenceIndex: 0,
  label: 'Sesión A',
  focus: 'Cuerpo completo',
  estimatedMinutes: 55,
  items: [item],
};

const blueprint: PlanBlueprint = {
  rulesetVersion: 'v0-placeholder',
  source: 'placeholder',
  templateId: 'full_body_ab',
  sessions: [session],
  warnings: [],
};

describe('toPlanInsert', () => {
  it('mapea camelCase a snake_case y adjunta el snapshot del objetivo', () => {
    const row = toPlanInsert('user-1', 'gym-1', blueprint, { goal: 'hypertrophy' });
    expect(row).toEqual({
      user_id: 'user-1',
      gym_id: 'gym-1',
      ruleset_version: 'v0-placeholder',
      template_id: 'full_body_ab',
      goal_snapshot: { goal: 'hypertrophy' },
      status: 'active',
    });
  });
});

describe('toPlanSessionInserts', () => {
  it('mapea cada sesión con status pending, sin fecha', () => {
    const rows = toPlanSessionInserts('plan-1', blueprint.sessions);
    expect(rows).toEqual([
      {
        plan_id: 'plan-1',
        sequence_index: 0,
        label: 'Sesión A',
        focus: 'Cuerpo completo',
        estimated_minutes: 55,
        status: 'pending',
      },
    ]);
  });
});

describe('toPlanSessionItemInserts', () => {
  it('separa el valor y la unidad de la carga', () => {
    const rows = toPlanSessionItemInserts('session-1', [item]);
    expect(rows[0]).toMatchObject({ target_load: 60, target_load_unit: 'kg' });
  });

  it('guarda null en carga y unidad cuando no hay baseline, no un valor inventado', () => {
    const rows = toPlanSessionItemInserts('session-1', [itemSinCarga]);
    expect(rows[0]).toMatchObject({ target_load: null, target_load_unit: null });
  });
});
