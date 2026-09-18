import type {
  BodyRegion,
  Equipment,
  Exercise,
  ExperienceLevel,
  Id,
  LoadReading,
  MatchDayState,
  MovementPattern,
  MuscleGroup,
  SetLog,
  SubstitutionEdge,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import { EXPERIENCE_LEVELS, nextLoad, snapToEquipment } from '@bh/domain';
import type {
  Aviso,
  BloqueDeContexto,
  ExplosiveConfig,
  Modulo,
  ResolvedSport,
} from './contexto.ts';
import {
  activePainRules,
  excluido,
  isBlocked,
  isBlockedByPain,
  isWithinSkillLevel,
  ordenarAvisos,
  PATRONES_DE_BLOQUE,
  primaryGoal,
  resolverContexto,
} from './contexto.ts';
import type {
  AdjustSessionInput,
  EngineContext,
  FindSubstitutesInput,
  GeneratePlanInput,
  GymSnapshot,
  PlanBlueprint,
  PrescriptionEngine,
  ProposalBlueprint,
  ReviewProgressInput,
  SessionAdjustment,
  SessionBlueprint,
  SessionItemBlueprint,
  SubstituteOption,
} from './contract.ts';
import { goalLabel, muscleLabel, patternLabel, regionLabel, sesiones } from './etiquetas.ts';
import { createRng, pickDeterministic } from './rng.ts';
import type { GoalParams, PainRule, Ruleset, SlotRole } from './ruleset.ts';
import { isPlaceholder, resolveParams } from './ruleset.ts';

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
    adjustSession: adjustForMatchDay,
  };
}

// ------------------------------------------------------------------ plan

function generatePlan(input: GeneratePlanInput): PlanBlueprint {
  const { context, user, gym, ruleset } = input;
  const rng = createRng(context.seed);
  // Todo lo que depende de quién es la persona, resuelto antes de elegir nada.
  const ctx = resolverContexto(input);
  const { goal, sport, params, template, daysAway, comeback, avoidRules } = ctx;
  const avisos: Aviso[] = [...ctx.avisos];
  const decir = (modulo: Modulo, textos: readonly string[]) => {
    for (const texto of textos) avisos.push({ modulo, texto });
  };
  // Solo los escribe un ruleset mal armado (una sesión de cardio que no existe).
  const avisosDelRuleset: string[] = [];
  const placeholder = isPlaceholder(ruleset);

  const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));
  const disponibles = gym.exercises.filter(
    (ex) => !excluido(ctx, ex) && hasUsableEquipment(ex, gym, []),
  );
  // El equilibrio y el impacto entran como bloque propio y nunca por un slot:
  // si no, un aislamiento de glúteos o el complemento de una bisagra bloqueada
  // podían salir "caminata de costado" con la dosis de fuerza.
  const usableExercises = disponibles.filter((ex) => !PATRONES_DE_BLOQUE.includes(ex.pattern));

  // Rotar los ejercicios del plan anterior hace que el músculo trabaje en
  // ángulos distintos. Es preferencia, no requisito: si rotar dejaría un patrón
  // vacío, se repite el ejercicio antes que saltear el slot.
  const rotateAway = new Set(input.previousExerciseIds ?? []);

  // Series acumuladas por músculo en toda la plantilla. El slot de aislamiento
  // la usa para elegir lo que falta en vez de recargar lo que ya se trabajó:
  // sin esto, un plan de pierna podía terminar con glúteos por encima del techo
  // semanal y tríceps sin tocar.
  const setsByMuscle = new Map<MuscleGroup, number>();

  // Los ejercicios ya usados en CUALQUIER sesión de este plan, para no repetir
  // el mismo en dos sesiones si el catálogo da para variar.
  const usedInPlan = new Set<Id>();

  // Se elige una vez por sesión de la plantilla y se reutiliza en cada repetición
  // de la cola: si el ejercicio cambia cada vez, no hay progresión que medir.
  const resolvedTemplateSessions = template.sessions.map((tplSession) => {
    const used = new Set<Id>();
    const items: SessionItemBlueprint[] = [];

    for (const slot of tplSession.slots) {
      let exercise = chooseExercise({
        pattern: slot.pattern,
        role: slot.role,
        pool: usableExercises,
        used,
        usedInPlan,
        rotateAway,
        setsByMuscle,
        level: user.profile.experienceLevel,
        selection: ruleset.selection,
        emphasis: sport?.emphasis ?? [],
        regulatedByRir: params[slot.role].rirTarget !== null,
        rng,
      });

      if (!exercise) {
        const salida = resolverSlotVacio({
          pattern: slot.pattern,
          sessionLabel: tplSession.label,
          pool: usableExercises,
          gym,
          constraints: user.constraints,
          avoidRules,
          level: user.profile.experienceLevel,
          safety: ruleset.safety,
          used,
          setsByMuscle,
          rng,
        });
        decir('cobertura', [salida.warning]);
        if (!salida.exercise) continue;
        exercise = salida.exercise;
      }

      used.add(exercise.id);
      usedInPlan.add(exercise.id);

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
          equipment: pickEquipment(exercise, equipmentById, rng),
          roleParams,
          baselineLoad: user.baselines.find((b) => b.exerciseId === exercise.id)?.load ?? null,
          comeback,
          ruleset,
          placeholder,
          warnings: avisosDelRuleset,
        }),
      );
    }

    return { tplSession, items };
  });

  // Después de elegir todo lo demás, para que sumar un par no mueva ninguna
  // otra elección (comparten el mismo generador).
  const explosivos = ctx.explosivos;
  if (explosivos) {
    const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));
    for (const resolved of resolvedTemplateSessions) {
      resolved.items = addExplosivePairs({
        items: resolved.items,
        cfg: explosivos,
        pool: usableExercises,
        exerciseById,
        equipmentById,
        usedInPlan,
        rng,
      });
    }
  }

  // Los bloques de contexto van al final (Otago: primero la fuerza, después el
  // equilibrio) y después de los pares, para no mover ninguna elección anterior.
  for (const bloque of ctx.bloques) {
    const pool = disponibles.filter((ex) => ex.pattern === bloque.pattern);
    for (const resolved of resolvedTemplateSessions) {
      resolved.items = addBloque({
        items: resolved.items,
        bloque,
        pool,
        equipmentById,
        usedInPlan,
        placeholder,
        rng,
      });
    }
  }
  const equilibrio = ctx.equilibrio;
  if (equilibrio) {
    const deEquilibrio = new Set(
      disponibles.filter((ex) => ex.pattern === 'balance').map((ex) => ex.id),
    );
    const conEquilibrio = resolvedTemplateSessions.some((r) =>
      r.items.some((i) => deEquilibrio.has(i.exerciseId)),
    );
    if (conEquilibrio && goal.sessionsPerWeekTarget < equilibrio.minSessionsPerWeek) {
      decir('equilibrio', [
        equilibrio.fewSessionsNote
          .replace('{sesiones}', sesiones(goal.sessionsPerWeekTarget))
          .replace('{minimo}', String(equilibrio.minSessionsPerWeek)),
      ]);
    }
  }

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

  decir('ruleset', avisosDelRuleset);
  decir('ausencia', comebackWarnings(sessions, ruleset, daysAway, comeback, params));
  decir('tiempo', sessionLengthWarnings(sessions, ruleset, goal));
  decir('autorregulacion', autoregulationWarnings(params, ruleset, goal));
  decir('volumen', weeklyVolumeWarnings(sessions, template, gym, params, goal));
  decir('interferencia', interferenceWarnings(sessions, gym, ruleset));
  decir('potencia', powerWarnings(sessions, gym, goal, ruleset));
  decir(
    'deporte',
    emphasisWarnings({
      context,
      ruleset,
      gym,
      sport,
      sessions,
      constraints: user.constraints,
    }),
  );

  if (placeholder) {
    decir('provisorio', [
      'Plan generado con contenido provisorio: los números no salen todavía de la investigación.',
    ]);
  }

  return {
    rulesetVersion: ruleset.version,
    source: ruleset.source,
    templateId: template.id,
    sessions,
    warnings: ordenarAvisos(avisos),
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
    supersetGroup: null,
  };
}

// ------------------------------------------------------------------ equilibrio

/**
 * Suma al final de la sesión los ejercicios de un bloque de contexto.
 *
 * Entre sesiones rota: prefiere los que todavía no están en el plan, así una
 * semana de tres sesiones recorre todo el catálogo del bloque en vez de repetir
 * los mismos. Orden por nombre antes de sortear, para que el resultado no
 * dependa del orden en que llegó el catálogo.
 */
function addBloque(input: {
  readonly items: readonly SessionItemBlueprint[];
  readonly bloque: BloqueDeContexto;
  readonly pool: readonly Exercise[];
  readonly equipmentById: ReadonlyMap<Id, Equipment>;
  readonly usedInPlan: Set<Id>;
  readonly placeholder: boolean;
  readonly rng: () => number;
}): SessionItemBlueprint[] {
  const cfg = input.bloque;
  const out = [...input.items];
  const usedHere = new Set(out.map((i) => i.exerciseId));
  const ordenados = [...input.pool].sort((a, b) => a.name.localeCompare(b.name, 'es'));

  for (let n = 0; n < cfg.exercisesPerSession; n += 1) {
    const libres = ordenados.filter((e) => !usedHere.has(e.id));
    const frescos = libres.filter((e) => !input.usedInPlan.has(e.id));
    const exercise = pickDeterministic(frescos.length > 0 ? frescos : libres, input.rng);
    if (!exercise) break;
    usedHere.add(exercise.id);
    input.usedInPlan.add(exercise.id);
    out.push({
      exerciseId: exercise.id,
      equipmentId: pickEquipment(exercise, input.equipmentById, input.rng)?.id ?? null,
      orderIndex: out.length,
      targetSets: cfg.sets,
      targetRepsMin: cfg.repsMin,
      targetRepsMax: cfg.repsMax,
      targetLoad: null,
      targetRir: null,
      restSeconds: cfg.restSeconds,
      rationale: cfg.rationale,
      isPlaceholder: input.placeholder,
      targetDurationSeconds: null,
      targetIntensityZone: null,
      targetIntervalRestSeconds: null,
      supersetGroup: null,
    });
  }
  return out;
}

/**
 * Lo que no se dosifica como fuerza: ni suma al volumen semanal, que se midió
 * con series cerca del fallo, ni recibe propuestas de subir carga o
 * repeticiones. Lo explosivo se regula por la calidad de cada repetición
 * (`docs/research/22`, `37`); el equilibrio progresa soltando el apoyo, no con
 * kilos (`39`).
 */
function fueraDeLaDosis(exercise: Exercise): boolean {
  return exercise.isExplosive || PATRONES_DE_BLOQUE.includes(exercise.pattern);
}

// ------------------------------------------------------------------ explosivos

/**
 * Pega un explosivo del mismo patrón detrás del primer levantamiento que lo
 * admite, serie por serie: sentadilla → salto, bisagra → swing.
 *
 * El levantamiento va primero porque así se midió: el formato que le gana a la
 * fuerza sola es el alternado con el levantamiento adelante; hacer todos los
 * saltos antes que la fuerza no mejoró el sprint (Zhao 2026).
 *
 * Mismas series que el levantamiento, porque se alternan de a una. Sin RIR y
 * sin carga objetivo: se regula por cómo sale cada repetición.
 */
function addExplosivePairs(input: {
  readonly items: readonly SessionItemBlueprint[];
  readonly cfg: ExplosiveConfig;
  readonly pool: readonly Exercise[];
  readonly exerciseById: ReadonlyMap<Id, Exercise>;
  readonly equipmentById: ReadonlyMap<Id, Equipment>;
  readonly usedInPlan: Set<Id>;
  readonly rng: () => number;
}): SessionItemBlueprint[] {
  const { items, cfg } = input;
  const usedHere = new Set(items.map((i) => i.exerciseId));
  const out: SessionItemBlueprint[] = [];
  let pairs = 0;

  for (const item of items) {
    out.push(item);
    const lift = input.exerciseById.get(item.exerciseId);
    if (pairs >= cfg.pairsPerSession || !lift || !puedeLlevarPar(item, lift, cfg)) continue;

    const explosive = chooseExplosive(
      lift.pattern,
      input.pool,
      usedHere,
      input.usedInPlan,
      input.rng,
    );
    if (!explosive) continue;

    pairs += 1;
    usedHere.add(explosive.id);
    input.usedInPlan.add(explosive.id);
    out[out.length - 1] = { ...item, restSeconds: cfg.intraPairRestSeconds, supersetGroup: pairs };
    out.push({
      exerciseId: explosive.id,
      equipmentId: pickEquipment(explosive, input.equipmentById, input.rng)?.id ?? null,
      orderIndex: 0,
      targetSets: item.targetSets,
      targetRepsMin: cfg.repsMin,
      targetRepsMax: cfg.repsMax,
      targetLoad: null,
      targetRir: null,
      restSeconds: item.restSeconds,
      rationale: cfg.rationale,
      isPlaceholder: item.isPlaceholder,
      targetDurationSeconds: null,
      targetIntensityZone: null,
      targetIntervalRestSeconds: null,
      supersetGroup: pairs,
    });
  }

  return out.map((it, i) => (it.orderIndex === i ? it : { ...it, orderIndex: i }));
}

function puedeLlevarPar(item: SessionItemBlueprint, lift: Exercise, cfg: ExplosiveConfig): boolean {
  return (
    item.targetDurationSeconds === null &&
    item.supersetGroup === null &&
    lift.isCompound &&
    !lift.isExplosive &&
    cfg.pairPatterns.includes(lift.pattern)
  );
}

/** Un explosivo del patrón, si el socio puede hacerlo; entre iguales, uno que no esté ya en el plan. */
function chooseExplosive(
  pattern: MovementPattern,
  pool: readonly Exercise[],
  usedHere: ReadonlySet<Id>,
  usedInPlan: ReadonlySet<Id>,
  rng: () => number,
): Exercise | undefined {
  const candidates = pool
    .filter((e) => e.isExplosive && e.pattern === pattern && !usedHere.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const fresh = candidates.filter((e) => !usedInPlan.has(e.id));
  return pickDeterministic(fresh.length > 0 ? fresh : candidates, rng);
}

/**
 * Qué decirle a quien vuelve tras una ausencia larga.
 *
 * El aviso tiene dos formas porque el plan no siempre trae carga: mientras
 * `user_baselines` esté vacío —que hoy es siempre, ver `docs/research/15`—
 * `targetLoad` es `null` en todos los items, y anunciar "un 15 % menos de carga"
 * es prometer un ajuste sobre un número que el socio no va a ver en ningún lado.
 * Sin carga se le dice qué hacer; con carga, cuánto se le bajó.
 */
function comebackWarnings(
  sessions: readonly SessionBlueprint[],
  ruleset: Ruleset,
  daysSinceLastSession: number | null,
  multiplier: number,
  params: GoalParams,
): string[] {
  const rule = ruleset.modifiers?.detraining;
  if (!rule || daysSinceLastSession === null) return [];

  const out: string[] = [];

  if (multiplier < 1) {
    const conCarga = sessions.some((s) => s.items.some((i) => i.targetLoad !== null));
    const texto = conCarga ? rule.withLoad : rule.withoutLoad;
    out.push(
      texto
        .replace('{dias}', String(daysSinceLastSession))
        .replace('{recorte}', String(Math.round((1 - multiplier) * 100))),
    );
  }

  // El aviso de cardio va por su cuenta y arranca antes: el recorte de sala
  // recién muerde a los 30 días, y para entonces lo aeróbico hace rato que
  // cayó. El umbral es el escalón más chico que el objetivo ya define — no uno
  // nuevo —, y coincide con lo que `docs/research/03` documenta.
  const primerEscalon = Math.min(...params.detraining.map((step) => step.days));
  const hayCardio = sessions.some((s) => s.items.some((i) => i.targetDurationSeconds !== null));
  if (hayCardio && daysSinceLastSession >= primerEscalon) {
    out.push(rule.cardioNote.replace('{dias}', String(daysSinceLastSession)));
  }

  return out;
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
  // dijo que puede hacer. **Solo se acota por arriba.** Subirla hasta el mínimo
  // de la plantilla —lo que hacía antes— medía una semana que el socio no iba a
  // hacer, y así el aviso de volumen bajo nunca se disparaba justo para quien va
  // menos veces. Ver `docs/research/11`.
  const perWeek = Math.min(goal.sessionsPerWeekTarget, template.sessionsPerWeek[1]);

  const week = sessions.slice(0, perWeek);
  const setsByMuscle = new Map<MuscleGroup, number>();
  // El piso se mide solo sobre los músculos que el plan trabaja con algún
  // compuesto: son los que el programa apunta de verdad. Un bíceps que recibe
  // dos series de un curl no está "sub-dosificado" — es trabajo incidental, y
  // avisar por eso en cada plan convierte los avisos en ruido que nadie lee.
  const targeted = new Set<MuscleGroup>();

  for (const item of week.flatMap((s) => s.items)) {
    const exercise = exerciseById.get(item.exerciseId);
    // Lo explosivo no cuenta: los rangos semanales se midieron con series de
    // fuerza llevadas cerca del fallo (`docs/research/35`), y cinco saltos que
    // se cortan cuando baja la altura no son eso. Contarlos avisaba "glúteos
    // 27, pasás el techo" a un futbolista por los saltos del par.
    if (!exercise || fueraDeLaDosis(exercise)) continue;
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

  // "Con 1 sesiones por semana" — lo leía un socio que eligió entrenar una vez
  // por semana, que es una opción válida del onboarding.
  const frecuencia = `Con ${sesiones(perWeek)} por semana`;

  const warnings: string[] = [];
  if (over.length > 0) {
    warnings.push(
      `${frecuencia}, estos músculos pasan las ${maxSetsPerMuscle} series semanales que la evidencia marca como techo útil: ${list(over)}. Más volumen ahí no rinde más.`,
    );
  }
  if (under.length > 0) {
    warnings.push(
      `${frecuencia}, estos músculos quedan abajo de las ${minSetsPerMuscle} series semanales mínimas: ${list(under)}. Sumar una sesión más por semana los cubre.`,
    );
  }

  return warnings;
}

// ------------------------------------------------------------------ día de partido

/**
 * Ajusta la sesión de hoy según dónde cae respecto del partido.
 *
 * **No entra en `generatePlan` a propósito.** El plan es una cola ordenada sin
 * fechas: cuál sesión toca hoy se sabe recién hoy, y si el partido se pospone
 * el plan no tiene que regenerarse. El socio lo declara al empezar la sesión.
 *
 * Baja volumen, nunca intensidad ni repeticiones: es lo que hace la literatura
 * de tapering, y el nulo de pesado-vs-liviano no deja tocar la carga.
 */
function adjustForMatchDay(input: AdjustSessionInput): SessionAdjustment {
  const rule = input.ruleset.sports?.matchDay?.[input.state];
  if (!rule) return { items: input.items, note: null, changed: false };

  const exerciseById = new Map(input.gym.exercises.map((e) => [e.id, e]));
  const dropped: string[] = [];
  const droppedRest = new Map<number, number>();
  const items: SessionItemBlueprint[] = [];
  let scaled = 0;

  for (const item of input.items) {
    const exercise = exerciseById.get(item.exerciseId);
    const adjusted = adjustItem(item, exercise, rule);

    if (adjusted === null) {
      dropped.push(exercise?.name ?? item.exerciseId);
      if (item.supersetGroup !== null) droppedRest.set(item.supersetGroup, item.restSeconds);
      continue;
    }
    if (adjusted !== item) scaled += 1;
    items.push(adjusted);
  }

  const changed = dropped.length > 0 || scaled > 0;
  const detail = dropped.length > 0 ? ` Hoy se sacan: ${dropped.join(', ')}.` : '';
  return {
    items: desarmarParesRotos(items, droppedRest),
    note: changed ? `${rule.note}${detail}` : null,
    changed,
  };
}

/**
 * Si el día saca el explosivo de un par, el levantamiento queda solo con la
 * pausa corta de adentro del par (la que iba antes del salto). Vuelve a ser un
 * ejercicio suelto, con el descanso de la vuelta, que era el del explosivo.
 */
function desarmarParesRotos(
  items: readonly SessionItemBlueprint[],
  droppedRest: ReadonlyMap<number, number>,
): SessionItemBlueprint[] {
  const miembros = new Map<number, number>();
  for (const it of items) {
    if (it.supersetGroup !== null) {
      miembros.set(it.supersetGroup, (miembros.get(it.supersetGroup) ?? 0) + 1);
    }
  }
  return items.map((it) => {
    if (it.supersetGroup === null || (miembros.get(it.supersetGroup) ?? 0) > 1) return it;
    const vuelta = droppedRest.get(it.supersetGroup) ?? it.restSeconds;
    return { ...it, supersetGroup: null, restSeconds: Math.max(it.restSeconds, vuelta) };
  });
}

type MatchDayRule = NonNullable<NonNullable<Ruleset['sports']>['matchDay']>[MatchDayState];

/**
 * El ítem con el volumen de hoy, el mismo ítem si no cambia, o `null` si hoy no
 * se hace. Devolver la misma referencia cuando no cambia es lo que deja saber
 * si la sesión se tocó de verdad: crear un objeto nuevo siempre hacía que un
 * día normal reportara un ajuste que no existía.
 */
function adjustItem(
  item: SessionItemBlueprint,
  exercise: Exercise | undefined,
  rule: MatchDayRule,
): SessionItemBlueprint | null {
  // El cardio no se prescribe en series: escalarlo por un multiplicador de
  // volumen de sala no significa nada. Se deja como está.
  if (!exercise || item.targetDurationSeconds !== null) return item;
  if (rule.avoidExplosive && exercise.isExplosive) return null;

  const multiplier = isLowerBody(exercise)
    ? rule.lowerBodyVolumeMultiplier
    : rule.upperBodyVolumeMultiplier;

  // Cero es "hoy esto no se hace": se saca en vez de mostrarlo vacío. Es lo que
  // pasa con la pierna el mismo día del partido.
  if (multiplier === 0) return null;

  // Redondeo, no truncamiento: con el volumen ya bajado por la temporada un
  // ejercicio queda en 2 series, y truncar 2 × 0,5 hacia abajo lo borraba del
  // plan. El recorte del partido baja volumen, no saca ejercicios.
  const targetSets = Math.max(1, Math.round(item.targetSets * multiplier));
  return targetSets === item.targetSets ? item : { ...item, targetSets };
}

/**
 * Qué decirle a quien tiene cardio y pierna en el mismo plan.
 *
 * **No se mira si caen en la misma sesión**, y es a propósito: el subgrupo de
 * misma sesión contra días separados no mostró ninguna diferencia, así que
 * condicionar el aviso a que coincidan sería aplicar la regla que justamente se
 * cayó. Lo que discriminó fue la modalidad, y eso vale igual en cualquier día.
 *
 * Sale una sola vez por plan: el efecto medido es chico y a nivel de músculo
 * entero no aparece, así que repetirlo por sesión lo convertiría en ruido.
 */
/**
 * UN PLAN DE POTENCIA SIN NADA EXPLOSIVO LO DICE
 *
 * La app ofrece este objetivo como "Potencia / explosividad — moverte más
 * rápido y más explosivo", y toda la prescripción del bloque `power` está
 * escrita para movimientos explosivos: la investigación habla de "3-5 series
 * para ejercicios explosivos", "trabajo explosivo", "saltos asistidos", y de
 * repeticiones bajas "para mantener velocidad máxima"
 * (`01-fuerza-hipertrofia-potencia.md`).
 *
 * Desde el 18/09/2026 lo explosivo entra solo, en par con el levantamiento de
 * su patrón (`addExplosivePairs`, `docs/research/37`). Este aviso queda para
 * cuando no entra: una molestia declarada, la edad por encima de la que cubren
 * los ensayos, o un nivel sin ningún explosivo a su alcance. El plan **no
 * puede prometer explosividad y entregar series lentas sin decirlo**: es la
 * regla dura 4 aplicada a la selección en vez de a los números.
 */
function powerWarnings(
  sessions: readonly SessionBlueprint[],
  gym: GymSnapshot,
  goal: UserGoal,
  ruleset: Ruleset,
): string[] {
  if (goal.goal !== 'power') return [];

  const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));
  const hayExplosivo = sessions
    .flatMap((s) => s.items)
    .some((item) => exerciseById.get(item.exerciseId)?.isExplosive === true);

  if (hayExplosivo) return [];

  const edad = ruleset.explosive ? `, pasados los ${ruleset.explosive.maxAge} años` : '';
  return [
    `Este plan no trae saltos ni lanzamientos: con una molestia declarada${edad} o sin la ` +
      'técnica que piden, no se suman solos. Se entrena con series cortas y rápidas sobre ' +
      'los ejercicios de siempre. Si buscás explosividad, consultalo con el staff.',
  ];
}

function interferenceWarnings(
  sessions: readonly SessionBlueprint[],
  gym: GymSnapshot,
  ruleset: Ruleset,
): string[] {
  const rule = ruleset.cardio?.interference;
  if (!rule) return [];

  const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));
  let cardio = false;
  let pierna = false;
  for (const item of sessions.flatMap((s) => s.items)) {
    const exercise = exerciseById.get(item.exerciseId);
    if (!exercise) continue;
    if (exercise.pattern === 'cardio') cardio = true;
    // Caminar talón-punta no es "pierna" en el sentido de la interferencia,
    // que se midió con fuerza de tren inferior.
    else if (!PATRONES_DE_BLOQUE.includes(exercise.pattern) && isLowerBody(exercise)) pierna = true;
  }

  return cardio && pierna ? [rule.note] : [];
}

function isLowerBody(exercise: Exercise): boolean {
  return exercise.primaryMuscles.some((m) => LOWER_BODY_MUSCLES.includes(m));
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
  const { context, user, gym, ruleset, resolvedProposals } = input;
  // El contrato pide el historial de más reciente a más viejo y toda la lógica de
  // abajo lo da por cierto: `proposeAbsenceDeload` toma la primera serie como la
  // última que hizo, y `isReadyToIncrease` mira las primeras N.
  //
  // Un comentario no es una garantía. Medido pasándole el mismo historial al
  // revés: el motor le propone a alguien que entrenó **hoy** cortar el volumen a
  // la mitad porque "pasaron 100 días". La app lo ordena bien hoy
  // (`.order('completed_at', { ascending: false })` en `adaptation.ts`), pero es
  // una línea que alguien puede tocar sin saber que de eso depende la adaptación
  // entera, y el error no rompe nada: sale una propuesta absurda y nadie se
  // entera.
  //
  // Ordenarlo acá cuesta un sort sobre un array acotado y vuelve imposible esa
  // clase de error. Con el orden correcto no cambia nada.
  // Se compara por instante y no por texto: dos ISO válidos del mismo momento
  // pueden escribirse distinto (`Z` contra `+00:00`) y ordenarlos alfabéticamente
  // los pondría en cualquier lado. `Date.parse` no lee el reloj, así que el motor
  // sigue siendo puro.
  const history = [...input.history].sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
  );
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
  // VOLVER DESPUÉS DE UNA AUSENCIA NO SE MEZCLA CON PROGRESAR
  //
  // Las reglas por ejercicio miran las últimas series del historial. Después de
  // una ausencia esas series son de **antes** de la ausencia, y no describen a
  // la persona que volvió. Medido: a alguien que no entrenaba hacía 100 días el
  // motor le daba las dos propuestas juntas —"arrancamos con menos volumen" y
  // "te sobraron repeticiones las últimas 2 veces, ¿subimos la carga?"—, donde
  // "las últimas 2 veces" fueron hace más de tres meses.
  //
  // No es solo incoherente de leer. `03-progresion-descarga.md` dice que las
  // reglas de desentrenamiento existen "para evitar prescribir cargas lesivas
  // tras ausencias de 10, 30 o 90 días", y que a los 90 "el tejido conectivo
  // pierde rigidez y tolerancia a la tracción, elevando el riesgo de lesiones si
  // se retorna con cargas máximas" (Mujika y Padilla, 2000 y 2001). Proponer
  // subir carga al volver es exactamente lo que esa sección pide evitar.
  //
  // El plan nuevo ya baja la carga solo, con `detrainingMultiplier`. Lo único
  // que agregaban estas propuestas encima era ruido calculado sobre datos que
  // caducaron.
  if (absence) return [absence];

  for (const [exerciseId, sets] of groupTopSetsByExercise(history)) {
    if (wasRecentlyRejected(resolvedProposals, exerciseId)) continue;
    const exercise = exerciseById.get(exerciseId);
    // Lo explosivo se regula por la calidad de cada repetición (altura,
    // velocidad), no por repeticiones en reserva ni por kilos: subirle la carga
    // a un salto porque "le sobraron" lo vuelve más lento, que es lo contrario
    // de lo que busca. `docs/research/22` y `37`.
    if (!exercise || fueraDeLaDosis(exercise)) continue;

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
  // Esta guarda carga más peso del que parece en los objetivos sin `rirTarget`.
  // En potencia `proposeIncrease` se corta antes por el RIR nulo, así que esto es
  // lo único que separa "va sobrado" de "está clavado trabajando duro": con RIR
  // alto no sale nada (y el plan avisa por qué), con RIR bajo sale la descarga.
  // Eso está bien —el RIR sirve de filtro aunque el objetivo no lo prescriba como
  // meta— pero depende de `triggerRirAtLeast`, y el de potencia es el único del
  // ruleset que no se deriva de nada: en los otros doce bloques vale exactamente
  // `rirTarget + 1`, y potencia no tiene `rirTarget`. Medido: puesto en 10, el
  // socio que va sobrado recibe `stalled`, o sea una semana liviana a alguien al
  // que le falta peso.
  //
  // Ningún test puede frenar eso leyendo el número del ruleset: se adapta al
  // valor que encuentra. Lo que sí se fija es la relación entre los dos números
  // y que potencia es la única excepción — `placeholder-engine.test.ts`, "un
  // objetivo sin señal de RIR".
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

/**
 * Con qué se cuenta el ejercicio: segundos o repeticiones.
 *
 * No es la `modality` entera. `reps_weight` y `reps_bodyweight` se cuentan
 * igual —el press de banco y las flexiones son 10 repeticiones— y separarlas
 * descartaría los equivalentes más obvios del gimnasio. Lo que no se puede
 * mezclar es sostener con repetir: ver `requireSameMeasure` en `ruleset.ts`.
 */
function porTiempo(exercise: Exercise): boolean {
  return exercise.modality === 'time';
}

function findSubstitutes(input: FindSubstitutesInput): readonly SubstituteOption[] {
  const { item, gym, constraints, unavailableEquipmentIds, ruleset } = input;
  const cfg = ruleset.substitution;

  const original = gym.exercises.find((e) => e.id === item.exerciseId);
  if (!original) return [];

  const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));
  const blocked = new Set(unavailableEquipmentIds);
  if (item.equipmentId) blocked.add(item.equipmentId);

  // Se guarda la fila entera, no solo `equivalence`: `note` es lo que el
  // staff escribió para explicar POR QUÉ dos ejercicios son equivalentes
  // (`/panel`, `useCreateSubstitution`), y hasta acá se leía de la base y se
  // tiraba sin usar — el reemplazo llegaba con el mismo texto genérico que
  // uno calculado automáticamente, perdiendo la única razón de cargarlo a
  // mano en vez de dejar que `scoreEquivalence` lo calcule solo.
  const explicit = new Map(
    gym.substitutions.filter((s) => s.exerciseId === original.id).map((s) => [s.substituteId, s]),
  );

  // Las mismas reglas de dolor que armaron el plan.
  //
  // Hasta acá este camino no las miraba, y era un agujero: medido sobre el
  // catálogo real, alguien con la rodilla lesionada en severidad 5 recibía un
  // plan sin una sola sentadilla —la regla saca el patrón entero y el cuádriceps
  // — y después, tocando "cambiar ejercicio", se le ofrecían sentadilla hack,
  // sentadilla con cinturón y sentadilla en Smith. El plan protegía la rodilla
  // y el botón la desprotegía en dos toques.
  //
  // Vale también para las equivalencias cargadas a mano: el staff carga una
  // equivalencia mirando el ejercicio, no la lesión de cada socio.
  const avoidRules = activePainRules(ruleset, constraints, 'avoid');

  /**
   * Lo que descalifica a un candidato antes de mirar cuánto se parece.
   *
   * Los tres `require*` son la misma idea en tres ejes, y ninguno se puede
   * expresar con el puntaje: `scoreEquivalence` solo mira patrón y músculos
   * primarios, así que dos ejercicios que se hacen de forma incompatible pueden
   * puntuar 1,00. Una equivalencia curada a mano los cruza los tres: si el
   * staff la escribió, sabe algo que el puntaje no.
   */
  const descartado = (candidate: Exercise, curatedEdge: SubstitutionEdge | undefined) =>
    candidate.id === original.id ||
    isBlocked(candidate, constraints) ||
    isBlockedByPain(candidate, avoidRules) ||
    !hasUsableEquipment(candidate, gym, [...blocked]) ||
    // El mismo trabajo de otra forma, no otro trabajo.
    (!curatedEdge && cfg.requireSamePattern && candidate.pattern !== original.pattern) ||
    // Medido en segundos o en repeticiones, no en las dos. Aceptar el cambio no
    // reescribe la prescripción, así que cruzar acá deja al socio con las series
    // del original sobre un ejercicio que no se cuenta así.
    (!curatedEdge && cfg.requireSameMeasure && porTiempo(candidate) !== porTiempo(original)) ||
    // Explosivo o no: en un salto o un swing, la velocidad ES el ejercicio.
    (!curatedEdge &&
      cfg.requireSameExplosiveness &&
      candidate.isExplosive !== original.isExplosive);

  const options: SubstituteOption[] = [];

  for (const candidate of gym.exercises) {
    const curatedEdge = explicit.get(candidate.id);
    if (descartado(candidate, curatedEdge)) continue;

    const equivalence = curatedEdge?.equivalence ?? scoreEquivalence(original, candidate, cfg);
    // El piso de confianza es del cálculo automático, no de una equivalencia
    // cargada a mano: si el staff la escribió, ya decidió que es un reemplazo
    // válido, y aplicarle el mismo `minEquivalence` filtraba en silencio
    // cualquier curación por debajo del piso — se guardaba en /panel, se veía
    // en la lista de "equivalencias cargadas", y nunca le llegaba a nadie, sin
    // ningún error que lo avisara.
    if (!curatedEdge && equivalence < cfg.minEquivalence) continue;

    const equipment = firstAvailableEquipment(candidate, equipmentById, blocked);
    options.push({
      exerciseId: candidate.id,
      equipmentId: equipment?.id ?? null,
      equivalence: Math.round(equivalence * 100) / 100,
      reason: substituteReason(original.name, curatedEdge),
      curated: !!curatedEdge,
    });
  }

  return options
    .sort((a, b) => b.equivalence - a.equivalence || a.exerciseId.localeCompare(b.exerciseId))
    .slice(0, cfg.maxOptions);
}

/**
 * La nota que escribió el staff manda sobre el texto genérico: es la única
 * razón de cargar una equivalencia a mano en vez de dejar que
 * `scoreEquivalence` la calcule sola.
 */
function substituteReason(originalName: string, curatedEdge: SubstitutionEdge | undefined): string {
  if (!curatedEdge) return `Mismo patrón de movimiento y músculos parecidos que ${originalName}.`;
  return curatedEdge.note ?? `Reemplazo equivalente cargado a mano para ${originalName}.`;
}

// ------------------------------------------------------------------ helpers

/**
 * EL PLAN NO ENTRA EN EL TIEMPO QUE LA PERSONA DIJO TENER
 *
 * El onboarding pregunta los minutos por sesión, Perfil los muestra de vuelta, y
 * el motor no los leía — está anotado en CLAUDE.md como deuda desde hace rato.
 * Quien contestaba "tengo 30 minutos" recibía el mismo plan que quien tiene 90,
 * y la pantalla le prometía los 55 minutos fijos de la plantilla.
 *
 * Lo que se compara acá no es una estimación de cuánto dura la sesión, que
 * obligaría a suponer cuánto tarda una serie. Es el **descanso solo**, que sale
 * entero del ruleset: una sesión no puede durar menos que la suma de sus
 * descansos. Si eso ya no entra, el plan no entra, y no hizo falta inventar
 * nada para saberlo.
 *
 * Se mira la sesión más larga de la plantilla y no el promedio: el socio no
 * entrena promedios, entrena días.
 */
/**
 * Avisa cuando el objetivo elegido no tiene señal que la app pueda leer para
 * decidir subir la carga.
 *
 * Se pregunta por `rirTarget` y no por `goal === 'power'` porque la condición es
 * la falta de señal, no el nombre del objetivo: si mañana otro queda sin RIR
 * objetivo, el aviso sale igual y nadie tiene que acordarse de agregarlo acá.
 */
function autoregulationWarnings(params: GoalParams, ruleset: Ruleset, goal: UserGoal): string[] {
  const rule = ruleset.modifiers?.autoregulation;
  if (!rule || params.primary.rirTarget !== null) return [];
  return [rule.noSignalForGoal.replace('{objetivo}', goalLabel(goal.goal))];
}

function sessionLengthWarnings(
  sessions: readonly SessionBlueprint[],
  ruleset: Ruleset,
  goal: UserGoal,
): string[] {
  const rule = ruleset.modifiers?.sessionLength;
  if (!rule || goal.sessionMinutesTarget <= 0) return [];

  const descansoDe = (s: SessionBlueprint) =>
    s.items.reduce((total, i) => total + i.targetSets * i.restSeconds, 0);

  const peor = Math.max(0, ...sessions.map(descansoDe));
  const minutos = Math.round(peor / 60);
  if (minutos <= goal.sessionMinutesTarget) return [];

  return [
    rule.overTargetNote
      .replace('{declarados}', String(goal.sessionMinutesTarget))
      .replace('{descanso}', `${minutos} minutos`),
  ];
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

function availableEquipment(
  exercise: Exercise,
  equipmentById: ReadonlyMap<Id, Equipment>,
  blocked: ReadonlySet<Id> = new Set(),
): Equipment[] {
  const out: Equipment[] = [];
  for (const id of exercise.equipmentIds) {
    const equipment = equipmentById.get(id);
    if (equipment?.isActive && !blocked.has(id)) out.push(equipment);
  }
  return out;
}

function firstAvailableEquipment(
  exercise: Exercise,
  equipmentById: ReadonlyMap<Id, Equipment>,
  blocked: ReadonlySet<Id> = new Set(),
): Equipment | undefined {
  return availableEquipment(exercise, equipmentById, blocked)[0];
}

/**
 * Cuál de las estaciones que sirven para este ejercicio se le asigna. Las
 * estaciones de un mismo ejercicio son intercambiables por definición —si no lo
 * fueran, serían ejercicios distintos—, así que acá no hay ninguna decisión de
 * prescripción: elegir siempre la primera no hacía el plan mejor, solo mandaba
 * a todo el gimnasio a la misma máquina.
 *
 * Es lo que hacía que "Dorsalera al pecho" y "Dorsalera con agarre neutro",
 * dos ejercicios distintos apuntando a las mismas dos estaciones, cayeran
 * siempre en el mismo Lat Pulldown.
 */
function pickEquipment(
  exercise: Exercise,
  equipmentById: ReadonlyMap<Id, Equipment>,
  rng: () => number,
): Equipment | undefined {
  return pickDeterministic(availableEquipment(exercise, equipmentById), rng);
}

interface ChooseExerciseInput {
  readonly pattern: MovementPattern;
  readonly role: SlotRole;
  readonly pool: readonly Exercise[];
  readonly used: ReadonlySet<Id>;
  readonly usedInPlan: ReadonlySet<Id>;
  readonly rotateAway: ReadonlySet<Id>;
  readonly setsByMuscle: ReadonlyMap<MuscleGroup, number>;
  readonly level: ExperienceLevel;
  readonly selection: Ruleset['selection'];
  /**
   * Músculos del gesto del deporte. Solo desempata entre ejercicios que ya
   * pasaron todo lo demás: el deporte no cambia la dosis, porque cargas
   * pesadas y livianas dan el mismo rendimiento deportivo (SMD −0,03,
   * I² = 0%). Vacío si no practica ninguno.
   */
  readonly emphasis: readonly MuscleGroup[];
  /**
   * Si la dosis de este rol se regula por repeticiones en reserva. Sale del
   * ruleset (`rirTarget !== null`), no de una lista de objetivos: hoy es todo
   * menos potencia.
   */
  readonly regulatedByRir: boolean;
  readonly rng: () => number;
}

/**
 * Se queda con los mejores según `score` (más bajo es mejor), abriendo de a
 * escalones completos hasta juntar al menos `floor` opciones. Nunca parte un
 * empate: si el escalón que cruza el piso tiene cinco ejercicios, entran los
 * cinco. Es la versión gradual de "quedate con el mejor": conserva el orden de
 * preferencia sin dejar el slot con una única opción.
 */
function preferRanked(
  list: readonly Exercise[],
  score: (e: Exercise) => number,
  floor: number,
): readonly Exercise[] {
  if (list.length <= floor) return list;
  const tiers = [...new Set(list.map(score))].sort((a, b) => a - b);

  const kept: Exercise[] = [];
  for (const tier of tiers) {
    kept.push(...list.filter((e) => score(e) === tier));
    if (kept.length >= floor) break;
  }
  return kept;
}

/**
 * TRABAJO COMPLEMENTARIO CUANDO UNA MOLESTIA SACÓ TODO UN PATRÓN
 *
 * Hasta acá, si una molestia lumbar sacaba todo el patrón `hinge`, el día
 * quedaba con un ejercicio menos y un aviso explicando por qué. Eso es honesto
 * y es lo que menos ayuda: quien vino a entrenar se va con menos entrenamiento
 * justo el día que le duele algo, que es cuando más importa sostener el hábito.
 *
 * Lo que hace esto es buscar, entre los ejercicios que **sí** puede hacer, los
 * que mueven los músculos que ese patrón cubría en **este** gimnasio. No hay
 * ninguna tabla de "qué reemplaza a qué": los músculos objetivo salen del
 * catálogo real (qué entrenan los ejercicios de ese patrón acá), y los
 * candidatos salen del mismo `pool` que ya pasó por las restricciones, el
 * nivel y el equipamiento disponible. Un ejercicio bloqueado por la molestia
 * nunca puede aparecer como complemento, porque nunca estuvo en el `pool`.
 *
 * **El músculo tiene que definir al patrón, no aparecer una vez.** La primera
 * versión unía los músculos de todos los ejercicios del patrón, y eso alcanzó
 * para que a alguien con la rodilla lesionada el motor le pusiera un press de
 * hombro donde iba la sentadilla: de las ocho sentadillas del catálogo real, el
 * wall ball es la única que declara `front_delts`, y ese único caso metió los
 * hombros en la lista de "músculos de la sentadilla". Así que cada músculo se
 * pesa por en cuántos ejercicios del patrón aparece y solo cuentan los que
 * están en más de la mitad. Para la sentadilla eso deja cuádriceps y glúteos,
 * que es lo que una sentadilla es.
 *
 * Entre los que empatan gana el que menos trabajo lleva en la semana — el mismo
 * criterio que el slot de aislamiento, para no apilar series sobre lo que ya
 * está cubierto.
 */
function chooseComplement(input: {
  readonly pattern: MovementPattern;
  readonly pool: readonly Exercise[];
  readonly gymExercises: readonly Exercise[];
  readonly used: ReadonlySet<Id>;
  readonly setsByMuscle: ReadonlyMap<MuscleGroup, number>;
  readonly avoidExplosive: boolean;
  readonly rng: () => number;
}): Exercise | undefined {
  const { pattern, pool, gymExercises, used, setsByMuscle, avoidExplosive, rng } = input;

  // Se mira el catálogo entero y no el `pool`: el pool ya tiene sacados
  // justamente los ejercicios que la molestia bloqueó, y son los que definen
  // qué hay que compensar.
  const delPatron = gymExercises.filter((e) => e.pattern === pattern);
  if (delPatron.length === 0) return undefined;

  const frecuencia = new Map<MuscleGroup, number>();
  for (const e of delPatron) {
    for (const m of e.primaryMuscles) frecuencia.set(m, (frecuencia.get(m) ?? 0) + 1);
  }
  // "En más de la mitad", sin constante que alguien pueda tocar: dos veces la
  // cuenta supera al total. Un músculo que está en la mitad justa no define.
  const nucleo = new Set(
    [...frecuencia].filter(([, veces]) => veces * 2 > delPatron.length).map(([m]) => m),
  );
  if (nucleo.size === 0) return undefined;

  const candidatos = pool.filter(
    (e) =>
      e.pattern !== pattern &&
      !used.has(e.id) &&
      !(avoidExplosive && e.isExplosive) &&
      // El complemento hereda la prescripción del slot: series y repeticiones.
      // Cardio y movilidad declaran músculos (la escaladora, glúteos) y por
      // solapamiento le ganaban el lugar del peso muerto a la patada de glúteo.
      !porTiempo(e) &&
      e.pattern !== 'cardio' &&
      e.pattern !== 'mobility' &&
      e.primaryMuscles.some((m) => nucleo.has(m)),
  );
  if (candidatos.length === 0) return undefined;

  // Más músculos en común primero; entre iguales, el que menos volumen acumuló.
  const solapamiento = (e: Exercise) => e.primaryMuscles.filter((m) => nucleo.has(m)).length;
  const mejor = Math.max(...candidatos.map(solapamiento));
  const empatados = candidatos.filter((e) => solapamiento(e) === mejor);
  const menosTrabajado = preferRanked(
    empatados,
    (e) => Math.min(...e.primaryMuscles.map((m) => setsByMuscle.get(m) ?? 0)),
    1,
  );

  return pickDeterministic(menosTrabajado, rng);
}

/**
 * Qué hacer con un slot que quedó sin ejercicio.
 *
 * Siempre devuelve un aviso, porque el socio tiene derecho a saber que su plan
 * no salió como el de cualquier otro. Devuelve además un ejercicio cuando pudo
 * sustituir: una molestia cambia **qué** se entrena, no si se entrena.
 */
function resolverSlotVacio(input: {
  readonly pattern: MovementPattern;
  readonly sessionLabel: string;
  readonly pool: readonly Exercise[];
  readonly gym: GymSnapshot;
  readonly constraints: readonly UserConstraint[];
  readonly avoidRules: readonly PainRule[];
  readonly level: ExperienceLevel;
  readonly safety: Ruleset['safety'];
  readonly used: ReadonlySet<Id>;
  readonly setsByMuscle: ReadonlyMap<MuscleGroup, number>;
  readonly rng: () => number;
}): { readonly exercise?: Exercise; readonly warning: string } {
  const { pattern, sessionLabel, pool, gym, constraints, avoidRules, level, safety } = input;
  const vacio = { pattern, gym, constraints, avoidRules, level };

  const sinSustituto = {
    warning: `En ${sessionLabel} no quedó ningún ejercicio de ${patternLabel(pattern)}: ${porQueNoHay(vacio)}`,
  };

  // Las otras tres causas —el catálogo vacío, el nivel, la estación fuera de
  // servicio— no tienen nada que sustituir: no es que el socio no pueda hacer
  // el movimiento, es que acá no se puede hacer. Ahí el aviso es la respuesta.
  const sustitucion = safety?.painSubstitution;
  if (!sustitucion || causaDeVacio(vacio) !== 'bloqueado') return sinSustituto;

  const complemento = chooseComplement({
    pattern,
    pool,
    gymExercises: gym.exercises,
    used: input.used,
    setsByMuscle: input.setsByMuscle,
    avoidExplosive: sustitucion.avoidExplosive,
    rng: input.rng,
  });
  if (!complemento) return sinSustituto;

  const zona = zonaQueBloqueo({ pattern, gym, constraints, avoidRules });
  const plantilla = zona
    ? sustitucion.text.replace('{region}', regionLabel(zona))
    : sustitucion.textSinZona;

  return {
    exercise: complemento,
    warning: plantilla
      .replace('{session}', sessionLabel)
      .replace('{pattern}', patternLabel(pattern)),
  };
}

function chooseExercise(input: ChooseExerciseInput): Exercise | undefined {
  const { pattern, role, used, usedInPlan, rotateAway, setsByMuscle, selection, rng } = input;
  const candidates = input.pool
    .filter((e) => e.pattern === pattern && !used.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (candidates.length === 0) return undefined;

  // Cada preferencia se aplica solo si deja algo: es mejor un ejercicio menos
  // ideal que un patrón sin cubrir.
  const prefer = (list: readonly Exercise[], keep: (e: Exercise) => boolean) => {
    const kept = list.filter(keep);
    return kept.length > 0 ? kept : list;
  };

  // Igual que `prefer`, pero además se saltea si dejaría el slot con menos
  // opciones que el piso del ruleset. Un pool de una sola opción no es una
  // elección: es el mismo ejercicio —y la misma máquina— para todos los socios
  // del mismo perfil, aunque el catálogo tenga alternativas equivalentes.
  const floor = selection?.minPoolSize ?? 1;
  const preferSoft = (list: readonly Exercise[], keep: (e: Exercise) => boolean, piso = floor) => {
    const kept = list.filter(keep);
    if (kept.length === 0) return list;
    // El piso se topea con lo que hay. Antes la guarda era
    // `list.length > floor && kept.length < floor`, y con `minPoolSize` 3 un
    // pool de 2 nunca entraba (2 > 3 es falso): el filtro lo colapsaba a 1 sin
    // ninguna protección, o sea que el piso cuidaba los pools grandes —que no
    // lo necesitan— y dejaba sin cuidar a los chicos, que es donde quedarse con
    // una sola opción duele.
    //
    // Medido sobre el catálogo real, 30 socios del mismo perfil: el tirón
    // horizontal quedaba en 2 candidatos después de filtrar por modalidad y por
    // compuestos, la tolerancia de nivel dejaba 1, y **el 100% de los socios
    // intermedios hacía remo con mancuerna a una mano, en las dos sesiones de
    // la semana**, con el remo sentado disponible y sin usar.
    if (kept.length < Math.min(piso, list.length)) return list;
    return kept;
  };

  // 1. Rotar respecto del plan anterior.
  let eligible = preferSoft(candidates, (e) => !rotateAway.has(e.id));

  // 2. Fuera del cardio, uno que se mida en repeticiones. El ruleset prescribe
  //    series, repeticiones y RIR: nada de eso aplica a una plancha, que se
  //    sostiene por tiempo. Decirle a alguien "2×6-10 de plancha" no significa
  //    nada.
  if (pattern !== 'cardio') {
    eligible = prefer(eligible, (e) => e.modality !== 'time');
  }

  // 2b. Donde la dosis se regula por RIR, uno que no sea explosivo.
  //
  //     Un salto no se hace "dejando dos en reserva": se corta cuando cae la
  //     velocidad, no cuando se acerca el fallo. El propio ruleset lo dice al
  //     poner `rirTarget: null` en potencia ("se regula por velocidad"), y
  //     `22-carga-de-potencia.md` lo sostiene con dos metaanálisis: la carga y
  //     la dosis de lo explosivo dependen del ejercicio, no del objetivo.
  //
  //     Sin esto el selector no distinguía, y lo explosivo entraba a planes de
  //     hipertrofia con la receta de hipertrofia. Medido en la matriz: "Salto al
  //     cajón 3×8-15, RIR 2, 90 s" en dos perfiles. Quince saltos al cajón con
  //     dos en reserva no es una prescripción de nada.
  //
  //     Es `prefer` y no un filtro: si el patrón solo tuviera explosivos, se
  //     cubre igual antes que dejar el slot vacío.
  //
  //     Y vale también donde no hay RIR (potencia): lo explosivo entra por un
  //     solo camino, pegado al levantamiento de su patrón (`addExplosivePairs`),
  //     con su propia dosis. En un slot común recibiría la del slot —"wall ball
  //     3×1-3 al 30-60 % 1RM"—, que no es la de un lanzamiento.
  eligible = prefer(eligible, (e) => !e.isExplosive);

  // 3. En el ejercicio principal, uno al que se le pueda subir la carga. Toda la
  //    progresión se mide en kilos: si el ejercicio más importante de la sesión
  //    es de peso corporal, no hay nada que progresar ahí.
  if (role === 'primary') {
    eligible = prefer(eligible, (e) => e.modality === 'reps_weight');
  }

  // 4. Los compuestos antes que los aislados.
  eligible = prefer(eligible, (e) => e.isCompound);

  // 5. Cerca del nivel de la persona, con la tolerancia que fija el ruleset.
  //
  //    Antes acá se colapsaba al nivel MÁS ALTO del pool, con el argumento de
  //    que a un avanzado no se le manda una sentadilla goblet a 1-5
  //    repeticiones porque no hay kettlebell que aguante esa carga. El
  //    argumento vale para el extremo, pero el filtro era mucho más duro que
  //    eso: a un socio intermedio le dejaba UN solo ejercicio de sentadilla
  //    —el rack libre— con prensa, Smith y hack disponibles y sin usar. Todos
  //    los intermedios del gimnasio terminaban en la misma máquina.
  //
  //    Y no compraba nada a cambio: máquina, peso libre y polea dan la misma
  //    hipertrofia (Haugen 2023). "La variante más exigente" no tiene ningún
  //    ensayo detrás — por eso el bloque va con `confidence: "low"`.
  //
  //    Hacia arriba no se aflojó nada: `isWithinSkillLevel` sigue sin proponer
  //    un ejercicio que exija más técnica de la que la persona tiene.
  if (role !== 'isolation') {
    const tolerance = selection?.levelTolerance;
    if (tolerance !== undefined) {
      const own = EXPERIENCE_LEVELS.indexOf(input.level);
      eligible = preferSoft(
        eligible,
        (e) => own - EXPERIENCE_LEVELS.indexOf(e.skillLevel) <= tolerance,
      );
    }
  } else {
    // 6. En el aislado, el músculo que menos trabajo lleva. Es el único slot
    //    libre para equilibrar: sin esto el plan podía cerrar con más glúteo
    //    —que ya viene de sentadilla, bisagra y zancada— y dejar el tríceps sin
    //    tocar en toda la semana.
    //
    //    Se abre por escalones hasta llegar al piso del ruleset en vez de
    //    quedarse solo con el mínimo exacto. Quedarse con el mínimo dejaba el
    //    slot de `core` con un único ejercicio —todos apuntan a abdominales, así
    //    que el "menos trabajado" siempre empataba en el mismo— y mandaba al
    //    80% del gimnasio al mismo aparato de crunch.
    const volumeOf = (e: Exercise) =>
      Math.min(...e.primaryMuscles.map((m) => setsByMuscle.get(m) ?? 0));
    eligible = preferRanked(eligible, volumeOf, floor);
  }

  // 7. Los músculos del gesto del deporte, si practica alguno.
  //
  //    Va acá y no antes a propósito: es un desempate entre ejercicios que ya
  //    son buenos, nunca un cambio de dosis. Entrenar fuerza transfiere al
  //    deporte con efecto grande (SMD 1,16), pero cargas pesadas y livianas
  //    dan lo mismo (SMD −0,03, IC −0,38 a 0,31, I² = 0%) y la especificidad
  //    direccional está refutada (22 estudios, 578 participantes). Lo único
  //    que queda es elegir el ejercicio que toca el músculo del gesto cuando
  //    hay varios equivalentes.
  //
  //    Y es blanda: si el énfasis dejara el slot con menos opciones que el
  //    piso, se saltea. Un futbolista no puede terminar con el mismo plan que
  //    todos los otros futbolistas — eso es el problema que acabamos de
  //    arreglar, y el deporte no lo puede reintroducir.
  //
  //    Pero el piso acá es el suyo, no `minPoolSize`. Compartirlo dejaba el
  //    desempate casi sin efecto, porque el paso 6 ya deja el pool justo en ese
  //    piso: medido sobre el catálogo real y los 34 perfiles de la matriz,
  //    declarar el deporte cambiaba algo en 15 de 336 combinaciones con el piso
  //    compartido y en 39 con el suyo. Y no compra variedad: los slots que
  //    quedan con una sola opción para todos son los mismos 720 de 4320 con el
  //    piso en 3 que con el piso en 2. El detalle y lo que costaría bajarlo a 1
  //    están en `ruleset.ts`, sobre `emphasisMinPoolSize`.
  if (input.emphasis.length > 0) {
    const emphasized = new Set(input.emphasis);
    eligible = preferSoft(
      eligible,
      (e) => e.primaryMuscles.some((m) => emphasized.has(m)),
      selection?.emphasisMinPoolSize ?? floor,
    );
  }

  // 8. Y entre los que quedaron igual de buenos, uno que no esté ya en OTRA
  //    sesión de este mismo plan.
  //
  //    `used` evita repetir dentro de una sesión, pero se reinicia en cada
  //    una: un patrón que la plantilla pide en A y en B (horizontal_pull en
  //    full_body_ab, por ejemplo) recibía el mismo ejercicio las dos veces,
  //    con el resto del catálogo sin tocar — remo con mancuerna dos veces por
  //    semana mientras el remo sentado quedaba libre.
  //
  //    Va última a propósito: primero se elige un ejercicio bueno, y recién
  //    entre los empatados se desempata por variedad. Al revés, la variedad
  //    podría empujar hacia una opción peor. Y como toda preferencia acá, es
  //    preferencia y no requisito: si el patrón tiene un solo ejercicio
  //    disponible, se repite antes que dejar el slot vacío.
  //
  //    Es el mismo criterio que ya aplica `rotateAway` entre planes ("el
  //    músculo trabaja en ángulos distintos"), llevado al hueco que faltaba:
  //    entre sesiones del mismo plan.
  eligible = prefer(eligible, (e) => !usedInPlan.has(e.id));

  return pickDeterministic(eligible, rng);
}

/**
 * Qué músculos toca el plan, y cuáles quedan a un cambio de distancia.
 *
 * La cola repite las sesiones de la plantilla, así que a cada ejercicio se le
 * piden los equivalentes una sola vez: sin `vistos` se le preguntaba ocho veces
 * al mismo ítem para obtener siempre la misma respuesta.
 */
function musclesReachable(input: EmphasisWarningInput): {
  enElPlan: Set<MuscleGroup>;
  cambiando: Set<MuscleGroup>;
} {
  const { context, ruleset, gym, sessions, constraints } = input;
  const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));
  const enElPlan = new Set<MuscleGroup>();
  const cambiando = new Set<MuscleGroup>();
  const vistos = new Set<Id>();

  for (const item of sessions.flatMap((s) => s.items)) {
    for (const m of exerciseById.get(item.exerciseId)?.primaryMuscles ?? []) enElPlan.add(m);
    if (vistos.has(item.exerciseId)) continue;
    vistos.add(item.exerciseId);

    const opciones = findSubstitutes({
      context,
      item,
      gym,
      constraints,
      unavailableEquipmentIds: [],
      ruleset,
    });
    for (const opcion of opciones) {
      for (const m of exerciseById.get(opcion.exerciseId)?.primaryMuscles ?? []) cambiando.add(m);
    }
  }

  return { enElPlan, cambiando };
}

/**
 * EL DEPORTE APUNTA A UN MÚSCULO QUE EL PLAN NO TOCA
 *
 * `sports.catalog` le pone a cada deporte los músculos del gesto, para
 * desempatar la selección cuando hay varios ejercicios equivalentes. Cuando el
 * gimnasio no tiene con qué, el desempate no falla: no tiene sobre qué actuar,
 * y el socio no se entera — la nota de la categoría solo se muestra si el
 * deporte cambia el volumen, y `local_gesture` no lo cambia.
 *
 * **Se mira el plan y sus equivalentes, no el catálogo.** La primera versión de
 * esto preguntaba si el catálogo tenía, estructuralmente, algún ejercicio con
 * ese músculo primario en un patrón que alguna plantilla pidiera. Medido contra
 * los planes reales, esa pregunta se equivocaba en las dos direcciones:
 *
 * - **De más**: daba los oblicuos por imposibles porque la plancha se mide en
 *   tiempo y no entra sola a un slot. Pero sí aparece entre los equivalentes de
 *   los ejercicios de core, así que el socio puede cambiarla desde la sesión.
 *   Decirle "el gimnasio no tiene con qué" era falso.
 * - **De menos**: no marcaba el hombro posterior en tenis y pádel, porque
 *   estructuralmente hay ejercicios que lo tienen primario. En el plan que esos
 *   perfiles reciben no aparece en ninguna sesión ni entre los tres
 *   equivalentes de ningún ejercicio.
 *
 * Lo que el socio experimenta es su plan y lo que puede cambiar dentro de él.
 * Eso es lo que se mide.
 */
function emphasisWarnings(input: EmphasisWarningInput): string[] {
  const { ruleset, sport } = input;
  const sinNada = ruleset.sports?.emphasisUnreachableNote;
  const soloCambiando = ruleset.sports?.emphasisOnlyBySwapNote;
  if (!sport || sport.emphasis.length === 0) return [];

  const { enElPlan, cambiando } = musclesReachable(input);

  const faltan = sport.emphasis.filter((m) => !enElPlan.has(m));
  const avisos: string[] = [];

  const conCambio = faltan.filter((m) => cambiando.has(m));
  if (soloCambiando && conCambio.length > 0) {
    avisos.push(soloCambiando.replace('{muscles}', conCambio.map(muscleLabel).join(', ')));
  }

  const sinSalida = faltan.filter((m) => !cambiando.has(m));
  if (sinNada && sinSalida.length > 0) {
    avisos.push(sinNada.replace('{muscles}', sinSalida.map(muscleLabel).join(', ')));
  }

  return avisos;
}

interface EmphasisWarningInput {
  readonly context: EngineContext;
  readonly ruleset: Ruleset;
  readonly gym: GymSnapshot;
  readonly sport: ResolvedSport | null;
  readonly sessions: readonly SessionBlueprint[];
  readonly constraints: readonly UserConstraint[];
}

/**
 * Por qué no quedó ningún ejercicio de un patrón.
 *
 * El aviso listaba las tres causas posibles —"falta equipamiento en el catálogo,
 * está todo bloqueado por restricciones, o no hay nada de tu nivel"— y el motor
 * sabe cuál es. Para alguien con la rodilla lesionada, leer que "falta
 * equipamiento en el catálogo" cuando lo que pasó es que su propia lesión sacó
 * las sentadillas manda a buscar el problema al lugar equivocado.
 *
 * Se reaplican los mismos cuatro filtros de `usableExercises`, en el mismo orden,
 * y se informa el primero que deja el patrón en cero.
 */
interface VacioInput {
  pattern: MovementPattern;
  gym: GymSnapshot;
  constraints: readonly UserConstraint[];
  avoidRules: readonly PainRule[];
  level: ExperienceLevel;
}

/**
 * La causa, separada de la frase.
 *
 * El texto solo servía para mostrarlo. Ahora el motor además **decide** con
 * esto: si el patrón se vació porque el socio anotó una molestia, el día no se
 * queda corto — se busca trabajo complementario. Si se vació porque el catálogo
 * no tiene el ejercicio o la máquina está fuera de servicio, no hay nada que
 * sustituir y el aviso sigue siendo la respuesta correcta.
 *
 * Devolver un código en vez de comparar la frase es lo que evita que cambiar
 * una palabra del aviso cambie el comportamiento del motor — que es el mismo
 * error que ya cometieron dos tests buscando `'no tenemos una regla propia'`.
 */
type CausaDeVacio = 'sin_catalogo' | 'bloqueado' | 'nivel' | 'sin_estacion';

function causaDeVacio(input: VacioInput): CausaDeVacio {
  const { pattern, gym, constraints, avoidRules, level } = input;
  const delPatron = gym.exercises.filter((e) => e.pattern === pattern);
  if (delPatron.length === 0) return 'sin_catalogo';

  const sinBloquear = delPatron.filter(
    (e) => !isBlocked(e, constraints) && !isBlockedByPain(e, avoidRules),
  );
  if (sinBloquear.length === 0) return 'bloqueado';

  if (sinBloquear.filter((e) => isWithinSkillLevel(e, level)).length === 0) return 'nivel';

  return 'sin_estacion';
}

const TEXTO_DE_VACIO: Readonly<Record<CausaDeVacio, string>> = {
  sin_catalogo: 'el catálogo del gimnasio no tiene ninguno cargado todavía.',
  bloqueado:
    'los que hay quedaron afuera por lo que anotaste que no podés hacer. Es lo esperable y no hace falta que hagas nada.',
  nivel:
    'los que hay piden más experiencia de la que declaraste. Hablalo con el staff si querés incorporarlos.',
  sin_estacion: 'las estaciones donde se hacen no están disponibles. Avisale al staff.',
};

function porQueNoHay(input: VacioInput): string {
  return TEXTO_DE_VACIO[causaDeVacio(input)];
}

/**
 * Qué zona del cuerpo dejó ese patrón sin ejercicios.
 *
 * Se pregunta primero a las reglas de dolor —son las que sacan un patrón
 * entero— y después a lo que el socio anotó a mano. `null` cuando lo que
 * bloqueó fue una máquina que no quiere usar: ahí no hay zona que nombrar, y
 * el aviso lo dice de otra manera.
 */
function zonaQueBloqueo(input: {
  pattern: MovementPattern;
  gym: GymSnapshot;
  constraints: readonly UserConstraint[];
  avoidRules: readonly PainRule[];
}): BodyRegion | null {
  const { pattern, gym, constraints, avoidRules } = input;
  const delPatron = gym.exercises.filter((e) => e.pattern === pattern);

  const porDolor = avoidRules.find((rule) =>
    delPatron.some(
      (e) =>
        rule.avoidPatterns.includes(e.pattern) ||
        e.primaryMuscles.some((m) => rule.avoidMuscles.includes(m)),
    ),
  );
  if (porDolor) return porDolor.bodyRegion;

  const porAnotacion = constraints.find(
    (c) => c.bodyRegion !== null && delPatron.some((e) => isBlocked(e, [c])),
  );
  return porAnotacion?.bodyRegion ?? null;
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
