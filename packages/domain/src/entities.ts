import type {
  BaselineSource,
  BodyRegion,
  EquipmentCategory,
  ExperienceLevel,
  Goal,
  LoadUnit,
  Modality,
  MovementPattern,
  MuscleGroup,
  ProposalStatus,
  ProposalType,
  SessionStatus,
  Sex,
} from './enums.ts';
import type { EquipmentLoadSpec, LoadReading } from './load.ts';

/**
 * Entidades del dominio en forma de TypeScript (camelCase).
 * La base usa snake_case; la traducción vive en `apps/web/src/lib/mappers/`.
 *
 * Los tipos generados desde la base real están en `database.types.ts`
 * (`npm run db:types`). Estos son los que consume el motor.
 */

export type Id = string;

// ---------------------------------------------------------------- catálogo

export interface Equipment {
  readonly id: Id;
  readonly gymId: Id;
  readonly name: string;
  readonly category: EquipmentCategory;
  readonly brand: string | null;
  readonly model: string | null;
  readonly photoUrl: string | null;
  /** Dónde está en el gimnasio, en castellano: "fondo a la derecha, al lado de las poleas". */
  readonly locationNote: string | null;
  /** Ajustes de la estación: "asiento 5 posiciones, respaldo regulable". */
  readonly setupNotes: string | null;
  readonly load: EquipmentLoadSpec;
  /** Cuántas unidades idénticas hay. Define si dos personas pueden usarla a la vez. */
  readonly quantity: number;
  readonly isActive: boolean;
}

export interface Exercise {
  readonly id: Id;
  /** `null` = ejercicio global, reutilizable en cualquier gimnasio. */
  readonly gymId: Id | null;
  readonly name: string;
  readonly pattern: MovementPattern;
  readonly primaryMuscles: readonly MuscleGroup[];
  readonly secondaryMuscles: readonly MuscleGroup[];
  readonly modality: Modality;
  readonly isCompound: boolean;
  readonly isUnilateral: boolean;
  readonly skillLevel: ExperienceLevel;
  /** Indicaciones de ejecución, en castellano. */
  readonly cues: string | null;
  /** Estaciones donde se puede hacer. Un ejercicio no es una máquina: ver regla dura. */
  readonly equipmentIds: readonly Id[];
}

export interface SubstitutionEdge {
  readonly exerciseId: Id;
  readonly substituteId: Id;
  /** 0..1. Cuán equivalente es el reemplazo en patrón, músculos y demanda. */
  readonly equivalence: number;
  readonly note: string | null;
}

// ---------------------------------------------------------------- usuario

export interface Profile {
  readonly id: Id;
  readonly gymId: Id;
  readonly displayName: string;
  /** ISO `YYYY-MM-DD`. La edad se calcula al momento de generar, no se guarda. */
  readonly birthDate: string | null;
  readonly sex: Sex;
  readonly experienceLevel: ExperienceLevel;
}

export interface UserGoal {
  readonly goal: Goal;
  /** Deporte que practica, si el objetivo es de transferencia. Texto libre por ahora. */
  readonly sport: string | null;
  readonly priority: number;
  readonly sessionsPerWeekTarget: number;
  readonly sessionMinutesTarget: number;
}

export interface UserConstraint {
  readonly type: 'injury' | 'pain' | 'avoid_exercise' | 'avoid_equipment';
  readonly bodyRegion: BodyRegion | null;
  readonly exerciseId: Id | null;
  readonly equipmentId: Id | null;
  /** 1 = molestia leve, 5 = no puede. */
  readonly severity: number;
}

/**
 * Peso y altura en un momento dado. Siempre en kg y cm, convertidos una sola
 * vez al escribirlos: a diferencia de la carga de una máquina (regla dura 6),
 * acá no hay ninguna placa contra la cual el socio vuelva a comparar.
 *
 * Las dos son opcionales por separado: alguien puede querer registrar el peso
 * y no la altura, y forzar los dos para guardar uno haría que no se registre
 * ninguno.
 */
export interface BodyMetric {
  readonly weightKg: number | null;
  readonly heightCm: number | null;
  readonly recordedAt: string;
}

/** Punto de partida por ejercicio: lo declaró el usuario o lo calibró la app. */
export interface UserBaseline {
  readonly exerciseId: Id;
  readonly source: BaselineSource;
  readonly load: LoadReading;
  readonly reps: number;
  readonly recordedAt: string;
}

// ---------------------------------------------------------------- plan

export interface Plan {
  readonly id: Id;
  readonly userId: Id;
  readonly gymId: Id;
  /** Con qué ruleset se generó. Sin esto no se puede reproducir ni comparar. */
  readonly rulesetVersion: string;
  readonly generatedAt: string;
  readonly status: 'active' | 'archived';
}

export interface PlanSession {
  readonly id: Id;
  readonly planId: Id;
  /** Posición en la cola. **No hay fecha**: "hoy" es la primera pendiente. */
  readonly sequenceIndex: number;
  readonly label: string;
  readonly focus: string;
  readonly estimatedMinutes: number;
  readonly status: SessionStatus;
}

export interface PlanSessionItem {
  readonly id: Id;
  readonly planSessionId: Id;
  /** Orden sugerido. El usuario puede hacerlos en cualquier orden. */
  readonly orderIndex: number;
  readonly exerciseId: Id;
  readonly equipmentId: Id | null;
  readonly targetSets: number;
  readonly targetRepsMin: number;
  readonly targetRepsMax: number;
  readonly targetLoad: LoadReading | null;
  readonly targetRir: number | null;
  readonly restSeconds: number;
  /** Por qué este ejercicio va acá. Se muestra en la lista de la sesión. */
  readonly rationale: string;
  /** `true` mientras el ruleset activo sea placeholder. */
  readonly isPlaceholder: boolean;
}

// ---------------------------------------------------------------- ejecución

export interface WorkoutLog {
  readonly id: Id;
  readonly userId: Id;
  readonly planSessionId: Id | null;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly preSleep: number | null;
  readonly preEnergy: number | null;
  readonly sessionFeel: 'easy' | 'right' | 'hard' | null;
  readonly notes: string | null;
  /** Clave de idempotencia generada en el teléfono. Ancla de la cola offline. */
  readonly clientId: string;
}

export interface SetLog {
  readonly id: Id;
  readonly workoutLogId: Id;
  readonly planSessionItemId: Id | null;
  readonly exerciseId: Id;
  readonly equipmentId: Id | null;
  readonly setIndex: number;
  /**
   * `null` cuando no hubo carga que anotar: dominadas, abdominales, o la
   * primera sesión de alguien que todavía no sabe con cuánto entrena. No es
   * lo mismo que carga cero.
   */
  readonly load: LoadReading | null;
  /** Comparable entre estaciones. `null` cuando no se puede convertir sin inventar. */
  readonly loadKg: number | null;
  readonly reps: number | null;
  readonly repsTarget: number | null;
  readonly rir: number | null;
  readonly durationSeconds: number | null;
  readonly distanceMeters: number | null;
  readonly restPrescribedSeconds: number | null;
  /** Lo que descansó de verdad. Si cortó antes, es dato, no error. */
  readonly restActualSeconds: number | null;
  readonly isWarmup: boolean;
  readonly completedAt: string;
  readonly clientId: string;
}

// ---------------------------------------------------------------- adaptación

export interface AdaptationProposal {
  readonly id: Id;
  readonly userId: Id;
  readonly planId: Id;
  readonly type: ProposalType;
  /** A qué apunta: `{ exerciseId }`, `{ planSessionItemId }`, `{ planId }`. */
  readonly targetRef: Readonly<Record<string, string>>;
  readonly fromValue: string | null;
  readonly toValue: string | null;
  /** Unidad de esos valores cuando son una carga; `null` si no lo son. */
  readonly loadUnit: LoadUnit | null;
  readonly reasonCode: string;
  /** El motivo en castellano, tal cual se le muestra al usuario. */
  readonly reasonText: string;
  readonly rulesetVersion: string;
  readonly status: ProposalStatus;
}

// ---------------------------------------------------------------- utilidades

/** Unidad de carga admitida por una estación, para tipar formularios de carga. */
export type EquipmentUnit = LoadUnit;
