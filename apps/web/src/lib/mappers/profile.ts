import type { ExperienceLevel, Goal, SeasonPhase, SecondaryGoal, Sex, UserGoal } from '@bh/domain';
import type { OnboardingInput } from '../../routes/onboarding/schemas.ts';
import { limpiarSecundarios } from '../objetivos.ts';
import { temporadaYDia } from '../partido.ts';

/**
 * Traducción entre el `camelCase` del dominio/formularios y el `snake_case`
 * de las tablas de Supabase. Vive acá y en ningún otro lado (CLAUDE.md).
 *
 * Son funciones puras: no importan el cliente de Supabase, así que se testean
 * sin red ni base de datos.
 */

/** Lo que se actualiza en `profiles` al terminar el onboarding. */
export interface ProfileUpdateRow {
  readonly birth_date: string;
  readonly sex: Sex;
  readonly experience_level: ExperienceLevel;
  readonly onboarded_at: string;
}

/** Lo que se inserta en `body_metrics`: la primera medición del socio. */
export interface BodyMetricInsertRow {
  readonly user_id: string;
  readonly gym_id: string;
  readonly weight_kg: number;
  readonly height_cm: number;
}

/** Lo que se inserta en `user_goals`, el primero del socio. */
export interface UserGoalInsertRow {
  readonly user_id: string;
  readonly goal: Goal;
  readonly sport: string | null;
  readonly season_phase: SeasonPhase;
  readonly match_weekday: number | null;
  readonly priority: number;
  readonly secondary_goals: SecondaryGoal[];
  readonly sessions_per_week_target: number;
  readonly session_minutes_target: number;
}

export function toProfileUpdate(input: OnboardingInput, now = new Date()): ProfileUpdateRow {
  return {
    birth_date: input.birthDate,
    sex: input.sex,
    experience_level: input.experienceLevel,
    onboarded_at: now.toISOString(),
  };
}

export function toBodyMetricInsert(
  userId: string,
  gymId: string,
  input: OnboardingInput,
): BodyMetricInsertRow {
  return {
    user_id: userId,
    gym_id: gymId,
    weight_kg: input.weightKg,
    height_cm: input.heightCm,
  };
}

export function toUserGoalInsert(userId: string, input: OnboardingInput): UserGoalInsertRow {
  const sport = input.sport?.trim() || null;
  const { seasonPhase, matchWeekday } = temporadaYDia({
    sport,
    seasonPhase: input.seasonPhase,
    matchWeekday: input.matchWeekday,
  });
  return {
    user_id: userId,
    goal: input.goal,
    sport,
    season_phase: seasonPhase,
    match_weekday: matchWeekday,
    priority: 1,
    secondary_goals: limpiarSecundarios(input.secondaryGoals),
    sessions_per_week_target: input.sessionsPerWeekTarget,
    session_minutes_target: input.sessionMinutesTarget,
  };
}

/** La fila de `user_goals` que lee el motor. */
interface UserGoalRow {
  readonly goal: Goal;
  readonly sport: string | null;
  readonly season_phase: SeasonPhase;
  readonly priority: number;
  readonly secondary_goals: SecondaryGoal[];
  readonly sessions_per_week_target: number;
  readonly session_minutes_target: number;
}

/**
 * De la fila al objetivo del motor. Todo lo que el socio contesta tiene que
 * llegar acá: un campo que se guarda y no se copia es una pregunta que no
 * cambia nada (pasó con `sessionMinutesTarget`).
 */
export function toDomainGoal(row: UserGoalRow): UserGoal {
  return {
    goal: row.goal,
    sport: row.sport,
    seasonPhase: row.season_phase,
    priority: row.priority,
    secondaryGoals: row.secondary_goals,
    sessionsPerWeekTarget: row.sessions_per_week_target,
    sessionMinutesTarget: row.session_minutes_target,
  };
}
