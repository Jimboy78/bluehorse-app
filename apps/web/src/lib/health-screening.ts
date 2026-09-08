import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { activeRuleset } from './engine.ts';
import { requireSupabase } from './supabase.ts';

/**
 * CRIBADO PREVIO A ENTRENAR
 *
 * Las preguntas no viven acá: salen de `ruleset.safety.screening`, igual que
 * todo el resto del contenido. Este archivo solo sabe guardarlas y leerlas.
 *
 * Un ruleset sin bloque `safety` (el provisorio, por ejemplo) apaga el cribado
 * entero: es preferible no ofrecer uno a ofrecer uno inventado.
 */

export interface ScreeningState {
  /** `false` cuando el ruleset activo no define cribado. */
  readonly required: boolean;
  /** Si ya lo respondió con el ruleset activo. */
  readonly answered: boolean;
  /** `false` = respondió que sí a algo bloqueante: necesita autorización médica. */
  readonly cleared: boolean;
  /** Si hay que volver a pedirle que acepte el aviso legal. */
  readonly needsDisclaimer: boolean;
}

export function useScreeningState() {
  const { user, status } = useAuth();

  return useQuery<ScreeningState>({
    queryKey: ['health-screening', user?.id, activeRuleset.version],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const safety = activeRuleset.safety;
      if (!safety) {
        return { required: false, answered: true, cleared: true, needsDisclaimer: false };
      }

      const client = requireSupabase();
      const { data, error } = await client
        .from('health_screenings')
        .select('cleared, disclaimer_accepted_at, ruleset_version, created_at')
        .eq('user_id', user?.id as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return { required: true, answered: false, cleared: false, needsDisclaimer: true };
      }

      // Un cribado hecho con otro ruleset no sirve: las preguntas pueden haber
      // cambiado, y lo que se guardó son respuestas a las preguntas de entonces.
      const sameRuleset = data.ruleset_version === activeRuleset.version;
      const accepted = data.disclaimer_accepted_at as string | null;

      return {
        required: true,
        answered: sameRuleset,
        cleared: sameRuleset && (data.cleared as boolean),
        needsDisclaimer: !accepted || isDisclaimerStale(accepted, safety.disclaimerRenewMonths),
      };
    },
  });
}

export function useSubmitScreening() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answers: Readonly<Record<string, boolean>>) => {
      if (!user) throw new Error('No hay sesión activa.');
      const safety = activeRuleset.safety;
      if (!safety) throw new Error('El ruleset activo no define cribado de salud.');

      const client = requireSupabase();
      const cleared = isCleared(answers);

      const { error } = await client.from('health_screenings').insert({
        user_id: user.id,
        ruleset_version: activeRuleset.version,
        answers,
        cleared,
        disclaimer_accepted_at: new Date().toISOString(),
      });
      if (error) throw error;

      return cleared;
    },
    /**
     * Se escribe el estado nuevo en la caché en vez de solo invalidar.
     *
     * Con `invalidateQueries` sola había una carrera real: la pantalla navegaba
     * al onboarding apenas guardaba, `RequireScreening` montaba mientras la
     * consulta todavía se estaba rehaciendo, leía el dato viejo
     * (`answered: false`) y rebotaba de vuelta al cribado — con el formulario en
     * blanco, como si no se hubiera guardado nada. Se guardaba bien; lo que
     * fallaba era lo que el guard veía en ese instante.
     */
    onSuccess: (cleared) => {
      queryClient.setQueryData<ScreeningState>(
        ['health-screening', user?.id, activeRuleset.version],
        { required: true, answered: true, cleared, needsDisclaimer: false },
      );
    },
  });
}

/**
 * Queda frenado si respondió que sí a cualquier pregunta marcada como
 * bloqueante. Las no bloqueantes se guardan igual: son contexto útil, no un
 * motivo para no dejarlo entrenar.
 */
export function isCleared(answers: Readonly<Record<string, boolean>>): boolean {
  const questions = activeRuleset.safety?.screening.questions ?? [];
  return !questions.some((q) => q.blocking && answers[q.id] === true);
}

/** Si pasó el plazo de renovación desde que aceptó el aviso. */
export function isDisclaimerStale(acceptedAt: string, renewMonths: number): boolean {
  const accepted = Date.parse(acceptedAt);
  if (Number.isNaN(accepted)) return true;

  const renewAt = new Date(accepted);
  renewAt.setMonth(renewAt.getMonth() + renewMonths);
  return Date.now() >= renewAt.getTime();
}
