import type {
  BodyRegion,
  Equipment,
  Exercise,
  ExperienceLevel,
  Id,
  LoadReading,
  MovementPattern,
  MuscleGroup,
  Profile,
  SetLog,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import { EXPERIENCE_LEVELS, nextLoad, snapToEquipment } from '@bh/domain';
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
import type { GoalParams, PainRule, Ruleset, SlotRole } from './ruleset.ts';
import { detrainingMultiplier, isPlaceholder, resolveParams } from './ruleset.ts';

/**
 * EL MOTOR — la mecánica. El contenido vive en el ruleset.
 *
 * Arma planes, propone progresiones y busca reemplazos usando el equipamiento
 * real de Blue Horse. Ningún número de entrenamiento sale de este archivo:
 * series, repeticiones, RIR, descansos, umbrales y reglas de dolor salen todos
 * del `Ruleset` que se le pasa.
 *
 * Es puro: no lee la hora, no usa Math.random, no toca la red.
 */
export function createPlaceholderEngine(): PrescriptionEngine {
  return {
    id: 'bh-engine-v1',
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
  const basePar = resolveParams(ruleset, goal.goal, user.profile.experienceLevel);
  const params = applyAgeModifier(basePar, ruleset, user.profile, context.now, warnings);
  const template = pickTemplate(ruleset, goal, warnings);
  const placeholder = isPlaceholder(ruleset);

  // Volver después de mucho con la carga con la que dejaste es la forma más
  // rápida de lesionarse: la fuerza aguanta, el tendón no.
  const comeback = comebackMultiplier(params, input.daysSinceLastSession ?? null, warnings);

  const painRules = activePainRules(ruleset, user.constraints);
  const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));
  const usableExercises = gym.exercises.filter(
    (ex) =>
      !isBlocked(ex, user.constraints) &&
      !isBlockedByPain(ex, painRules) &&
      isWithinSkillLevel(ex, user.profile.experienceLevel) &&
      hasUsableEquipment(ex, gym, []),
  );

  if (painRules.length > 0) {
    for (const rule of painRules) {
      warnings.push(`Por la molestia en ${regionLabel(rule.bodyRegion)}: ${rule.keepDoing}`);
    }
  }

  // Rotar los ejercicios del plan anterior hace que el músculo trabaje en
  // ángulos distintos. Es preferencia, no requisito: si rotar dejaría un patrón
  // vacío, se repite el ejercicio antes que saltear el slot.
  const rotateAway = new Set(input.previousExerciseIds ?? []);

  // Series acumuladas por músculo en toda la plantilla. El slot de aislamiento
  // la usa para elegir lo que falta en vez de recargar lo que ya se trabajó:
  // sin esto, un plan de pierna podía terminar con glúteos por encima del techo
  // semanal y tríceps sin tocar.
  const setsByMuscle = new Map<MuscleGroup, number>();

  // Se elige una vez por sesión de la plantilla y se reutiliza en cada repetición
  // de la cola: si el ejercicio cambia cada vez, no hay progresión que medir.
  const resolvedTemplateSessions = template.sessions.map((tplSession) => {
    const used = new Set<Id>();
    const items: SessionItemBlueprint[] = [];

    for (const slot of tplSession.slots) {
      const exercise = chooseExercise(
        slot.pattern,
        slot.role,
        usableExercises,
        used,
        rotateAway,
        setsByMuscle,
        rng,
      );
      if (!exercise) {
        warnings.push(
          `No hay ningún ejercicio disponible para el patrón "${slot.pattern}" en ${tplSession.label}. Falta equipamiento en el catálogo, está todo bloqueado por restricciones, o no hay nada de tu nivel para ese patrón.`,
        );
        continue;
      }
      used.add(exercise.id);

      const roleParams = params[slot.role];
      for (const muscle of exercise.primaryMuscles) {
        setsByMuscle.set(muscle, (setsByMuscle.get(muscle) ?? 0) + roleParams.sets);
      }

      items.push(
        buildItem({
          exercise,
          role: slot.role,
          cardioSessionId: slot.cardioSessionId,
          orderIndex: items.length,
          equipment: firstAvailableEquipment(exercise, equipmentById),
          roleParams,
          baselineLoad: user.baselines.find((b) => b.exerciseId === exercise.id)?.load ?? null,
          comeback,
          ruleset,
          placeholder,
          warnings,
        }),
      );
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

  warnings.push(...weeklyVolumeWarnings(sessions, template, gym, params, goal));

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

interface BuildItemInput {
  readonly exercise: Exercise;
  readonly role: SlotRole;
  readonly cardioSessionId: string | undefined;
  readonly orderIndex: number;
  readonly equipment: Equipment | undefined;
  readonly roleParams: GoalParams['primary'];
  readonly baselineLoad: LoadReading | null;
  readonly comeback: number;
  readonly ruleset: Ruleset;
  readonly placeholder: boolean;
  readonly warnings: string[];
}

/**
 * Un ítem de la sesión. El cardio pisa la prescripción de sala entera: donde
 * hay duración y zona no hay series, repeticiones ni RIR.
 */
function buildItem(input: BuildItemInput): SessionItemBlueprint {
  const { exercise, roleParams, equipment, ruleset } = input;
  const cardio = cardioPrescription(ruleset, input.cardioSessionId, exercise, input.warnings);

  return {
    exerciseId: exercise.id,
    equipmentId: equipment?.id ?? null,
    orderIndex: input.orderIndex,
    targetSets: cardio?.sets ?? roleParams.sets,
    targetRepsMin: cardio?.reps ?? roleParams.repsMin,
    targetRepsMax: cardio?.reps ?? roleParams.repsMax,
    targetLoad: baselineToTarget(input.baselineLoad, equipment, input.comeback),
    targetRir: cardio ? null : roleParams.rirTarget,
    restSeconds: cardio?.restSeconds ?? roleParams.restSeconds,
    rationale: cardio?.rationale ?? renderRationale(ruleset, input.role, exercise.name),
    isPlaceholder: input.placeholder,
    targetDurationSeconds: cardio?.durationSeconds ?? null,
    targetIntensityZone: cardio?.intensityZone ?? null,
    targetIntervalRestSeconds: cardio?.intervalRestSeconds ?? null,
  };
}

/**
 * Cuánto ajustar la carga al volver tras una ausencia larga. El multiplicador se
 * aplica al punto de partida; no cambia series ni repeticiones.
 */
function comebackMultiplier(
  params: GoalParams,
  daysSinceLastSession: number | null,
  warnings: string[],
): number {
  if (daysSinceLastSession === null) return 1;
  const multiplier = detrainingMultiplier(params, daysSinceLastSession);
  if (multiplier >= 1) return 1;

  warnings.push(
    `Pasaron ${daysSinceLastSession} días desde tu última sesión, así que arrancamos con un ${Math.round((1 - multiplier) * 100)}% menos de carga. La fuerza vuelve rápido; el tendón tarda más, y es lo que se lastima al retomar de golpe.`,
  );
  return multiplier;
}

/**
 * Ajuste por edad: menos carga, más repeticiones y más descanso. No es que a
 * cierta edad se progrese menos — se progresa bien —, es dejar más margen.
 */
function applyAgeModifier(
  params: GoalParams,
  ruleset: Ruleset,
  profile: Profile,
  now: string,
  warnings: string[],
): GoalParams {
  const rule = ruleset.modifiers?.olderAdults;
  if (!rule || !profile.birthDate) return params;

  const age = ageAt(profile.birthDate, now);
  if (age === null || age < rule.fromAge) return params;

  warnings.push(rule.note);
  const adjust = (role: GoalParams['primary']): GoalParams['primary'] => ({
    ...role,
    repsMin: role.repsMin + rule.repsMinDelta,
    repsMax: Math.max(role.repsMax, role.repsMin + rule.repsMinDelta),
    restSeconds: Math.round(role.restSeconds * rule.restMultiplier),
    intensityPct1RM: [
      role.intensityPct1RM[0] * rule.intensityMultiplier,
      role.intensityPct1RM[1] * rule.intensityMultiplier,
    ],
  });

  return {
    ...params,
    primary: adjust(params.primary),
    secondary: adjust(params.secondary),
    isolation: adjust(params.isolation),
  };
}

/** Reglas de dolor que aplican hoy, según lo que el socio reportó. */
function activePainRules(
  ruleset: Ruleset,
  constraints: readonly UserConstraint[],
): readonly PainRule[] {
  const rules = ruleset.safety?.painRules;
  if (!rules) return [];

  return rules.filter((rule) =>
    constraints.some(
      (c) =>
        (c.type === 'pain' || c.type === 'injury') &&
        c.bodyRegion === rule.bodyRegion &&
        c.severity >= rule.severityAtLeast,
    ),
  );
}

/**
 * Un ejercicio queda fuera si irrita una zona que duele. La regla del research
 * es no parar del todo: se saca lo que molesta y se sigue con el resto.
 */
function isBlockedByPain(exercise: Exercise, rules: readonly PainRule[]): boolean {
  return rules.some(
    (rule) =>
      rule.avoidPatterns.includes(exercise.pattern) ||
      exercise.primaryMuscles.some((m) => rule.avoidMuscles.includes(m)),
  );
}

/**
 * No se le propone a alguien un ejercicio que exige más técnica de la que tiene.
 * Mandar a un principiante a hacer peso muerto con barra sin que nadie lo mire es
 * la forma más directa de que se lastime.
 */
function isWithinSkillLevel(exercise: Exercise, level: ExperienceLevel): boolean {
  return EXPERIENCE_LEVELS.indexOf(exercise.skillLevel) <= EXPERIENCE_LEVELS.indexOf(level);
}

interface CardioPrescription {
  readonly sets: number;
  readonly reps: number;
  readonly restSeconds: number;
  readonly durationSeconds: number;
  readonly intensityZone: number;
  readonly intervalRestSeconds: number | null;
  readonly rationale: string;
}

/**
 * El cardio no se prescribe en series y repeticiones: es duración y zona de
 * intensidad, o vueltas de trabajo y descanso. `sets`/`reps` se completan igual
 * porque la tabla los exige, pero lo que se le muestra al socio es la duración.
 */
function cardioPrescription(
  ruleset: Ruleset,
  cardioSessionId: string | undefined,
  exercise: Exercise,
  warnings: string[],
): CardioPrescription | null {
  if (exercise.pattern !== 'cardio') return null;

  const block = ruleset.cardio;
  if (!block) return null;

  const session = cardioSessionId
    ? block.sessions.find((s) => s.id === cardioSessionId)
    : block.sessions[0];

  if (!session) {
    warnings.push(
      `El ruleset no define la sesión de cardio "${cardioSessionId}". Se usa el trabajo de sala por defecto.`,
    );
    return null;
  }

  const zone = block.zones.find((z) => z.zone === session.intensityZone);
  const feels = zone ? ` ${zone.feels}` : '';

  if (session.type === 'interval' && session.interval) {
    const { workMinutes, restMinutes, reps } = session.interval;
    return {
      sets: reps,
      reps: 1,
      restSeconds: Math.round(restMinutes * 60),
      durationSeconds: Math.round(workMinutes * 60),
      intensityZone: session.intensityZone,
      intervalRestSeconds: Math.round(restMinutes * 60),
      rationale: `${exercise.name}: ${reps} vueltas de ${workMinutes} min fuerte con ${restMinutes} min suave en el medio.${feels}`,
    };
  }

  const minutes = session.durationMinutes ?? 0;
  return {
    sets: 1,
    reps: 1,
    restSeconds: 0,
    durationSeconds: minutes * 60,
    intensityZone: session.intensityZone,
    intervalRestSeconds: null,
    rationale: `${exercise.name}: ${minutes} minutos continuos en zona ${session.intensityZone}.${feels}`,
  };
}

/**
 * Chequeo de volumen semanal: series por músculo contra la ventana del research.
 * No corrige el plan, avisa. Cambiar la plantilla sola por esto sería reescribir
 * el contenido desde el código, que es justo lo que el ruleset evita.
 */
function weeklyVolumeWarnings(
  sessions: readonly SessionBlueprint[],
  template: Ruleset['templates'][number],
  gym: GymSnapshot,
  params: GoalParams,
  goal: UserGoal,
): string[] {
  const { minSetsPerMuscle, maxSetsPerMuscle } = params.weeklyVolume;
  const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));

  // La cola no tiene fechas: se estima la semana con las sesiones que la persona
  // dijo que puede hacer, acotadas a lo que la plantilla soporta.
  const perWeek = Math.min(
    Math.max(goal.sessionsPerWeekTarget, template.sessionsPerWeek[0]),
    template.sessionsPerWeek[1],
  );

  const week = sessions.slice(0, perWeek);
  const setsByMuscle = new Map<MuscleGroup, number>();
  // El piso se mide solo sobre los músculos que el plan trabaja con algún
  // compuesto: son los que el programa apunta de verdad. Un bíceps que recibe
  // dos series de un curl no está "sub-dosificado" — es trabajo incidental, y
  // avisar por eso en cada plan convierte los avisos en ruido que nadie lee.
  const targeted = new Set<MuscleGroup>();

  for (const item of week.flatMap((s) => s.items)) {
    const exercise = exerciseById.get(item.exerciseId);
    if (!exercise) continue;
    for (const muscle of exercise.primaryMuscles) {
      setsByMuscle.set(muscle, (setsByMuscle.get(muscle) ?? 0) + item.targetSets);
      if (exercise.isCompound) targeted.add(muscle);
    }
  }

  const list = (entries: [MuscleGroup, number][]) =>
    entries.map(([muscle, sets]) => `${muscleLabel(muscle)} (${sets})`).join(', ');

  const counted = [...setsByMuscle.entries()];
  const over = counted.filter(([, sets]) => sets > maxSetsPerMuscle);
  const under = counted.filter(
    ([muscle, sets]) => targeted.has(muscle) && sets > 0 && sets < minSetsPerMuscle,
  );

  const warnings: string[] = [];
  if (over.length > 0) {
    warnings.push(
      `Con ${perWeek} sesiones por semana, estos músculos pasan las ${maxSetsPerMuscle} series semanales que la evidencia marca como techo útil: ${list(over)}. Más volumen ahí no rinde más.`,
    );
  }
  if (under.length > 0) {
    warnings.push(
      `Con ${perWeek} sesiones por semana, estos músculos quedan abajo de las ${minSetsPerMuscle} series semanales mínimas: ${list(under)}. Sumar una sesión más por semana los cubre.`,
    );
  }

  return warnings;
}

/** Edad en años a la fecha dada. `null` si la fecha no se puede leer. */
function ageAt(birthDate: string, now: string): number | null {
  const born = new Date(birthDate);
  const at = new Date(now);
  if (Number.isNaN(born.getTime()) || Number.isNaN(at.getTime())) return null;

  let age = at.getUTCFullYear() - born.getUTCFullYear();
  const monthDiff = at.getUTCMonth() - born.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && at.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
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
  readonly resolvedProposals: ReviewProgressInput['resolvedProposals'];
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
      resolvedProposals,
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
    loadUnit: null,
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

/** Músculos que la investigación agrupa como tren inferior. */
const LOWER_BODY_MUSCLES: readonly MuscleGroup[] = ['quads', 'hamstrings', 'glutes', 'calves'];

/**
 * El paso de progresión no es el mismo arriba que abajo: el tren inferior mueve
 * más carga absoluta, así que un mismo porcentaje representa un salto más chico
 * en proporción a lo que la persona ya levanta. Subirle al press de banca lo
 * mismo que a la sentadilla lo manda al fallo antes de tiempo.
 */
function progressionStep(ctx: RuleContext): number {
  const isLowerBody = ctx.exercise.primaryMuscles.some((m) => LOWER_BODY_MUSCLES.includes(m));
  return isLowerBody
    ? ctx.params.progression.stepPctLowerBody
    : ctx.params.progression.stepPctUpperBody;
}

function proposeIncrease(ctx: RuleContext): ProposalBlueprint | null {
  // La potencia se regula por velocidad de ejecución, no por repeticiones en
  // reserva: el ruleset deja `rirTarget` nulo ahí a propósito, y sin RIR no hay
  // señal para decidir subir. Proponerlo igual sería inventar el criterio.
  if (ctx.params.primary.rirTarget === null) return null;
  if (!isReadyToIncrease(ctx)) return null;

  const { progression } = ctx.params;
  const top = ctx.sets[0];
  const equipment = equipmentOf(top, ctx.equipmentById);
  if (!top || !equipment) return null;

  // Sin carga anotada no hay desde dónde subir: proponer un número sería
  // inventarle un punto de partida que nunca usó.
  if (!top.load) return null;
  const proposed = nextLoad(top.load, equipment.load, progressionStep(ctx));
  if (proposed === null || proposed === top.load.value) return null;
  if (alreadyAccepted(ctx, proposed)) return null;

  return {
    type: 'load_increase',
    targetRef: { exerciseId: ctx.exerciseId },
    fromValue: String(top.load.value),
    toValue: String(proposed),
    loadUnit: equipment.load.unit,
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
  if (!top || !equipment || top.load?.value == null) return null;

  const target = snapToEquipment(top.load.value * (1 - regression.stepPct / 100), equipment.load);
  if (alreadyAccepted(ctx, target)) return null;
  return {
    type: 'load_decrease',
    targetRef: { exerciseId: ctx.exerciseId },
    fromValue: String(top.load.value),
    toValue: String(target),
    loadUnit: equipment.load.unit,
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
    // Solo se puede hablar de estancamiento si hay una carga registrada con
    // la cual comparar; sin eso no se sabe si se movió o no.
    recent.every((s) => s.load?.value != null && s.load.value === recent[0]?.load?.value);
  if (!stalled) return null;

  return {
    type: 'deload',
    targetRef: { exerciseId: ctx.exerciseId },
    fromValue: null,
    toValue: `${Math.round(deload.volumeMultiplier * 100)}%`,
    loadUnit: null,
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
      curated: explicit.has(candidate.id),
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
  role: SlotRole,
  pool: readonly Exercise[],
  used: ReadonlySet<Id>,
  rotateAway: ReadonlySet<Id>,
  setsByMuscle: ReadonlyMap<MuscleGroup, number>,
  rng: () => number,
): Exercise | undefined {
  const candidates = pool
    .filter((e) => e.pattern === pattern && !used.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (candidates.length === 0) return undefined;

  // Cada preferencia se aplica solo si deja algo: es mejor un ejercicio menos
  // ideal que un patrón sin cubrir.
  const prefer = (list: readonly Exercise[], keep: (e: Exercise) => boolean) => {
    const kept = list.filter(keep);
    return kept.length > 0 ? kept : list;
  };

  // 1. Rotar respecto del plan anterior.
  let eligible = prefer(candidates, (e) => !rotateAway.has(e.id));

  // 2. Fuera del cardio, uno que se mida en repeticiones. El ruleset prescribe
  //    series, repeticiones y RIR: nada de eso aplica a una plancha, que se
  //    sostiene por tiempo. Decirle a alguien "2×6-10 de plancha" no significa
  //    nada.
  if (pattern !== 'cardio') {
    eligible = prefer(eligible, (e) => e.modality !== 'time');
  }

  // 3. En el ejercicio principal, uno al que se le pueda subir la carga. Toda la
  //    progresión se mide en kilos: si el ejercicio más importante de la sesión
  //    es de peso corporal, no hay nada que progresar ahí.
  if (role === 'primary') {
    eligible = prefer(eligible, (e) => e.modality === 'reps_weight');
  }

  // 4. Los compuestos antes que los aislados.
  eligible = prefer(eligible, (e) => e.isCompound);

  // 5. La variante más exigente que la persona puede hacer. Mandar a alguien
  //    avanzado a hacer sentadilla goblet con kettlebell a 1-5 repeticiones es
  //    absurdo: no hay kettlebell que aguante esa carga. La versión más
  //    demandante del patrón es también la que se puede cargar de verdad.
  if (role !== 'isolation') {
    const topLevel = Math.max(...eligible.map((e) => EXPERIENCE_LEVELS.indexOf(e.skillLevel)));
    eligible = prefer(eligible, (e) => EXPERIENCE_LEVELS.indexOf(e.skillLevel) === topLevel);
  } else {
    // 6. En el aislado, el músculo que menos trabajo lleva. Es el único slot
    //    libre para equilibrar: sin esto el plan podía cerrar con más glúteo
    //    —que ya viene de sentadilla, bisagra y zancada— y dejar el tríceps sin
    //    tocar en toda la semana.
    const volumeOf = (e: Exercise) =>
      Math.min(...e.primaryMuscles.map((m) => setsByMuscle.get(m) ?? 0));
    const leastWorked = Math.min(...eligible.map(volumeOf));
    eligible = prefer(eligible, (e) => volumeOf(e) === leastWorked);
  }

  return pickDeterministic(eligible, rng);
}

const MUSCLE_LABELS: Readonly<Record<MuscleGroup, string>> = {
  quads: 'cuádriceps',
  hamstrings: 'isquiotibiales',
  glutes: 'glúteos',
  calves: 'gemelos',
  chest: 'pecho',
  back: 'espalda',
  lats: 'dorsales',
  traps: 'trapecios',
  front_delts: 'hombro anterior',
  side_delts: 'hombro lateral',
  rear_delts: 'hombro posterior',
  biceps: 'bíceps',
  triceps: 'tríceps',
  forearms: 'antebrazos',
  abs: 'abdominales',
  obliques: 'oblicuos',
  lower_back: 'lumbares',
  full_body: 'cuerpo completo',
};

function muscleLabel(muscle: MuscleGroup): string {
  return MUSCLE_LABELS[muscle] ?? muscle;
}

const REGION_LABELS: Readonly<Record<BodyRegion, string>> = {
  neck: 'el cuello',
  shoulder: 'el hombro',
  elbow: 'el codo',
  wrist: 'la muñeca',
  upper_back: 'la espalda alta',
  lower_back: 'la zona lumbar',
  hip: 'la cadera',
  knee: 'la rodilla',
  ankle: 'el tobillo',
  other: 'la zona que marcaste',
};

function regionLabel(region: BodyRegion): string {
  return REGION_LABELS[region] ?? 'la zona que marcaste';
}

function baselineToTarget(
  load: LoadReading | null,
  equipment: Equipment | undefined,
  multiplier = 1,
): LoadReading | null {
  if (!load || load.value === null) return null;
  const adjusted = load.value * multiplier;
  if (!equipment) return multiplier === 1 ? load : { value: adjusted, unit: load.unit };
  return { value: snapToEquipment(adjusted, equipment.load), unit: equipment.load.unit };
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
  const av = a.loadKg ?? a.load?.value ?? 0;
  const bv = b.loadKg ?? b.load?.value ?? 0;
  if (av !== bv) return av - bv;
  return (a.reps ?? 0) - (b.reps ?? 0);
}

/**
 * Ya se aceptó exactamente este cambio y todavía no se entrenó con la carga
 * nueva. Volver a proponerlo sería repetir una pregunta ya contestada: recién
 * cuando la persona entrene con la carga nueva, esa pasa a ser la serie tope
 * y la próxima propuesta va a ser otro número.
 */
function alreadyAccepted(ctx: RuleContext, proposed: number): boolean {
  return ctx.resolvedProposals.some(
    (p) =>
      p.status === 'accepted' &&
      p.targetRef.exerciseId === ctx.exerciseId &&
      p.toValue === String(proposed),
  );
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
