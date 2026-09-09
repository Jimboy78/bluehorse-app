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
      if (error) {
        // La foto ya subió a Storage; si la fila no se pudo crear, no dejamos
        // el archivo huérfano ahí para siempre. Best-effort de verdad: si el
        // borrado también falla, no tapamos el error original con ese.
        if (photoUrl) {
          try {
            const path = new URL(photoUrl).pathname.split('/equipment-photos/')[1];
            if (path) await client.storage.from('equipment-photos').remove([path]);
          } catch {
            // limpieza fallida no es motivo para ocultar el error real de abajo.
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment-list', gymId] });
      void queryClient.invalidateQueries({ queryKey: ['gym-catalog', gymId] });
    },
  });
}

/** Saca el path dentro del bucket a partir de la URL pública. `null` si no matchea. */
function photoPath(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  try {
    return new URL(photoUrl).pathname.split('/equipment-photos/')[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Borra una foto del bucket sin hacer ruido. La limpieza de un archivo que ya
 * no referencia nadie no puede tapar (ni provocar) el error de la operación
 * que importaba.
 */
async function removePhotoQuietly(photoUrl: string | null): Promise<void> {
  const path = photoPath(photoUrl);
  if (!path) return;
  try {
    await requireSupabase().storage.from('equipment-photos').remove([path]);
  } catch {
    // una foto huérfana molesta menos que un error inventado.
  }
}

/**
 * Cuántos ejercicios tiene mapeados cada estación. Es lo que se pierde al
 * borrarla: `exercise_equipment` cascadea, así que la fila se va sin avisar y
 * el motor deja de poder proponer esos ejercicios. Los `set_logs` no se
 * pierden (su `equipment_id` queda en null), el historial sobrevive.
 */
export function useEquipmentUsage(gymId: string | null) {
  return useQuery({
    queryKey: ['equipment-usage', gymId],
    enabled: !!gymId,
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from('exercise_equipment')
        .select('equipment_id, equipment!inner(gym_id)')
        .eq('equipment.gym_id', gymId as string);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const id = (row as { equipment_id: string }).equipment_id;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return counts;
    },
  });
}

/**
 * Corregir una estación ya cargada. Relevar el gimnasio son decenas de filas
 * a mano: sin esto, un nombre mal tipeado o una carga máxima equivocada solo
 * se arreglaba por SQL.
 *
 * `photo: null` deja la foto que ya tenía; para reemplazarla se manda una
 * nueva y la vieja se borra del bucket después de que la fila se actualizó.
 */
export function useUpdateEquipment(gymId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
      photo,
      currentPhotoUrl,
    }: {
      id: string;
      input: EquipmentFormInput;
      photo: File | null;
      currentPhotoUrl: string | null;
    }) => {
      if (!gymId) throw new Error('No se pudo determinar el gimnasio.');
      const client = requireSupabase();

      const newPhotoUrl = await uploadEquipmentPhoto(photo, gymId);
      const { error } = await client
        .from('equipment')
        .update(toEquipmentInsert(gymId, input, newPhotoUrl ?? currentPhotoUrl))
        .eq('id', id);

      if (error) {
        // Misma limpieza que en el alta: la foto nueva ya subió y la fila no
        // cambió, así que ese archivo no lo referencia nadie.
        await removePhotoQuietly(newPhotoUrl);
        throw error;
      }

      // Recién acá: si la fila no se hubiera actualizado, borrar la vieja
      // dejaría a la estación sin foto y sin haber cambiado nada.
      if (newPhotoUrl) await removePhotoQuietly(currentPhotoUrl);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment-list', gymId] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-usage', gymId] });
      void queryClient.invalidateQueries({ queryKey: ['gym-catalog', gymId] });
    },
  });
}

/**
 * Borrar una estación que no existe o que se cargó dos veces. La foto se
 * borra después de la fila, por la misma razón de siempre: si la fila no se
 * pudo borrar, la estación sigue viva y sin foto no sirve.
 */
export function useDeleteEquipment(gymId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, photoUrl }: { id: string; photoUrl: string | null }) => {
      const client = requireSupabase();

      const { error } = await client.from('equipment').delete().eq('id', id);
      if (error) throw error;

      await removePhotoQuietly(photoUrl);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment-list', gymId] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-usage', gymId] });
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
        if (mappingError) {
          // Un ejercicio recién creado sin su mapeo de equipamiento quedaría
          // atascado ahí para siempre (invisible para el motor, pero
          // ocupando el nombre en el listado). Mejor que no exista a medias —
          // se borra y el staff reintenta desde cero. Seguro de hacer acá
          // (a diferencia de `useDeleteExercise`) porque todavía no pasó por
          // ningún plan ni ninguna serie: se está creando en este mismo instante.
          try {
            await client.from('exercises').delete().eq('id', data.id);
          } catch {
            // limpieza fallida no es motivo para ocultar el error real de abajo.
          }
          throw mappingError;
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercise-list', gymId] });
      void queryClient.invalidateQueries({ queryKey: ['gym-catalog', gymId] });
    },
  });
}

/**
 * Corregir un ejercicio ya cargado: nombre mal tipeado, patrón equivocado, un
 * músculo que faltaba. El mapeo de equipamiento se reemplaza entero (borrar
 * todo lo viejo, insertar lo nuevo) en vez de calcular el diff — la tabla es
 * chica y así no hay forma de dejar una fila vieja colgada si el orden de
 * altas y bajas se complica.
 */
export function useUpdateExercise(gymId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ExerciseFormInput }) => {
      if (!gymId) throw new Error('No se pudo determinar el gimnasio.');
      const client = requireSupabase();

      const { error } = await client
        .from('exercises')
        .update(toExerciseInsert(gymId, input))
        .eq('id', id);
      if (error) throw error;

      const { error: deleteError } = await client
        .from('exercise_equipment')
        .delete()
        .eq('exercise_id', id);
      if (deleteError) throw deleteError;

      const mappings = toExerciseEquipmentInserts(id, input.equipmentIds);
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

/**
 * Borrar un ejercicio cargado por error o duplicado.
 *
 * A diferencia de `equipment` (que no tiene ninguna referencia con
 * `on delete restrict`), `exercises` sí: `plan_session_items.exercise_id` y
 * `set_logs.exercise_id` bloquean el borrado en cuanto el ejercicio entró en
 * algún plan o alguien registró una serie con él (05_plans.sql, 06_logs.sql
 * — es la misma frontera entre lo planificado y lo real de la regla dura 7).
 * Ese error de Postgres (`23503`, foreign key violation) se traduce acá:
 * sin esto, el staff vería el código crudo en vez de un motivo.
 */
export function useDeleteExercise(gymId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = requireSupabase();
      const { error } = await client.from('exercises').delete().eq('id', id);
      if (error) {
        if (error.code === '23503') {
          throw new Error(
            'Ya se usó en un plan o tiene series registradas: no se puede borrar sin perder ese historial.',
          );
        }
        throw error;
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercise-list', gymId] });
      void queryClient.invalidateQueries({ queryKey: ['gym-catalog', gymId] });
    },
  });
}
