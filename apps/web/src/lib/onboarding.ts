import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OnboardingInput } from '../routes/onboarding/schemas.ts';
import { useAuth } from './auth/AuthProvider.tsx';
import { conPlazo } from './con-plazo.ts';
import { toBodyMetricInsert, toProfileUpdate, toUserGoalInsert } from './mappers/profile.ts';
import { requireSupabase, supabase } from './supabase.ts';

/**
 * Estado de onboarding del socio. `profiles` ya existe para todo usuario
 * autenticado (la crea un trigger de la base al registrarse) — acá solo se
 * lee si `onboarded_at` está seteado.
 *
 * No pasa por la cola offline: onboarding necesita ver el estado real del
 * servidor y ocurre una sola vez, normalmente con conexión de sobra.
 */
export function useProfileStatus() {
  const { user, status } = useAuth();

  return useQuery({
    queryKey: ['profile-status', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      // Con plazo: mismo motivo que en el cribado — es un guard de ruta.
      const { data, error } = await conPlazo(
        client
          .from('profiles')
          .select('onboarded_at, gym_id')
          .eq('id', user?.id as string)
          .single(),
      );

      if (error) throw error;
      return { onboarded: data.onboarded_at !== null, gymId: data.gym_id };
    },
  });
}

/**
 * El `user_goal` se guarda ANTES de marcar `profiles.onboarded_at`, no
 * después: ese campo es lo único que decide si `RequireOnboarding` deja
 * pasar a la app. Si el orden fuera al revés y la inserción del objetivo
 * fallara, el socio quedaría marcado como "ya hizo el onboarding" pero sin
 * ningún objetivo — pasaría el gate, llegaría a "Hoy", e intentar generar un
 * plan tiraría un error de "falta el onboarding" sin ninguna forma de volver
 * atrás a cargarlo.
 */
export function useCompleteOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OnboardingInput) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();

      const { data: profileRow, error: readError } = await client
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .single();
      if (readError) throw readError;

      const { error: goalError } = await client
        .from('user_goals')
        .insert(toUserGoalInsert(user.id, input));
      if (goalError) throw goalError;

      // La primera medición va antes de marcar `onboarded_at`, igual que el
      // objetivo: si falla, el socio repite el paso en vez de entrar a la app
      // sin ningún peso registrado y sin ninguna pantalla para cargarlo.
      const { error: metricError } = await client
        .from('body_metrics')
        .insert(toBodyMetricInsert(user.id, profileRow.gym_id, input));
      if (metricError) throw metricError;

      const { error: profileError } = await client
        .from('profiles')
        .update(toProfileUpdate(input))
        .eq('id', user.id);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile-status', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['body-metrics', user?.id] });
    },
  });
}

/** `true` mientras Supabase no esté configurado: el onboarding no puede correr. */
export const onboardingUnavailable = !supabase;
