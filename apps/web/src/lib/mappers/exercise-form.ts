import type { ExperienceLevel, Id, Modality, MovementPattern, MuscleGroup } from '@bh/domain';
import type { ExerciseFormInput } from '../../routes/panel/exercise-schemas.ts';

/** Lo que se inserta en `exercises`. La lista de equipamiento va aparte, a `exercise_equipment`. */
export interface ExerciseInsertRow {
  readonly gym_id: string;
  readonly name: string;
  readonly pattern: MovementPattern;
  readonly primary_muscles: MuscleGroup[];
  readonly secondary_muscles: MuscleGroup[];
  readonly modality: Modality;
  readonly is_compound: boolean;
  readonly is_unilateral: boolean;
  readonly skill_level: ExperienceLevel;
  readonly cues: string | null;
}

export interface ExerciseEquipmentInsertRow {
  readonly exercise_id: string;
  readonly equipment_id: string;
  readonly is_primary: boolean;
}

export function toExerciseInsert(gymId: string, input: ExerciseFormInput): ExerciseInsertRow {
  return {
    gym_id: gymId,
    name: input.name,
    pattern: input.pattern,
    primary_muscles: input.primaryMuscles,
    secondary_muscles: input.secondaryMuscles,
    modality: input.modality,
    is_compound: input.isCompound,
    is_unilateral: input.isUnilateral,
    skill_level: input.skillLevel,
    cues: input.cues || null,
  };
}

/** El primer equipamiento elegido queda como principal; el resto, alternativas. */
export function toExerciseEquipmentInserts(
  exerciseId: Id,
  equipmentIds: readonly Id[],
): ExerciseEquipmentInsertRow[] {
  return equipmentIds.map((equipmentId, index) => ({
    exercise_id: exerciseId,
    equipment_id: equipmentId,
    is_primary: index === 0,
  }));
}
