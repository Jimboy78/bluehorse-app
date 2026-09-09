import type { ProposalBlueprint } from '@bh/engine';
import { describe, expect, it } from 'vitest';
import { toAdaptationProposal, toProposalInsert, toSetLog } from './adaptation.ts';

describe('toSetLog', () => {
  it('mapea snake_case a camelCase sin tocar la carga cruda', () => {
    const log = toSetLog({
      id: 's-1',
      plan_session_item_id: 'psi-1',
      exercise_id: 'ex-1',
      equipment_id: 'eq-1',
      set_index: 0,
      load_value: 40,
      load_unit: 'kg',
      load_kg_normalized: 40,
      reps: 8,
      reps_target: 8,
      rir: 2,
      duration_seconds: null,
      distance_meters: null,
      rest_prescribed_seconds: 90,
      rest_actual_seconds: 95,
      is_warmup: false,
      completed_at: '2026-08-10T12:00:00Z',
      client_id: 'client-1',
      workout_log_id: 'w-1',
    });
    expect(log.load).toEqual({ value: 40, unit: 'kg' });
    expect(log.loadKg).toBe(40);
    expect(log.workoutLogId).toBe('w-1');
  });
});

describe('toAdaptationProposal', () => {
  it('mapea la fila persistida a dominio', () => {
    const proposal = toAdaptationProposal({
      id: 'p-1',
      user_id: 'u-1',
      plan_id: 'plan-1',
      type: 'load_increase',
      target_ref: { exerciseId: 'ex-1' },
      from_value: '40',
      to_value: '42.5',
      reason_code: 'rir_above_target',
      reason_text: 'Te sobraron repeticiones.',
      ruleset_version: 'v0-placeholder',
      load_unit: 'kg' as const,
      status: 'pending',
      created_at: '2026-09-01T12:00:00Z',
      resolved_at: null,
    });
    expect(proposal).toEqual({
      id: 'p-1',
      loadUnit: 'kg',
      userId: 'u-1',
      planId: 'plan-1',
      type: 'load_increase',
      targetRef: { exerciseId: 'ex-1' },
      fromValue: '40',
      toValue: '42.5',
      reasonCode: 'rir_above_target',
      reasonText: 'Te sobraron repeticiones.',
      rulesetVersion: 'v0-placeholder',
      status: 'pending',
      createdAt: '2026-09-01T12:00:00Z',
      resolvedAt: null,
    });
  });
});

describe('toProposalInsert', () => {
  it('arma la fila a insertar sin id ni status: eso lo da la base', () => {
    const blueprint: ProposalBlueprint = {
      type: 'deload',
      targetRef: { planId: 'plan-1' },
      fromValue: null,
      toValue: '70%',
      // Un deload no habla de carga: "70%" no tiene unidad que guardar.
      loadUnit: null,
      reasonCode: 'absence',
      reasonText: 'Volviste después de un tiempo.',
      rulesetVersion: 'v0-placeholder',
      isPlaceholder: true,
    };
    expect(toProposalInsert('u-1', 'plan-1', blueprint)).toEqual({
      user_id: 'u-1',
      plan_id: 'plan-1',
      type: 'deload',
      target_ref: { planId: 'plan-1' },
      from_value: null,
      to_value: '70%',
      load_unit: null,
      reason_code: 'absence',
      reason_text: 'Volviste después de un tiempo.',
      ruleset_version: 'v0-placeholder',
    });
  });
});
