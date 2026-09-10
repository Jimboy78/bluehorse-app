import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  BodyRegion,
  Equipment,
  EquipmentCategory,
  Exercise,
  ExperienceLevel,
  Goal,
  LoadUnit,
  MatchDayState,
  MovementPattern,
  MuscleGroup,
  Profile,
  SeasonPhase,
  UserBaseline,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import type {
  GymSnapshot,
  PlanBlueprint,
  Ruleset,
  SessionItemBlueprint,
  UserSnapshot,
} from '@bh/engine';
import { createPlaceholderEngine, resolveParams, V1_RESEARCH } from '@bh/engine';
import { describe, expect, it } from 'vitest';
import catalogo from '../supabase/catalog/blue-horse.json' with { type: 'json' };

/**
 * EL MOTOR SOBRE UNA MATRIZ DE SOCIOS
 *
 * Pulir el ruleset es cambiar un número y preguntarse qué le pasó al plan de
 * alguien. Leyendo el JSON eso no se ve: `stepPctUpperBody: 2.5 → 1.25` es una
 * línea de diff, y lo que importa es que a un principiante de hipertrofia la
 * carga le sube la mitad de rápido.
 *
 * Esto corre el motor contra el **catálogo real del gimnasio** —58 estaciones,
 * no un gimnasio de juguete— para una matriz de perfiles, y escribe lo que
 * prescribió en `tools/reportes/`. Dos corridas se comparan con
 * `npm run qa motor-diff a.json b.json`.
 *
 * Es un test y no un script suelto por dos razones: el motor es TypeScript y
 * Node 22.3 no lo importa sin transpilar, y las invariantes que se chequean
 * abajo son regresiones de verdad —tienen que correr en `npm run check`, no
 * cuando alguien se acuerde—.
 *
 * El motor es puro (regla 2), así que esto no toca la base, ni la red, ni el
 * reloj: la fecha y la semilla entran por parámetro y el resultado es el mismo
 * siempre.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const GYM_ID = 'gym-blue-horse';
const AHORA = '2026-09-10T12:00:00.000Z';

// ---------------------------------------------------------------- el gimnasio

/** Un id estable y legible desde el nombre: dos corridas tienen que dar lo mismo. */
function idDe(prefijo: string, nombre: string): string {
  const limpio = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefijo}-${limpio}`;
}

function construirGimnasio(): GymSnapshot {
  const equipment: Equipment[] = catalogo.equipment.map((e) => ({
    id: idDe('eq', e.name),
    gymId: GYM_ID,
    name: e.name,
    category: e.category as EquipmentCategory,
    brand: null,
    model: null,
    photoUrl: null,
    locationNote: null,
    setupNotes: null,
    // El rango real de cada estación todavía no está medido in situ: `load_min`,
    // `load_max` y `load_increment` siguen en null en la base. Se pasa lo mismo
    // acá para que la matriz refleje lo que el motor ve hoy, no un gimnasio ideal.
    load: {
      unit: e.load_unit as LoadUnit,
      min: null,
      max: null,
      increment: null,
      levels: null,
    },
    quantity: e.quantity,
    isActive: true,
  }));

  const porNombre = new Map(equipment.map((e) => [e.name, e.id]));

  const exercises: Exercise[] = catalogo.exercises.map((x) => ({
    id: idDe('ex', x.name),
    gymId: GYM_ID,
    name: x.name,
    pattern: x.pattern as MovementPattern,
    primaryMuscles: x.primaryMuscles as MuscleGroup[],
    secondaryMuscles: x.secondaryMuscles as MuscleGroup[],
    modality: x.modality as Exercise['modality'],
    isCompound: x.isCompound,
    isUnilateral: x.isUnilateral,
    isExplosive: 'isExplosive' in x ? Boolean(x.isExplosive) : false,
    skillLevel: x.skillLevel as ExperienceLevel,
    cues: x.cues ?? null,
    equipmentIds: (x.equipment ?? [])
      .map((n) => porNombre.get(n))
      .filter((id): id is string => !!id),
    isActive: true,
  }));

  return { gymId: GYM_ID, equipment, exercises, substitutions: [] };
}

// ------------------------------------------------------------------ la matriz

interface Perfil {
  readonly nombre: string;
  readonly goal: Goal;
  readonly nivel: ExperienceLevel;
  readonly nacimiento: string;
  readonly sesiones: number;
  readonly minutos: number;
  /** Deporte del catálogo del ruleset (`sports.catalog[].id`). */
  readonly deporte?: string;
  readonly fase?: SeasonPhase;
  /** Lesiones y molestias declaradas: es lo que activa el bloque `safety`. */
  readonly limitaciones?: readonly UserConstraint[];
  /** Días desde la última sesión. `null` = nunca entrenó; `undefined` = no se pasa. */
  readonly diasSinEntrenar?: number | null;
  /** Cargas conocidas, para que el motor pueda proponer un `targetLoad`. */
  readonly cargas?: readonly UserBaseline[];
}

/**
 * Una carga conocida en la prensa.
 *
 * Sin ningún baseline el motor no tiene contra qué calcular un `targetLoad` y
 * sale `null` en todos los ítems — que es lo correcto (regla 6: no se inventa
 * una carga), pero deja sin probar el recorte por desentrenamiento, que es
 * justamente un porcentaje sobre una carga.
 */
const BASE_PRENSA: UserBaseline = {
  exerciseId: 'ex-prensa-de-piernas',
  source: 'declared',
  load: { value: 80, unit: 'kg' },
  reps: 10,
  recordedAt: '2026-06-01T10:00:00.000Z',
};

function molestia(
  bodyRegion: BodyRegion,
  severity: number,
  type: UserConstraint['type'] = 'pain',
): UserConstraint {
  return { type, bodyRegion, exerciseId: null, equipmentId: null, severity };
}

/**
 * Los perfiles que se prueban.
 *
 * No es el producto cartesiano de todo contra todo —serían cientos de planes y
 * un reporte que nadie lee—. Es una fila por combinación que el ruleset trata
 * distinto: cada objetivo con su nivel típico, más los bordes que la
 * investigación marca como sensibles (mayores de 60, principiante absoluto,
 * frecuencia mínima y máxima).
 */
const PERFILES: readonly Perfil[] = [
  {
    nombre: 'fuerza · intermedio',
    goal: 'strength',
    nivel: 'intermediate',
    nacimiento: '1994-05-10',
    sesiones: 3,
    minutos: 60,
  },
  {
    nombre: 'fuerza · principiante',
    goal: 'strength',
    nivel: 'beginner',
    nacimiento: '2000-03-01',
    sesiones: 3,
    minutos: 60,
  },
  {
    nombre: 'fuerza · avanzado',
    goal: 'strength',
    nivel: 'advanced',
    nacimiento: '1990-01-01',
    sesiones: 4,
    minutos: 75,
  },
  {
    nombre: 'hipertrofia · intermedio',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1994-05-10',
    sesiones: 3,
    minutos: 60,
  },
  {
    nombre: 'hipertrofia · principiante',
    goal: 'hypertrophy',
    nivel: 'beginner',
    nacimiento: '2002-07-20',
    sesiones: 2,
    minutos: 45,
  },
  {
    nombre: 'potencia · avanzado',
    goal: 'power',
    nivel: 'advanced',
    nacimiento: '1998-11-05',
    sesiones: 4,
    minutos: 75,
  },
  {
    nombre: 'recomposición · novato',
    goal: 'recomposition',
    nivel: 'novice',
    nacimiento: '1988-02-14',
    sesiones: 3,
    minutos: 60,
  },
  {
    // El nivel donde la recomposición no tenía byLevel y caía al default:
    // recibía 4 series donde hipertrofia da 5.
    nombre: 'recomposición · avanzado',
    goal: 'recomposition',
    nivel: 'advanced',
    nacimiento: '1991-06-30',
    sesiones: 4,
    minutos: 75,
  },
  {
    nombre: 'resistencia · intermedio',
    goal: 'endurance',
    nivel: 'intermediate',
    nacimiento: '1995-09-30',
    sesiones: 3,
    minutos: 50,
  },
  {
    nombre: 'cardio · principiante',
    goal: 'cardio',
    nivel: 'beginner',
    nacimiento: '1985-06-12',
    sesiones: 3,
    minutos: 45,
  },
  {
    nombre: 'mayor de 60 · hipertrofia',
    goal: 'hypertrophy',
    nivel: 'beginner',
    nacimiento: '1960-04-18',
    sesiones: 2,
    minutos: 45,
  },
  {
    nombre: 'mayor de 60 · fuerza',
    goal: 'strength',
    nivel: 'novice',
    nacimiento: '1958-12-02',
    sesiones: 3,
    minutos: 50,
  },
  {
    nombre: 'frecuencia mínima',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1996-08-08',
    sesiones: 1,
    minutos: 40,
  },
  {
    nombre: 'frecuencia alta',
    goal: 'hypertrophy',
    nivel: 'advanced',
    nacimiento: '1993-03-22',
    sesiones: 5,
    minutos: 75,
  },

  // ---------------------------------------------------------------- deportes
  // Las cuatro categorías del ruleset, cada una con la fase de temporada que
  // más la cambia. `emphasis` de cada deporte tiene que verse en la selección.
  {
    nombre: 'fútbol · pretemporada',
    goal: 'strength',
    nivel: 'intermediate',
    nacimiento: '1999-04-12',
    sesiones: 3,
    minutos: 60,
    deporte: 'futbol',
    fase: 'preseason',
  },
  {
    nombre: 'fútbol · en temporada',
    goal: 'strength',
    nivel: 'intermediate',
    nacimiento: '1999-04-12',
    sesiones: 2,
    minutos: 45,
    deporte: 'futbol',
    fase: 'in_season',
  },
  {
    nombre: 'tenis · en temporada',
    goal: 'power',
    nivel: 'advanced',
    nacimiento: '1997-01-09',
    sesiones: 3,
    minutos: 60,
    deporte: 'tenis',
    fase: 'in_season',
  },
  {
    nombre: 'pádel · recreativo',
    goal: 'recomposition',
    nivel: 'beginner',
    nacimiento: '1983-10-25',
    sesiones: 2,
    minutos: 45,
    deporte: 'padel',
    fase: 'none',
  },
  {
    nombre: 'vóley · fuera de temporada',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '2001-06-30',
    sesiones: 4,
    minutos: 70,
    deporte: 'voley',
    fase: 'off_season',
  },

  // ------------------------------------------------------- dolor y lesiones
  // El bloque `safety` es de los que declara evidencia floja, así que es
  // justamente donde más importa mirar qué sale.
  {
    nombre: 'lumbalgia leve',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1991-02-17',
    sesiones: 3,
    minutos: 60,
    limitaciones: [molestia('lower_back', 2)],
  },
  {
    nombre: 'lumbalgia que no deja',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1991-02-17',
    sesiones: 3,
    minutos: 60,
    limitaciones: [molestia('lower_back', 5)],
  },
  {
    nombre: 'hombro lesionado',
    goal: 'strength',
    nivel: 'advanced',
    nacimiento: '1989-08-03',
    sesiones: 4,
    minutos: 70,
    limitaciones: [molestia('shoulder', 4, 'injury')],
  },
  {
    nombre: 'rodilla lesionada',
    goal: 'strength',
    nivel: 'intermediate',
    nacimiento: '1994-11-11',
    sesiones: 3,
    minutos: 60,
    limitaciones: [molestia('knee', 4, 'injury')],
  },
  {
    nombre: 'dos zonas a la vez',
    goal: 'hypertrophy',
    nivel: 'novice',
    nacimiento: '1987-05-19',
    sesiones: 3,
    minutos: 60,
    limitaciones: [molestia('knee', 3), molestia('shoulder', 3)],
  },
  {
    nombre: 'mayor de 60 con rodilla',
    goal: 'strength',
    nivel: 'beginner',
    nacimiento: '1959-03-08',
    sesiones: 2,
    minutos: 45,
    limitaciones: [molestia('knee', 3)],
  },

  // ------------------------------------------------------- volver de una pausa
  // `modifiers.detraining` recorta la carga por días de ausencia. Los bordes
  // importan: el recorte tiene que ser monótono y no aparecer de golpe.
  {
    nombre: 'nunca entrenó',
    goal: 'hypertrophy',
    nivel: 'beginner',
    nacimiento: '1998-09-14',
    sesiones: 3,
    minutos: 60,
    diasSinEntrenar: null,
  },
  {
    nombre: 'volvió a la semana',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1995-12-01',
    sesiones: 3,
    minutos: 60,
    diasSinEntrenar: 7,
    cargas: [BASE_PRENSA],
  },
  {
    nombre: 'volvió al mes',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1995-12-01',
    sesiones: 3,
    minutos: 60,
    diasSinEntrenar: 30,
    cargas: [BASE_PRENSA],
  },
  {
    nombre: 'volvió a los tres meses',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1995-12-01',
    sesiones: 3,
    minutos: 60,
    diasSinEntrenar: 90,
    cargas: [BASE_PRENSA],
  },
  {
    nombre: 'volvió al año',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1995-12-01',
    sesiones: 3,
    minutos: 60,
    diasSinEntrenar: 365,
    cargas: [BASE_PRENSA],
  },

  // ------------------------------------------------------ el borde de los 60
  // `modifiers.olderAdults.fromAge` es 60. Un umbral con una fecha de
  // nacimiento adentro es donde se esconden los errores de un día.
  {
    nombre: 'justo antes de 60',
    goal: 'strength',
    nivel: 'intermediate',
    nacimiento: '1966-09-11',
    sesiones: 3,
    minutos: 60,
  },
  {
    nombre: 'justo cumplidos 60',
    goal: 'strength',
    nivel: 'intermediate',
    nacimiento: '1966-09-09',
    sesiones: 3,
    minutos: 60,
  },
  {
    nombre: 'ochenta años',
    goal: 'strength',
    nivel: 'beginner',
    nacimiento: '1946-01-20',
    sesiones: 2,
    minutos: 40,
  },
];

function socioDe(p: Perfil): UserSnapshot {
  const profile: Profile = {
    id: `user-${p.nombre.replace(/\s+/g, '-')}`,
    gymId: GYM_ID,
    displayName: p.nombre,
    birthDate: p.nacimiento,
    sex: 'undisclosed',
    experienceLevel: p.nivel,
  };
  const goal: UserGoal = {
    goal: p.goal,
    sport: p.deporte ?? null,
    seasonPhase: p.fase ?? 'none',
    priority: 1,
    sessionsPerWeekTarget: p.sesiones,
    sessionMinutesTarget: p.minutos,
  };
  return {
    profile,
    goals: [goal],
    constraints: p.limitaciones ?? [],
    baselines: p.cargas ?? [],
  };
}

const engine = createPlaceholderEngine();
const gym = construirGimnasio();

function planDe(p: Perfil, ruleset: Ruleset): PlanBlueprint {
  return engine.generatePlan({
    context: { now: AHORA, seed: 42 },
    user: socioDe(p),
    gym,
    ruleset,
    ...(p.diasSinEntrenar === undefined ? {} : { daysSinceLastSession: p.diasSinEntrenar }),
  });
}

/**
 * El plan reducido a lo comparable.
 *
 * No se guarda el blueprint entero: los ids de ejercicio cambian si alguien
 * renombra una máquina en el catálogo, y un diff lleno de renombres tapa el
 * cambio de prescripción que se vino a ver. Queda el nombre y los números.
 */
function resumir(plan: PlanBlueprint) {
  return {
    rulesetVersion: plan.rulesetVersion,
    source: plan.source,
    warnings: plan.warnings,
    sesiones: plan.sessions.map((s) => ({
      label: s.label,
      focus: s.focus,
      minutos: s.estimatedMinutes,
      items: s.items.map((i) => ({
        ejercicio: gym.exercises.find((e) => e.id === i.exerciseId)?.name ?? i.exerciseId,
        series: i.targetSets,
        reps: `${i.targetRepsMin}-${i.targetRepsMax}`,
        rir: i.targetRir,
        descanso: i.restSeconds,
        carga: i.targetLoad ? `${i.targetLoad.value} ${i.targetLoad.unit}` : null,
        // Los de cardio se prescriben por tiempo y zona, no por series y carga.
        // Van al resumen porque sin ellos una caminata de 30 minutos y una de 5
        // se ven idénticas: `1 serie, 1-1 reps, sin carga`.
        duracionSeg: i.targetDurationSeconds,
        zona: i.targetIntensityZone,
      })),
    })),
  };
}

type ItemResumido = ReturnType<typeof resumir>['sesiones'][number]['items'][number];

/**
 * Qué tiene de imposible una prescripción, si tiene algo.
 *
 * Regla 3: ningún número de entrenamiento vive en el código. Si sale una serie
 * con 0 repeticiones o un RIR fuera del rango declarado, ese número no vino del
 * ruleset — lo puso un default escondido en el motor.
 */
function* quejasDe(item: ItemResumido): Generator<string> {
  const [min, max] = item.reps.split('-').map(Number);

  if (item.series <= 0) yield `con ${item.series} series`;
  if (!min || !max || min > max) yield `reps ${item.reps}`;
  if (item.rir !== null && (item.rir < 0 || item.rir > 10)) yield `RIR ${item.rir}`;

  // Un ítem de cardio continuo no tiene descanso: es un solo bloque de N
  // minutos. Se reconoce porque trae duración, no porque el descanso sea 0 —
  // así una serie de sala con descanso 0 sigue siendo un error.
  if (item.duracionSeg === null && item.descanso <= 0) yield `descanso ${item.descanso}`;
}

const CACHE = new Map<string, ReturnType<typeof resumir>>();

/** El plan resumido de un perfil, calculado una sola vez. */
function reporteDe(p: Perfil) {
  const previo = CACHE.get(p.nombre);
  if (previo) return previo;
  const nuevo = resumir(planDe(p, V1_RESEARCH));
  CACHE.set(p.nombre, nuevo);
  return nuevo;
}

describe('matriz del motor', () => {
  const reporte = {
    generadoEl: AHORA,
    ruleset: V1_RESEARCH.version,
    catalogo: { estaciones: gym.equipment.length, ejercicios: gym.exercises.length },
    perfiles: {} as Record<string, ReturnType<typeof resumir>>,
  };

  for (const perfil of PERFILES) {
    reporte.perfiles[perfil.nombre] = resumir(planDe(perfil, V1_RESEARCH));
  }

  /**
   * El reporte **se commitea**.
   *
   * Es determinista (lo cuida el test de abajo), así que mientras nadie toque
   * el ruleset ni el catálogo, git no lo ve cambiar. Y cuando alguien sí los
   * toca, el diff del commit muestra qué le pasó al plan de cada perfil —"la
   * sentadilla pasó de 4×6-12 a 3×6-12"— en vez de una línea de JSON con un
   * número distinto. Es la revisión que un cambio de prescripción merece.
   */
  it('escribe el reporte para comparar contra otra corrida', () => {
    const destino = join(AQUI, 'reportes', `motor-${V1_RESEARCH.version}.json`);
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, `${JSON.stringify(reporte, null, 2)}\n`, 'utf8');
    expect(Object.keys(reporte.perfiles)).toHaveLength(PERFILES.length);
  });

  it('le arma un plan con ejercicios a todos los perfiles', () => {
    const vacios = Object.entries(reporte.perfiles)
      .filter(([, p]) => p.sesiones.length === 0 || p.sesiones.every((s) => s.items.length === 0))
      .map(([nombre]) => nombre);
    expect(vacios).toEqual([]);
  });

  /**
   * Regla 3: ningún número de entrenamiento vive en el código.
   *
   * Si una prescripción sale con 0 series o 0 repeticiones, o con un RIR fuera
   * del rango que el ruleset declara, el número no salió del ruleset: lo puso
   * un default escondido en el motor.
   */
  it('no prescribe números imposibles', () => {
    const malos: string[] = [];
    for (const [nombre, plan] of Object.entries(reporte.perfiles)) {
      for (const sesion of plan.sesiones) {
        for (const item of sesion.items) {
          for (const queja of quejasDe(item)) malos.push(`${nombre}: ${item.ejercicio} ${queja}`);
        }
      }
    }
    expect(malos).toEqual([]);
  });

  /** Regla 4: un plan siempre sabe con qué versión se armó. */
  it('cada plan declara su ruleset', () => {
    for (const plan of Object.values(reporte.perfiles)) {
      expect(plan.rulesetVersion).toBe(V1_RESEARCH.version);
      expect(plan.source).toBe('research');
    }
  });

  /**
   * El mismo socio y la misma semilla dan el mismo plan.
   *
   * Sin esto, comparar dos corridas no significa nada: cualquier diferencia
   * podría ser el azar del motor en vez del cambio que se hizo.
   */
  it('es determinista', () => {
    const uno = planDe(PERFILES[0], V1_RESEARCH);
    const dos = planDe(PERFILES[0], V1_RESEARCH);
    expect(JSON.stringify(uno)).toBe(JSON.stringify(dos));
  });

  /** El plan tiene que caber en el tiempo que el socio dijo que tiene. */
  /**
   * HUECO CONOCIDO: el motor no mira los minutos que el socio declaró.
   *
   * `sessionMinutesTarget` se pregunta en el onboarding (paso 3, "los minutos
   * por sesión"), se valida entre 15 y 180, se guarda en `user_goals`, se mapea
   * a `UserSnapshot` y se le pasa al motor en cada `generatePlan`. Y el motor
   * nunca lo lee: `estimatedMinutes` sale de la plantilla
   * (`placeholder-engine.ts:182`, `resolved.tplSession.estimatedMinutes`).
   *
   * Medido acá: quien declara 40 minutos recibe sesiones de 55 —un 37% más—, y
   * quien declara 75 recibe las mismas de siempre. La pregunta del onboarding
   * no cambia nada de lo que pasa después.
   *
   * Este test **afirma el hueco** en vez de ignorarlo: si alguien hace que el
   * motor respete el tiempo, esta lista deja de coincidir y el test falla
   * pidiendo que se lo dé vuelta. Un `it.skip` no haría eso, y un test que
   * simplemente falla rompe `npm run check` todos los días hasta que alguien lo
   * borra por molesto.
   */
  it('todavía no respeta el tiempo declarado (hueco conocido)', () => {
    const desbordes = new Set<string>();
    for (const perfil of PERFILES) {
      for (const sesion of reporte.perfiles[perfil.nombre].sesiones) {
        // Un 25% de margen: la estimación no es un cronómetro.
        if (sesion.minutos > perfil.minutos * 1.25) desbordes.add(perfil.nombre);
      }
    }
    expect([...desbordes].sort()).toEqual(['frecuencia mínima', 'ochenta años']);
  });
});

/**
 * LOS AVISOS SE LEEN EN PANTALLA
 *
 * Un `warning` del motor no es un log: aparece en la tarjeta del plan, en
 * castellano, y lo lee el socio. Salió de correr la matriz —quien elige
 * entrenar una vez por semana, que es una opción del onboarding, leía "Con 1
 * sesiones por semana"—.
 */
describe('los avisos del motor', () => {
  const unaVezPorSemana: Perfil = {
    nombre: 'una sola sesión',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1996-08-08',
    sesiones: 1,
    minutos: 40,
  };

  it('no dice "1 sesiones"', () => {
    const plan = planDe(unaVezPorSemana, V1_RESEARCH);
    expect(plan.warnings.length).toBeGreaterThan(0);
    for (const aviso of plan.warnings) {
      expect(aviso).not.toContain('1 sesiones');
    }
  });

  it('sigue diciendo "3 sesiones" en plural', () => {
    const plan = planDe({ ...unaVezPorSemana, sesiones: 3 }, V1_RESEARCH);
    expect(plan.warnings.some((a) => a.includes('3 sesiones'))).toBe(true);
  });
});

/**
 * REGLA 3, VERIFICADA DE PUNTA A PUNTA
 *
 * `qa docs` compara el ruleset contra las tablas de `docs/research/`: ahí se ve
 * que el número documentado llegó bien al JSON. Lo que eso NO prueba es que el
 * número del JSON sea el que termina en el plan del socio.
 *
 * Esto cierra ese eslabón: cada combinación de series, repeticiones, RIR y
 * descanso que sale en un plan tiene que existir tal cual en algún bloque del
 * ruleset para ese objetivo. Si el motor promedia, redondea o mete un default
 * propio, no va a encontrarse en ninguna parte y aparece acá.
 *
 * Es la única forma de que "ningún número de entrenamiento vive en el código"
 * sea una afirmación verificada y no una intención.
 */

/**
 * REGLA 3, VERIFICADA DE PUNTA A PUNTA
 *
 * `npm run qa docs` compara el ruleset contra las tablas de `docs/research/`:
 * ahí se ve que el número documentado llegó bien al JSON. Lo que eso no prueba
 * es que el número del JSON sea el que termina en el plan del socio.
 *
 * Esto cierra ese eslabón. En vez de comparar contra el bloque crudo —que da
 * 280 falsos positivos, porque los modificadores existen justamente para
 * transformarlo— se reconstruye la cadena documentada:
 *
 *   1. la prescripción del nivel (`byLevel.<nivel>`), o `default` si no hay
 *   2. la ventana de repeticiones de mayores (`modifiers.olderAdults`), si la
 *      edad la alcanza y el objetivo está en `appliesToGoals`
 *   3. el multiplicador de volumen de la fase de temporada (`sports.seasonPhases`)
 *
 * Si el plan no coincide con eso, el motor puso un número que no sale del
 * ruleset por ningún camino documentado, y ahí sí hay algo que mirar.
 *
 * Los tres grupos que la primera versión marcó como inventados y resultaron
 * correctos, cada uno con su respaldo:
 *
 * - `RIR null` en potencia — `rirTarget` es `null` en el ruleset, y la nota
 *   dice por qué: "la potencia se regula por velocidad, no por repeticiones
 *   en reserva".
 * - Series a la mitad en fútbol y tenis en temporada — `volumeMultiplier: 0.5`.
 * - `7-9` repeticiones pasados los 60 — `olderAdults.repsWindow`.
 */
describe('los números del plan salen del ruleset', () => {
  const reglas = V1_RESEARCH as unknown as {
    prescription: Record<string, { default?: Ranura; byLevel?: Record<string, Ranura> }>;
    modifiers?: {
      olderAdults?: { fromAge: number; repsWindow: [number, number]; appliesToGoals: string[] };
    };
    sports?: { seasonPhases?: Record<string, { volumeMultiplier: number }> };
  };

  type Slot = {
    sets: number;
    repsMin: number;
    repsMax: number;
    rirTarget: number | null;
    restSeconds: number;
  };
  type Ranura = Record<string, Slot>;

  function edadDe(nacimiento: string): number {
    const nace = new Date(nacimiento);
    const hoy = new Date(AHORA);
    let años = hoy.getUTCFullYear() - nace.getUTCFullYear();
    const mes = hoy.getUTCMonth() - nace.getUTCMonth();
    if (mes < 0 || (mes === 0 && hoy.getUTCDate() < nace.getUTCDate())) años--;
    return años;
  }

  /** La ventana de repeticiones de mayores, si a este perfil le corresponde. */
  function ventanaDeMayores(p: Perfil): [number, number] | null {
    const mayores = reglas.modifiers?.olderAdults;
    if (!mayores) return null;
    if (edadDe(p.nacimiento) < mayores.fromAge) return null;
    if (!mayores.appliesToGoals.includes(p.goal)) return null;
    return mayores.repsWindow;
  }

  /** Todas las firmas que el ruleset permite para este perfil, con los modificadores puestos. */
  function firmasPermitidas(p: Perfil): Set<string> {
    const bloque = reglas.prescription[p.goal];
    const familias = [bloque?.byLevel?.[p.nivel], bloque?.default].filter(Boolean) as Ranura[];
    const ventana = ventanaDeMayores(p);

    const multiplicador = reglas.sports?.seasonPhases?.[p.fase ?? 'none']?.volumeMultiplier ?? 1;

    const firmas = new Set<string>();
    for (const familia of familias) {
      for (const slot of Object.values(familia)) {
        if (typeof slot?.sets !== 'number') continue;
        for (const firma of firmasDeUnSlot(slot, ventana, multiplicador)) firmas.add(firma);
      }
    }
    return firmas;
  }

  /**
   * Las firmas que admite una ranura sola, con los modificadores puestos.
   *
   * Se emiten las **dos** formas de redondear medio set (`ceil` y `floor`)
   * porque el ruleset no dice cuál usar, y afirmar una sería convertir el test
   * en una regla sobre algo que la investigación no decide. Lo que vigila es
   * que las series salgan de multiplicar el valor del ruleset, no de un
   * default escondido en el motor.
   */
  function firmasDeUnSlot(
    slot: Slot,
    ventana: [number, number] | null,
    multiplicador: number,
  ): string[] {
    const repsMin = ventana ? ventana[0] : slot.repsMin;
    const repsMax = ventana ? ventana[1] : slot.repsMax;
    const posibles = [Math.ceil(slot.sets * multiplicador), Math.floor(slot.sets * multiplicador)];
    return posibles
      .filter((sets) => sets > 0)
      .map((sets) => `${sets}×${repsMin}-${repsMax} RIR ${slot.rirTarget} d${slot.restSeconds}s`);
  }

  /** Lo que este perfil recibió y el ruleset no explica por ningún camino. */
  function sinExplicacion(perfil: Perfil): string[] {
    const permitidas = firmasPermitidas(perfil);
    if (permitidas.size === 0) return []; // objetivo sin bloque de sala (cardio)

    const sueltos: string[] = [];
    for (const sesion of reporteDe(perfil).sesiones) {
      for (const item of sesion.items) {
        // El cardio continuo se prescribe por tiempo y zona, no por series.
        if (item.duracionSeg !== null) continue;
        const firma = `${item.series}×${item.reps} RIR ${item.rir} d${item.descanso}s`;
        if (!permitidas.has(firma)) sueltos.push(`${perfil.nombre} · ${item.ejercicio}: ${firma}`);
      }
    }
    return sueltos;
  }

  it('cada prescripción de sala se explica por el ruleset', () => {
    const inexplicables = PERFILES.flatMap(sinExplicacion);
    expect([...new Set(inexplicables)]).toEqual([]);
  });
});

/**
 * EL PLAN NO PROMETE LO QUE NO ENTREGA
 *
 * La app ofrece el objetivo como "Potencia / explosividad — moverte más rápido
 * y más explosivo". Medido sobre el catálogo real, un plan de potencia trae la
 * misma selección que uno de fuerza —sentadilla en Smith, press inclinado,
 * remo, press militar— a 1-3 repeticiones, y ninguno de los tres ejercicios
 * explosivos del gimnasio.
 *
 * Mientras eso siga así, el plan tiene que decirlo. Ver la nota larga en
 * `powerWarnings` (`placeholder-engine.ts`) para por qué la selección no se
 * cambió acá: es una decisión de producto con una tensión real detrás.
 */
describe('el aviso de potencia sin explosivos', () => {
  const explosivosDelGimnasio = gym.exercises.filter((e) => e.isExplosive).map((e) => e.name);

  function avisaDeExplosivos(p: Perfil): boolean {
    return planDe(p, V1_RESEARCH).warnings.some((w) => w.includes('explosivo'));
  }

  it('el gimnasio tiene ejercicios explosivos cargados', () => {
    // Si el catálogo no marcara ninguno, el aviso saldría siempre y no
    // significaría nada: estaría describiendo el catálogo, no el plan.
    expect(explosivosDelGimnasio.length).toBeGreaterThan(0);
  });

  it('avisa cuando el objetivo es potencia y no entró ninguno', () => {
    const potencia = PERFILES.filter((p) => p.goal === 'power');
    expect(potencia.length).toBeGreaterThan(0);
    for (const perfil of potencia) {
      const conExplosivo = reporteDe(perfil).sesiones.some((s) =>
        s.items.some((i) => explosivosDelGimnasio.includes(i.ejercicio)),
      );
      // Hoy ninguno recibe explosivos, así que todos tienen que avisar. Si
      // algún día la selección cambia, este test sigue siendo correcto: avisa
      // solo el que no recibió ninguno.
      expect(avisaDeExplosivos(perfil)).toBe(!conExplosivo);
    }
  });

  it('no avisa en objetivos que no son potencia', () => {
    for (const perfil of PERFILES.filter((p) => p.goal !== 'power')) {
      expect(avisaDeExplosivos(perfil)).toBe(false);
    }
  });
});

/**
 * EL DÍA DEL PARTIDO: EL MÉTODO QUE NADIE LLAMA
 *
 * `adjustSession` es el único método del contrato que la matriz no ejercitaba, y
 * el único que hoy **ningún socio puede alcanzar**: `MatchDayState` vive en el
 * enum del dominio y en el motor, y no aparece ni en `apps/web` ni en el
 * esquema de la base. Nadie pregunta "¿jugaste ayer?", así que los cinco
 * estados que `07-dias-pre-y-post-partido.md` justifica con siete fuentes no
 * llegan a la pantalla.
 *
 * Se cubre igual, y por eso mismo: cuando se cablee, tiene que salir bien de
 * entrada. Lo que se verifica es la regla 3 aplicada al ajuste — cada serie que
 * sale se explica por el multiplicador del ruleset, no por un número del código.
 */
describe('el ajuste por día de partido', () => {
  const ESTADOS = Object.keys(V1_RESEARCH.sports?.matchDay ?? {}) as MatchDayState[];

  // Anatomía, no prescripción: el motor tiene la misma lista y no la exporta.
  // Se repite acá a propósito — si alguien le agrega o le saca un músculo allá,
  // este test empieza a fallar en vez de quedarse mirando otra cosa.
  const PIERNA: readonly MuscleGroup[] = ['quads', 'hamstrings', 'glutes', 'calves'];

  function esDePierna(ex: Exercise): boolean {
    return ex.primaryMuscles.some((m) => PIERNA.includes(m));
  }

  /**
   * TODAS las sesiones de TODOS los perfiles, aplanadas una sola vez.
   *
   * La primera versión miraba solo la sesión con más ítems de cada perfil, y
   * con eso sacarle `avoidExplosive` al motor entero no rompía nada: el único
   * explosivo que hoy entra a un plan cae en "Pierna B" del perfil de vóley,
   * que no es la sesión más grande. Un test que mira una sesión por perfil deja
   * pasar justo lo que aparece en las otras.
   */
  const SESIONES = PERFILES.flatMap((perfil) =>
    planDe(perfil, V1_RESEARCH).sessions.map((s) => ({
      perfil,
      label: s.label,
      items: s.items,
    })),
  );

  /**
   * Cada sesión pasada por cada estado, calculado una vez.
   *
   * Aplanar acá es lo que deja cada test en un solo bucle: con los cuatro
   * anidados adentro de cada `it`, biome medía complejidad 63 sobre un test
   * que hace una comparación por ítem.
   */
  const AJUSTES = SESIONES.flatMap(({ perfil, label, items }) =>
    ESTADOS.map((state) => ({
      donde: `${perfil.nombre}/${state}/${label}`,
      perfil,
      state,
      regla: V1_RESEARCH.sports?.matchDay?.[state],
      antes: items,
      salida: engine.adjustSession({ items, gym, state, ruleset: V1_RESEARCH }),
    })),
  );

  type ReglaDia = NonNullable<NonNullable<Ruleset['sports']>['matchDay']>[MatchDayState];

  /**
   * Qué tiene de inexplicable lo que le pasó a un ítem, si tiene algo.
   *
   * Mismo criterio que `quejasDe`: la regla 3 dice que el número sale del
   * ruleset, así que acá se recalcula desde el ruleset y se compara. Si no
   * coincide, el número lo puso el motor.
   */
  function quejaDelAjuste(
    item: SessionItemBlueprint,
    despues: SessionItemBlueprint | undefined,
    ex: Exercise,
    regla: ReglaDia,
  ): string | null {
    const mult = esDePierna(ex) ? regla.lowerBodyVolumeMultiplier : regla.upperBodyVolumeMultiplier;
    const fuera = (regla.avoidExplosive && ex.isExplosive) || mult === 0;

    if (fuera) return despues === undefined ? null : `${ex.name} tendría que salir y quedó`;
    if (despues === undefined) return `${ex.name} salió sin regla que lo saque`;

    const esperado = Math.max(1, Math.round(item.targetSets * mult));
    if (despues.targetSets === esperado) return null;
    return `${ex.name} ${item.targetSets}→${despues.targetSets}, el ruleset da ${esperado}`;
  }

  /** Cada (ajuste, ítem) del barrido, con el ejercicio ya resuelto. */
  function* porItem() {
    for (const ajuste of AJUSTES) {
      if (!ajuste.regla) continue;
      const porId = new Map(ajuste.salida.items.map((i) => [i.exerciseId, i]));
      for (const item of ajuste.antes) {
        const ex = gym.exercises.find((e) => e.id === item.exerciseId);
        if (ex)
          yield { ...ajuste, regla: ajuste.regla, item, ex, despues: porId.get(item.exerciseId) };
      }
    }
  }

  it('el ruleset declara los cinco estados que el documento justifica', () => {
    // Si alguien agrega un estado sin documento detrás, o saca uno que el
    // documento sostiene, esto lo dice antes de que llegue a un plan.
    expect([...ESTADOS].sort()).toEqual(
      ['day_after', 'day_before', 'match_day', 'normal', 'two_days_after'].sort(),
    );
  });

  it('un día normal no toca nada', () => {
    for (const { donde, state, antes, salida } of AJUSTES) {
      if (state !== 'normal') continue;
      expect(salida.changed, donde).toBe(false);
      expect(salida.note, donde).toBeNull();
      expect(salida.items, donde).toEqual(antes);
    }
  });

  it('cada serie que sale se explica por el multiplicador del ruleset', () => {
    const sinExplicar: string[] = [];

    for (const { donde, regla, item, ex, despues } of porItem()) {
      // El cardio se prescribe por tiempo: un multiplicador de series no
      // significa nada sobre él y tiene que salir intacto.
      if (item.targetDurationSeconds !== null) {
        expect(despues, `${donde}/${ex.name}`).toEqual(item);
        continue;
      }
      const queja = quejaDelAjuste(item, despues, ex, regla);
      if (queja) sinExplicar.push(`${donde}: ${queja}`);
    }

    expect(sinExplicar.join('\n')).toBe('');
  });

  /**
   * LA REGLA DE LO EXPLOSIVO SE PROBÓ SOLA, Y CASI NO SE PRUEBA
   *
   * Se le sacó `avoidExplosive` al motor entero y los 32 perfiles siguieron
   * pasando. La causa no era que ningún plan traiga explosivos —uno los trae—
   * sino que el test miraba una sola sesión por perfil. Con eso corregido, la
   * cobertura pende de **un** ítem de **un** perfil: si el catálogo o el
   * selector se mueven un poco, la regla vuelve a quedar sin probar.
   *
   * Por eso van los dos tests: uno arma el caso a mano, para que la rama esté
   * cubierta pase lo que pase, y el otro vigila que siga habiendo al menos un
   * plan real donde la regla haga algo.
   */
  it('saca lo explosivo cuando el estado lo pide', () => {
    const explosivo = gym.exercises.find((e) => e.isExplosive);
    expect(explosivo).toBeDefined();
    if (!explosivo) return;

    const item = { ...SESIONES[0].items[0], exerciseId: explosivo.id };

    for (const state of ESTADOS) {
      const regla = V1_RESEARCH.sports?.matchDay?.[state];
      if (!regla) continue;
      const salida = engine.adjustSession({ items: [item], gym, state, ruleset: V1_RESEARCH });
      expect(salida.items.length, state).toBe(regla.avoidExplosive ? 0 : 1);
      if (regla.avoidExplosive) expect(salida.note, state).toContain(explosivo.name);
    }
  });

  it('algún plan real todavía trae un explosivo sobre el que la regla actúe', () => {
    const conExplosivo = SESIONES.filter((s) =>
      s.items.some((i) => gym.exercises.find((e) => e.id === i.exerciseId)?.isExplosive),
    ).map((s) => `${s.perfil.nombre} / ${s.label}`);

    // Hoy es exactamente uno, y no es de potencia: los tres explosivos del
    // gimnasio son de peso corporal y el selector prefiere `reps_weight` en el
    // slot principal (ver `22-carga-de-potencia.md`). Que sea uno solo es el
    // hallazgo, no el requisito — el test pide que no sea cero.
    expect(conExplosivo.length, 'ningún plan trae explosivos').toBeGreaterThan(0);
  });

  it('recorta la pierna al menos tanto como el tren superior', () => {
    // La asimetría es el resultado principal del documento: el daño se
    // concentra abajo. Si algún estado recortara más arriba que abajo, el
    // ruleset estaría diciendo lo contrario que su propia fuente.
    for (const state of ESTADOS) {
      const regla = V1_RESEARCH.sports?.matchDay?.[state];
      if (!regla) continue;
      expect(regla.lowerBodyVolumeMultiplier, state).toBeLessThanOrEqual(
        regla.upperBodyVolumeMultiplier,
      );
    }
  });

  it('ningún estado deja la sesión vacía salvo el del partido', () => {
    for (const { donde, state, salida } of AJUSTES) {
      if (state === 'match_day') continue;
      expect(salida.items.length, donde).toBeGreaterThan(0);
    }
  });

  /** Los ejercicios que el ajuste dejó afuera de una sesión. */
  function sacadosDe(
    antes: readonly SessionItemBlueprint[],
    items: readonly SessionItemBlueprint[],
  ): string[] {
    const quedaron = new Set(items.map((o) => o.exerciseId));
    return antes
      .filter((i) => !quedaron.has(i.exerciseId))
      .map((i) => gym.exercises.find((e) => e.id === i.exerciseId)?.name)
      .filter((n): n is string => n !== undefined);
  }

  it('cuando cambia algo lo explica, y lo que saca lo nombra', () => {
    for (const { donde, antes, salida } of AJUSTES) {
      if (!salida.changed) continue;
      expect(salida.note, donde).toBeTruthy();
      for (const nombre of sacadosDe(antes, salida.items)) {
        expect(salida.note, donde).toContain(nombre);
      }
    }
  });
});

/**
 * LO QUE EL RULESET AFIRMA SOBRE SÍ MISMO
 *
 * La nota de confianza de `recomposition` dice textualmente *"Los números son
 * los de hipertrofia; lo que cambia es la dieta, que esta app no maneja"*, y
 * `12-objetivo.md` lo audita y lo da por bueno: su tabla anota
 * "idéntico a hipertrofia" en los tres slots.
 *
 * Medido el 10 de septiembre de 2026, eso valía **solo en el `default`**. El
 * `byLevel` estaba a medio copiar: `beginner` tenía `primary` pero no
 * `secondary` ni `isolation`, `novice` solo tenía `progression`, y `advanced`
 * no existía. Como `resolveParams` cae al `default` slot por slot, un novato
 * que elegía recomposición recibía la dosis de intermedio —4 series a RIR 1 en
 * vez de 3 a RIR 2— y un principiante recibía los accesorios a 3 series RIR 2
 * en vez de 2 a RIR 3. Más volumen y más cerca del fallo, en déficit calórico,
 * que es justo donde el margen es menor.
 *
 * La auditoría de `12` no lo vio porque miró la fila del `default`. Este test
 * mira los cuatro niveles.
 */
describe('lo que el ruleset afirma de sí mismo', () => {
  const NIVELES: readonly ExperienceLevel[] = ['beginner', 'novice', 'intermediate', 'advanced'];

  it('la recomposición prescribe lo mismo que la hipertrofia, en los cuatro niveles', () => {
    const distintos: string[] = [];

    for (const nivel of NIVELES) {
      const hiper = resolveParams(V1_RESEARCH, 'hypertrophy', nivel);
      const recomp = resolveParams(V1_RESEARCH, 'recomposition', nivel);

      for (const slot of ['primary', 'secondary', 'isolation'] as const) {
        const a = JSON.stringify(hiper[slot]);
        const b = JSON.stringify(recomp[slot]);
        if (a !== b) distintos.push(`${nivel}.${slot}: hipertrofia ${a} · recomposición ${b}`);
      }
    }

    // Si algún día la recomposición tiene que diferenciarse, el cambio empieza
    // por la nota y por `12-objetivo.md`, no por acá: hoy las dos dicen que son
    // los mismos números.
    expect(distintos.join('\n')).toBe('');
  });
});
