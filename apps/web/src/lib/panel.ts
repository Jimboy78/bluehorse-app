import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EquipmentFormInput } from '../routes/panel/schemas.ts';
import { useAuth } from './auth/AuthProvider.tsx';
import { equipmentRowSchema, toDomainEquipment } from './mappers/catalog.ts';
import { toEquipmentInsert } from './mappers/equipment-form.ts';
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
