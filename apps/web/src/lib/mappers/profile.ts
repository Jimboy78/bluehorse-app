import type { ExperienceLevel, Goal, Sex } from '@bh/domain';
import type { OnboardingInput } from '../../routes/onboarding/schemas.ts';

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

/** Lo que se inserta en `user_goals`, el primero del socio. */
export interface UserGoalInsertRow {
  readonly user_id: string;
  readonly goal: Goal;
  readonly sport: string | null;
  readonly priority: number;
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

export function toUserGoalInsert(userId: string, input: OnboardingInput): UserGoalInsertRow {
  return {
    user_id: userId,
    goal: input.goal,
    sport: input.sport?.trim() || null,
    priority: 1,
    sessions_per_week_target: input.sessionsPerWeekTarget,
    session_minutes_target: input.sessionMinutesTarget,
  };
}
