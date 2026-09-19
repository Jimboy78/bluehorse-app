import type {
  BodyRegion,
  ExperienceLevel,
  Goal,
  Id,
  MovementLimit,
  Sex,
  UserConstraint,
} from '@bh/domain';
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
        displayName: profile.display_name,
        email: user?.email ?? null,
        role: profile.role as ProfileDetail['role'],
        birthDate: profile.birth_date,
        age: yearsSince(profile.birth_date),
        sex: profile.sex as Sex,
        experienceLevel: profile.experience_level as ExperienceLevel,
        memberSince: profile.created_at,
        onboarded: profile.onboarded_at !== null,
        gym: gym ? { name: gym.name, address: gym.address } : null,
        goal: goalRow
          ? {
              goal: goalRow.goal as Goal,
              sport: goalRow.sport,
              sessionsPerWeekTarget: goalRow.sessions_per_week_target,
              sessionMinutesTarget: goalRow.session_minutes_target,
              startedAt: goalRow.started_at,
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
  readonly type: UserConstraint['type'];
  readonly bodyRegion: string | null;
  readonly severity: number;
  readonly note: string | null;
  readonly since: string;
  /** Nombre del ejercicio o de la estación, cuando la restricción apunta a uno. */
  readonly targetName: string | null;
  /**
   * Lo mismo pero por id, que es lo que el motor necesita. Va acá y no en una
   * consulta aparte para no pedir dos veces las mismas filas.
   */
  readonly exerciseId: Id | null;
  readonly equipmentId: Id | null;
  /** Solo en una operación: el mes en que fue y si ya terminó la rehabilitación. */
  readonly occurredOn: string | null;
  readonly rehabDone: boolean | null;
  /** Solo en `avoid_movement`: el movimiento que no puede (`docs/research/58`). */
  readonly movement: MovementLimit | null;
}

/**
 * Las restricciones en la forma que espera el motor.
 *
 * `generatePlan` ya las recibe (`plan.ts` las arma junto al resto del snapshot),
 * pero `findSubstitutes` se llamaba con `constraints: []` en las tres pantallas
 * que lo usan, así que el filtro por dolor que el motor tiene nunca corría.
 * Medido contra el catálogo real: a un socio con la rodilla lesionada, **20 de
 * los 58 ejercicios** le ofrecían un reemplazo que su lesión prohíbe, incluido el
 * salto al cajón. En "Hoy" no pasaba, porque ahí el original ya salió de un plan
 * filtrado y el reemplazo comparte patrón con él; en "Explorar" se arranca de
 * cualquier ejercicio del catálogo y ese blindaje no existe.
 */
export function paraElMotor(
  detalles: readonly ConstraintDetail[] | undefined,
): readonly UserConstraint[] {
  return (detalles ?? []).map((c) => ({
    type: c.type,
    bodyRegion: c.bodyRegion as UserConstraint['bodyRegion'],
    exerciseId: c.exerciseId,
    equipmentId: c.equipmentId,
    severity: c.severity,
    ...(c.occurredOn !== null ? { occurredOn: c.occurredOn } : {}),
    ...(c.rehabDone !== null ? { rehabDone: c.rehabDone } : {}),
    ...(c.movement !== null ? { movement: c.movement } : {}),
  }));
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
          'id, type, body_region, severity, note, active_from, exercise_id, equipment_id, occurred_on, rehab_done, movement, exercises(name), equipment(name)',
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
          exercise_id: string | null;
          equipment_id: string | null;
          occurred_on: string | null;
          rehab_done: boolean | null;
          movement: MovementLimit | null;
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
          exerciseId: row.exercise_id,
          equipmentId: row.equipment_id,
          occurredOn: row.occurred_on,
          rehabDone: row.rehab_done,
          movement: row.movement,
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

/** Una lesión, un dolor, un tendón, una operación o un esguince que el socio declara fuera de la sesión. */
export interface MolestiaDeclarada {
  readonly region: BodyRegion;
  readonly type: 'pain' | 'injury' | 'tendinopathy' | 'surgery' | 'sprain';
  readonly severity: number;
  /** Solo en una operación o un esguince: el mes (`YYYY-MM`). */
  readonly month?: string;
  /** Solo en una operación: si ya terminó la rehabilitación. */
  readonly rehabDone?: boolean;
}

/** Los tipos que llevan el mes en que pasaron (el `check` de `occurred_on`). */
export function conMes(type: MolestiaDeclarada['type']): boolean {
  return type === 'surgery' || type === 'sprain';
}

/**
 * Anotar lo que el socio declara en la puerta de lesiones (registro o Perfil).
 *
 * Hasta acá la app solo creaba restricciones desde el reporte de dolor de la
 * sesión, siempre como `pain`: nadie podía declarar una lesión reciente ni un
 * tendón, y toda la lógica del motor para esos casos solo la alcanzaba quien
 * cargara filas a mano (`docs/research/55`).
 */
export function useDeclareConstraints() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, readonly MolestiaDeclarada[]>({
    mutationFn: async (molestias) => {
      if (!user) throw new Error('No hay sesión activa.');
      if (molestias.length === 0) return;
      const client = requireSupabase();
      const { error } = await client.from('user_constraints').insert(
        molestias.map((m) => ({
          user_id: user.id,
          type: m.type,
          body_region: m.region,
          severity: m.severity,
          occurred_on: conMes(m.type) && m.month ? `${m.month}-01` : null,
          rehab_done: m.type === 'surgery' ? (m.rehabDone ?? false) : null,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['constraints', user?.id] });
    },
  });
}

/**
 * Anotar los movimientos que el socio no puede hacer (`docs/research/58`), desde
 * /salud o el perfil. La severidad es la de "no puede" de la escala; el motor no
 * la lee para esto, pero una fila que dice "no puede" no dice "molestia leve".
 * Un movimiento ya anotado no se vuelve a mandar: la base lo rechazaría (índice
 * único sobre los vigentes). Se mira acá y no solo en la pantalla porque /salud
 * vuelve a pasar por esta pregunta cuando se renueva el aviso legal.
 */
export function useDeclareMovements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, readonly MovementLimit[]>({
    mutationFn: async (movimientos) => {
      if (!user) throw new Error('No hay sesión activa.');
      if (movimientos.length === 0) return;
      const client = requireSupabase();
      const vigentes = await client
        .from('user_constraints')
        .select('movement')
        .eq('user_id', user.id)
        .eq('type', 'avoid_movement')
        .is('active_to', null);
      if (vigentes.error) throw vigentes.error;
      const nuevos = movimientosNuevos(
        movimientos,
        (vigentes.data ?? []).map((r) => r.movement),
      );
      if (nuevos.length === 0) return;
      const { error } = await client.from('user_constraints').insert(
        nuevos.map((movement) => ({
          user_id: user.id,
          type: 'avoid_movement' as const,
          movement,
          severity: SEVERIDAD_NO_PUEDE,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['constraints', user?.id] });
    },
  });
}

/** Los pedidos que no están ya vigentes, sin repetir. */
export function movimientosNuevos(
  pedidos: readonly MovementLimit[],
  vigentes: readonly (MovementLimit | null)[],
): MovementLimit[] {
  return [...new Set(pedidos)].filter((m) => !vigentes.includes(m));
}

/** El tope de `severity` en la base: "5 = no puede" (`UserConstraint.severity`). */
const SEVERIDAD_NO_PUEDE = 5;

/**
 * Marcar que terminó la rehabilitación de una operación. Desde ahí la zona deja
 * de contar como lesión para el plan (`docs/research/56`).
 */
export function useFinishRehab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, Id>({
    mutationFn: async (constraintId) => {
      if (!user) throw new Error('No hay sesión activa.');
      const { error } = await requireSupabase()
        .from('user_constraints')
        .update({ rehab_done: true })
        .eq('id', constraintId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['constraints', user?.id] });
    },
  });
}

/** Lo que el socio puede cambiar de su propio perfil. */
export interface ProfileEdit {
  readonly displayName: string;
  readonly birthDate: string | null;
  readonly sex: Sex;
  readonly experienceLevel: ExperienceLevel;
}

/**
 * Editar el propio perfil.
 *
 * **No incluye `role` ni `gym_id` a propósito**, y no alcanza con no mandarlos
 * desde acá: la política de RLS comprueba quién edita, no qué columnas toca, así
 * que el que frena de verdad la promoción a admin es el trigger
 * `profiles_guard_privileges` (ver `supabase/schemas/02_gyms.sql`). Esta
 * interfaz es la segunda barrera, no la primera.
 *
 * `experienceLevel` cambia lo que el motor prescribe, así que se invalida
 * también el plan: dejar el plan viejo en pantalla después de cambiar el nivel
 * mostraría números que ya no son los que el motor daría.
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, ProfileEdit>({
    mutationFn: async (edit) => {
      if (!user) throw new Error('No hay sesión activa.');
      const nombre = edit.displayName.trim();
      if (!nombre) throw new Error('El nombre no puede quedar vacío.');

      const client = requireSupabase();
      const { error } = await client
        .from('profiles')
        .update({
          display_name: nombre,
          birth_date: edit.birthDate,
          sex: edit.sex,
          experience_level: edit.experienceLevel,
        })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile-detail', user?.id] });
      // La edad y el nivel entran al motor. Ver `docs/research/08-edad.md` y
      // `docs/research/10-nivel-de-experiencia.md`.
      void queryClient.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}
