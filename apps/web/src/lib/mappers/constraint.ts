import type { MovementLimit, UserConstraint } from '@bh/domain';

/**
 * Una fila vigente de `user_constraints` tal como la lee el motor. Los campos
 * que solo tienen algunos tipos (el mes, el alta, el movimiento) se **omiten**
 * cuando vienen nulos: el motor pregunta `!== undefined`, y un `null` pasaría
 * ese filtro (la trampa de `null` no es `undefined`, CLAUDE.md).
 */
export interface ConstraintRow {
  readonly type: UserConstraint['type'];
  readonly body_region: string | null;
  readonly exercise_id: string | null;
  readonly equipment_id: string | null;
  readonly severity: number;
  readonly occurred_on: string | null;
  readonly rehab_done: boolean | null;
  readonly movement: MovementLimit | null;
}

export function toDomainConstraint(row: ConstraintRow): UserConstraint {
  return {
    type: row.type,
    bodyRegion: row.body_region as UserConstraint['bodyRegion'],
    exerciseId: row.exercise_id,
    equipmentId: row.equipment_id,
    severity: row.severity,
    ...(row.occurred_on !== null ? { occurredOn: row.occurred_on } : {}),
    ...(row.rehab_done !== null ? { rehabDone: row.rehab_done } : {}),
    ...(row.movement !== null ? { movement: row.movement } : {}),
  };
}
