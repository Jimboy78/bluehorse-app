import type {
  BodyRegion,
  Equipment,
  Exercise,
  ExperienceLevel,
  Goal,
  Id,
  LoadReading,
  MatchDayState,
  MovementPattern,
  MuscleGroup,
  Profile,
  SetLog,
  SubstitutionEdge,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import { EXPERIENCE_LEVELS, nextLoad, snapToEquipment } from '@bh/domain';
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
import { createRng, pickDeterministic } from './rng.ts';
import type { GoalParams, PainRule, Ruleset, SlotRole } from './ruleset.ts';
import { detrainingMultiplier, isPlaceholder, levelChangesDose, resolveParams } from './ruleset.ts';

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
  const warnings: string[] = [];

  const goal = primaryGoal(user.goals);
  const basePar = resolveParams(ruleset, goal.goal, user.profile.experienceLevel);
  // Se le piden cuatro niveles al socio y en varios objetivos los cuatro dan la
  // misma dosis. Regla dura 4: si el plan no se individualiza, el plan lo dice.
  const levelNote = ruleset.modifiers?.experienceLevel;
  if (levelNote && !levelChangesDose(ruleset, goal.goal)) {
    warnings.push(levelNote.noDoseEffectNote);
  }
  const byAge = applyAgeModifier(basePar, ruleset, user.profile, goal.goal, context.now, warnings);
  const sport = resolveSport(ruleset, goal, warnings);
  const params = applySportVolume(byAge, sport, warnings);
  const template = pickTemplate(ruleset, goal, warnings);
  warnings.push(...frequencyWarnings(ruleset, goal, template));
  const placeholder = isPlaceholder(ruleset);

  // Volver después de mucho con la carga con la que dejaste es la forma más
  // rápida de lesionarse: la fuerza no se fue, el tendón sí se ablandó.
  //
  // El multiplicador se calcula acá porque los items lo necesitan, pero el aviso
  // se emite recién abajo: hasta que no están armados no se sabe si el plan trae
  // carga, y sin carga no se le puede anunciar al socio un porcentaje de recorte
  // que no va a ver en ninguna parte.
  const daysAway = input.daysSinceLastSession ?? null;
  const comeback = daysAway === null ? 1 : detrainingMultiplier(params, daysAway);

  // Dos tramos, no uno: con dolor moderado el ejercicio se mantiene y se muestra
  // la regla de monitoreo; recién con dolor alto se saca. Sacar de más ataca la
  // exposición, que es lo que las fuentes señalan como el factor que decide.
  const painRules = activePainRules(ruleset, user.constraints, 'monitor');
  const avoidRules = activePainRules(ruleset, user.constraints, 'avoid');
  const equipmentById = new Map(gym.equipment.map((e) => [e.id, e]));
  const usableExercises = gym.exercises.filter(
    (ex) =>
      !isBlocked(ex, user.constraints) &&
      !isBlockedByPain(ex, avoidRules) &&
      isWithinSkillLevel(ex, user.profile.experienceLevel) &&
      hasUsableEquipment(ex, gym, []),
  );

  warnings.push(...safetyWarnings(ruleset, user.constraints, painRules));

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
      const exercise = chooseExercise({
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
        rng,
      });
      if (!exercise) {
        warnings.push(
          `En ${tplSession.label} no quedó ningún ejercicio de ${patternLabel(slot.pattern)}: ${porQueNoHay(
            {
              pattern: slot.pattern,
              gym,
              constraints: user.constraints,
              avoidRules,
              level: user.profile.experienceLevel,
            },
          )}`,
        );
        continue;
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

  warnings.push(...comebackWarnings(sessions, ruleset, daysAway, comeback, params));
  warnings.push(...weeklyVolumeWarnings(sessions, template, gym, params, goal));
  warnings.push(...interferenceWarnings(sessions, gym, ruleset));
  warnings.push(...powerWarnings(sessions, gym, goal));
  warnings.push(
    ...emphasisWarnings({
      context,
      ruleset,
      gym,
      sport,
      sessions,
      constraints: user.constraints,
    }),
  );

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

/**
 * Ajuste por edad: la ventana de repeticiones e intensidad que se midió a partir
 * de los 60, en lugar de la del objetivo.
 *
 * **Se reemplaza, no se rebaja.** Para fuerza baja la carga y sube las
 * repeticiones; para hipertrofia en principiantes hace lo contrario (la ventana
 * es 70-79 % y la base es 50-70 %). El descanso no se toca: ninguna fuente
 * respalda alargarlo por edad. El comentario de acá decía "menos carga, más
 * repeticiones y más descanso" y las tres cosas eran inexactas.
 *
 * De la ventana, hoy solo llega la mitad: `intensityPct1RM` se escribe acá y no
 * se lee en ninguna parte (`29-la-intensidad-que-nadie-lee.md`).
 */
function applyAgeModifier(
  params: GoalParams,
  ruleset: Ruleset,
  profile: Profile,
  goal: Goal,
  now: string,
  warnings: string[],
): GoalParams {
  const rule = ruleset.modifiers?.olderAdults;
  if (!rule || !profile.birthDate) return params;
  // Borde midió fuerza y morfología. Fuera de esos objetivos no hay ventana que
  // aplicar, y extrapolarla sería inventar un número.
  if (!rule.appliesToGoals.includes(goal)) return params;

  const age = ageAt(profile.birthDate, now);
  if (age === null || age < rule.fromAge) return params;

  warnings.push(rule.note);
  // Se reemplaza, no se multiplica: la ventana es la que se midió en esta edad,
  // no una rebaja sobre la del adulto joven. El descanso no se toca porque
  // ninguna fuente respalda alargarlo por edad.
  const adjust = (role: GoalParams['primary']): GoalParams['primary'] => ({
    ...role,
    repsMin: rule.repsWindow[0],
    repsMax: rule.repsWindow[1],
    intensityPct1RM: [rule.intensityWindowPct1RM[0], rule.intensityWindowPct1RM[1]],
  });

  return {
    ...params,
    primary: adjust(params.primary),
    secondary: adjust(params.secondary),
    isolation: adjust(params.isolation),
  };
}

// ------------------------------------------------------------------ deporte

/** El deporte del socio resuelto contra el catálogo del ruleset. */
interface ResolvedSport {
  readonly label: string;
  readonly emphasis: readonly MuscleGroup[];
  /** Multiplicador de volumen: categoría × momento de la temporada. */
  readonly volumeMultiplier: number;
  readonly hasMatches: boolean;
  readonly notes: readonly string[];
}

/**
 * Traduce el deporte y el momento de la temporada del socio a lo que el motor
 * puede usar. Devuelve `null` cuando no hay nada que aplicar, que es el caso de
 * la mayoría de los socios.
 *
 * Si el deporte guardado no está en el catálogo, avisa en vez de ignorarlo en
 * silencio: es la señal de que alguien quedó con un valor viejo de cuando el
 * campo era texto libre.
 */
function resolveSport(ruleset: Ruleset, goal: UserGoal, warnings: string[]): ResolvedSport | null {
  const block = ruleset.sports;
  if (!block) return null;

  const entry = goal.sport ? block.catalog.find((s) => s.id === goal.sport) : undefined;
  if (goal.sport && !entry) {
    warnings.push(
      `El deporte "${goal.sport}" no está en el catálogo del ruleset ${ruleset.version}, así que no se usó para armar el plan.`,
    );
    return null;
  }

  const category = entry ? block.categories[entry.category] : undefined;
  const phase = block.seasonPhases[goal.seasonPhase];
  // Se toma el MÁS ESTRICTO, no el producto. Los dos contestan la misma
  // pregunta —cuánto menos hoy— así que manda el que más recorta. Multiplicarlos
  // daba 0,8 × 0,5 = 0,4 para un corredor en temporada, un recorte que ninguna
  // de las dos fuentes respalda y que dejaba ejercicios de una sola serie.
  const multiplier = Math.min(category?.volumeMultiplier ?? 1, phase?.volumeMultiplier ?? 1);

  const notes: string[] = [];
  if (category && category.volumeMultiplier !== 1) notes.push(category.note);
  if (phase && phase.volumeMultiplier !== 1) notes.push(phase.note);

  return {
    label: entry?.label ?? 'sin deporte',
    emphasis: entry?.emphasis ?? [],
    volumeMultiplier: multiplier,
    hasMatches: category?.hasMatches ?? false,
    notes,
  };
}

/**
 * Aplica el multiplicador de volumen del deporte y la temporada. Toca SOLO las
 * series: la intensidad y las repeticiones no se mueven, que es justo lo que
 * dice la literatura de tapering —bajar volumen, mantener intensidad— y lo que
 * el nulo de pesado-vs-liviano obliga a respetar.
 *
 * Nunca baja de una serie: media serie no existe, y un ejercicio con cero
 * series es un ejercicio que no está.
 */
function applySportVolume(
  params: GoalParams,
  sport: ResolvedSport | null,
  warnings: string[],
): GoalParams {
  if (!sport || sport.volumeMultiplier === 1) return sport ? params : params;

  const scale = (role: GoalParams['primary']): GoalParams['primary'] => ({
    ...role,
    sets: Math.max(1, Math.round(role.sets * sport.volumeMultiplier)),
  });

  warnings.push(...sport.notes);
  return {
    ...params,
    primary: scale(params.primary),
    secondary: scale(params.secondary),
    isolation: scale(params.isolation),
  };
}

/**
 * Reglas de dolor que aplican hoy, según lo que el socio reportó.
 *
 * `'monitor'` son las que hay que contarle; `'avoid'`, el subconjunto que además
 * saca ejercicios del plan. La diferencia entre las dos es lo que evita tratar
 * "me molesta" y "no puedo" como la misma decisión.
 */
function activePainRules(
  ruleset: Ruleset,
  constraints: readonly UserConstraint[],
  level: 'monitor' | 'avoid',
): readonly PainRule[] {
  const rules = ruleset.safety?.painRules;
  if (!rules) return [];

  return rules.filter((rule) => {
    const floor = level === 'avoid' ? rule.avoidFrom : rule.monitorFrom;
    return constraints.some((c) => {
      if (c.type !== 'pain' && c.type !== 'injury') return false;
      if (c.bodyRegion !== rule.bodyRegion) return false;
      // Una lesión no accede al tramo permisivo. Los dos umbrales salen de
      // evidencia de dolor crónico —tejido ya cicatrizado, donde seguir
      // cargando es lo que mejora el cuadro—; ninguna de esas fuentes miró algo
      // lesionado hace poco. Así que para una lesión el piso para SACAR es el
      // mismo en el que un dolor crónico apenas se monitorea.
      const piso = c.type === 'injury' ? rule.monitorFrom : floor;
      return c.severity >= piso;
    });
  });
}

/**
 * Los avisos de seguridad que acompañan al plan.
 *
 * El orden importa: primero qué sí se puede hacer por zona, después cuándo hay
 * que ir a que lo vean, y al final una sola regla general — la de monitoreo de
 * dolor o la de lesión, nunca las dos, porque se contradicen.
 */
function safetyWarnings(
  ruleset: Ruleset,
  constraints: readonly UserConstraint[],
  painRules: readonly PainRule[],
): string[] {
  const out: string[] = [];
  let hayLesion = false;

  for (const rule of masSeveraPorZona(painRules)) {
    const region = regionLabel(rule.bodyRegion);
    const lesion = isInjuryRegion(constraints, rule);
    hayLesion ||= lesion;
    // Llamarle "molestia" a una lesión no es solo impreciso: baja la guardia
    // justo donde hay que subirla.
    out.push(`Por ${lesion ? 'la lesión' : 'la molestia'} en ${region}: ${rule.keepDoing}`);
    // `referIf` es la frase que distingue una molestia de gimnasio de algo que
    // hay que hacer ver. Estaba escrita en el ruleset y no se emitía nunca.
    out.push(`Consultá si ${lowerFirst(rule.referIf)}`);
  }

  // Las zonas que el socio declaró y el ruleset no cubre. Sin esto el plan sale
  // igual que el de alguien sano, y el silencio se lee como "miramos y no hay
  // nada que ajustar".
  out.push(...avisosDeZonaSinRegla(ruleset, constraints));

  // Con una lesión declarada, la regla de monitoreo de dolor NO se emite: su
  // texto autoriza a cargar hasta 5 sobre 10, y esa autorización sale de
  // literatura de dolor crónico. Se emite en su lugar la nota de lesión.
  const monitoring = ruleset.safety?.painMonitoring;
  const acute = ruleset.safety?.acuteInjury;
  if (hayLesion && acute) out.push(acute.note);
  else if (painRules.length > 0 && monitoring) out.push(monitoring.text);

  return out;
}

/**
 * Una sola regla por zona: la del tramo más severo que aplique.
 *
 * Las exclusiones sí se unen —sacar de más es el lado seguro—, pero el **consejo**
 * no. La rodilla tiene dos reglas escalonadas, y con severidad 4 aplican las dos:
 * el socio leía "hacé sentadillas parciales controladas" del tramo de 3, y abajo
 * el aviso de que no quedó ningún ejercicio de sentadilla en el plan porque el
 * tramo de 4 las sacó todas. Además las dos comparten el `referIf` palabra por
 * palabra, así que leía dos veces la misma frase.
 *
 * El consejo del tramo permisivo no acompaña a un plan armado con el estricto.
 */
function masSeveraPorZona(rules: readonly PainRule[]): readonly PainRule[] {
  const porZona = new Map<BodyRegion, PainRule>();
  for (const rule of rules) {
    const previa = porZona.get(rule.bodyRegion);
    if (!previa || rule.monitorFrom > previa.monitorFrom) porZona.set(rule.bodyRegion, rule);
  }
  return [...porZona.values()];
}

/**
 * Las zonas declaradas para las que el ruleset no tiene regla.
 *
 * `BODY_REGIONS` ofrece diez y `painRules` cubre cinco. Codo, espalda alta,
 * cadera, tobillo y "otra" no tienen ninguna, y hasta acá eso se veía igual que
 * no tener nada: plan completo y ni un aviso. Ver `27-zonas-sin-regla.md`.
 */
function avisosDeZonaSinRegla(ruleset: Ruleset, constraints: readonly UserConstraint[]): string[] {
  const texto = ruleset.safety?.noRuleForRegion?.text;
  if (!texto) return [];

  const conRegla = new Set((ruleset.safety?.painRules ?? []).map((r) => r.bodyRegion));
  const sinRegla = new Set<BodyRegion>();
  for (const c of constraints) {
    if (c.type !== 'pain' && c.type !== 'injury') continue;
    if (c.bodyRegion === null || conRegla.has(c.bodyRegion)) continue;
    sinRegla.add(c.bodyRegion);
  }

  return [...sinRegla].map((region) => texto.replace('{region}', regionLabel(region)));
}

/** Si la zona de esta regla es una lesión declarada y no un dolor de arrastre. */
function isInjuryRegion(
  constraints: readonly UserConstraint[],
  rule: Pick<PainRule, 'bodyRegion' | 'monitorFrom'>,
): boolean {
  return constraints.some(
    (c) =>
      c.type === 'injury' && c.bodyRegion === rule.bodyRegion && c.severity >= rule.monitorFrom,
  );
}

/** Para encadenar `referIf` después de "Consultá si...". */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
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
  const items: SessionItemBlueprint[] = [];
  let scaled = 0;

  for (const item of input.items) {
    const exercise = exerciseById.get(item.exerciseId);
    const adjusted = adjustItem(item, exercise, rule);

    if (adjusted === null) {
      dropped.push(exercise?.name ?? item.exerciseId);
      continue;
    }
    if (adjusted !== item) scaled += 1;
    items.push(adjusted);
  }

  const changed = dropped.length > 0 || scaled > 0;
  const detail = dropped.length > 0 ? ` Hoy se sacan: ${dropped.join(', ')}.` : '';
  return { items, note: changed ? `${rule.note}${detail}` : null, changed };
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
 * Lo que sale hoy es otra cosa. Medido sobre el catálogo real: un plan de
 * potencia trae sentadilla en Smith, press inclinado, remo y press militar —la
 * misma selección que fuerza— a 1-3 repeticiones. Los tres ejercicios
 * explosivos del gimnasio (salto al cajón, wall ball, slam ball) no entran
 * nunca, porque son de peso corporal y el slot principal prefiere algo a lo
 * que se le pueda subir la carga.
 *
 * Ese filtro es correcto para fuerza e hipertrofia, donde la progresión se
 * mide en kilos. Para potencia contradice al propio ruleset, que dice que "la
 * potencia se regula por velocidad, no por repeticiones en reserva" y no
 * propone subir carga sola en este objetivo.
 *
 * Cambiar la selección es una decisión de producto —implicaría que el
 * ejercicio principal de un plan de potencia sea un salto al cajón, y el
 * bloque prescribe 30-60 % del 1RM, que en peso corporal no significa nada—.
 * Hasta que se tome, el plan **no puede prometer explosividad y entregar
 * series lentas sin decirlo**: es la regla dura 4 aplicada a la selección en
 * vez de a los números.
 */
function powerWarnings(
  sessions: readonly SessionBlueprint[],
  gym: GymSnapshot,
  goal: UserGoal,
): string[] {
  if (goal.goal !== 'power') return [];

  const exerciseById = new Map(gym.exercises.map((e) => [e.id, e]));
  const hayExplosivo = sessions
    .flatMap((s) => s.items)
    .some((item) => exerciseById.get(item.exerciseId)?.isExplosive === true);

  if (hayExplosivo) return [];

  return [
    'Este plan no incluye ningún ejercicio explosivo: se entrena con series cortas y ' +
      'rápidas sobre los ejercicios de siempre. El gimnasio tiene con qué (cajones, wall ' +
      'ball, slam ball), pero todavía no entran solos al plan. Si buscás explosividad, ' +
      'consultalo con el staff.',
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
    else if (isLowerBody(exercise)) pierna = true;
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

  // Se guarda la fila entera, no solo `equivalence`: `note` es lo que el
  // staff escribió para explicar POR QUÉ dos ejercicios son equivalentes
  // (`/panel`, `useCreateSubstitution`), y hasta acá se leía de la base y se
  // tiraba sin usar — el reemplazo llegaba con el mismo texto genérico que
  // uno calculado automáticamente, perdiendo la única razón de cargarlo a
  // mano en vez de dejar que `scoreEquivalence` lo calcule solo.
  const explicit = new Map(
    gym.substitutions.filter((s) => s.exerciseId === original.id).map((s) => [s.substituteId, s]),
  );

  const options: SubstituteOption[] = [];

  for (const candidate of gym.exercises) {
    if (candidate.id === original.id) continue;
    if (isBlocked(candidate, constraints)) continue;
    if (!hasUsableEquipment(candidate, gym, [...blocked])) continue;

    const curatedEdge = explicit.get(candidate.id);
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
    `Ninguna plantilla cubre ${sesiones(goal.sessionsPerWeekTarget)} por semana para ${goalLabel(goal.goal)}. Se usó "${fallback.label}".`,
  );
  return fallback;
}

/**
 * Qué pierde el socio cuando declara menos sesiones de las que la plantilla
 * necesita. Antes esto no se decía: el motor rellenaba la semana con sesiones
 * que la persona no iba a hacer y daba el plan por bueno.
 */
function frequencyWarnings(
  ruleset: Ruleset,
  goal: UserGoal,
  template: Ruleset['templates'][number],
): string[] {
  const rule = ruleset.modifiers?.frequency;
  const minimo = template.sessionsPerWeek[0];
  if (!rule || goal.sessionsPerWeekTarget >= minimo) return [];

  const aviso = rule.belowTemplateNote
    .replace('{declaradas}', String(goal.sessionsPerWeekTarget))
    .replace('{minimo}', String(minimo));
  const porObjetivo = rule.byGoal[goal.goal];
  return porObjetivo ? [aviso, porObjetivo] : [aviso];
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
  const preferSoft = (list: readonly Exercise[], keep: (e: Exercise) => boolean) => {
    const kept = list.filter(keep);
    if (kept.length === 0) return list;
    if (list.length > floor && kept.length < floor) return list;
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
  if (input.emphasis.length > 0) {
    const emphasized = new Set(input.emphasis);
    eligible = preferSoft(eligible, (e) => e.primaryMuscles.some((m) => emphasized.has(m)));
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

/**
 * El patrón de movimiento en castellano.
 *
 * Mismo caso que `GOAL_LABELS` acá abajo, y que a los objetivos ya les había
 * pasado: el aviso de patrón sin cubrir interpolaba `slot.pattern` crudo, así
 * que el socio leía `el patrón "vertical_pull"` — el identificador interno, en
 * inglés y entrecomillado. No era un caso de borde: cuatro de los 33 planes del
 * reporte lo mostraban, y los dos con lesión lo tienen siempre, porque sacar un
 * patrón entero es justamente lo que dispara ese aviso.
 *
 * Las palabras son las mismas que usa `PATTERN_LABELS` en la app, en minúscula
 * porque acá van en medio de una oración. Que la insignia del ejercicio y el
 * aviso digan cosas distintas del mismo patrón es peor que no traducir.
 */
const PATTERN_LABELS: Readonly<Record<MovementPattern, string>> = {
  squat: 'sentadilla',
  hinge: 'bisagra de cadera',
  lunge: 'zancada',
  horizontal_push: 'empuje horizontal',
  horizontal_pull: 'tirón horizontal',
  vertical_push: 'empuje vertical',
  vertical_pull: 'tirón vertical',
  carry: 'traslado',
  core: 'zona media',
  isolation: 'aislamiento',
  cardio: 'cardio',
};

function patternLabel(pattern: MovementPattern): string {
  return PATTERN_LABELS[pattern] ?? pattern;
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
function porQueNoHay(input: {
  pattern: MovementPattern;
  gym: GymSnapshot;
  constraints: readonly UserConstraint[];
  avoidRules: readonly PainRule[];
  level: ExperienceLevel;
}): string {
  const { pattern, gym, constraints, avoidRules, level } = input;
  const delPatron = gym.exercises.filter((e) => e.pattern === pattern);
  if (delPatron.length === 0) {
    return 'el catálogo del gimnasio no tiene ninguno cargado todavía.';
  }

  const sinBloquear = delPatron.filter(
    (e) => !isBlocked(e, constraints) && !isBlockedByPain(e, avoidRules),
  );
  if (sinBloquear.length === 0) {
    return 'los que hay quedaron afuera por lo que anotaste que no podés hacer. Es lo esperable y no hace falta que hagas nada.';
  }

  const deTuNivel = sinBloquear.filter((e) => isWithinSkillLevel(e, level));
  if (deTuNivel.length === 0) {
    return 'los que hay piden más experiencia de la que declaraste. Hablalo con el staff si querés incorporarlos.';
  }

  return 'las estaciones donde se hacen no están disponibles. Avisale al staff.';
}

/**
 * El objetivo en castellano.
 *
 * Los `warnings` del motor se muestran tal cual en la tarjeta del plan, así
 * que un `goal.goal` interpolado crudo le dejaba al socio `el objetivo
 * "hypertrophy"`: el identificador interno, en inglés y entrecomillado.
 *
 * Va acá al lado de `muscleLabel` y `regionLabel` y no se importa de
 * `apps/web/src/lib/labels.ts` porque la flecha de dependencias va en un solo
 * sentido: el motor no conoce la app.
 */
const GOAL_LABELS: Readonly<Record<Goal, string>> = {
  strength: 'fuerza',
  hypertrophy: 'hipertrofia',
  power: 'potencia',
  cardio: 'cardio',
  endurance: 'resistencia',
  recomposition: 'recomposición corporal',
};

function goalLabel(goal: Goal): string {
  return GOAL_LABELS[goal] ?? goal;
}

/** "1 sesión" / "3 sesiones". Un socio puede elegir entrenar una vez por semana. */
function sesiones(cantidad: number): string {
  return cantidad === 1 ? '1 sesión' : `${cantidad} sesiones`;
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
