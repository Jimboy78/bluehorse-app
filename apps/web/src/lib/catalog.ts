import type { GymSnapshot } from '@bh/engine';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import {
  equipmentRowSchema,
  exerciseEquipmentRowSchema,
  exerciseRowSchema,
  substitutionRowSchema,
  toDomainEquipment,
  toDomainExercise,
  toDomainSubstitution,
} from './mappers/catalog.ts';
import { PLACEHOLDER_GYM } from './placeholder-gym.ts';
import { requireSupabase } from './supabase.ts';

export interface GymCatalog {
  readonly gym: GymSnapshot;
  /**
   * `true` mientras el gimnasio del socio no tenga equipamiento real cargado.
   * Cuando el relevamiento (Fase 0) entre a la base, esto se apaga solo: no
   * hace falta tocar código ni borrar ningún aviso a mano.
   */
  readonly isPlaceholder: boolean;
}

/**
 * Catálogo real del gimnasio del socio, leído de Supabase. Si todavía no hay
 * equipamiento cargado para ese gimnasio, cae al gimnasio de ejemplo
 * (`placeholder-gym.ts`) — mismo criterio que el ruleset provisorio.
 */
export function useGymCatalog(gymId: string | null) {
  return useQuery<GymCatalog>({
    queryKey: ['gym-catalog', gymId],
    enabled: !!gymId,
    queryFn: () => fetchGymCatalog(requireSupabase(), gymId as string),
  });
}

/** Exportada para reuso: la generación de plan necesita el mismo catálogo que el motor. */
export async function fetchGymCatalog(client: SupabaseClient, gymId: string): Promise<GymCatalog> {
  const equipment = await fetchEquipment(client, gymId);
  if (equipment.length === 0) {
    return { gym: PLACEHOLDER_GYM, isPlaceholder: true };
  }

  const exercises = await fetchExercises(client, gymId, new Set(equipment.map((e) => e.id)));
  const substitutions = await fetchSubstitutions(client, new Set(exercises.map((e) => e.id)));

  return {
    gym: { gymId, equipment, exercises, substitutions },
    isPlaceholder: false,
  };
}

/**
 * Equivalencias cargadas a mano en `/panel` (tabla `exercise_substitutions`).
 * El motor las prioriza sobre el cálculo automático por patrón y músculos —
 * ver `findSubstitutes` en el engine — pero hasta acá nunca se leían: esta
 * consulta faltaba, así que ninguna equivalencia curada llegaba nunca al
 * motor, en ninguna de las tres pantallas que ofrecen "cambiar ejercicio".
 */
async function fetchSubstitutions(client: SupabaseClient, ownedExerciseIds: ReadonlySet<string>) {
  const { data, error } = await client
    .from('exercise_substitutions')
    .select('exercise_id, substitute_id, equivalence, note');
  if (error) throw error;

  return (data ?? [])
    .map((raw) => substitutionRowSchema.parse(raw))
    .filter(
      (row) => ownedExerciseIds.has(row.exercise_id) && ownedExerciseIds.has(row.substitute_id),
    )
    .map(toDomainSubstitution);
}

async function fetchEquipment(client: SupabaseClient, gymId: string) {
  const { data, error } = await client
    .from('equipment')
    .select(
      'id, gym_id, name, category, brand, model, photo_url, location_note, setup_notes, load_unit, load_min, load_max, load_increment, stack_kg, base_weight_kg, quantity, is_active',
    )
    .eq('gym_id', gymId)
    .eq('is_active', true);
  if (error) throw error;
  return (data ?? []).map((row) => toDomainEquipment(equipmentRowSchema.parse(row)));
}

/** Exportada para reuso del panel admin, que necesita la lista real aunque el equipamiento esté vacío. */
export async function fetchExercises(
  client: SupabaseClient,
  gymId: string,
  ownedEquipmentIds: ReadonlySet<string>,
) {
  const { data: exerciseRows, error: exerciseError } = await client
    .from('exercises')
    .select(
      'id, gym_id, name, pattern, primary_muscles, secondary_muscles, modality, is_compound, is_unilateral, is_explosive, skill_level, cues, is_active',
    )
    .or(`gym_id.is.null,gym_id.eq.${gymId}`)
    .eq('is_active', true);
  if (exerciseError) throw exerciseError;

  const { data: mappingRows, error: mappingError } = await client
    .from('exercise_equipment')
    .select('exercise_id, equipment_id');
  if (mappingError) throw mappingError;

  const equipmentIdsByExercise = new Map<string, string[]>();
  for (const raw of mappingRows ?? []) {
    const mapping = exerciseEquipmentRowSchema.parse(raw);
    if (!ownedEquipmentIds.has(mapping.equipment_id)) continue; // de otro gimnasio o inactivo
    const list = equipmentIdsByExercise.get(mapping.exercise_id) ?? [];
    list.push(mapping.equipment_id);
    equipmentIdsByExercise.set(mapping.exercise_id, list);
  }

  return (exerciseRows ?? []).map((raw) => {
    const row = exerciseRowSchema.parse(raw);
    return toDomainExercise(row, equipmentIdsByExercise.get(row.id) ?? []);
  });
}
