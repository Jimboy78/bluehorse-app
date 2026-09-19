import type {
  BodyRegion,
  Exercise,
  ExperienceLevel,
  Goal,
  HealthCondition,
  MovementPattern,
  MuscleGroup,
  Profile,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import { EXPERIENCE_LEVELS } from '@bh/domain';
import type { GeneratePlanInput } from './contract.ts';
import { goalLabel, regionLabel, sesiones } from './etiquetas.ts';
import type { GoalParams, PainRule, Ruleset } from './ruleset.ts';
import { detrainingMultiplier, levelChangesDose, resolveParams } from './ruleset.ts';

/**
 * EL CONTEXTO DEL SOCIO — todo lo que depende de quién es la persona, resuelto
 * una sola vez y antes de elegir un solo ejercicio.
 *
 * Es la forma de EXPERT (`docs/research/38`, etapa 2): cada contexto es un
 * módulo que aporta exclusiones, ajustes de dosis, bloques y avisos, y hay un
 * único lugar que los combina. Antes cada contexto agregaba su rama en un punto
 * distinto de `generatePlan`, y nadie miraba cómo se combinaban: una molestia
 * leve y un deporte, cada uno bien por separado, le daban saltos a alguien con
 * dolor lumbar.
 *
 * Cómo se combinan hoy, escrito para que el próximo módulo lo respete:
 * - **Exclusiones**: se suman. Alcanza con que un módulo saque un ejercicio.
 * - **Dosis**: se aplican en orden, y cada módulo toca campos distintos (la
 *   edad la ventana de repeticiones, el deporte las series, la salud el piso de
 *   RIR). Dentro del deporte, categoría y temporada contestan lo mismo y manda
 *   la más estricta; entre condiciones de salud, el piso más alto.
 * - **Bloques**: por ahora uno solo, el par explosivo.
 * - **Avisos**: cada uno sabe de qué módulo sale, en el orden en que el socio
 *   los lee.
 */

/**
 * De qué parte del contexto sale una exclusión o un aviso.
 *
 * El orden de esta lista es el orden en que el socio lee los avisos: la app
 * muestra los primeros y guarda el resto detrás de "ver más". Primero lo que
 * pide hacer algo —cuándo consultar, cómo volver, qué falta cubrir, qué no
 * entra en su tiempo— y después lo que explica por qué el plan es como es
 * (regla dura 4: se avisa lo accionable). Dentro de un módulo se respeta el
 * orden en que el motor los escribió: la regla de una zona va con su "consultá
 * si", pegada.
 */
export const ORDEN_DE_AVISOS = [
  // Estado del producto, no del socio. Con un ruleset de investigación no sale.
  'provisorio',
  'ruleset',
  'molestia',
  // Cómo hacer la fuerza con una condición de salud: respirar, no llegar al
  // fallo, cómo terminar. Pide hacer algo en cada serie.
  'salud',
  'supervision',
  'ausencia',
  'cobertura',
  'tiempo',
  'frecuencia',
  'volumen',
  'equilibrio',
  'impacto',
  'plantilla',
  'deporte',
  'edad',
  'interferencia',
  'potencia',
  'autorregulacion',
  'nivel',
  'restriccion',
] as const;

export type Modulo = (typeof ORDEN_DE_AVISOS)[number];

export interface Aviso {
  readonly modulo: Modulo;
  readonly texto: string;
}

export interface Exclusion {
  readonly modulo: Modulo;
  readonly excluye: (exercise: Exercise) => boolean;
}

export type Template = Ruleset['templates'][number];

export interface ContextoDelSocio {
  readonly goal: UserGoal;
  readonly sport: ResolvedSport | null;
  /** La dosis del objetivo y el nivel, con los ajustes de edad y deporte encima. */
  readonly params: GoalParams;
  readonly template: Template;
  readonly daysAway: number | null;
  /** Multiplicador de carga por la ausencia; 1 si no hay recorte. */
  readonly comeback: number;
  /** Reglas de dolor que se le cuentan al socio. */
  readonly painRules: readonly PainRule[];
  /** El subconjunto que además saca ejercicios. */
  readonly avoidRules: readonly PainRule[];
  /** El bloque explosivo si este socio lo recibe. */
  readonly explosivos: ExplosiveConfig | null;
  /**
   * Una condición de salud saca lo explosivo (embarazo, pérdidas de orina). Su
   * aviso ya dice por qué, así que el de potencia no tiene que inventar otro.
   */
  readonly sinExplosivosPorSalud: boolean;
  /** El bloque de equilibrio si este socio lo recibe. */
  readonly equilibrio: BalanceConfig | null;
  /** Los bloques que se suman al final de cada sesión, en orden. */
  readonly bloques: readonly BloqueDeContexto[];
  readonly exclusiones: readonly Exclusion[];
  /** Los avisos del contexto, antes de armar las sesiones. */
  readonly avisos: readonly Aviso[];
}

/**
 * Resuelve el contexto del socio. Es el único lugar que decide qué módulos
 * aplican; `generatePlan` solo consume lo que devuelve.
 */
export function resolverContexto(input: GeneratePlanInput): ContextoDelSocio {
  const { context, user, ruleset } = input;
  const avisos: Aviso[] = [];
  const decir = (modulo: Modulo, textos: readonly string[]) => {
    for (const texto of textos) avisos.push({ modulo, texto });
  };
  // Las funciones de cada módulo escriben en un arreglo de texto; se etiquetan
  // acá, a la salida, para no cambiar la forma de cada una.
  const junto = <T>(modulo: Modulo, fn: (out: string[]) => T): T => {
    const out: string[] = [];
    const r = fn(out);
    decir(modulo, out);
    return r;
  };

  const goal = primaryGoal(user.goals);
  const level = user.profile.experienceLevel;
  const basePar = resolveParams(ruleset, goal.goal, level);
  const byAge = junto('edad', (out) =>
    applyAgeModifier(basePar, ruleset, user.profile, goal.goal, context.now, out),
  );
  const byYouth = junto('supervision', (out) =>
    applyYouthModifier(byAge, ruleset, user.profile, context.now, out),
  );
  // Se le piden cuatro niveles al socio y en varios objetivos los cuatro dan la
  // misma dosis. Si el plan no se individualiza, el plan lo dice.
  // Con la dosis de inicio de adolescentes el nivel sí la cambió: decir lo
  // contrario sería falso.
  const levelNote = ruleset.modifiers?.experienceLevel;
  if (levelNote && !levelChangesDose(ruleset, goal.goal) && byYouth === byAge) {
    decir('nivel', [levelNote.noDoseEffectNote]);
  }

  const sport = junto('deporte', (out) => resolveSport(ruleset, goal, out));
  const bySport = junto('deporte', (out) => applySportVolume(byYouth, sport, out));
  const params = junto('salud', (out) =>
    applyHealthConditions(bySport, ruleset, user.conditions, out),
  );
  const template = junto('plantilla', (out) => pickTemplate(ruleset, goal, out));
  decir('frecuencia', frequencyWarnings(ruleset, goal, template));

  // Volver después de mucho con la carga con la que dejaste es la forma más
  // rápida de lesionarse: la fuerza no se fue, el tendón sí se ablandó. El
  // aviso sale después de armar las sesiones, cuando se sabe si traen carga.
  const daysAway = input.daysSinceLastSession ?? null;
  const comeback = daysAway === null ? 1 : detrainingMultiplier(params, daysAway);

  // Dos tramos, no uno: con dolor moderado el ejercicio se mantiene y se muestra
  // la regla de monitoreo; recién con dolor alto se saca. Sacar de más ataca la
  // exposición, que es lo que las fuentes señalan como el factor que decide.
  const painRules = activePainRules(ruleset, user.constraints, 'monitor');
  const avoidRules = activePainRules(ruleset, user.constraints, 'avoid');
  decir('molestia', safetyWarnings(ruleset, user.constraints, painRules));

  // Cualquier molestia o lesión declarada, aunque sea leve y no active ninguna
  // regla de dolor: sumar impacto no es lo que se ajusta, es lo que se evita.
  // Vale para los saltos del par, para el bloque de impacto y para un explosivo
  // que entrara por un slot común. Eso último pasaba: el selector solo
  // *prefiere* no explosivos, y con osteoporosis (sin abdominales que flexionen)
  // más una molestia que sacaba la plancha, el único core que quedaba era el
  // lanzamiento rotacional. Medido en el barrido.
  const conMolestia = user.constraints.some(esMolestia);
  const sinSaltosPorMolestia =
    conMolestia && ruleset.safety?.painSubstitution?.avoidExplosive === true;

  const salud = efectosDeSalud(ruleset, user.conditions);
  const exclusiones: Exclusion[] = [
    { modulo: 'restriccion', excluye: (ex) => isBlocked(ex, user.constraints) },
    {
      modulo: 'molestia',
      excluye: (ex) => isBlockedByPain(ex, avoidRules) || (sinSaltosPorMolestia && ex.isExplosive),
    },
    { modulo: 'nivel', excluye: (ex) => !isWithinSkillLevel(ex, level) },
    { modulo: 'salud', excluye: salud.excluye },
  ];
  const explosivos = salud.sinExplosivos
    ? null
    : explosivePairing({
        ruleset,
        goal,
        sport,
        profile: user.profile,
        now: context.now,
        hasPain: conMolestia,
      });

  const equilibrio = balanceBlock(ruleset, user.profile, context.now);
  // Una condición puede sumar el impacto (osteoporosis, sin mirar sexo ni edad)
  // o sacarlo (suelo pélvico). La molestia y el "sacar" ganan siempre.
  const porEdad = impactBlock(ruleset, user.profile, context.now);
  const impacto =
    conMolestia || salud.impacto === 'remove'
      ? null
      : salud.impacto === 'add'
        ? (ruleset.impact ?? null)
        : porEdad;
  // Van al final de la sesión en este orden: el impacto antes que el
  // equilibrio, que cierra (Otago hace el equilibrio después de la fuerza).
  const bloques: BloqueDeContexto[] = [];
  if (impacto) bloques.push({ ...impacto, modulo: 'impacto', pattern: 'impact' });
  if (equilibrio) bloques.push({ ...equilibrio, modulo: 'equilibrio', pattern: 'balance' });

  return {
    goal,
    sport,
    params,
    template,
    daysAway,
    comeback,
    painRules,
    avoidRules,
    explosivos,
    sinExplosivosPorSalud: salud.sinExplosivos,
    equilibrio,
    bloques,
    exclusiones,
    avisos,
  };
}

/**
 * Los textos de los avisos, en el orden en que se leen: por módulo según
 * `ORDEN_DE_AVISOS` y, dentro de un módulo, como se escribieron. No se saca
 * ninguno; cuántos se ven de entrada lo decide la pantalla.
 */
export function ordenarAvisos(avisos: readonly Aviso[]): string[] {
  const rango = (m: Modulo) => ORDEN_DE_AVISOS.indexOf(m);
  return avisos
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rango(x.a.modulo) - rango(y.a.modulo) || x.i - y.i)
    .map(({ a }) => a.texto);
}

/** Si algún módulo saca este ejercicio. Las exclusiones se suman. */
export function excluido(ctx: Pick<ContextoDelSocio, 'exclusiones'>, exercise: Exercise): boolean {
  return ctx.exclusiones.some((e) => e.excluye(exercise));
}

// ------------------------------------------------------------------ adolescentes

/**
 * Adolescentes que recién empiezan: la dosis de inicio de la CSEP (1–2 series
 * de 8–15) con cualquier objetivo, también potencia, porque arrancar con 1–3
 * repeticiones cerca del máximo es lo contrario de aprender la técnica. Con más
 * experiencia, la dosis del adulto (`docs/research/41`).
 *
 * Se reemplazan las repeticiones y se topean las series; el RIR y el descanso
 * quedan los del objetivo, porque nadie midió otra cosa en chicos.
 */
function applyYouthModifier(
  params: GoalParams,
  ruleset: Ruleset,
  profile: Profile,
  now: string,
  warnings: string[],
): GoalParams {
  const rule = ruleset.modifiers?.youth;
  if (!rule || !profile.birthDate) return params;
  const age = ageAt(profile.birthDate, now);
  if (age === null || age < rule.fromAge || age > rule.toAge) return params;
  if (!rule.levels.includes(profile.experienceLevel)) return params;

  warnings.push(rule.note);
  const adjust = (role: GoalParams['primary']): GoalParams['primary'] => ({
    ...role,
    sets: Math.min(role.sets, rule.maxSets),
    repsMin: rule.repsWindow[0],
    repsMax: rule.repsWindow[1],
  });
  return {
    ...params,
    primary: adjust(params.primary),
    secondary: adjust(params.secondary),
    isolation: adjust(params.isolation),
  };
}

// ------------------------------------------------------------------ salud

/**
 * Las condiciones de salud que marcó el socio y tienen entrada en el ruleset
 * (`docs/research/44`). Una condición sin entrada no cambia nada.
 */
function condicionesActivas(
  ruleset: Ruleset,
  conditions: readonly HealthCondition[],
): NonNullable<Ruleset['conditions']> {
  return (ruleset.conditions ?? []).filter((c) => conditions.includes(c.id));
}

/**
 * El piso de RIR de las condiciones: con presión alta o un problema del
 * corazón, lo que dispara la presión es acumular repeticiones hacia el fallo,
 * no la carga (Gjøvaag 2016). Así que se sube el RIR y nada más: la carga, las
 * repeticiones y las series quedan las del objetivo. El trabajo que no se mide
 * por RIR (potencia, cardio) no se toca.
 *
 * Los avisos se suman sin repetir: presión y betabloqueantes comparten el de
 * la vuelta a la calma.
 */
function applyHealthConditions(
  params: GoalParams,
  ruleset: Ruleset,
  conditions: readonly HealthCondition[],
  warnings: string[],
): GoalParams {
  const activas = condicionesActivas(ruleset, conditions);
  const juntas = activas.flatMap((c) =>
    c.withOther.filter((o) => conditions.includes(o.id)).map((o) => o.note),
  );
  for (const nota of new Set([...activas.flatMap((c) => c.notes), ...juntas])) warnings.push(nota);

  const pisos = activas.flatMap((c) => (c.minRir === null ? [] : [c.minRir]));
  if (pisos.length === 0) return params;
  const piso = Math.max(...pisos);
  const adjust = (role: GoalParams['primary']): GoalParams['primary'] =>
    role.rirTarget === null || role.rirTarget >= piso ? role : { ...role, rirTarget: piso };
  const primary = adjust(params.primary);
  // El disparador de "subimos la carga" está un escalón por encima del RIR de la
  // principal. Si el RIR sube y el disparador no, cumplir el plan ya cuenta como
  // que sobraron repeticiones: cada sesión propondría subir, y subir es volver a
  // acercarse al fallo. Se corre lo mismo que se corrió el RIR.
  const corrimiento = (primary.rirTarget ?? 0) - (params.primary.rirTarget ?? 0);
  return {
    ...params,
    primary,
    secondary: adjust(params.secondary),
    isolation: adjust(params.isolation),
    progression: {
      ...params.progression,
      triggerRirAtLeast: params.progression.triggerRirAtLeast + corrimiento,
    },
  };
}

/**
 * Lo que las condiciones hacen fuera de la dosis: qué ejercicios sacan y qué
 * pasa con el bloque de impacto (`docs/research/46`). Con una que suma el
 * impacto y otra que lo saca, gana la que lo saca: con pérdidas de orina, el
 * consenso de osteoporosis pide tratarlas antes de sumar impacto.
 */
function efectosDeSalud(ruleset: Ruleset, conditions: readonly HealthCondition[]) {
  const activas = condicionesActivas(ruleset, conditions);
  const sinFlexion = activas.some((c) => c.excludesSpinalFlexion);
  const sinExplosivos = activas.some((c) => c.excludesExplosive);
  const sinCabezaAbajo = activas.some((c) => c.excludesHeadDown);
  const impacto: 'add' | 'remove' | null = activas.some((c) => c.impactBlock === 'remove')
    ? 'remove'
    : activas.some((c) => c.impactBlock === 'add')
      ? 'add'
      : null;
  return {
    sinExplosivos,
    impacto,
    excluye: (ex: Exercise) =>
      (sinFlexion && ex.loadsSpinalFlexion) ||
      (sinExplosivos && ex.isExplosive) ||
      (sinCabezaAbajo && ex.headBelowHeart),
  };
}

/**
 * Si la tarjeta de cardio deja afuera el % de frecuencia cardíaca máxima: con
 * betabloqueantes el pulso no llega y ese número empuja a exigirse de más. La
 * pantalla lo pregunta acá para no decidirlo ella.
 */
export function ocultaElPulso(ruleset: Ruleset, conditions: readonly HealthCondition[]): boolean {
  return condicionesActivas(ruleset, conditions).some((c) => c.hidesHeartRate);
}

// ------------------------------------------------------------------ bloques

/**
 * Un bloque que un módulo suma al final de cada sesión, con su propia dosis.
 * No entra por ningún slot, no suma al volumen semanal ni recibe propuestas de
 * progresión.
 */
export interface BloqueDeContexto {
  readonly modulo: Modulo;
  readonly pattern: MovementPattern;
  readonly exercisesPerSession: number;
  readonly sets: number;
  readonly repsMin: number;
  readonly repsMax: number;
  readonly restSeconds: number;
  readonly rationale: string;
}

/** Los patrones que solo entran como bloque. */
export const PATRONES_DE_BLOQUE: readonly MovementPattern[] = ['balance', 'impact'];

export type ImpactConfig = NonNullable<Ruleset['impact']>;

/**
 * Impacto para el hueso: mujeres desde la edad en que casi todas pasaron la
 * menopausia (`docs/research/42`). Se deduce del sexo y la edad, sin preguntar;
 * con el sexo sin declarar no se agrega.
 */
function impactBlock(ruleset: Ruleset, profile: Profile, now: string): ImpactConfig | null {
  const cfg = ruleset.impact;
  if (!cfg || !profile.birthDate || !cfg.sexes.includes(profile.sex)) return null;
  const age = ageAt(profile.birthDate, now);
  return age !== null && age >= cfg.fromAge ? cfg : null;
}

// ------------------------------------------------------------------ equilibrio

export type BalanceConfig = NonNullable<Ruleset['balance']>;

/**
 * El bloque de equilibrio si la persona llegó a la edad del ruleset. Con
 * cualquier objetivo: la guía mundial de caídas lo recomienda a todo mayor que
 * vive en la comunidad, entrene para lo que entrene (`docs/research/39`).
 *
 * Sin fecha de nacimiento no se agrega: no se inventa una edad.
 */
function balanceBlock(ruleset: Ruleset, profile: Profile, now: string): BalanceConfig | null {
  const cfg = ruleset.balance;
  if (!cfg || !profile.birthDate) return null;
  const age = ageAt(profile.birthDate, now);
  return age !== null && age >= cfg.fromAge ? cfg : null;
}

// ------------------------------------------------------------------ explosivos
export type ExplosiveConfig = NonNullable<Ruleset['explosive']>;

/**
 * La configuración de pares explosivos si este socio los recibe, o `null`.
 *
 * Los reciben el objetivo potencia y quien declara un deporte de las
 * categorías del ruleset. Nadie más: a quien entrena para la salud o la
 * estética no le agrega nada que su objetivo no pida.
 *
 * Y con una molestia activa, ninguno: es el mismo criterio que ya aplica
 * `painSubstitution.avoidExplosive` al reemplazar un patrón bloqueado. El
 * impacto de un salto no es el momento de sumarlo.
 */
function explosivePairing(input: {
  readonly ruleset: Ruleset;
  readonly goal: UserGoal;
  readonly sport: ResolvedSport | null;
  readonly profile: Profile;
  readonly now: string;
  readonly hasPain: boolean;
}): ExplosiveConfig | null {
  const cfg = input.ruleset.explosive;
  if (!cfg) return null;
  const porObjetivo = cfg.goals.includes(input.goal.goal);
  const porDeporte =
    input.sport?.category !== null &&
    input.sport?.category !== undefined &&
    cfg.sportCategories.includes(input.sport.category);
  if (!porObjetivo && !porDeporte) return null;

  if (input.hasPain && input.ruleset.safety?.painSubstitution?.avoidExplosive) return null;

  // Más allá de la edad que cubren los ensayos no se agrega: no es que haga
  // mal, es que nadie lo midió.
  const age = input.profile.birthDate ? ageAt(input.profile.birthDate, input.now) : null;
  if (age !== null && age > cfg.maxAge) return null;
  return cfg;
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

  // La edad se mira PRIMERO. Antes el objetivo cortaba antes que la edad, y el
  // motor ni se enteraba de que la persona había pasado los 60: con objetivo
  // potencia alguien de 85 años recibía un plan byte a byte idéntico al de uno
  // de 30 —3×1-3 explosivas— y la misma cantidad de avisos. Cuatro de los seis
  // objetivos salían así.
  const age = ageAt(profile.birthDate, now);
  if (age === null || age < rule.fromAge) return params;

  // Borde midió fuerza y morfología. Fuera de esos objetivos no hay ventana que
  // aplicar, y extrapolarla sería inventar un número — pero callarse tampoco es
  // gratis: el silencio se lee como "miramos tu edad y no hay nada que
  // ajustar". Se dice que no hay, igual que con las zonas sin regla de dolor.
  if (!rule.appliesToGoals.includes(goal)) {
    warnings.push(rule.noWindowForGoal.replace('{objetivo}', goalLabel(goal)));
    return params;
  }

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
export interface ResolvedSport {
  readonly label: string;
  /** Clave de `sports.categories`, o `null` si no declaró deporte. */
  readonly category: string | null;
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
    category: entry?.category ?? null,
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
export function activePainRules(
  ruleset: Ruleset,
  constraints: readonly UserConstraint[],
  level: 'monitor' | 'avoid',
): readonly PainRule[] {
  const rules = ruleset.safety?.painRules;
  if (!rules) return [];

  return rules.filter((rule) => {
    const floor = level === 'avoid' ? rule.avoidFrom : rule.monitorFrom;
    return constraints.some((c) => {
      if (!esMolestia(c)) return false;
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
  out.push(...avisosDeTendon(ruleset, constraints));

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
 * `BODY_REGIONS` ofrece diez zonas y `painRules` no las cubre todas (la cadera
 * entró en `49`). Antes de `27`, una zona sin regla se veía igual que no tener
 * nada: plan completo y ni un aviso.
 */
function avisosDeZonaSinRegla(ruleset: Ruleset, constraints: readonly UserConstraint[]): string[] {
  const texto = ruleset.safety?.noRuleForRegion?.text;
  if (!texto) return [];

  const conRegla = new Set((ruleset.safety?.painRules ?? []).map((r) => r.bodyRegion));
  const sinRegla = new Set<BodyRegion>();
  for (const c of constraints) {
    if (!esMolestia(c)) continue;
    if (c.bodyRegion === null || conRegla.has(c.bodyRegion)) continue;
    sinRegla.add(c.bodyRegion);
  }

  return [...sinRegla].map((region) => texto.replace('{region}', regionLabel(region)));
}

/**
 * Lo que declara algo que duele en una zona: un dolor, una lesión o un tendón.
 * Las otras restricciones (un ejercicio o una máquina descartados) no.
 */
function esMolestia(c: UserConstraint): boolean {
  return c.type === 'pain' || c.type === 'injury' || c.type === 'tendinopathy';
}

/**
 * El aviso del tendón, uno por zona declarada como tendinopatía. Va aparte del
 * `keepDoing` de la zona: ese habla de qué hacer con el dolor; este, de que el
 * tendón necesita carga.
 */
function avisosDeTendon(ruleset: Ruleset, constraints: readonly UserConstraint[]): string[] {
  const nota = ruleset.safety?.tendinopathy?.note;
  if (!nota) return [];
  const zonas = new Set<BodyRegion>();
  for (const c of constraints) {
    if (c.type === 'tendinopathy' && c.bodyRegion !== null) zonas.add(c.bodyRegion);
  }
  return [...zonas].map((region) => nota.replace('{region}', regionLabel(region)));
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
export function isBlockedByPain(exercise: Exercise, rules: readonly PainRule[]): boolean {
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
export function isWithinSkillLevel(exercise: Exercise, level: ExperienceLevel): boolean {
  return EXPERIENCE_LEVELS.indexOf(exercise.skillLevel) <= EXPERIENCE_LEVELS.indexOf(level);
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

export function primaryGoal(goals: readonly UserGoal[]): UserGoal {
  const sorted = [...goals].sort((a, b) => a.priority - b.priority);
  const first = sorted[0];
  if (!first) throw new Error('El usuario no tiene ningún objetivo cargado.');
  return first;
}

/**
 * Cuántas sesiones de diferencia hay entre lo que la persona declaró y el rango
 * que la plantilla pide. Cero si cae adentro.
 */
function distanciaDeFrecuencia(
  declaradas: number,
  [minimo, maximo]: readonly [number, number],
): number {
  if (declaradas < minimo) return minimo - declaradas;
  if (declaradas > maximo) return declaradas - maximo;
  return 0;
}

function pickTemplate(ruleset: Ruleset, goal: UserGoal, warnings: string[]) {
  const forGoal = ruleset.templates.filter((t) => t.goals.includes(goal.goal));
  const byFrequency = forGoal.find(
    (t) =>
      goal.sessionsPerWeekTarget >= t.sessionsPerWeek[0] &&
      goal.sessionsPerWeekTarget <= t.sessionsPerWeek[1],
  );
  if (byFrequency) return byFrequency;

  // Cuando ninguna cubre la frecuencia declarada se usa la **más cercana**, no
  // la primera del array. Era `forGoal[0]`, que acertaba por casualidad en el
  // extremo bajo y elegía la más lejana en el alto: medido, quien declaraba 7
  // sesiones de hipertrofia, fuerza o recomposición recibía "Full body AB" (2 a
  // 3) teniendo "Torso/pierna" (4 a 6) disponible, y el de 6 sesiones de
  // resistencia recibía la de 2-3 en vez de "Base de cardio" (3 a 5). El slider
  // del onboarding va de 1 a 7 y la base acepta ese rango, así que no era un
  // caso imposible.
  //
  // Es la misma forma que las dos trampas de `CLAUDE.md`: elegir por posición en
  // un array y depender de que alguien lo haya ordenado bien. Acá ni siquiera
  // había un orden que lo justificara.
  const porCercania = [...forGoal].sort(
    (a, b) =>
      distanciaDeFrecuencia(goal.sessionsPerWeekTarget, a.sessionsPerWeek) -
      distanciaDeFrecuencia(goal.sessionsPerWeekTarget, b.sessionsPerWeek),
  );
  const fallback = porCercania[0] ?? ruleset.templates[0];
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

export function isBlocked(exercise: Exercise, constraints: readonly UserConstraint[]): boolean {
  return constraints.some(
    (c) =>
      (c.type === 'avoid_exercise' && c.exerciseId === exercise.id) ||
      (c.type === 'avoid_equipment' &&
        c.equipmentId !== null &&
        exercise.equipmentIds.includes(c.equipmentId)),
  );
}
