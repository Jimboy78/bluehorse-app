import type { ExperienceLevel, Goal, Id, Sex } from '@bh/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth/AuthProvider.tsx';
import { requireSupabase } from './supabase.ts';

/**
 * TODO LO QUE LA APP SABE DE VOS, EN UN SOLO LUGAR
 *
 * Hasta acá el perfil estaba repartido: el rol lo leía el panel, el objetivo lo
 * leía el aviso de evidencia, el peso lo leía Progreso, y el cribado de salud
 * no lo leía nadie después de responderlo. Nada de eso se podía ver junto, así
 * que tampoco se podía comprobar: alguien que cargaba mal la fecha de
 * nacimiento en el onboarding no tenía forma de enterarse.
 *
 * Una consulta por tabla y no un `select` anidado gigante: son tablas chicas,
 * el perfil se abre poco, y así un error en una no deja la pantalla entera en
 * blanco.
 */

export interface ProfileDetail {
  readonly displayName: string;
  readonly email: string | null;
  readonly role: 'member' | 'staff' | 'admin';
  readonly birthDate: string | null;
  /** Años cumplidos, calculados al leer. La base guarda la fecha, no la edad. */
  readonly age: number | null;
  readonly sex: Sex;
  readonly experienceLevel: ExperienceLevel;
  readonly memberSince: string;
  readonly onboarded: boolean;
  readonly gym: { readonly name: string; readonly address: string | null } | null;
  readonly goal: ActiveGoalDetail | null;
}

export interface ActiveGoalDetail {
  readonly goal: Goal;
  readonly sport: string | null;
  readonly sessionsPerWeekTarget: number;
  readonly sessionMinutesTarget: number;
  readonly startedAt: string;
}

export function useProfileDetail() {
  const { user, status } = useAuth();

  return useQuery<ProfileDetail>({
    queryKey: ['profile-detail', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const userId = user?.id as string;

      const { data: profile, error } = await client
        .from('profiles')
        .select(
          'display_name, birth_date, sex, experience_level, role, created_at, onboarded_at, gyms(name, address)',
        )
        .eq('id', userId)
        .single();
      if (error) throw error;

      const { data: goalRow, error: goalError } = await client
        .from('user_goals')
        .select('goal, sport, sessions_per_week_target, session_minutes_target, started_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('priority')
        .limit(1)
        .maybeSingle();
      if (goalError) throw goalError;

      // `gyms` viene como objeto o como array de uno según cómo resuelva
      // PostgREST la relación; normalizar acá evita un `?.[0]` en la pantalla.
      const rawGym = profile.gyms as
        | { name: string; address: string | null }
        | { name: string; address: string | null }[]
        | null;
      const gym = Array.isArray(rawGym) ? (rawGym[0] ?? null) : rawGym;

      return {
        displayName: profile.display_name as string,
        email: user?.email ?? null,
        role: profile.role as ProfileDetail['role'],
        birthDate: profile.birth_date as string | null,
        age: yearsSince(profile.birth_date as string | null),
        sex: profile.sex as Sex,
        experienceLevel: profile.experience_level as ExperienceLevel,
        memberSince: profile.created_at as string,
        onboarded: profile.onboarded_at !== null,
        gym: gym ? { name: gym.name, address: gym.address } : null,
        goal: goalRow
          ? {
              goal: goalRow.goal as Goal,
              sport: goalRow.sport as string | null,
              sessionsPerWeekTarget: goalRow.sessions_per_week_target as number,
              sessionMinutesTarget: goalRow.session_minutes_target as number,
              startedAt: goalRow.started_at as string,
            }
          : null,
      };
    },
  });
}

/**
 * Años cumplidos. `null` si no cargó la fecha o si es ilegible.
 *
 * `birth_date` es un `date` de Postgres — un día de calendario, sin huso
 * horario — pero `new Date('1996-09-10')` lo parsea como medianoche UTC.
 * Leerlo después con `.getMonth()`/`.getDate()` (hora LOCAL) lo corre un día
 * para atrás en cualquier huso al oeste de UTC. Arroyo Seco es uno de esos
 * husos (UTC-3): con la fecha de nacimiento parseada así, alguien que nació
 * el 10 aparecía habiendo nacido el 9, y el día ANTES de su cumpleaños real
 * la cuenta ya lo daba un año más grande. Se detectó con un test que
 * cubría justo ese caso (el cumpleaños de mañana, no el de hoy).
 *
 * El arreglo: sacar el año/mes/día de la fecha de nacimiento directo del
 * texto, sin pasar nunca por `Date` — así no hay ningún huso horario que
 * pueda correr el número.
 */
export function yearsSince(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return null;
  const bornYear = Number(match[1]);
  const bornMonth = Number(match[2]);
  const bornDay = Number(match[3]);

  const now = new Date();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  let years = now.getFullYear() - bornYear;
  const beforeBirthday = nowMonth < bornMonth || (nowMonth === bornMonth && nowDay < bornDay);
  if (beforeBirthday) years -= 1;
  return years >= 0 && years < 130 ? years : null;
}

// ------------------------------------------------------------ restricciones

export interface ConstraintDetail {
  readonly id: Id;
  readonly type: 'injury' | 'pain' | 'avoid_exercise' | 'avoid_equipment';
  readonly bodyRegion: string | null;
  readonly severity: number;
  readonly note: string | null;
  readonly since: string;
  /** Nombre del ejercicio o de la estación, cuando la restricción apunta a uno. */
  readonly targetName: string | null;
}

/**
 * Lo que el motor tiene que esquivar: molestias vigentes y ejercicios
 * descartados a mano.
 *
 * Verlos importa más de lo que parece. "No me lo propongas más" se toca en la
 * vista previa del plan, en un segundo, y hasta acá no había ninguna pantalla
 * donde apareciera de nuevo: un ejercicio descartado por error quedaba fuera
 * para siempre sin que nadie pudiera saber por qué.
 */
export function useConstraints() {
  const { user, status } = useAuth();

  return useQuery<readonly ConstraintDetail[]>({
    queryKey: ['constraints', user?.id],
    enabled: status === 'signed-in' && !!user,
    queryFn: async () => {
      const client = requireSupabase();
      const { data, error } = await client
        .from('user_constraints')
        .select(
          'id, type, body_region, severity, note, active_from, exercises(name), equipment(name)',
        )
        .eq('user_id', user?.id as string)
        .is('active_to', null)
        .order('active_from', { ascending: false });
      if (error) throw error;

      return ((data ?? []) as unknown[]).map((raw) => {
        const row = raw as {
          id: string;
          type: ConstraintDetail['type'];
          body_region: string | null;
          severity: number;
          note: string | null;
          active_from: string;
          exercises: { name: string } | null;
          equipment: { name: string } | null;
        };
        return {
          id: row.id,
          type: row.type,
          bodyRegion: row.body_region,
          severity: row.severity,
          note: row.note,
          since: row.active_from,
          targetName: row.exercises?.name ?? row.equipment?.name ?? null,
        };
      });
    },
  });
}

/**
 * Dar de baja una restricción.
 *
 * Se cierra con `active_to`, no se borra: la fila es el registro de que en su
 * momento hubo una molestia ahí, y esa historia es justamente lo que hace falta
 * si la molestia vuelve. El motor solo mira las que tienen `active_to` nulo.
 */
export function useClearConstraint() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Id>({
    mutationFn: async (constraintId) => {
      if (!user) throw new Error('No hay sesión activa.');
      const client = requireSupabase();
      const { error } = await client
        .from('user_constraints')
        .update({ active_to: new Date().toISOString() })
        .eq('id', constraintId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['constraints', user?.id] });
    },
  });
}
