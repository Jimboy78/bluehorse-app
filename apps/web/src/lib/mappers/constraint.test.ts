import { describe, expect, it } from 'vitest';
import { type ConstraintRow, toDomainConstraint } from './constraint.ts';

/**
 * Es el camino por el que el plan se entera de las restricciones
 * (`fetchUserSnapshot`). Un campo que se pierde acá no rompe nada a la vista: el
 * motor arma el plan de alguien sano.
 */

const base: ConstraintRow = {
  type: 'pain',
  body_region: 'knee',
  exercise_id: null,
  equipment_id: null,
  severity: 3,
  occurred_on: null,
  rehab_done: null,
  movement: null,
};

describe('toDomainConstraint', () => {
  it('un movimiento que no puede llega con su movimiento (`docs/research/58`)', () => {
    const c = toDomainConstraint({
      ...base,
      type: 'avoid_movement',
      body_region: null,
      severity: 5,
      movement: 'overhead',
    });
    expect(c.type).toBe('avoid_movement');
    expect(c.movement).toBe('overhead');
  });

  it('los campos nulos se omiten, no viajan como null', () => {
    const c = toDomainConstraint(base);
    expect('movement' in c).toBe(false);
    expect('occurredOn' in c).toBe(false);
    expect('rehabDone' in c).toBe(false);
  });

  it('una operación lleva el mes y el alta', () => {
    const c = toDomainConstraint({
      ...base,
      type: 'surgery',
      occurred_on: '2026-07-01',
      rehab_done: false,
    });
    expect(c.occurredOn).toBe('2026-07-01');
    expect(c.rehabDone).toBe(false);
  });
});
