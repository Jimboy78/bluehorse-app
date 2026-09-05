import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExerciseFormInput } from '../routes/panel/exercise-schemas.ts';
import type { EquipmentFormInput } from '../routes/panel/schemas.ts';
import { useAuth } from './auth/AuthProvider.tsx';
import { fetchExercises } from './catalog.ts';
import { equipmentRowSchema, toDomainEquipment } from './mappers/catalog.ts';
import { toEquipmentInsert } from './mappers/equipment-form.ts';
import { toExerciseEquipmentInserts, toExerciseInsert } from './mappers/exercise-form.ts';
import { requireSupabase } from './supabase.ts';

/**
 * Datos y mutaciones del panel admin. Separado de `catalog.ts` (que arma el
 * `GymSnapshot` para el motor) porque acá el consumidor es la UI de gestión,
 * no el motor: necesita el listado crudo, no solo lo que el motor usa.
 */

export function useProfileRole() {
  const { user, status } = useAuth();

  return useQuery({
    queryKey: ['profile-role', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from('profiles')
        .select('role, gym_id')
        .eq('id', user?.id as string)
        .single();
      if (error) throw error;
      return { role: data.role as 'member' | 'staff' | 'admin', gymId: data.gym_id as string };
    },
  });
}

export function useEquipmentList(gymId: string | null) {
  return useQuery({
    queryKey: ['equipment-list', gymId],
    enabled: !!gymId,
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from('equipment')
        .select(
          'id, gym_id, name, category, brand, model, photo_url, location_note, setup_notes, load_unit, load_min, load_max, load_increment, stack_kg, base_weight_kg, quantity, is_active',
        )
        .eq('gym_id', gymId as string)
        .order('name');
      if (error) throw error;
      return (data ?? []).map((row) => toDomainEquipment(equipmentRowSchema.parse(row)));
    },
  });
}

/** Sube la foto a Storage y devuelve la URL pública. `null` si no se adjuntó ninguna. */
async function uploadEquipmentPhoto(file: File | null, gymId: string): Promise<string | null> {
  if (!file) return null;
  const client = requireSupabase();
  const path = `${gymId}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await client.storage.from('equipment-photos').upload(path, file);
  if (error) throw error;

  return client.storage.from('equipment-photos').getPublicUrl(path).data.publicUrl;
}

export function useCreateEquipment(gymId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ input, photo }: { input: EquipmentFormInput; photo: File | null }) => {
      if (!gymId) throw new Error('No se pudo determinar el gimnasio.');
      const client = requireSupabase();

      const photoUrl = await uploadEquipmentPhoto(photo, gymId);
      const { error } = await client
        .from('equipment')
        .insert(toEquipmentInsert(gymId, input, photoUrl));
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment-list', gymId] });
      void queryClient.invalidateQueries({ queryKey: ['gym-catalog', gymId] });
    },
  });
}

/**
 * Ejercicios visibles para el gimnasio: los propios más los globales
 * (`gym_id is null`, como los del seed). Reutiliza la misma consulta que
 * arma el `GymSnapshot` real (`fetchExercises`), para no mantener dos
 * versiones del mismo join contra `exercise_equipment`.
 */
export function useExerciseList(gymId: string | null) {
  const equipmentList = useEquipmentList(gymId);

  return useQuery({
    queryKey: ['exercise-list', gymId, equipmentList.data?.map((e) => e.id)],
    enabled: !!gymId && equipmentList.isSuccess,
    queryFn: () => {
      const client = requireSupabase();
      const ownedEquipmentIds = new Set((equipmentList.data ?? []).map((e) => e.id));
      return fetchExercises(client, gymId as string, ownedEquipmentIds);
    },
  });
}

export function useCreateExercise(gymId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExerciseFormInput) => {
      if (!gymId) throw new Error('No se pudo determinar el gimnasio.');
      const client = requireSupabase();

      const { data, error } = await client
        .from('exercises')
        .insert(toExerciseInsert(gymId, input))
        .select('id')
        .single();
      if (error) throw error;

      const mappings = toExerciseEquipmentInserts(data.id, input.equipmentIds);
      if (mappings.length > 0) {
        const { error: mappingError } = await client.from('exercise_equipment').insert(mappings);
        if (mappingError) throw mappingError;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercise-list', gymId] });
      void queryClient.invalidateQueries({ queryKey: ['gym-catalog', gymId] });
    },
  });
}
