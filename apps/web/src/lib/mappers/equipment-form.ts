import type { EquipmentCategory, LoadUnit } from '@bh/domain';
import type { EquipmentFormInput } from '../../routes/panel/schemas.ts';
import { parseStackKg } from '../../routes/panel/schemas.ts';

/** Lo que se inserta en `equipment`. Snake_case, tal como espera la tabla. */
export interface EquipmentInsertRow {
  readonly gym_id: string;
  readonly name: string;
  readonly category: EquipmentCategory;
  readonly load_unit: LoadUnit;
  readonly load_min: number | null;
  readonly load_max: number | null;
  readonly load_increment: number | null;
  readonly stack_kg: number[] | null;
  readonly base_weight_kg: number | null;
  readonly quantity: number;
  readonly location_note: string | null;
  readonly setup_notes: string | null;
  readonly photo_url: string | null;
}

export function toEquipmentInsert(
  gymId: string,
  input: EquipmentFormInput,
  photoUrl: string | null,
): EquipmentInsertRow {
  return {
    gym_id: gymId,
    name: input.name,
    category: input.category,
    load_unit: input.loadUnit,
    load_min: input.loadMin,
    load_max: input.loadMax,
    load_increment: input.loadIncrement,
    stack_kg: parseStackKg(input.stackKgRaw),
    base_weight_kg: input.baseWeightKg,
    quantity: input.quantity,
    location_note: input.locationNote || null,
    setup_notes: input.setupNotes || null,
    photo_url: photoUrl,
  };
}
