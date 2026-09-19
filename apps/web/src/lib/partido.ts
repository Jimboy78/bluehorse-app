import type { MatchDayState, SeasonPhase } from '@bh/domain';
import { SEASON_PHASES } from '@bh/domain';
import type { GymSnapshot, SessionItemBlueprint } from '@bh/engine';
import { estadoDelDia, excepcionesParaEstado } from '@bh/engine';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from './auth/AuthProvider.tsx';
import { useGymCatalog } from './catalog.ts';
import { conPlazo } from './con-plazo.ts';
import { activeRuleset, engine } from './engine.ts';
import { useProfileStatus } from './onboarding.ts';
import type { ActiveSessionItem } from './plan.ts';
import { hoyEnElGimnasio } from './rest-days.ts';
import { requireSupabase } from './supabase.ts';

/**
 * El deporte con partidos y el día de partido (`docs/research/65`).
 *
 * La temporada se le pregunta a quien declara un deporte; el día de partido,
 * solo en temporada y con un deporte cuya categoría tiene partidos
 * (`sports.categories[].hasMatches`). Lo demás no ve la pregunta (`07`).
 */

/** Si el deporte es de los que tienen partido (`hasMatches` de su categoría). */
export function tienePartidos(sport: string | null | undefined): boolean {
  const sports = activeRuleset.sports;
  const entrada = sports?.catalog.find((s) => s.id === sport);
  return entrada !== undefined && sports?.categories[entrada.category]?.hasMatches === true;
}

/** Si corresponde preguntar (y usar) el día de partido. */
export function pideDiaDePartido(
  sport: string | null | undefined,
  seasonPhase: SeasonPhase | null | undefined,
): boolean {
  return seasonPhase === 'in_season' && tienePartidos(sport);
}

/** Las etapas en el orden del enum, con el nombre que les da el ruleset. */
export const ETAPAS: readonly { readonly id: SeasonPhase; readonly label: string }[] =
  SEASON_PHASES.map((id) => ({
    id,
    label: activeRuleset.sports?.seasonPhases[id]?.label ?? id,
  }));

/** 1 lunes … 7 domingo, como `user_goals.match_weekday`. */
export const DIAS_DE_PARTIDO: readonly { readonly id: number; readonly label: string }[] = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 7, label: 'Domingo' },
];

/**
 * Lo que se guarda de la temporada y el día, limpio: sin deporte no hay
 * temporada, y sin temporada con partidos no hay día.
 */
export function temporadaYDia(input: {
  readonly sport: string | null;
  readonly seasonPhase: SeasonPhase | null | undefined;
  readonly matchWeekday: number | null | undefined;
}): { readonly seasonPhase: SeasonPhase; readonly matchWeekday: number | null } {
  const seasonPhase = input.sport ? (input.seasonPhase ?? 'none') : 'none';
  const matchWeekday = pideDiaDePartido(input.sport, seasonPhase)
    ? (input.matchWeekday ?? null)
    : null;
  return { seasonPhase, matchWeekday };
}

// ------------------------------------------------------------ el día de hoy

/** Lo que Hoy necesita saber del partido: si aplica y en qué estado está el día. */
interface PartidoDeHoy {
  readonly aplica: boolean;
  readonly estado: MatchDayState;
  readonly matchWeekday: number | null;
}

const NO_APLICA: PartidoDeHoy = { aplica: false, estado: 'normal', matchWeekday: null };

const goalRowSchema = z.object({
  sport: z.string().nullable(),
  season_phase: z.enum(SEASON_PHASES),
  match_weekday: z.number().int().min(1).max(7).nullable(),
});
const excepcionSchema = z.object({ day: z.string(), plays: z.boolean() });

/** Los días que miran los estados, alrededor de hoy (`daysFromMatch` del ruleset). */
function ventana(hoy: string): { readonly desde: string; readonly hasta: string } {
  const dias = excepcionesParaEstado({
    ruleset: activeRuleset,
    hoy,
    matchWeekday: null,
    estado: 'normal',
  })
    .map((e) => e.day)
    .sort();
  return { desde: dias[0] ?? hoy, hasta: dias[dias.length - 1] ?? hoy };
}

/**
 * El estado del partido de hoy (`docs/research/65`), deducido del día fijo y
 * de lo que se declaró esta semana. No aplica sin deporte de partidos o fuera
 * de temporada: ahí es siempre el día normal.
 */
function usePartidoDeHoy() {
  const { user, status } = useAuth();
  const hoy = hoyEnElGimnasio();

  return useQuery<PartidoDeHoy>({
    queryKey: ['partido-de-hoy', user?.id, hoy],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const { data: goal, error } = await conPlazo(
        client
          .from('user_goals')
          .select('sport, season_phase, match_weekday')
          .eq('user_id', user?.id as string)
          .eq('is_active', true)
          .order('priority')
          .limit(1)
          .maybeSingle(),
      );
      if (error) throw error;
      if (!goal) return NO_APLICA;
      const g = goalRowSchema.parse(goal);
      if (!pideDiaDePartido(g.sport, g.season_phase)) return NO_APLICA;

      const { desde, hasta } = ventana(hoy);
      const { data: filas, error: excError } = await conPlazo(
        client
          .from('match_exceptions')
          .select('day, plays')
          .eq('user_id', user?.id as string)
          .gte('day', desde)
          .lte('day', hasta),
      );
      if (excError) throw excError;
      const excepciones = (filas ?? []).map((f) => excepcionSchema.parse(f));
      return {
        aplica: true,
        estado: estadoDelDia({
          ruleset: activeRuleset,
          hoy,
          partidos: { matchWeekday: g.match_weekday, excepciones },
        }),
        matchWeekday: g.match_weekday,
      };
    },
  });
}

/**
 * "¿Cambió el partido?": deja declarado lo necesario para que hoy sea el estado
 * elegido. Borra las excepciones que el día fijo ya cubre y escribe las demás.
 */
function useCambiarPartido() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      readonly estado: MatchDayState;
      readonly matchWeekday: number | null;
    }) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();
      const cambios = excepcionesParaEstado({
        ruleset: activeRuleset,
        hoy: hoyEnElGimnasio(),
        matchWeekday: input.matchWeekday,
        estado: input.estado,
      });

      const borrar = cambios.filter((c) => c.plays === null).map((c) => c.day);
      if (borrar.length > 0) {
        const { error } = await client
          .from('match_exceptions')
          .delete()
          .eq('user_id', user.id)
          .in('day', borrar);
        if (error) throw error;
      }

      const poner = cambios.flatMap((c) =>
        c.plays === null ? [] : [{ day: c.day, plays: c.plays }],
      );
      if (poner.length === 0) return;
      const { data: perfil, error: readError } = await client
        .from('profiles')
        .select('gym_id')
        .eq('id', user.id)
        .single();
      if (readError) throw readError;
      const { error } = await client.from('match_exceptions').upsert(
        poner.map((x) => ({ user_id: user.id, gym_id: perfil.gym_id, day: x.day, plays: x.plays })),
        { onConflict: 'user_id,day' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partido-de-hoy', user?.id] });
    },
  });
}

/**
 * La sesión de hoy con el ajuste del partido (`adjustSession`). El motor
 * trabaja sobre su forma de ítem; se le pasa la posición como `orderIndex` y
 * con eso se vuelve al ítem de la pantalla. Del motor solo pueden cambiar las
 * series, la pausa y el par: lo demás es el ítem tal cual.
 */
export function ajustarAlPartido(
  items: readonly ActiveSessionItem[],
  gym: GymSnapshot,
  estado: MatchDayState,
): { readonly items: readonly ActiveSessionItem[]; readonly nota: string | null } {
  if (estado === 'normal') return { items, nota: null };
  const plano: SessionItemBlueprint[] = items.map((it, i) => ({
    exerciseId: it.exerciseId,
    equipmentId: it.equipmentId,
    orderIndex: i,
    targetSets: it.sets,
    targetRepsMin: it.repsTarget,
    targetRepsMax: it.repsTarget,
    targetLoad: it.targetLoad,
    targetRir: it.targetRir,
    restSeconds: it.restSeconds,
    rationale: it.rationale ?? '',
    isPlaceholder: it.isPlaceholder,
    targetDurationSeconds: it.durationSeconds,
    targetIntensityZone: it.intensityZone,
    targetIntervalRestSeconds: it.intervalRestSeconds,
    supersetGroup: it.supersetGroup,
  }));
  const salida = engine.adjustSession({ items: plano, gym, state: estado, ruleset: activeRuleset });
  const ajustados = salida.items.flatMap((b) => {
    const original = items[b.orderIndex];
    if (!original) return [];
    return [
      {
        ...original,
        sets: b.targetSets,
        restSeconds: b.restSeconds,
        supersetGroup: b.supersetGroup,
      },
    ];
  });
  return { items: ajustados, nota: salida.note };
}

/**
 * Todo lo del partido que usa Hoy, junto: el estado del día (`null` si no
 * aplica), cómo cambiarlo y la sesión ajustada. Mientras el estado o el
 * catálogo no llegan, la sesión va como está.
 */
export function useAjusteDelPartido() {
  const profile = useProfileStatus();
  const partido = usePartidoDeHoy();
  const cambiar = useCambiarPartido();
  const catalog = useGymCatalog(profile.data?.gymId ?? null);
  const estado = partido.data?.aplica ? partido.data.estado : null;
  const gym = catalog.data?.gym;

  return {
    estado,
    cambiando: cambiar.isPending,
    errorAlCambiar: cambiar.isError,
    cambiar: (nuevo: MatchDayState) =>
      cambiar.mutate({ estado: nuevo, matchWeekday: partido.data?.matchWeekday ?? null }),
    aplicar: (items: readonly ActiveSessionItem[]) =>
      estado && gym ? ajustarAlPartido(items, gym, estado) : { items, nota: null },
  };
}

/** Las opciones de "¿Cambió el partido?", con el nombre que les da el ruleset. */
export const ESTADOS_DEL_PARTIDO: readonly {
  readonly id: MatchDayState;
  readonly label: string;
}[] = (['match_day', 'day_before', 'day_after', 'two_days_after', 'normal'] as const).map((id) => ({
  id,
  label: activeRuleset.sports?.matchDay?.[id]?.label ?? id,
}));
