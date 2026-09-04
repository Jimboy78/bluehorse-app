import type {
  AdaptationProposal,
  Equipment,
  Exercise,
  Id,
  LoadReading,
  Plan,
  PlanSessionItem,
  Profile,
  ProposalType,
  RulesetSource,
  SetLog,
  SubstitutionEdge,
  UserBaseline,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import type { Ruleset } from './ruleset.ts';

/**
 * CONTRATO DEL MOTOR DE PRESCRIPCIÓN
 *
 * Regla dura 1 (CLAUDE.md): esto es una función pura. No toca la base, no hace
 * fetch, no lee la hora del sistema ni variables de entorno. Todo lo que
 * necesita entra por parámetro, incluida la hora y la semilla del azar.
 *
 * Regla dura 2: ningún número de entrenamiento sale de acá. Todos salen del
 * `Ruleset`, que hoy es placeholder y mañana será el resultado del research.
 *
 * Cambiar el contenido = escribir un ruleset nuevo y activarlo.
 * Cambiar la arquitectura = tocar este archivo. Debería pasar casi nunca.
 */

// ------------------------------------------------------------------ contexto

export interface EngineContext {
  /** Hora inyectada, ISO 8601. El motor nunca llama a `Date.now()`. */
  readonly now: string;
  /** Semilla de los desempates. Misma semilla + mismo input = mismo plan. */
  readonly seed: number;
}

/** Lo que hay en el gimnasio hoy. */
export interface GymSnapshot {
  readonly gymId: Id;
  readonly equipment: readonly Equipment[];
  readonly exercises: readonly Exercise[];
  readonly substitutions: readonly SubstitutionEdge[];
}

/** Quién es la persona y de dónde parte. */
export interface UserSnapshot {
  readonly profile: Profile;
  readonly goals: readonly UserGoal[];
  readonly constraints: readonly UserConstraint[];
  readonly baselines: readonly UserBaseline[];
}

// ------------------------------------------------------------------ salidas

export interface SessionItemBlueprint {
  readonly exerciseId: Id;
  readonly equipmentId: Id | null;
  readonly orderIndex: number;
  readonly targetSets: number;
  readonly targetRepsMin: number;
  readonly targetRepsMax: number;
  /** `null` cuando el usuario todavía no tiene punto de partida: entra en calibración. */
  readonly targetLoad: LoadReading | null;
  readonly targetRir: number | null;
  readonly restSeconds: number;
  /** Por qué este ejercicio y por qué acá. Se muestra en la lista de la sesión. */
  readonly rationale: string;
  readonly isPlaceholder: boolean;
}

export interface SessionBlueprint {
  readonly sequenceIndex: number;
  readonly label: string;
  readonly focus: string;
  readonly estimatedMinutes: number;
  readonly items: readonly SessionItemBlueprint[];
}

export interface PlanBlueprint {
  readonly rulesetVersion: string;
  readonly source: RulesetSource;
  readonly templateId: string;
  readonly sessions: readonly SessionBlueprint[];
  /** Avisos para el usuario o para vos: patrones sin cubrir, ejercicios sin equipamiento. */
  readonly warnings: readonly string[];
}

export interface ProposalBlueprint {
  readonly type: ProposalType;
  readonly targetRef: Readonly<Record<string, string>>;
  readonly fromValue: string | null;
  readonly toValue: string | null;
  /** Código estable para métricas: `rir_above_target`, `stalled`, `absence`. */
  readonly reasonCode: string;
  /** El motivo en castellano, tal cual se le muestra. */
  readonly reasonText: string;
  readonly rulesetVersion: string;
  readonly isPlaceholder: boolean;
}

export interface SubstituteOption {
  readonly exerciseId: Id;
  readonly equipmentId: Id | null;
  /** 0..1. Cuánto se parece al ejercicio original. */
  readonly equivalence: number;
  readonly reason: string;
}

// ------------------------------------------------------------------ entradas

export interface GeneratePlanInput {
  readonly context: EngineContext;
  readonly user: UserSnapshot;
  readonly gym: GymSnapshot;
  readonly ruleset: Ruleset;
}

export interface ReviewProgressInput {
  readonly context: EngineContext;
  readonly user: UserSnapshot;
  readonly gym: GymSnapshot;
  readonly plan: Plan;
  /** Series registradas, más recientes primero. El motor no decide cuántas mirar: se le pasan. */
  readonly history: readonly SetLog[];
  /** Propuestas ya resueltas, para no volver a proponer lo mismo. */
  readonly resolvedProposals: readonly AdaptationProposal[];
  readonly ruleset: Ruleset;
}

export interface FindSubstitutesInput {
  readonly context: EngineContext;
  readonly item: Pick<PlanSessionItem, 'exerciseId' | 'equipmentId'>;
  readonly gym: GymSnapshot;
  readonly constraints: readonly UserConstraint[];
  /** Estaciones ocupadas o fuera de servicio en este momento. */
  readonly unavailableEquipmentIds: readonly Id[];
  readonly ruleset: Ruleset;
}

// ------------------------------------------------------------------ el motor

export interface PrescriptionEngine {
  /** Identifica la implementación en logs y en la UI: `placeholder-v0`, `research-v1`. */
  readonly id: string;

  /** Arma la cola de sesiones. Sin fechas: `sequenceIndex` ordena. */
  generatePlan(input: GeneratePlanInput): PlanBlueprint;

  /** Mira lo que pasó y propone cambios. No los aplica: el usuario confirma. */
  reviewProgress(input: ReviewProgressInput): readonly ProposalBlueprint[];

  /** Máquina ocupada: qué otra cosa hacer ahora mismo con lo que está libre. */
  findSubstitutes(input: FindSubstitutesInput): readonly SubstituteOption[];
}
