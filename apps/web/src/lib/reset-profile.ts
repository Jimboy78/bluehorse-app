import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { requireSupabase } from './supabase.ts';

/**
 * BORRAR TODO Y EMPEZAR DE NUEVO
 *
 * Borra cada fila propia del socio —objetivo, medidas, restricciones,
 * baselines, ajustes de máquina, planes (con sus sesiones e ítems, por
 * cascada), entrenamientos registrados (con sus series y eventos, por
 * cascada), reportes de dolor, propuestas de adaptación y récords— y
 * después vuelve `profiles.onboarded_at` a `null`, que es lo único que mira
 * `RequireOnboarding` para mandar de nuevo al wizard.
 *
 * `health_screenings` queda afuera a propósito: la política de esa tabla no
 * tiene `delete` ("sin update ni delete a propósito", `08_rls.sql`) porque
 * cada respuesta al PAR-Q es un registro de responsabilidad, no un dato de
 * entrenamiento. El socio que resetea su perfil vuelve a responderlo antes de
 * poder generar un plan con el motor — `RequireScreening` ya lo exige así.
 *
 * No hay transacción real: el cliente de Supabase no la ofrece desde acá. Se
 * borra de lo más independiente a lo que tiene cascada, así que un fallo a
 * mitad de camino deja datos borrados de más y no de menos — y ninguna fila
 * queda huérfana, porque cada `delete` es sobre las propias del socio.
 */
export function useResetProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();
      const userId = user.id;

      const tablas = [
        'pain_reports',
        'adaptation_proposals',
        'personal_records',
        'workout_logs', // cascada: set_logs, session_events
        'plans', // cascada: plan_sessions, plan_session_items
        'user_constraints',
        'user_baselines',
        'user_equipment_settings',
        'body_metrics',
        'user_goals',
      ] as const;

      for (const tabla of tablas) {
        const { error } = await client.from(tabla).delete().eq('user_id', userId);
        if (error) throw error;
      }

      const { error: profileError } = await client
        .from('profiles')
        .update({ onboarded_at: null })
        .eq('id', userId);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      // Todo lo que este socio pudo haber cacheado queda viejo: más simple
      // invalidar todo que enumerar cada query key una por una y olvidarse de
      // una en la próxima función que agregue una tabla acá.
      void queryClient.invalidateQueries();
    },
  });
}
