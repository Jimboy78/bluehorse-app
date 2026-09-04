import type {
  Equipment,
  Exercise,
  Id,
  LoadReading,
  MovementPattern,
  MuscleGroup,
  SetLog,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import { nextLoad, snapToEquipment } from '@bh/domain';
import type {
  FindSubstitutesInput,
  GeneratePlanInput,
  GymSnapshot,
  PlanBlueprint,
  PrescriptionEngine,
  ProposalBlueprint,
  ReviewProgressInput,
  SessionBlueprint,
  SessionItemBlueprint,
  SubstituteOption,
} from './contract.ts';
import { createRng, pickDeterministic } from './rng.ts';
import type { GoalParams, Ruleset, SlotRole } from './ruleset.ts';
import { isPlaceholder, resolveParams } from './ruleset.ts';

/**
 * MOTOR PLACEHOLDER — la mecánica es real, el contenido no.
 *
 * Arma planes, propone progresiones y busca reemplazos usando el equipamiento
 * real de Blue Horse, pero todos los números salen de `rulesets/v0-placeholder.json`
 * y no son una prescripción válida. Cuando llegue el research se escribe un
 * ruleset nuevo y este archivo no se toca.
 *
 * Es puro: no lee la hora, no usa Math.random, no toca la red.
 */
export function createPlaceholderEngine(): PrescriptionEngine {
  return {
    id: 'placeholder-v0',
    generatePlan,
    reviewProgress,
    findSubstitutes,
  };
}

// ------------------------------------------------------------------ plan

function generatePlan(input: GeneratePlanInput): PlanBlueprint {
  const { context, user, gym, ruleset } = input;
  const rng = createRng(context.seed);
  const warnings: string[] = [];

  const goal = primaryGoal(user.goals);
  const params = resolveParams(ruleset, goal.goal, user.profile.experienceLevel);
  const template = pickTemplate(ruleset, goal, warnings);
  const placeholder = isPlaceholder(ruleset);

  const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));
  const usableExercises = gym.exercises.filter(
    (ex) => !isBlocked(ex, user.constraints) && hasUsableEquipment(ex, gym, []),
  );

  // Se elige una vez por sesión de la plantilla y se reutiliza en cada repetición
  // de la cola: si el ejercicio cambia cada vez, no hay progresión que medir.
  const resolvedTemplateSessions = template.sessions.map((tplSession) => {
    const used = new Set<Id>();
    const items: SessionItemBlueprint[] = [];

    for (const slot of tplSession.slots) {
      const exercise = chooseExercise(slot.pattern, usableExercises, used, rng);
      if (!exercise) {
        warnings.push(
          `No hay ningún ejercicio disponible para el patrón "${slot.pattern}" en ${tplSession.label}. Falta equipamiento en el catálogo o está todo bloqueado por restricciones.`,
        );
        continue;
      }
      used.add(exercise.id);

      const equipment = firstAvailableEquipment(exercise, equipmentById);
      const roleParams = params[slot.role];
      const baseline = user.baselines.find((b) => b.exerciseId === exercise.id);

      items.push({
        exerciseId: exercise.id,
        equipmentId: equipment?.id ?? null,
        orderIndex: items.length,
        targetSets: roleParams.sets,
        targetRepsMin: roleParams.repsMin,
        targetRepsMax: roleParams.repsMax,
        targetLoad: baselineToTarget(baseline?.load ?? null, equipment),
        targetRir: roleParams.rirTarget,
        restSeconds: roleParams.restSeconds,
        rationale: renderRationale(ruleset, slot.role, exercise.name),
        isPlaceholder: placeholder,
      });
    }

    return { tplSession, items };
  });

  const sessions: SessionBlueprint[] = [];
  for (let i = 0; i < ruleset.planning.sessionsAhead; i += 1) {
    const resolved = resolvedTemplateSessions[i % resolvedTemplateSessions.length];
    if (!resolved) break;
    sessions.push({
      sequenceIndex: i,
      label: resolved.tplSession.label,
      focus: resolved.tplSession.focus,
      estimatedMinutes: resolved.tplSession.estimatedMinutes,
      items: resolved.items,
    });
  }

  if (placeholder) {
    warnings.push(
      'Plan generado con contenido provisorio: los números no salen todavía de la investigación.',
    );
  }

  return {
    rulesetVersion: ruleset.version,
    source: ruleset.source,
    templateId: template.id,
    sessions,
    warnings,
  };
}

// ------------------------------------------------------------------ adaptación

/** Todo lo que necesita una regla de adaptación para decidir sobre un ejercicio. */
interface RuleContext {
  readonly exerciseId: Id;
  readonly exercise: Exercise;
  /** Serie tope de cada sesión, de la más reciente a la más vieja. */
  readonly sets: readonly SetLog[];
  readonly params: GoalParams;
  readonly equipmentById: ReadonlyMap<Id, Equipment>;
  readonly ruleset: Ruleset;
  readonly placeholder: boolean;
}

function reviewProgress(input: ReviewProgressInput): readonly ProposalBlueprint[] {
  const { context, user, gym, history, ruleset, resolvedProposals } = input;
  const goal = primaryGoal(user.goals);
  const params = resolveParams(ruleset, goal.goal, user.profile.experienceLevel);
  const placeholder = isPlaceholder(ruleset);
  const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));
  const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));

  const proposals: ProposalBlueprint[] = [];

  const absence = proposeAbsenceDeload(
    history,
    params,
    ruleset,
    placeholder,
    context.now,
    input.plan.id,
  );
  if (absence) proposals.push(absence);

  for (const [exerciseId, sets] of groupTopSetsByExercise(history)) {
    if (wasRecentlyRejected(resolvedProposals, exerciseId)) continue;
    const exercise = exerciseById.get(exerciseId);
    if (!exercise) continue;

    const ctx: RuleContext = {
      exerciseId,
      exercise,
      sets,
      params,
      equipmentById,
      ruleset,
      placeholder,
    };

    // Orden de prioridad: subir gana sobre bajar, y bajar sobre descargar.
    const proposal = proposeIncrease(ctx) ?? proposeDecrease(ctx) ?? proposeStallDeload(ctx);
    if (proposal) proposals.push(proposal);
  }

  return proposals;
}

/** Volvió después de mucho: se propone arrancar con menos volumen. */
function proposeAbsenceDeload(
  history: readonly SetLog[],
  params: GoalParams,
  ruleset: Ruleset,
  placeholder: boolean,
  now: string,
  planId: Id,
): ProposalBlueprint | null {
  const lastSet = history.find((s) => !s.isWarmup);
  if (!lastSet) return null;

  const daysOff = daysBetween(lastSet.completedAt, now);
  if (daysOff < params.deload.absenceDays) return null;

  return {
    type: 'deload',
    targetRef: { planId },
    fromValue: null,
    toValue: `${Math.round(params.deload.volumeMultiplier * 100)}%`,
    reasonCode: 'absence',
    reasonText: `Pasaron ${daysOff} días desde tu última sesión. Arrancamos con menos volumen esta semana para volver sin castigarte.`,
    rulesetVersion: ruleset.version,
    isPlaceholder: placeholder,
  };
}

/** ¿Le sobraron repeticiones las últimas N sesiones seguidas? */
function isReadyToIncrease(ctx: RuleContext): boolean {
  const { consecutiveSessions, triggerRirAtLeast } = ctx.params.progression;
  const recent = ctx.sets.slice(0, consecutiveSessions);
  return (
    recent.length === consecutiveSessions &&
    recent.every((s) => s.rir !== null && s.rir >= triggerRirAtLeast)
  );
}

function proposeIncrease(ctx: RuleContext): ProposalBlueprint | null {
  if (!isReadyToIncrease(ctx)) return null;

  const { progression } = ctx.params;
  const top = ctx.sets[0];
  const equipment = equipmentOf(top, ctx.equipmentById);
  if (!top || !equipment) return null;

  const proposed = nextLoad(top.load, equipment.load, progression.stepPct);
  if (proposed === null || proposed === top.load.value) return null;

  return {
    type: 'load_increase',
    targetRef: { exerciseId: ctx.exerciseId },
    fromValue: String(top.load.value),
    toValue: String(proposed),
    reasonCode: 'rir_above_target',
    reasonText: `En ${ctx.exercise.name} te sobraron repeticiones las últimas ${progression.consecutiveSessions} veces. ¿Subimos la carga?`,
    rulesetVersion: ctx.ruleset.version,
    isPlaceholder: ctx.placeholder,
  };
}

function proposeDecrease(ctx: RuleContext): ProposalBlueprint | null {
  const { regression } = ctx.params;
  const recent = ctx.sets.slice(0, regression.missedRepsSessions);
  const missed =
    recent.length === regression.missedRepsSessions &&
    recent.every((s) => s.reps !== null && s.repsTarget !== null && s.reps < s.repsTarget);
  if (!missed) return null;

  const top = ctx.sets[0];
  const equipment = equipmentOf(top, ctx.equipmentById);
  if (!top || !equipment || top.load.value === null) return null;

  const target = top.load.value * (1 - regression.stepPct / 100);
  return {
    type: 'load_decrease',
    targetRef: { exerciseId: ctx.exerciseId },
    fromValue: String(top.load.value),
    toValue: String(snapToEquipment(target, equipment.load)),
    reasonCode: 'missed_reps',
    reasonText: `Venís sin llegar a las repeticiones en ${ctx.exercise.name}. Bajamos un poco para volver a completar las series.`,
    rulesetVersion: ctx.ruleset.version,
    isPlaceholder: ctx.placeholder,
  };
}

/**
 * Misma carga durante N sesiones. No aplica si en realidad le sobra: eso no es
 * estancamiento, es que todavía no le subimos la carga.
 */
function proposeStallDeload(ctx: RuleContext): ProposalBlueprint | null {
  if (isReadyToIncrease(ctx)) return null;

  const { deload } = ctx.params;
  const recent = ctx.sets.slice(0, deload.stallSessions);
  const stalled =
    recent.length === deload.stallSessions &&
    recent.every((s) => s.load.value === recent[0]?.load.value);
  if (!stalled) return null;

  return {
    type: 'deload',
    targetRef: { exerciseId: ctx.exerciseId },
    fromValue: null,
    toValue: `${Math.round(deload.volumeMultiplier * 100)}%`,
    reasonCode: 'stalled',
    reasonText: `Hace ${deload.stallSessions} sesiones que ${ctx.exercise.name} está clavado en la misma carga. Una semana más liviana suele destrabarlo.`,
    rulesetVersion: ctx.ruleset.version,
    isPlaceholder: ctx.placeholder,
  };
}

function equipmentOf(
  set: SetLog | undefined,
  equipmentById: ReadonlyMap<Id, Equipment>,
): Equipment | undefined {
  return set?.equipmentId ? equipmentById.get(set.equipmentId) : undefined;
}

// ------------------------------------------------------------------ sustitución

function findSubstitutes(input: FindSubstitutesInput): readonly SubstituteOption[] {
  const { item, gym, constraints, unavailableEquipmentIds, ruleset } = input;
  const cfg = ruleset.substitution;

  const original = gym.exercises.find((e) => e.id === item.exerciseId);
  if (!original) return [];

  const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));
  const blocked = new Set(unavailableEquipmentIds);
  if (item.equipmentId) blocked.add(item.equipmentId);

  const explicit = new Map(
    gym.substitutions
      .filter((s) => s.exerciseId === original.id)
      .map((s) => [s.substituteId, s.equivalence]),
  );

  const options: SubstituteOption[] = [];

  for (const candidate of gym.exercises) {
    if (candidate.id === original.id) continue;
    if (isBlocked(candidate, constraints)) continue;
    if (!hasUsableEquipment(candidate, gym, [...blocked])) continue;

    const equivalence = explicit.get(candidate.id) ?? scoreEquivalence(original, candidate, cfg);
    if (equivalence < cfg.minEquivalence) continue;

    const equipment = firstAvailableEquipment(candidate, equipmentById, blocked);
    options.push({
      exerciseId: candidate.id,
      equipmentId: equipment?.id ?? null,
      equivalence: Math.round(equivalence * 100) / 100,
      reason: explicit.has(candidate.id)
        ? `Reemplazo equivalente cargado a mano para ${original.name}.`
        : `Mismo patrón de movimiento y músculos parecidos que ${original.name}.`,
    });
  }

  return options
    .sort((a, b) => b.equivalence - a.equivalence || a.exerciseId.localeCompare(b.exerciseId))
    .slice(0, cfg.maxOptions);
}

// ------------------------------------------------------------------ helpers

function primaryGoal(goals: readonly UserGoal[]): UserGoal {
  const sorted = [...goals].sort((a, b) => a.priority - b.priority);
  const first = sorted[0];
  if (!first) throw new Error('El usuario no tiene ningún objetivo cargado.');
  return first;
}

function pickTemplate(ruleset: Ruleset, goal: UserGoal, warnings: string[]) {
  const forGoal = ruleset.templates.filter((t) => t.goals.includes(goal.goal));
  const byFrequency = forGoal.find(
    (t) =>
      goal.sessionsPerWeekTarget >= t.sessionsPerWeek[0] &&
      goal.sessionsPerWeekTarget <= t.sessionsPerWeek[1],
  );
  if (byFrequency) return byFrequency;

  const fallback = forGoal[0] ?? ruleset.templates[0];
  if (!fallback) throw new Error(`El ruleset ${ruleset.version} no tiene ninguna plantilla.`);
  warnings.push(
    `Ninguna plantilla cubre ${goal.sessionsPerWeekTarget} sesiones por semana para el objetivo "${goal.goal}". Se usó "${fallback.label}".`,
  );
  return fallback;
}

function isBlocked(exercise: Exercise, constraints: readonly UserConstraint[]): boolean {
  return constraints.some(
    (c) =>
      (c.type === 'avoid_exercise' && c.exerciseId === exercise.id) ||
      (c.type === 'avoid_equipment' &&
        c.equipmentId !== null &&
        exercise.equipmentIds.includes(c.equipmentId)),
  );
}

/** Un ejercicio es utilizable si el gimnasio tiene activa al menos una de sus estaciones. */
function hasUsableEquipment(
  exercise: Exercise,
  gym: GymSnapshot,
  excludeIds: readonly Id[],
): boolean {
  if (exercise.equipmentIds.length === 0) return exercise.modality === 'reps_bodyweight';
  const excluded = new Set(excludeIds);
  return gym.equipment.some(
    (e) => e.isActive && !excluded.has(e.id) && exercise.equipmentIds.includes(e.id),
  );
}

function firstAvailableEquipment(
  exercise: Exercise,
  equipmentById: ReadonlyMap<Id, Equipment>,
  blocked: ReadonlySet<Id> = new Set(),
): Equipment | undefined {
  for (const id of exercise.equipmentIds) {
    const equipment = equipmentById.get(id);
    if (equipment?.isActive && !blocked.has(id)) return equipment;
  }
  return undefined;
}

function chooseExercise(
  pattern: MovementPattern,
  pool: readonly Exercise[],
  used: ReadonlySet<Id>,
  rng: () => number,
): Exercise | undefined {
  const candidates = pool
    .filter((e) => e.pattern === pattern && !used.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (candidates.length === 0) return undefined;

  // Los compuestos primero: si hay, se elige entre ellos.
  const compounds = candidates.filter((e) => e.isCompound);
  return pickDeterministic(compounds.length > 0 ? compounds : candidates, rng);
}

function baselineToTarget(
  load: LoadReading | null,
  equipment: Equipment | undefined,
): LoadReading | null {
  if (!load || load.value === null) return null;
  if (!equipment) return load;
  return { value: snapToEquipment(load.value, equipment.load), unit: equipment.load.unit };
}

function renderRationale(ruleset: Ruleset, role: SlotRole, exerciseName: string): string {
  return ruleset.rationale[role].replace('{exercise}', exerciseName);
}

/** Serie tope de cada sesión, por ejercicio, de la más reciente a la más vieja. */
function groupTopSetsByExercise(history: readonly SetLog[]): Map<Id, SetLog[]> {
  const byExercise = new Map<Id, Map<Id, SetLog>>();

  for (const set of history) {
    if (set.isWarmup) continue;
    const sessions = byExercise.get(set.exerciseId) ?? new Map<Id, SetLog>();
    const current = sessions.get(set.workoutLogId);
    if (!current || compareLoad(set, current) > 0) sessions.set(set.workoutLogId, set);
    byExercise.set(set.exerciseId, sessions);
  }

  const out = new Map<Id, SetLog[]>();
  for (const [exerciseId, sessions] of byExercise) {
    const tops = [...sessions.values()].sort(
      (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
    );
    out.set(exerciseId, tops);
  }
  return out;
}

function compareLoad(a: SetLog, b: SetLog): number {
  const av = a.loadKg ?? a.load.value ?? 0;
  const bv = b.loadKg ?? b.load.value ?? 0;
  if (av !== bv) return av - bv;
  return (a.reps ?? 0) - (b.reps ?? 0);
}

function wasRecentlyRejected(
  resolved: ReviewProgressInput['resolvedProposals'],
  exerciseId: Id,
): boolean {
  return resolved.some((p) => p.status === 'rejected' && p.targetRef.exerciseId === exerciseId);
}

function scoreEquivalence(
  original: Exercise,
  candidate: Exercise,
  cfg: Ruleset['substitution'],
): number {
  const samePattern = original.pattern === candidate.pattern ? 1 : 0;
  const overlap = jaccard(original.primaryMuscles, candidate.primaryMuscles);
  return cfg.patternWeight * samePattern + cfg.muscleWeight * overlap;
}

function jaccard(a: readonly MuscleGroup[], b: readonly MuscleGroup[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const intersection = a.filter((m) => setB.has(m)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = Date.parse(toIso) - Date.parse(fromIso);
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Expuesto solo para los tests del propio paquete. */
export const __internals = { groupTopSetsByExercise, scoreEquivalence, jaccard };
export type { GoalParams };
