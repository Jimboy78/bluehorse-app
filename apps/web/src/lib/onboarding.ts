import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OnboardingInput } from '../routes/onboarding/schemas.ts';
import { useAuth } from './auth/AuthProvider.tsx';
import { toProfileUpdate, toUserGoalInsert } from './mappers/profile.ts';
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
      const { data, error } = await client
        .from('profiles')
        .select('onboarded_at')
        .eq('id', user?.id as string)
        .single();

      if (error) throw error;
      return { onboarded: data.onboarded_at !== null };
    },
  });
}

export function useCompleteOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OnboardingInput) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();

      const { error: profileError } = await client
        .from('profiles')
        .update(toProfileUpdate(input))
        .eq('id', user.id);
      if (profileError) throw profileError;

      const { error: goalError } = await client
        .from('user_goals')
        .insert(toUserGoalInsert(user.id, input));
      if (goalError) throw goalError;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile-status', user?.id] });
    },
  });
}

/** `true` mientras Supabase no esté configurado: el onboarding no puede correr. */
export const onboardingUnavailable = !supabase;
