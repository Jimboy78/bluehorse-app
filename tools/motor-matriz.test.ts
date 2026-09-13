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
  LoadReading,
  LoadUnit,
  MatchDayState,
  MovementPattern,
  MuscleGroup,
  Plan,
  Profile,
  SeasonPhase,
  SetLog,
  UserBaseline,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import {
  BODY_REGIONS,
  GOALS,
  MOVEMENT_PATTERNS,
  MUSCLE_GROUPS,
  nextLoad,
  snapToEquipment,
} from '@bh/domain';
import type {
  GymSnapshot,
  PlanBlueprint,
  ProposalBlueprint,
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
    // `load_max` y `load_increment` siguen en null en la base. La matriz refleja
    // eso, pero **como lo refleja la app**: `toDomainEquipment` arma el spec con
    // spread condicional, así que una columna nula deja la clave AUSENTE, no en
    // `null`.
    //
    // No es lo mismo, y la diferencia se comía la carga entera. `snapToEquipment`
    // pregunta `spec.max !== undefined`, y `null` pasa ese filtro: con `max:
    // null` hacía `Math.min(41, null)`, que es `Math.min(41, 0)` = 0. Medido:
    // con 40 kg anotados, el motor proponía "subir" de 40 a 0. En la app no
    // pasa; pasaba solo acá, o sea que toda conclusión de la matriz sobre carga
    // se sacaba contra un gimnasio que no existe.
    load: { unit: e.load_unit as LoadUnit },
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
  {
    /*
     * Los seis perfiles mayores de 60 que había usaban fuerza o hipertrofia,
     * que son justo los dos objetivos que la ventana de `olderAdults` cubre.
     * O sea que la matriz —el artefacto de regresión del proyecto— no
     * ejercitaba nunca el caso contrario, y ahí había un agujero: alguien de 85
     * con objetivo potencia recibía un plan byte a byte idéntico al de uno de
     * 30, con la misma cantidad de avisos.
     */
    nombre: 'ochenta años · potencia',
    goal: 'power',
    nivel: 'beginner',
    nacimiento: '1946-01-20',
    sesiones: 2,
    minutos: 60,
  },
  {
    /*
     * El onboarding deja pedir hasta 7 sesiones por semana y la base las acepta
     * (`04_user.sql`), pero ninguna plantilla pasa de 6 — y la matriz no tenía
     * un solo perfil arriba de 5. O sea que el fallback de `pickTemplate`, el
     * único camino que esos socios recorren, no aparecía nunca en el reporte
     * commiteado. Ahí estaba el agujero: con 7 sesiones declaradas el motor
     * elegía "Full body AB" (2 a 3) teniendo "Torso/pierna" (4 a 6) disponible.
     */
    nombre: 'siete por semana',
    goal: 'hypertrophy',
    nivel: 'intermediate',
    nacimiento: '1996-03-14',
    sesiones: 7,
    minutos: 60,
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

  /**
   * EL PLAN QUE NO ENTRA EN EL TIEMPO LO DICE
   *
   * El motor ya no ignora del todo `sessionMinutesTarget`: compara el
   * **descanso solo** —`restSeconds` × series, todo del ruleset— contra los
   * minutos que la persona declaró. Una sesión no puede durar menos que la suma
   * de sus descansos, así que si eso no entra, el plan no entra, y no hace falta
   * suponer cuánto tarda una serie para saberlo. Suponerlo sí sería inventar: la
   * investigación mide el tempo y devuelve un rango de 0,5 a 8 segundos por
   * repetición, no un valor.
   *
   * Lo que importa de un aviso es a quién NO le sale. Medido sobre los 33
   * perfiles: con 30 minutos declarados le sale a 14, con 45 a 2, y con 60 a
   * ninguno. Un aviso que le saliera a todos no informaría nada.
   */
  it('avisa cuando el descanso solo no entra en el tiempo declarado', () => {
    const marca = (V1_RESEARCH.modifiers?.sessionLength?.overTargetNote ?? '').split(
      '{declarados}',
    )[0];
    expect(marca, 'el ruleset dejó de traer el aviso de tiempo').toBeTruthy();

    let conAviso = 0;
    let sinAviso = 0;
    for (const perfil of PERFILES) {
      const apurado = planDe(
        { ...perfil, nombre: `${perfil.nombre} apurado`, minutos: 30 },
        V1_RESEARCH,
      );
      const holgado = planDe(
        { ...perfil, nombre: `${perfil.nombre} holgado`, minutos: 180 },
        V1_RESEARCH,
      );
      if (apurado.warnings.some((w) => w.startsWith(marca ?? ''))) conAviso += 1;
      if (!holgado.warnings.some((w) => w.startsWith(marca ?? ''))) sinAviso += 1;
    }

    // A unos cuantos sí, para que el aviso exista de verdad.
    expect(conAviso, 'con 30 minutos no le avisó a nadie').toBeGreaterThan(8);
    // Y a nadie con tiempo de sobra, para que no sea ruido.
    expect(sinAviso, 'le avisó a alguien que declaró tres horas').toBe(PERFILES.length);
  });

  /**
   * HUECO QUE QUEDA: el número de minutos que se muestra sigue saliendo de la
   * plantilla.
   *
   * El motor ya **lee** `sessionMinutesTarget` para avisar cuando el plan no
   * entra (test de arriba), pero `estimatedMinutes` —lo que la pantalla le
   * muestra al socio en `PlanPreview`— sigue siendo la constante de la
   * plantilla, la misma para todos.
   *
   * Medido: la misma "Sesión A" le promete 55 minutos a los 27 perfiles que la
   * reciben, y el descanso solo va de 12 a 46 minutos según el objetivo y el
   * nivel. El número no sigue a la prescripción porque no se calcula a partir
   * de ella.
   *
   * Cerrarlo del todo obliga a suponer cuánto tarda una serie, que es una
   * decisión del dueño y no una que salga de la investigación. Mientras tanto
   * este test **afirma el hueco** en vez de ignorarlo: si alguien hace que el
   * motor calcule el tiempo, esta lista deja de coincidir y el test falla
   * pidiendo que se lo dé vuelta. Un `it.skip` no haría eso, y un test que
   * simplemente falla rompe `npm run check` todos los días hasta que alguien lo
   * borra por molesto.
   */
  it('el número que se muestra todavía sale de la plantilla (hueco conocido)', () => {
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
 * CUANDO NINGUNA PLANTILLA CUBRE LA FRECUENCIA DECLARADA
 *
 * El slider del onboarding va de 1 a 7 sesiones por semana y la base acepta ese
 * rango (`04_user.sql`: "between 1 and 7"), pero las plantillas del ruleset
 * cubren de 2 a 6. Los extremos caen en un fallback, y ese fallback era
 * `forGoal[0]`: la primera del array.
 *
 * Medido antes del arreglo: quien declaraba **7** sesiones de hipertrofia,
 * fuerza o recomposición recibía "Full body AB" —2 a 3 sesiones— teniendo
 * "Torso/pierna" (4 a 6) disponible y mucho más cerca. Y con 6 sesiones de
 * resistencia, la de 2-3 en vez de "Base de cardio" (3 a 5). En el extremo bajo
 * acertaba, pero por casualidad: la primera del array también era la más cercana.
 *
 * Es la tercera vez que aparece la misma forma en este proyecto —elegir por
 * posición y confiar en que alguien ordenó el array— y las dos anteriores están
 * en `CLAUDE.md`. Acá no había ni un orden declarado en el que confiar.
 */
describe('la plantilla que se elige cuando ninguna cubre la frecuencia', () => {
  /** Todas las frecuencias que la base y el onboarding permiten. */
  const FRECUENCIAS = [1, 2, 3, 4, 5, 6, 7] as const;

  function plantillaDe(goal: Perfil['goal'], sesiones: number) {
    const base = PERFILES.find((p) => p.limitaciones === undefined);
    expect(base, 'la matriz se quedó sin perfiles sin limitaciones').toBeDefined();
    if (!base) throw new Error('sin perfil');
    const plan = planDe(
      { ...base, goal, sesiones, deporte: undefined, fase: undefined },
      V1_RESEARCH,
    );
    // `templateId` y no `sessions.length`: el motor replica las sesiones de la
    // plantilla en una cola, así que "Full body AB" —2 sesiones— sale con 8.
    return { templateId: plan.templateId, avisos: plan.warnings };
  }

  it('nunca se elige una plantilla más lejana que otra disponible', () => {
    const plantillas = V1_RESEARCH.templates;
    let mirados = 0;
    for (const goal of GOALS) {
      const paraElObjetivo = plantillas.filter((t) => t.goals.includes(goal));
      if (paraElObjetivo.length < 2) continue;
      for (const n of FRECUENCIAS) {
        mirados += 1;
        const distancia = (r: readonly [number, number]) =>
          n < r[0] ? r[0] - n : n > r[1] ? n - r[1] : 0;
        const mejor = Math.min(...paraElObjetivo.map((t) => distancia(t.sessionsPerWeek)));
        const posibles = paraElObjetivo
          .filter((t) => distancia(t.sessionsPerWeek) === mejor)
          .map((t) => t.id);
        expect(
          posibles,
          `${goal} con ${n} sesiones: se eligió una plantilla más lejana de la que había`,
        ).toContain(plantillaDe(goal, n).templateId);
      }
    }
    // Verde y vacío no sirve: si ningún objetivo tuviera dos plantillas, el
    // bucle entero se saltearía sin una sola aserción.
    expect(mirados).toBeGreaterThan(10);
  });

  it('y lo sigue avisando cuando no la cubre', () => {
    // El arreglo mejora la elección; no tapa que la frecuencia no entra.
    const { avisos } = plantillaDe('hypertrophy', 7);
    expect(avisos.some((w) => w.includes('7 sesiones'))).toBe(true);
  });
});

/**
 * EL DEPORTE TIENE QUE CAMBIAR ALGO
 *
 * `06-deporte-y-temporada.md` tira casi todo el campo "deporte": la carga no
 * cambia por deporte (CONFIANZA ALTA) y la especificidad direccional está
 * refutada (22 estudios). Lo único que queda en pie es un sesgo de selección
 * entre ejercicios ya equivalentes, y el documento lo dice así: "el deporte se
 * usa como **sesgo de selección** entre ejercicios ya equivalentes (qué
 * músculos priorizar), nunca como cambio de dosis".
 *
 * Eso estaba escrito en el motor y casi no hacía nada, porque el desempate
 * compartía piso con `minPoolSize` y el paso anterior de la selección ya deja el
 * pool justo en ese piso. Medido acá: declarar el deporte cambiaba algún
 * ejercicio en **15 de 336** combinaciones (4,5 %) con el piso compartido, y en
 * **39** (11,6 %) con el piso propio. Un número que el propio ruleset declara sin
 * medir —`confidence: low`, "no hay ningún ensayo que los haya medido"— estaba
 * recortando un hallazgo de confianza media.
 *
 * Lo primero que se probó acá fue "cambia al menos un ejercicio", y **pasaba con
 * el piso compartido puesto**: 15 no es 0. Así que la aserción que cuida el
 * hueco es la otra, la de los dos pisos, que no puede adaptarse al valor. La de
 * comportamiento se queda igual, para el caso de que alguien saque el desempate
 * entero.
 */
describe('el deporte tiene que cambiar algún ejercicio', () => {
  /** El mismo perfil, con y sin el deporte declarado. */
  function ejerciciosDe(p: Perfil, deporte: Perfil['deporte']): string[] {
    return planDe({ ...p, deporte }, V1_RESEARCH).sessions.flatMap((s) =>
      s.items.map((i) => i.exerciseId),
    );
  }

  const conGesto = (V1_RESEARCH.sports?.catalog ?? []).filter((s) => s.emphasis.length > 0);

  it('el ruleset trae deportes con músculos del gesto', () => {
    // Sin esto el barrido de abajo no prueba nada: no habría nada que priorizar.
    expect(conGesto.length).toBeGreaterThan(5);
  });

  it('el desempate por deporte tiene su propio piso, más bajo que el general', () => {
    const { minPoolSize, emphasisMinPoolSize } = V1_RESEARCH.selection ?? {};
    expect(minPoolSize, 'el ruleset dejó de traer minPoolSize').toBeDefined();
    expect(emphasisMinPoolSize, 'el ruleset dejó de traer emphasisMinPoolSize').toBeDefined();
    if (minPoolSize === undefined || emphasisMinPoolSize === undefined) return;

    // Igualarlos no rompe nada visible —el deporte sigue cambiando algo en 15 de
    // 336— y por eso hace falta decirlo acá: el paso 6 deja el pool justo en
    // `minPoolSize`, así que un filtro posterior con ese mismo piso se saltea
    // casi siempre. Ver `emphasisMinPoolSize` en `ruleset.ts`.
    expect(emphasisMinPoolSize).toBeLessThan(minPoolSize);
  });

  it('declarar un deporte de gesto cambia al menos un ejercicio', () => {
    let mirados = 0;
    let cambiaron = 0;
    for (const perfil of PERFILES.filter((p) => p.limitaciones === undefined)) {
      const sinDeporte = ejerciciosDe(perfil, undefined);
      for (const deporte of conGesto) {
        mirados += 1;
        const conDeporte = ejerciciosDe(perfil, deporte.id as Perfil['deporte']);
        // Mismo largo siempre: el deporte desempata, no cambia la dosis.
        expect(conDeporte).toHaveLength(sinDeporte.length);
        if (conDeporte.some((id, i) => id !== sinDeporte[i])) cambiaron += 1;
      }
    }
    // Verde y vacío no sirve: hay que haber mirado de verdad.
    expect(mirados).toBeGreaterThan(100);
    expect(cambiaron, 'el énfasis del deporte no cambia ningún ejercicio').toBeGreaterThan(0);
  });

  it('y no colapsa el slot: quedan varios ejercicios posibles entre socios', () => {
    // Lo que el piso protege. Se mide lo que el socio experimenta: si dos socios
    // del mismo perfil y deporte reciben el mismo plan entero, el piso no
    // alcanzó. Las semillas son lo único que los distingue.
    const perfil = PERFILES.find((p) => p.deporte !== undefined && p.limitaciones === undefined);
    expect(perfil, 'la matriz dejó de traer un perfil con deporte').toBeDefined();
    if (!perfil) return;

    const planes = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((seed) =>
        engine
          .generatePlan({
            context: { now: AHORA, seed },
            user: socioDe(perfil),
            gym,
            ruleset: V1_RESEARCH,
          })
          .sessions.flatMap((s) => s.items.map((i) => i.exerciseId))
          .join(','),
      ),
    );
    expect(planes.size).toBeGreaterThan(1);
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

  /**
   * Un `byLevel` a medio llenar no se ve: se ve como el default.
   *
   * Es lo que pasó con `recomposition` —le faltaban slots sueltos y
   * `resolveParams` los completaba con la dosis de intermedio sin que nada
   * avisara—, y lo que hizo que `10-nivel-de-experiencia.md` lo midiera como
   * "2 de 4" mientras `12-objetivo.md` lo daba por "idéntico a hipertrofia".
   *
   * `10` documenta la forma que sí es deliberada: `beginner` redefine los tres
   * roles, `novice` solo el primario y la progresión, `advanced` el primario y
   * el secundario. Un objetivo o no diferencia por nivel —y entonces el plan lo
   * avisa— o diferencia con esa forma. Cualquier otra combinación es un copiado
   * incompleto.
   *
   * `advanced` arrastra una excepción que costó encontrar. La forma original no
   * le daba `progression` propia, y eso es inofensivo mientras el nivel no toque
   * el RIR. `strength.advanced` sí lo tocaba: bajaba `rirTarget` de 3 a 2 en el
   * primario y el secundario y heredaba el gatillo 4 del `default`. Medido: un
   * avanzado que cumple la prescripción al pie de la letra registra RIR 2, el
   * motor exige 4, y **nunca le propone subir la carga**. No hay otro camino —
   * `isReadyToIncrease` mira el RIR y nada más (`placeholder-engine.ts`).
   *
   * `strength.advanced` ahora define su propio `progression` por eso, y la forma
   * lo admite como extra en ese nivel. Lo que dejó de ser una cuestión de forma
   * y pasó a tener su propio test es la relación misma: está más abajo, en "el
   * gatillo no puede pedir más reserva de la que el plan prescribe".
   */
  const FORMA_POR_NIVEL: Record<string, readonly string[]> = {
    beginner: ['primary', 'secondary', 'isolation', 'progression'],
    novice: ['primary', 'progression'],
    advanced: ['primary', 'secondary'],
  };

  /** Claves que un nivel puede agregar a su forma sin que sea un copiado a medias. */
  const EXTRAS_ADMITIDOS: Record<string, readonly string[]> = { advanced: ['progression'] };

  /** Qué tiene de raro la forma del `byLevel` de un objetivo, si tiene algo. */
  function* formasRaras(objetivo: string, byLevel: Record<string, object> | undefined) {
    for (const [nivel, esperados] of Object.entries(FORMA_POR_NIVEL)) {
      const override = byLevel?.[nivel];
      if (!override) {
        yield `${objetivo}: le falta el nivel "${nivel}"`;
        continue;
      }
      const admitidos = new Set([...esperados, ...(EXTRAS_ADMITIDOS[nivel] ?? [])]);
      const tiene = Object.keys(override);
      const faltan = esperados.filter((k) => !tiene.includes(k));
      const sobran = tiene.filter((k) => !admitidos.has(k));
      if (faltan.length > 0 || sobran.length > 0) {
        yield `${objetivo}.${nivel}: define [${[...tiene].sort().join(',')}], la forma pide [${[...esperados].sort().join(',')}]`;
      }
    }
  }

  it('los objetivos que diferencian por nivel usan todos la misma forma', () => {
    const raros: string[] = [];

    for (const [objetivo, bloque] of Object.entries(V1_RESEARCH.prescription)) {
      const byLevel = bloque.byLevel as Record<string, object> | undefined;
      // Sin `byLevel` el nivel no cambia la dosis, y de eso ya avisa el plan.
      if (!byLevel || Object.keys(byLevel).length === 0) continue;
      raros.push(...formasRaras(objetivo, byLevel));
    }

    expect(raros.join('\n')).toBe('');
  });

  /**
   * NINGUNA PRESCRIPCIÓN BAJA DEL UMBRAL DONDE EMPIEZA A PASAR ALGO
   *
   * `23-resistencia-muscular.md`: la hipertrofia es equivalente en todo el
   * espectro **≥ ~30 % del 1RM** y no hay una "zona ideal" (Schoenfeld 2021).
   * Por debajo de eso la carga deja de producir el estímulo — medido aparte, un
   * protocolo al 10 % ni siquiera llegaba al fallo, con la carga crítica en
   * 31,7 ± 11,9 % (Colosio 2026, agudo y n = 12).
   *
   * Hoy el piso del ruleset es exactamente 30 %, en el primario de `power`.
   *
   * Esto además obliga a reconciliar dos documentos si alguien toca esa banda:
   * `22-carga-de-potencia.md` propone abrirla hacia abajo para los ejercicios
   * balísticos (≤ 30 % es donde producen más potencia). Las dos cosas pueden ser
   * ciertas —hablan de desenlaces distintos, potencia pico contra adaptación—
   * pero bajar el piso sin decir cuál de los dos manda es elegir sin saberlo.
   *
   * Desde `26-acsm-2026.md` el piso tiene una tercera fuente, independiente y
   * más fuerte que las dos anteriores: el position stand 2026 de ACSM —una
   * overview de 137 revisiones sistemáticas— da 30-70 % del 1RM para potencia.
   * Sigue sin resolver el caso balístico, porque un salto con peso corporal no
   * tiene `%1RM` que prescribir, así que la reconciliación de arriba queda igual
   * de pendiente. Lo que cambia es que mover el piso ahora contradice tres
   * documentos en vez de dos.
   */
  /** Cada (objetivo, nivel, slot) del ruleset, con sus parametros. */
  function* todosLosSlots() {
    for (const [objetivo, bloque] of Object.entries(V1_RESEARCH.prescription)) {
      const niveles = [
        ['default', bloque.default] as const,
        ...Object.entries(bloque.byLevel ?? {}),
      ];
      for (const [nivel, params] of niveles) {
        for (const slot of ['primary', 'secondary', 'isolation'] as const) {
          const p = params?.[slot];
          if (p) yield { donde: `${objetivo}.${nivel}.${slot}`, params: p };
        }
      }
    }
  }

  it('ninguna intensidad prescrita arranca por debajo del 30 % del 1RM', () => {
    // No es configuracion ni una prescripcion: es el limite que declara el
    // documento, escrito aca para que el test falle si el ruleset lo cruza.
    const UMBRAL_MINIMO_PCT_1RM = 30;

    const bajos: string[] = [];

    for (const { donde, params } of todosLosSlots()) {
      const rango = params.intensityPct1RM;
      if (rango && rango[0] < UMBRAL_MINIMO_PCT_1RM) bajos.push(`${donde}: ${rango[0]} %`);
    }

    expect(bajos.join('\n')).toBe('');
  });
});

/**
 * LO QUE MIDIÓ `24-cobertura-muscular.md`
 *
 * Dos mediciones que el documento usa como base de sus dos hallazgos. No son
 * requisitos —son el estado de las cosas— y por eso el mensaje de cada una dice
 * qué revisar si dejan de valer. Un documento que afirma un número medido y no
 * tiene nada que lo vuelva a medir envejece sin que nadie se entere, que es
 * exactamente lo que le pasó a `12-objetivo.md` con la recomposición.
 */
describe('las mediciones de cobertura muscular', () => {
  /** Series semanales por músculo, contando solo el trabajo de sala. */
  function seriesPorMusculo(perfil: Perfil): Map<MuscleGroup, number> {
    const plan = planDe(perfil, V1_RESEARCH);
    const semana = plan.sessions.slice(0, perfil.sesiones);
    const porMusculo = new Map<MuscleGroup, number>();

    for (const sesion of semana) {
      for (const item of sesion.items) {
        const ex = gym.exercises.find((e) => e.id === item.exerciseId);
        // El cardio se prescribe por tiempo: no tiene series que contar.
        if (!ex || item.targetDurationSeconds !== null) continue;
        for (const m of ex.primaryMuscles) {
          porMusculo.set(m, (porMusculo.get(m) ?? 0) + item.targetSets);
        }
      }
    }
    return porMusculo;
  }

  it('el objetivo cardio deja sin tocar más de la mitad de los músculos', () => {
    const perfil = PERFILES.find((p) => p.goal === 'cardio');
    expect(perfil).toBeDefined();
    if (!perfil) return;

    const tocados = seriesPorMusculo(perfil).size;

    // WHO 2020 pide "all major muscle groups"; este objetivo toca seis de
    // dieciocho. Si esto empieza a fallar es porque la plantilla mejoró: hay
    // que revisar la nota del bloque, que hoy declara justamente que no cubre.
    expect(tocados, `${perfil.nombre} toca ${tocados} músculos`).toBeLessThan(
      MUSCLE_GROUPS.length / 2,
    );
  });

  it('nada puede avisar de esa falta de cobertura, porque el mínimo es 0', () => {
    // El aviso existe y es correcto; lo que no puede es dispararse acá, porque
    // compara contra `minSetsPerMuscle`, que en este objetivo vale 0 — y vale 0
    // con razón: WHO dice que no hay dosis-respuesta por volumen.
    expect(V1_RESEARCH.prescription.cardio.default.weeklyVolume.minSetsPerMuscle).toBe(0);

    const perfil = PERFILES.find((p) => p.goal === 'cardio');
    if (!perfil) return;
    const avisos = planDe(perfil, V1_RESEARCH).warnings;
    expect(avisos.some((a) => a.includes('quedan abajo'))).toBe(false);
  });

  it('el glúteo es, por lejos, el músculo más etiquetado como primario', () => {
    const cuenta = new Map<MuscleGroup, number>();
    for (const ex of gym.exercises) {
      for (const m of ex.primaryMuscles) cuenta.set(m, (cuenta.get(m) ?? 0) + 1);
    }
    const orden = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
    const [primero, segundo] = orden;

    // 23 de 58 contra 15 del segundo. Es la causa de que el techo semanal lo
    // rompa siempre el mismo músculo. Si esto deja de valer, el catálogo se
    // reequilibró y hay que rehacer las dos tablas de `24-cobertura-muscular.md`.
    expect(primero[0]).toBe('glutes');
    expect(primero[1]).toBeGreaterThan(segundo[1]);
    expect(primero[1] / gym.exercises.length).toBeGreaterThan(0.3);
  });
});

/**
 * EL AVISO DE ÉNFASIS QUE EL PLAN NO CUBRE
 *
 * Ver `25-cobertura-del-catalogo.md`. Hay dos avisos distintos y la diferencia
 * importa: uno dice "cambialo desde la sesión" y el otro dice "el gimnasio no
 * tiene". Confundirlos es lo que hacía la primera versión, que miraba el
 * catálogo en vez del plan.
 */
describe('el aviso de énfasis que el plan no cubre', () => {
  /** Los músculos del plan y los que quedan a un cambio, recalculados acá. */
  function alcanceDe(perfil: Perfil) {
    const plan = planDe(perfil, V1_RESEARCH);
    const musculosDe = (id: string) => gym.exercises.find((e) => e.id === id)?.primaryMuscles ?? [];
    const enPlan = new Set<MuscleGroup>();
    const cambiando = new Set<MuscleGroup>();

    for (const item of plan.sessions.flatMap((s) => s.items)) {
      for (const m of musculosDe(item.exerciseId)) enPlan.add(m);
      const opciones = engine.findSubstitutes({
        item,
        gym,
        constraints: socioDe(perfil).constraints,
        unavailableEquipmentIds: [],
        ruleset: V1_RESEARCH,
      });
      for (const o of opciones) for (const m of musculosDe(o.exerciseId)) cambiando.add(m);
    }
    return { avisos: plan.warnings, enPlan, cambiando };
  }

  it('los dos textos salen del ruleset, no del código', () => {
    // Regla 3 llevada al texto: si alguien los escribe en el motor, esto falla.
    for (const clave of ['emphasisUnreachableNote', 'emphasisOnlyBySwapNote'] as const) {
      expect(V1_RESEARCH.sports?.[clave], clave).toBeTruthy();
      expect(V1_RESEARCH.sports?.[clave], clave).toContain('{muscles}');
    }
  });

  /**
   * Con qué reconocer cada aviso, sacado del ruleset en vez de repetir el texto.
   *
   * Va la parte de DESPUÉS de `{muscles}`: las dos notas arrancan igual —"Tu
   * deporte trabaja sobre todo…"— así que el principio no distingue una de la
   * otra, y con él este test daba por buenos avisos cruzados.
   */
  function marcaDe(clave: 'emphasisUnreachableNote' | 'emphasisOnlyBySwapNote'): string {
    const nota = V1_RESEARCH.sports?.[clave] ?? '';
    return nota.slice(nota.indexOf('{muscles}') + '{muscles}'.length).slice(0, 40);
  }

  type ClaveNota = 'emphasisUnreachableNote' | 'emphasisOnlyBySwapNote';

  /** Qué falla en UN aviso: que esté cuando no toca, que falte, o que no nombre. */
  function* quejasDeUnCaso(
    donde: string,
    avisos: readonly string[],
    muscles: readonly MuscleGroup[],
    clave: ClaveNota,
  ) {
    const aviso = avisos.find((a) => a.includes(marcaDe(clave)));
    if (muscles.length > 0 !== (aviso !== undefined)) {
      yield `${donde}/${clave}: ${aviso ? 'de más' : 'faltante'}`;
      return;
    }
    // Cada aviso nombra sus músculos: sin eso el socio no sabe qué le falta.
    for (const m of muscles) {
      if (!aviso?.includes(ETIQUETA[m] ?? m)) yield `${donde}/${clave}: no nombra ${m}`;
    }
  }

  /** Qué falla en los avisos de un perfil, si falla algo. */
  function quejasDelAviso(perfil: Perfil): string[] {
    const deporte = V1_RESEARCH.sports?.catalog.find((d) => d.id === perfil.deporte);
    const { avisos, enPlan, cambiando } = alcanceDe(perfil);
    const faltan = (deporte?.emphasis ?? []).filter((m) => !enPlan.has(m));

    const casos: readonly { muscles: MuscleGroup[]; clave: ClaveNota }[] = [
      { muscles: faltan.filter((m) => cambiando.has(m)), clave: 'emphasisOnlyBySwapNote' },
      { muscles: faltan.filter((m) => !cambiando.has(m)), clave: 'emphasisUnreachableNote' },
    ];

    return casos.flatMap(({ muscles, clave }) => [
      ...quejasDeUnCaso(perfil.nombre, avisos, muscles, clave),
    ]);
  }

  it('separa "cambialo en la sesión" de "el gimnasio no tiene"', () => {
    const problemas = PERFILES.flatMap(quejasDelAviso);
    expect(problemas.join('\n')).toBe('');
  });

  it('hoy hay al menos un caso de cada tipo', () => {
    // Si esto falla es una buena noticia y hay que revisar `25`: o el catálogo
    // creció, o las plantillas cambiaron, o el énfasis se corrigió.
    const avisos = PERFILES.flatMap((p) => planDe(p, V1_RESEARCH).warnings);
    for (const clave of ['emphasisOnlyBySwapNote', 'emphasisUnreachableNote'] as const) {
      expect(
        avisos.some((a) => a.includes(marcaDe(clave))),
        clave,
      ).toBe(true);
    }
  });
});

/** Los nombres que usa el motor, repetidos acá para no depender de un export interno. */
const ETIQUETA: Partial<Record<MuscleGroup, string>> = {
  obliques: 'oblicuos',
  forearms: 'antebrazos',
  calves: 'gemelos',
  traps: 'trapecios',
  rear_delts: 'hombro posterior',
  front_delts: 'hombro anterior',
};

/**
 * LOS EQUIVALENTES, Y LOS DOS CONTEXTOS EN QUE SE PIDEN
 *
 * `findSubstitutes` bloquea siempre la máquina del ejercicio original, porque
 * nació de "la máquina está ocupada". Eso es correcto en la sesión y **no** lo
 * es al explorar el catálogo, donde nadie está esperando nada: escondía los
 * ejercicios que solo existen en esa misma estación.
 *
 * Ver `25-cobertura-del-catalogo.md`. Medido sobre los 33 perfiles, los
 * equivalentes rescatan 10 de los 19 ejercicios que ningún plan usa.
 */
describe('los ejercicios equivalentes', () => {
  function opcionesDe(exerciseId: string, equipmentId: string | null) {
    return engine
      .findSubstitutes({
        item: { exerciseId, equipmentId },
        gym,
        constraints: [],
        unavailableEquipmentIds: [],
        ruleset: V1_RESEARCH,
      })
      .map((o) => gym.exercises.find((e) => e.id === o.exerciseId)?.name ?? o.exerciseId);
  }

  it('bloquear la máquina propia esconde lo que solo vive en esa estación', () => {
    const aductores = gym.exercises.find((e) => e.name === 'Aductores en máquina');
    const abductores = gym.exercises.find((e) => e.name === 'Abductores en máquina');
    if (!aductores || !abductores) throw new Error('faltan los ejercicios del caso');

    // Los aductores tienen dos estaciones; los abductores una sola, la
    // combinada. El plan asigna justamente esa, así que si el socio la declara
    // ocupada, el ejercicio más parecido que existe no se le puede ofrecer.
    const combinada = abductores.equipmentIds[0];
    expect(aductores.equipmentIds, 'ya no comparten estación').toContain(combinada);

    expect(
      opcionesDe(aductores.id, combinada),
      'con esa máquina ocupada no puede ofrecerla',
    ).not.toContain(abductores.name);

    // Y sin nada bloqueado —explorando el catálogo— sí aparece.
    expect(opcionesDe(aductores.id, null), 'explorando sí').toContain(abductores.name);
  });

  it('los equivalentes rescatan ejercicios que ningún plan usa', () => {
    const enPlanes = new Set<string>();
    const comoEquivalente = new Set<string>();

    for (const perfil of PERFILES) {
      for (const item of planDe(perfil, V1_RESEARCH).sessions.flatMap((s) => s.items)) {
        enPlanes.add(item.exerciseId);
        for (const o of engine.findSubstitutes({
          item,
          gym,
          constraints: socioDe(perfil).constraints,
          unavailableEquipmentIds: [],
          ruleset: V1_RESEARCH,
        })) {
          comoEquivalente.add(o.exerciseId);
        }
      }
    }

    const rescatados = gym.exercises.filter(
      (e) => !enPlanes.has(e.id) && comoEquivalente.has(e.id),
    );

    // Hoy son 10 de los 19 sin usar. El test no fija el número —el catálogo se
    // mueve— sino que la sustitución sirve para esto, que es lo que se afirma
    // en `25`. Si llega a cero, esa sección quedó vieja.
    expect(rescatados.length, 'la sustitución no rescata a nadie').toBeGreaterThan(0);
    expect(new Set([...enPlanes, ...comoEquivalente]).size).toBeGreaterThan(enPlanes.size);
  });
});

/**
 * LA ADAPTACIÓN, SOBRE TODOS LOS PERFILES
 *
 * `reviewProgress` tiene cobertura buena en `adaptive-engine.test.ts`, pero de
 * escenarios armados a mano: un socio, un ejercicio, un historial. Lo que
 * faltaba es lo que la matriz ya hace con `generatePlan` — pasarle la
 * diversidad entera y verificar que **cada número que propone sale del
 * ruleset**, que es la regla dura 3 aplicada a la adaptación.
 *
 * El historial se fabrica para disparar cada regla a propósito: no se mide si
 * el motor decide bien *cuándo* proponer (eso está en los escenarios), sino que
 * cuando propone, el número sea el que el ruleset manda para ESE objetivo, ESE
 * nivel y ESE tren.
 */
describe('la adaptación sobre todos los perfiles', () => {
  const AYER = '2026-09-09T12:00:00.000Z';

  function planDeSocio(perfil: Perfil): Plan {
    return {
      id: `plan-${perfil.nombre}`,
      userId: 'socio',
      gymId: GYM_ID,
      rulesetVersion: V1_RESEARCH.version,
      generatedAt: AYER,
      status: 'active',
    };
  }

  /**
   * La carga con la que se simula que viene entrenando.
   *
   * **No sale del plan**: ningún ítem trae `targetLoad`, porque las 58
   * estaciones siguen sin su rango medido (`load_min`/`load_max` en null, ver
   * CLAUDE.md). En la app la carga la anota el socio al registrar la serie, que
   * es exactamente lo que se simula acá.
   *
   * La primera versión de estos tests la sacaba de `item.targetLoad` y pasaba
   * en verde sin ejercitar nada: los 33 perfiles entraban por un `continue`.
   */
  const CARGA_ANOTADA: LoadReading = { value: 40, unit: 'kg' };

  /** Series inventadas para un ejercicio, todas iguales, con el RIR pedido. */
  function historial(item: SessionItemBlueprint, rir: number, reps: number, cuantas: number) {
    return Array.from({ length: cuantas }, (_, i) => ({
      id: `set-${i}`,
      workoutLogId: `log-${i}`,
      planSessionItemId: null,
      exerciseId: item.exerciseId,
      equipmentId: item.equipmentId,
      load: CARGA_ANOTADA,
      loadKg: CARGA_ANOTADA.value,
      reps,
      repsTarget: item.targetRepsMax,
      rir,
      durationSeconds: null,
      distanceMeters: null,
      restPrescribedSeconds: item.restSeconds,
      restActualSeconds: item.restSeconds,
      isWarmup: false,
      completedAt: AYER,
      clientId: `c-${i}`,
    })) as SetLog[];
  }

  /** El primer ítem de sala del plan, que es sobre lo que se adapta. */
  function itemDeSala(perfil: Perfil): SessionItemBlueprint | undefined {
    return planDe(perfil, V1_RESEARCH)
      .sessions.flatMap((s) => s.items)
      .find((i) => i.targetDurationSeconds === null && i.equipmentId !== null);
  }

  function revisar(perfil: Perfil, history: SetLog[]) {
    return engine.reviewProgress({
      context: { now: AHORA, seed: 42 },
      user: socioDe(perfil),
      gym,
      plan: planDeSocio(perfil),
      history,
      resolvedProposals: [],
      ruleset: V1_RESEARCH,
    });
  }

  /** Músculos que el motor agrupa como tren inferior, para el paso de progresión. */
  const PIERNA: readonly MuscleGroup[] = ['quads', 'hamstrings', 'glutes', 'calves'];

  /** El ejercicio, la estación y los parámetros de un perfil. Null si no aplica. */
  function contextoDe(perfil: Perfil) {
    const item = itemDeSala(perfil);
    if (!item) return null;
    const ex = gym.exercises.find((e) => e.id === item.exerciseId);
    const equipo = gym.equipment.find((q) => q.id === item.equipmentId);
    if (!ex || !equipo) return null;
    return {
      item,
      ex,
      equipo,
      params: resolveParams(V1_RESEARCH, perfil.goal ?? 'hypertrophy', perfil.nivel),
    };
  }

  /** Qué tiene de mal una propuesta de suba, si tiene algo. */
  function quejasDeLaSuba(
    donde: string,
    suba: ProposalBlueprint,
    esperado: number | null,
    paso: number,
  ): string[] {
    const quejas: string[] = [];
    if (suba.toValue !== String(esperado)) {
      quejas.push(`${donde}: propuso ${suba.toValue}, el ruleset da ${esperado} (${paso}%)`);
    }
    if (suba.fromValue !== String(CARGA_ANOTADA.value)) {
      quejas.push(`${donde}: viene de ${suba.fromValue}, no de ${CARGA_ANOTADA.value}`);
    }
    // Regla dura 4: cada propuesta guarda con qué ruleset se calculó.
    if (suba.rulesetVersion !== V1_RESEARCH.version) {
      quejas.push(`${donde}: la propuesta no declara el ruleset`);
    }
    return quejas;
  }

  it('cada carga propuesta sale del paso que el ruleset fija para ese tren', () => {
    const sinExplicar: string[] = [];
    let ejercitados = 0;

    for (const perfil of PERFILES) {
      const ctx = contextoDe(perfil);
      if (!ctx) continue;
      const { progression } = ctx.params;

      const suba = revisar(
        perfil,
        historial(
          ctx.item,
          progression.triggerRirAtLeast + 1,
          ctx.item.targetRepsMax,
          progression.consecutiveSessions,
        ),
      ).find((p) => p.type === 'load_increase');
      if (!suba) continue;
      ejercitados += 1;

      // El tren inferior mueve más carga absoluta, así que el ruleset le da otro
      // paso. Misma condición que aplica `progressionStep` en el motor.
      const esPierna = ctx.ex.primaryMuscles.some((m) => PIERNA.includes(m));
      const paso = esPierna ? progression.stepPctLowerBody : progression.stepPctUpperBody;
      const esperado = nextLoad(CARGA_ANOTADA, ctx.equipo.load, paso);
      sinExplicar.push(...quejasDeLaSuba(`${perfil.nombre}/${ctx.ex.name}`, suba, esperado, paso));
    }

    expect(sinExplicar.join('\n')).toBe('');
    // Sin esto el test pasa en verde sin mirar nada, que es lo que hacía cuando
    // la carga salía de `item.targetLoad` y ese campo siempre era nulo.
    expect(ejercitados, 'ningún perfil llegó a proponer una suba').toBeGreaterThan(10);
  });

  it('cada bajada sale del recorte que el ruleset fija', () => {
    const sinExplicar: string[] = [];
    let ejercitados = 0;

    for (const perfil of PERFILES) {
      const ctx = contextoDe(perfil);
      if (!ctx) continue;
      const { regression } = ctx.params;

      const baja = revisar(
        perfil,
        historial(
          ctx.item,
          0,
          Math.max(1, ctx.item.targetRepsMin - 1),
          regression.missedRepsSessions,
        ),
      ).find((p) => p.type === 'load_decrease');
      if (!baja) continue;
      ejercitados += 1;

      const esperado = snapToEquipment(
        (CARGA_ANOTADA.value ?? 0) * (1 - regression.stepPct / 100),
        ctx.equipo.load,
      );
      if (baja.toValue !== String(esperado)) {
        sinExplicar.push(
          `${perfil.nombre}/${ctx.ex.name}: bajó a ${baja.toValue}, el ruleset da ${esperado} (${regression.stepPct}%)`,
        );
      }
    }

    expect(sinExplicar.join('\n')).toBe('');
    expect(ejercitados, 'ningún perfil llegó a proponer una baja').toBeGreaterThan(10);
  });

  it('a potencia no le propone subir carga, en ningún perfil', () => {
    // El ruleset deja `rirTarget: null` en potencia a propósito: se regula por
    // velocidad, no por repeticiones en reserva. Sin RIR no hay señal, y
    // proponer igual sería inventar el criterio (`01-fuerza-hipertrofia-potencia.md`).
    for (const perfil of PERFILES.filter((p) => p.goal === 'power')) {
      const item = itemDeSala(perfil);
      if (!item) continue;
      const propuestas = revisar(perfil, historial(item, 5, item.targetRepsMax, 5));
      expect(
        propuestas.filter((p) => p.type === 'load_increase'),
        perfil.nombre,
      ).toEqual([]);
    }
  });

  it('sin historial no propone nada', () => {
    for (const perfil of PERFILES) {
      expect(revisar(perfil, []), perfil.nombre).toEqual([]);
    }
  });
});

/**
 * LO QUE ACSM SOSTIENE DEL RULESET
 *
 * `26-acsm-2026.md`. Dos posiciones de ACSM, las dos verificadas contra Crossref
 * y leídas en Europe PMC:
 *
 * - **2009** (DOI 10.1249/MSS.0b013e3181915670) es la única fuente del proyecto
 *   con un número para el paso de progresión: 2-10 %, y la regla de cuándo
 *   aplicarlo.
 * - **2026** (DOI 10.1249/mss.0000000000003897) se declara su reemplazo, sintetiza
 *   137 revisiones sistemáticas y **no** da porcentaje de incremento.
 *
 * Estos tests fijan lo que de ahí se puede afirmar. Lo que queda fuera de la
 * evidencia no se pone en verde: se cuenta.
 */
describe('lo que ACSM sostiene del ruleset', () => {
  /** Cada (objetivo, nivel) resuelto como lo resuelve el motor. */
  function* cadaDosis() {
    for (const objetivo of Object.keys(V1_RESEARCH.prescription) as Goal[]) {
      for (const nivel of ['beginner', 'novice', 'intermediate', 'advanced'] as const) {
        yield {
          donde: `${objetivo}/${nivel}`,
          params: resolveParams(V1_RESEARCH, objetivo, nivel),
        };
      }
    }
  }

  it('se sube la carga una repetición antes de lo que el RIR objetivo pide', () => {
    // ACSM 2009: subir "when the individual can perform the current workload for
    // one to two repetitions over the desired number". Traducido al RIR del
    // ruleset, el gatillo es el objetivo más uno.
    //
    // Se cumplía en los 11 bloques que definen RIR y nada lo obligaba: los
    // números están escritos a mano, uno por uno, en el JSON. Un bloque nuevo
    // copiado de otro objetivo se lleva el gatillo del que copió.
    const desalineados: string[] = [];
    let mirados = 0;

    for (const { donde, params } of cadaDosis()) {
      const objetivo = params.primary.rirTarget;
      // Potencia deja `rirTarget: null` a propósito —se regula por velocidad—,
      // así que ahí no hay objetivo del cual estar a una repetición.
      if (objetivo === null || objetivo === undefined) continue;
      mirados += 1;
      if (params.progression.triggerRirAtLeast !== objetivo + 1) {
        desalineados.push(
          `${donde}: RIR objetivo ${objetivo}, gatillo ${params.progression.triggerRirAtLeast}`,
        );
      }
    }

    expect(desalineados.join('\n')).toBe('');
    expect(mirados, 'no miró ninguna dosis con RIR').toBeGreaterThan(10);
  });

  it('el gatillo no puede pedir más reserva de la que el plan prescribe', () => {
    // El anterior mira el primario, que es donde la regla se lee. Este mira los
    // tres slots, porque el gatillo es uno solo por (objetivo, nivel) y se
    // aplica a cualquier ejercicio.
    //
    // Un slot que prescribe RIR 2 y un gatillo de 4 significa que el socio que
    // cumple el plan al pie de la letra registra 2, nunca llega a 4, y **nunca
    // recibe una suba de carga**. Es lo que le pasaba a `strength.advanced`, que
    // pisaba el RIR a 2 en el primario y el secundario y heredaba el gatillo 4
    // del `default`. `isReadyToIncrease` no tiene otro camino: mira el RIR y
    // nada más.
    //
    // El techo es +1 por ACSM 2009 —se sube cuando sobran una o dos
    // repeticiones—, y medido, todo el ruleset está en +1 o en 0. Un 0 es
    // progresar apenas se alcanza el objetivo, sin repetición de sobra: más
    // ansioso, pero nadie se queda trabado.
    const MAXIMA_RESERVA_EXTRA = 1;
    const trabados: string[] = [];

    for (const { donde, params } of cadaDosis()) {
      for (const slot of ['primary', 'secondary', 'isolation'] as const) {
        const objetivo = params[slot].rirTarget;
        if (objetivo === null || objetivo === undefined) continue;
        const sobra = params.progression.triggerRirAtLeast - objetivo;
        if (sobra > MAXIMA_RESERVA_EXTRA) {
          trabados.push(
            `${donde}.${slot}: prescribe RIR ${objetivo} y el gatillo pide ${params.progression.triggerRirAtLeast}`,
          );
        }
      }
    }

    expect(trabados.join('\n')).toBe('');
  });

  /**
   * EL PASO DE CARGA CONTRA EL ÚNICO RANGO CON FUENTE
   *
   * ACSM 2009 da 2-10 %. Hoy hay pasos por debajo del 2 %, y este test **no los
   * declara correctos**: los enumera. La lista está escrita acá para que agregar
   * uno nuevo, o corregir uno viejo, obligue a tocar el test y a decir por qué.
   *
   * No se arregla solo porque no es un bug: `1,25 %` es una prescripción, y las
   * prescripciones las decide el dueño (`26-acsm-2026.md`, "Decisiones que
   * quedan"). Y antes de decidir conviene leer la medición de ese documento: con
   * un escalón de máquina de 2,5 kg o más, 1,25 % y 5 % dan el mismo número.
   */
  it('los pasos que caen fuera del 2-10 % son los que el documento enumera', () => {
    const [PISO, TECHO] = [2, 10];
    const CONOCIDOS = [
      'cardio/advanced: 1.25 %',
      'cardio/beginner: 1.25 %',
      'cardio/intermediate: 1.25 %',
      'cardio/novice: 1.25 %',
      'endurance/advanced: 1.25 %',
      'endurance/beginner: 1.25 %',
      'endurance/intermediate: 1.25 %',
      'endurance/novice: 1.25 %',
      'hypertrophy/advanced: 1.25 %',
      'hypertrophy/intermediate: 1.25 %',
      'power/advanced: 1.25 %',
      'power/beginner: 1.25 %',
      'power/intermediate: 1.25 %',
      'power/novice: 1.25 %',
      'recomposition/advanced: 1.25 %',
      'recomposition/intermediate: 1.25 %',
      'strength/advanced: 1.25 %',
      'strength/intermediate: 1.25 %',
    ];

    const fuera: string[] = [];
    for (const { donde, params } of cadaDosis()) {
      for (const paso of [
        params.progression.stepPctUpperBody,
        params.progression.stepPctLowerBody,
      ]) {
        if (paso < PISO || paso > TECHO) fuera.push(`${donde}: ${paso} %`);
      }
    }

    expect([...new Set(fuera)].sort()).toEqual(CONOCIDOS);
  });

  it('la potencia se prescribe dentro de 30-70 % y por debajo de 24 repeticiones por series', () => {
    // ACSM 2026: "Power was enhanced by moderate loads (30%-70% one-repetition
    // maximum), low-to-moderate volume (≤24 repetitions⋅sets)".
    const quejas: string[] = [];

    for (const nivel of ['beginner', 'novice', 'intermediate', 'advanced'] as const) {
      const params = resolveParams(V1_RESEARCH, 'power', nivel);
      for (const slot of ['primary', 'secondary', 'isolation'] as const) {
        const p = params[slot];
        const rango = p.intensityPct1RM;
        if (rango && (rango[0] < 30 || rango[1] > 70)) {
          quejas.push(`${nivel}.${slot}: ${rango.join('-')} % fuera de 30-70`);
        }
        if (p.sets * p.repsMax > 24) {
          quejas.push(`${nivel}.${slot}: ${p.sets}x${p.repsMax} = ${p.sets * p.repsMax} > 24`);
        }
      }
    }

    expect(quejas.join('\n')).toBe('');
  });

  it('el volumen semanal de hipertrofia cae entre el piso y el plateau de ACSM 2026', () => {
    // "hypertrophy was enhanced by higher volumes (≥10 sets/wk)" y el plateau en
    // "~18-20 weekly sets". El rango óptimo del ruleset tiene que quedar adentro:
    // por debajo de 10 se prescribe menos de lo que la evidencia pide, y por
    // encima de 20 se prescribe tiempo que no compra nada.
    const [PISO, PLATEAU] = [10, 20];

    for (const objetivo of ['hypertrophy', 'recomposition'] as const) {
      const volumen = V1_RESEARCH.prescription[objetivo]?.default.weeklyVolume;
      expect(volumen, objetivo).toBeDefined();
      if (!volumen) continue;
      const [desde, hasta] = volumen.optimalSetsPerMuscle;
      expect(desde, `${objetivo}: el piso óptimo`).toBeGreaterThanOrEqual(PISO);
      expect(hasta, `${objetivo}: el techo óptimo`).toBeLessThanOrEqual(PLATEAU);
    }
  });
});

/**
 * EL AVISO DE VOLUMEN SEMANAL
 *
 * `weeklyVolumeWarnings` es de las pocas piezas del motor que mira el plan
 * entero y no un ítem, y no tenía cobertura sobre la diversidad: los tests que
 * había son escenarios armados a mano. Acá se recalcula la cuenta sobre los 33
 * perfiles y se exige que el aviso aparezca **exactamente** cuando la cuenta lo
 * pide — ni de más, que sería ruido, ni de menos, que sería callarse un plan
 * fuera de banda.
 *
 * El motor avisa y no corrige, a propósito: corregir la plantilla desde el
 * código sería escribir contenido fuera del ruleset (regla dura 3).
 */
describe('el aviso de volumen semanal', () => {
  /** La misma cuenta que hace el motor: la semana que el socio dijo que va a hacer. */
  function volumenDe(perfil: Perfil) {
    const plan = planDe(perfil, V1_RESEARCH);
    const plantilla = V1_RESEARCH.templates.find((t) => t.id === plan.templateId);
    // El motor acota por arriba con la plantilla y nunca sube el número: medir
    // una semana que el socio no va a hacer apagaba el aviso justo para quien va
    // menos veces (`11-frecuencia-semanal.md`).
    const porSemana = Math.min(perfil.sesiones, plantilla?.sessionsPerWeek[1] ?? perfil.sesiones);
    const series = new Map<MuscleGroup, number>();
    const apuntados = new Set<MuscleGroup>();

    for (const item of plan.sessions.slice(0, porSemana).flatMap((s) => s.items)) {
      const ex = gym.exercises.find((e) => e.id === item.exerciseId);
      if (!ex) continue;
      for (const m of ex.primaryMuscles) {
        series.set(m, (series.get(m) ?? 0) + item.targetSets);
        // El piso se mide solo donde hay un compuesto: dos series de curl no son
        // un bíceps sub-dosificado, son trabajo incidental.
        if (ex.isCompound) apuntados.add(m);
      }
    }
    return { avisos: plan.warnings, series, apuntados };
  }

  /** Los músculos por debajo de un piso dado, con la regla del motor. */
  function pordebajoDe(
    series: Map<MuscleGroup, number>,
    apuntados: Set<MuscleGroup>,
    piso: number,
  ) {
    return [...series.entries()].filter(([m, s]) => apuntados.has(m) && s > 0 && s < piso);
  }

  /** Los músculos fuera de banda de un perfil, con la regla del motor. */
  function fueraDeBanda(perfil: Perfil) {
    const { avisos, series, apuntados } = volumenDe(perfil);
    const { minSetsPerMuscle, maxSetsPerMuscle } = resolveParams(
      V1_RESEARCH,
      perfil.goal ?? 'hypertrophy',
      perfil.nivel,
    ).weeklyVolume;
    return {
      avisos,
      pasados: [...series.entries()].filter(([, s]) => s > maxSetsPerMuscle),
      cortos: pordebajoDe(series, apuntados, minSetsPerMuscle),
    };
  }

  /** Qué le falta o le sobra al aviso de un lado, si algo. */
  function* quejasDeUnLado(
    quien: string,
    lado: string,
    fuera: [MuscleGroup, number][],
    aviso: string | undefined,
  ) {
    if (fuera.length > 0 !== (aviso !== undefined)) {
      yield `${quien}: aviso de ${lado} ${aviso ? 'de más' : 'faltante'}`;
      return;
    }
    // Cada aviso nombra el músculo con su cuenta: sin eso no se puede actuar.
    for (const [musculo, series] of fuera) {
      if (!aviso?.includes(`(${series})`)) {
        yield `${quien}: el ${lado} no dice ${musculo} (${series})`;
      }
    }
  }

  it('aparece exactamente cuando la cuenta lo pide, en las dos direcciones', () => {
    const problemas: string[] = [];
    let conAlgo = 0;

    for (const perfil of PERFILES) {
      const { avisos, pasados, cortos } = fueraDeBanda(perfil);
      if (pasados.length > 0 || cortos.length > 0) conAlgo += 1;

      const deTecho = avisos.find((a) => a.includes('techo útil'));
      const dePiso = avisos.find((a) => a.includes('series semanales mínimas'));
      problemas.push(...quejasDeUnLado(perfil.nombre, 'techo', pasados, deTecho));
      problemas.push(...quejasDeUnLado(perfil.nombre, 'piso', cortos, dePiso));
    }

    expect(problemas.join('\n')).toBe('');
    // Sin esto el test pasa en verde si ningún perfil se sale de banda nunca.
    expect(conAlgo, 'ningún perfil quedó fuera de banda: el test no midió nada').toBeGreaterThan(
      10,
    );
  });

  /**
   * POR QUÉ EL AVISO NO USA `optimalSetsPerMuscle`
   *
   * El ruleset guarda tres números de volumen y el motor lee dos. El tercero,
   * `optimalSetsPerMuscle`, está declarado como deuda en
   * `ruleset-consumo.test.ts`: escrito y consumido por nadie.
   *
   * Tentador conectarlo, porque es el que coincide con ACSM 2026 (≥10 series
   * semanales para hipertrofia, plateau en ~18-20). Este test mide qué pasaría:
   * con la banda óptima el aviso de piso le sale a **30 de los 33 perfiles**. Un
   * aviso que le sale a casi todo el mundo no informa nada; es tapar la evidencia
   * con ruido en vez de con silencio, que es la regla dura 4 al revés.
   *
   * Así que la deuda se queda, y el motivo queda medido acá en vez de supuesto.
   * Lo que sí es una decisión del dueño es que la banda que **sí** se lee —6 a 24
   * series en hipertrofia— es más ancha que la evidencia por los dos lados. Ver
   * `26-acsm-2026.md`.
   */
  it('con la banda óptima el aviso de piso le saldría a casi todos', () => {
    const sinPiso: string[] = [];

    for (const perfil of PERFILES) {
      const { series, apuntados } = volumenDe(perfil);
      const [optimoDesde] = resolveParams(V1_RESEARCH, perfil.goal ?? 'hypertrophy', perfil.nivel)
        .weeklyVolume.optimalSetsPerMuscle;
      if (pordebajoDe(series, apuntados, optimoDesde).length === 0) sinPiso.push(perfil.nombre);
    }

    // Los que se salvan son planes de fuerza, donde el piso óptimo es 6 y no
    // 10: ningún músculo que reciba un compuesto queda debajo. Lo que quedaría
    // corto en el resto —abdominales, femorales— no lo apunta ningún compuesto,
    // y el motor no cuenta el trabajo incidental como sub-dosificación.
    //
    // Se mide la proporción y no la lista exacta. Acá había un `toEqual` con un
    // solo nombre adentro, y se cayó al arreglar el piso de `preferSoft` —que
    // cambió qué ejercicio llena cada slot y por lo tanto qué músculos suman
    // series—, sin que el argumento de este test se hubiera movido un milímetro:
    // el aviso le seguiría saliendo a treinta de treinta y tres. Fijar el nombre
    // del perfil era fijar un detalle del que la conclusión no depende.
    expect(sinPiso.length, `se salvan ${sinPiso.join(', ')}`).toBeLessThan(5);
    expect(PERFILES.length - sinPiso.length).toBeGreaterThan(25);
  });
});

/**
 * LAS ZONAS QUE EL SOCIO PUEDE DECLARAR Y EL RULESET NO CUBRE
 *
 * `BODY_REGIONS` tiene diez zonas y `SessionClose.tsx` las ofrece todas.
 * `safety.painRules` cubre cinco. Medido antes de este test: una lesión de
 * severidad 5 en la cadera producía el **plan entero, 40 ítems, y cero avisos**
 * — idéntico al de alguien sano, y sin nada que le dijera al socio por qué.
 *
 * No se inventan reglas para las cinco que faltan: un `avoidPatterns` para la
 * cadera sin fuente sería el número inventado que este proyecto no admite. Lo
 * que se puede hacer sin inventar nada es decir que no hay.
 *
 * Ver `27-zonas-sin-regla.md`.
 */
describe('las zonas sin regla de dolor', () => {
  const CON_REGLA = new Set((V1_RESEARCH.safety.painRules ?? []).map((r) => r.bodyRegion));

  /**
   * El tramo del aviso anterior a la zona interpolada, sacado del ruleset.
   *
   * Escribir la frase a mano acá ata el test a la redacción: cuando el texto
   * cambió (13/09/2026) los tres tests de este bloque se cayeron sin que
   * nada del comportamiento se hubiera roto.
   */
  const MARCA_SIN_REGLA =
    (V1_RESEARCH.safety.noRuleForRegion?.text ?? '').split('{region}')[0] ?? '';

  /** Un perfil cualquiera al que se le cambia la zona declarada. */
  function planConLesionEn(zona: BodyRegion, severidad = 5) {
    const base = PERFILES.find((p) => p.nombre === 'rodilla lesionada');
    if (!base) throw new Error('falta el perfil base');
    return planDe(
      { ...base, nombre: `prueba ${zona}`, limitaciones: [molestia(zona, severidad, 'injury')] },
      V1_RESEARCH,
    );
  }

  it('el texto sale del ruleset y nombra la zona', () => {
    // Regla dura 3 llevada al texto de seguridad.
    const nota = V1_RESEARCH.safety.noRuleForRegion;
    expect(nota?.text).toBeTruthy();
    expect(nota?.text).toContain('{region}');
  });

  it('ninguna de las diez zonas deja al socio sin leer nada', () => {
    const mudas: string[] = [];
    let sinRegla = 0;

    for (const zona of BODY_REGIONS) {
      const plan = planConLesionEn(zona);
      if (!CON_REGLA.has(zona)) sinRegla += 1;
      if (plan.warnings.length === 0) mudas.push(zona);
    }

    expect(mudas.join(', '), 'zonas que no le dicen nada al socio').toBe('');
    // Si esto llega a 0 es porque alguien cubrió las cinco zonas con reglas
    // propias, y entonces este bloque entero sobra: hay que ir a `27`.
    expect(sinRegla, 'ya no queda ninguna zona sin regla: revisar `27`').toBeGreaterThan(0);
  });

  it('avisa por la zona que no cubre, y no por la que sí', () => {
    // La marca sale del propio ruleset, no de una frase copiada acá: el texto
    // del aviso cambió una vez (13/09, al sacar el lenguaje de "no tenemos
    // evidencia") y estos tres tests se cayeron por buscar la redacción vieja.
    const marca = MARCA_SIN_REGLA;

    for (const zona of BODY_REGIONS) {
      const avisos = planConLesionEn(zona).warnings;
      const avisa = avisos.some((a) => a.includes(marca));
      expect(avisa, `${zona}: aviso de "sin regla" ${avisa ? 'de más' : 'faltante'}`).toBe(
        !CON_REGLA.has(zona),
      );
      // Y cuando avisa, el texto es **exactamente** el del ruleset con la zona
      // puesta. Esto era un `toContain` y pasaba por casualidad en `other`: la
      // frase que buscaba estaba en el molde del propio aviso y no en la parte
      // interpolada, así que el label podía estar mal y el test seguía verde.
      if (avisa) {
        const esperado = (V1_RESEARCH.safety.noRuleForRegion?.text ?? '').replace(
          '{region}',
          BODY_REGION_LABELS_MATRIZ[zona],
        );
        expect(avisos, zona).toContain(esperado);
      }
    }
  });

  it('con dos zonas sin regla avisa por las dos, una vez cada una', () => {
    const base = PERFILES.find((p) => p.nombre === 'rodilla lesionada');
    if (!base) return;
    const plan = planDe(
      {
        ...base,
        nombre: 'cadera y tobillo',
        limitaciones: [molestia('hip', 5, 'injury'), molestia('ankle', 3)],
      },
      V1_RESEARCH,
    );
    const avisos = plan.warnings.filter((a) => a.includes(MARCA_SIN_REGLA));
    expect(avisos).toHaveLength(2);
    expect(avisos.join('\n')).toContain('la cadera');
    expect(avisos.join('\n')).toContain('el tobillo');
  });
});

/** Las zonas como las nombra el motor, repetidas acá para no depender de un export interno. */
const BODY_REGION_LABELS_MATRIZ: Record<BodyRegion, string> = {
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

/**
 * UN SOLO CONSEJO POR ZONA, EL DEL TRAMO QUE MANDA
 *
 * La rodilla tiene dos reglas escalonadas: una desde 3 que dice "sentadillas
 * parciales controladas" y saca `lunge`, y otra desde 4 que dice "tren superior
 * y core" y saca además `squat` y `quads`. Con severidad 4 aplican las dos, y el
 * motor emitía las dos.
 *
 * Medido sobre `rodilla lesionada`: el socio leía "hacé sentadillas parciales" y
 * cuatro renglones abajo, que no quedó ningún ejercicio de sentadilla en el plan.
 * Y como las dos reglas comparten el `referIf` palabra por palabra, leía dos
 * veces "Consultá si hubo un chasquido...".
 *
 * Las exclusiones se siguen uniendo —sacar de más es el lado seguro—; el consejo
 * no. Ver `27-zonas-sin-regla.md`.
 */
describe('el consejo de seguridad cuando hay dos tramos', () => {
  it('ningún plan repite un aviso palabra por palabra', () => {
    const repetidos: string[] = [];

    for (const perfil of PERFILES) {
      const avisos = planDe(perfil, V1_RESEARCH).warnings;
      const vistos = new Set<string>();
      for (const aviso of avisos) {
        if (vistos.has(aviso)) repetidos.push(`${perfil.nombre}: "${aviso.slice(0, 60)}…"`);
        vistos.add(aviso);
      }
    }

    expect(repetidos.join('\n')).toBe('');
  });

  it('con dos reglas en la zona sale el consejo del tramo estricto, no el permisivo', () => {
    const perfil = PERFILES.find((p) => p.nombre === 'rodilla lesionada');
    expect(perfil).toBeDefined();
    if (!perfil) return;

    // Los dos tramos salen del ruleset, no escritos acá: si alguien agrega un
    // tercero o cambia los umbrales, este test lo sigue.
    const deRodilla = (V1_RESEARCH.safety.painRules ?? [])
      .filter((r) => r.bodyRegion === 'knee')
      .sort((a, b) => a.monitorFrom - b.monitorFrom);
    expect(deRodilla.length, 'la rodilla dejó de tener dos tramos: revisar `27`').toBe(2);

    const permisivo = deRodilla[0];
    const estricto = deRodilla[deRodilla.length - 1];
    expect(permisivo?.keepDoing).not.toBe(estricto?.keepDoing);

    const avisos = planDe(perfil, V1_RESEARCH).warnings.join('\n');
    expect(avisos, 'sale el consejo del tramo que manda').toContain(estricto?.keepDoing);
    expect(avisos, 'no sale el del tramo permisivo').not.toContain(permisivo?.keepDoing);
  });

  it('con severidad del tramo permisivo sale ese, que es el que corresponde', () => {
    // La otra mitad de la regla: quedarse siempre con el estricto sería el error
    // simétrico. Con una molestia de 3 no se saca nada, y el consejo tiene que
    // ser el que acompaña a un plan sin exclusiones.
    const base = PERFILES.find((p) => p.nombre === 'rodilla lesionada');
    if (!base) return;
    const deRodilla = (V1_RESEARCH.safety.painRules ?? [])
      .filter((r) => r.bodyRegion === 'knee')
      .sort((a, b) => a.monitorFrom - b.monitorFrom);
    const permisivo = deRodilla[0];

    const plan = planDe(
      { ...base, nombre: 'rodilla que molesta', limitaciones: [molestia('knee', 3)] },
      V1_RESEARCH,
    );
    expect(plan.warnings.join('\n')).toContain(permisivo?.keepDoing);
  });
});

/**
 * BLOQUEAR EQUIPAMIENTO Y EJERCICIOS
 *
 * `UserConstraint` tiene cuatro tipos y la matriz probaba dos: los 33 perfiles
 * declaran `pain` o `injury`. `avoid_exercise` y `avoid_equipment` pasan por el
 * mismo `isBlocked` que filtra la generación **y** la sustitución, y no tenían
 * cobertura sobre la diversidad.
 *
 * Medido al escribir esto, bloqueando de a tandas hasta las 58 estaciones: **cero
 * ejercicios bloqueados se colaron nunca**, y el plan se degrada de a poco en vez
 * de romperse. Lo que sí estaba mal era lo que el socio leía cuando un patrón se
 * quedaba sin nada. Ver `28-lo-que-el-socio-lee.md`.
 */
describe('los bloqueos de equipamiento y ejercicio', () => {
  const BASE = PERFILES.find((p) => p.nombre === 'hipertrofia · intermedio');

  function bloqueando(limitaciones: UserConstraint[], nombre = 'bloqueos') {
    if (!BASE) throw new Error('falta el perfil base');
    return planDe({ ...BASE, nombre, limitaciones }, V1_RESEARCH);
  }

  const sinEquipo = (equipmentId: string): UserConstraint => ({
    type: 'avoid_equipment',
    bodyRegion: null,
    exerciseId: null,
    equipmentId,
    severity: null,
  });

  it('ninguna estación bloqueada entra al plan, por muchas que se bloqueen', () => {
    let medidos = 0;

    for (const cuantas of [1, 5, 10, 20, 40]) {
      const ids = gym.equipment.slice(0, cuantas).map((e) => e.id);
      const plan = bloqueando(ids.map(sinEquipo), `bloquea ${cuantas}`);
      const items = plan.sessions.flatMap((s) => s.items);
      const colados = items.filter((i) => i.equipmentId !== null && ids.includes(i.equipmentId));
      expect(colados.map((i) => i.exerciseId).join(', '), `bloqueando ${cuantas}`).toBe('');
      if (items.length > 0) medidos += 1;
    }

    // Si todas las tandas dejaran el plan vacío, lo de arriba pasa sin mirar nada.
    expect(medidos, 'todas las tandas vaciaron el plan').toBeGreaterThan(3);
  });

  it('un ejercicio bloqueado no entra ni como equivalente', () => {
    if (!BASE) return;
    const plan0 = planDe(BASE, V1_RESEARCH);
    const primero = plan0.sessions[0]?.items[0];
    expect(primero).toBeDefined();
    if (!primero) return;

    const bloqueo: UserConstraint = {
      type: 'avoid_exercise',
      bodyRegion: null,
      exerciseId: primero.exerciseId,
      equipmentId: null,
      severity: null,
    };
    const plan = bloqueando([bloqueo], 'sin un ejercicio');
    const ids = plan.sessions.flatMap((s) => s.items.map((i) => i.exerciseId));
    expect(ids).not.toContain(primero.exerciseId);

    // Y tampoco puede volver por la puerta de atrás: `findSubstitutes` comparte
    // el filtro, que es la única razón por la que compartirlo vale la pena.
    for (const item of plan.sessions.flatMap((s) => s.items)) {
      const opciones = engine.findSubstitutes({
        item,
        gym,
        constraints: [bloqueo],
        unavailableEquipmentIds: [],
        ruleset: V1_RESEARCH,
      });
      expect(opciones.map((o) => o.exerciseId)).not.toContain(primero.exerciseId);
    }
  });

  /**
   * CAMBIAR UN EJERCICIO NO ES CAMBIAR EL PLAN
   *
   * El botón no existe para elegir otra cosa: existe para hacer **el mismo
   * trabajo** de otra forma, cuando la máquina está ocupada o cuando algo
   * molesta. Si deja elegir cualquier cosa, el plan deja de ser el plan.
   * Decisión del dueño, 12/09/2026.
   *
   * El puntaje solo no alcanzaba: con `patternWeight` 0,4 y `muscleWeight` 0,6,
   * un candidato de otro patrón pasa el piso de 0,5 con que comparta los
   * músculos. Medido sobre el catálogo real, a las **dominadas** les ofrecía un
   * **remo sentado** — los mismos músculos, pero tirón horizontal en vez de
   * vertical.
   */
  it('un equivalente es del mismo patrón de movimiento', () => {
    let medidos = 0;

    for (const original of gym.exercises) {
      const opciones = engine.findSubstitutes({
        item: { exerciseId: original.id, equipmentId: null } as never,
        gym,
        constraints: [],
        unavailableEquipmentIds: [],
        ruleset: V1_RESEARCH,
      });
      if (opciones.length === 0) continue;
      medidos += 1;

      for (const opcion of opciones) {
        const candidato = gym.exercises.find((e) => e.id === opcion.exerciseId);
        expect(
          candidato?.pattern,
          `a "${original.name}" (${original.pattern}) le ofreció "${candidato?.name}" (${candidato?.pattern})`,
        ).toBe(original.pattern);
      }
    }

    // Si ningún ejercicio tuviera equivalentes, el bucle de arriba no mira nada.
    expect(medidos, 'ningún ejercicio del catálogo tiene equivalentes').toBeGreaterThan(20);
  });

  /**
   * LO QUE LA LESIÓN SACA DEL PLAN NO PUEDE VOLVER POR EL BOTÓN
   *
   * `findSubstitutes` miraba las restricciones que el socio anotó a mano
   * (`avoid_exercise`, `avoid_equipment`) pero **no** las reglas de dolor del
   * ruleset, que son las que sacan un patrón entero. Medido sobre el catálogo
   * real: alguien con la rodilla lesionada en severidad 5 recibía un plan sin
   * una sola sentadilla, y tocando "cambiar ejercicio" se le ofrecían
   * sentadilla hack, sentadilla con cinturón y sentadilla en Smith.
   *
   * El plan protegía la rodilla y el botón la desprotegía en dos toques.
   */
  it('una lesión filtra los equivalentes igual que filtra el plan', () => {
    const lesion: UserConstraint = {
      type: 'injury',
      bodyRegion: 'knee',
      exerciseId: null,
      equipmentId: null,
      severity: 5,
    };
    const regla = (V1_RESEARCH.safety?.painRules ?? [])
      .filter((r) => r.bodyRegion === 'knee')
      .sort((a, b) => b.avoidPatterns.length - a.avoidPatterns.length)[0];
    expect(regla, 'el ruleset dejó de tener una regla de rodilla').toBeDefined();
    if (!regla) return;

    const ofrecidos = gym.exercises.flatMap((original) =>
      engine
        .findSubstitutes({
          item: { exerciseId: original.id, equipmentId: null } as never,
          gym,
          constraints: [lesion],
          unavailableEquipmentIds: [],
          ruleset: V1_RESEARCH,
        })
        .flatMap((o) => gym.exercises.filter((e) => e.id === o.exerciseId)),
    );

    const colados = ofrecidos.filter(
      (c) =>
        regla.avoidPatterns.includes(c.pattern) ||
        c.primaryMuscles.some((m) => regla.avoidMuscles.includes(m)),
    );
    expect([...new Set(colados.map((c) => c.name))].join(', ')).toBe('');

    // Sin esto, un motor que no ofreciera ningún equivalente pasaría en verde.
    expect(ofrecidos.length, 'con la lesión no se ofreció ni un equivalente').toBeGreaterThan(10);
  });

  /**
   * UN PATRÓN BLOQUEADO SE REEMPLAZA, NO SE SALTEA
   *
   * Hasta el 13/09/2026 este test pedía lo contrario: que el aviso explicara
   * **por qué** el día había quedado más corto. Explicarlo bien era una mejora
   * sobre listar las tres causas juntas, pero seguía dejando al socio con un
   * ejercicio menos justo el día que le duele algo — que es cuando el hábito
   * más cuesta sostener.
   *
   * Ahora el motor busca en el catálogo trabajo que mueva los mismos músculos
   * sin tocar la zona, y lo que se mide acá no es la redacción: es que la
   * sesión tenga la misma cantidad de ejercicios que sin el bloqueo.
   */
  it('cuando una restricción vacía un patrón, el día sigue completo', () => {
    if (!BASE) return;

    const delPatron = gym.exercises.filter((e) => e.pattern === 'squat');
    expect(delPatron.length, 'el catálogo dejó de tener sentadillas').toBeGreaterThan(0);

    const sano = planDe(BASE, V1_RESEARCH);
    const porRestriccion = bloqueando(
      delPatron.map((e) => ({
        type: 'avoid_exercise' as const,
        bodyRegion: null,
        exerciseId: e.id,
        equipmentId: null,
        severity: null,
      })),
      'sin sentadillas',
    );

    // Ninguna sentadilla entró, que es lo que el socio pidió.
    const bloqueados = new Set(delPatron.map((e) => e.id));
    for (const item of porRestriccion.sessions.flatMap((s) => s.items)) {
      expect(bloqueados.has(item.exerciseId), 'entró un ejercicio bloqueado').toBe(false);
    }

    // Y sin embargo el día no perdió ningún ejercicio.
    for (const [i, sesion] of porRestriccion.sessions.entries()) {
      const original = sano.sessions[i];
      if (!original) continue;
      expect(sesion.items.length, `${sesion.label} quedó más corta`).toBe(original.items.length);
    }

    // El aviso lo cuenta, con la marca sacada del ruleset y no copiada acá.
    const marca = (V1_RESEARCH.safety.painSubstitution?.textSinZona ?? '').split('{pattern}')[1];
    expect(marca, 'el ruleset dejó de traer el texto de sustitución').toBeTruthy();
    expect(porRestriccion.warnings.some((w) => w.includes(marca ?? ''))).toBe(true);

    // Y nunca en inglés: el identificador interno no sale a pantalla.
    for (const w of porRestriccion.warnings) {
      for (const pattern of ['squat', 'hinge', 'vertical_pull', 'horizontal_push', 'isolation']) {
        expect(w, `el aviso filtra "${pattern}"`).not.toContain(pattern);
      }
    }
  });

  /**
   * Las otras tres causas no tienen nada que sustituir, y ahí el aviso sigue
   * siendo la respuesta correcta: si la estación está fuera de servicio o el
   * catálogo no tiene el ejercicio, el socio necesita saberlo.
   */
  it('lo que no se puede sustituir se sigue explicando por su causa', () => {
    if (!BASE) return;

    const estaciones = new Set(
      gym.exercises.filter((e) => e.pattern === 'squat').flatMap((e) => e.equipmentIds),
    );
    expect(estaciones.size, 'las sentadillas no dependen de ninguna estación').toBeGreaterThan(0);

    // Fuera de servicio en el gimnasio, no anotado por el socio: son causas
    // distintas y solo la segunda tiene algo que sustituir.
    const sinEstacion = engine.generatePlan({
      context: { now: AHORA, seed: 42 },
      user: socioDe(BASE),
      gym: {
        ...gym,
        equipment: gym.equipment.map((e) => (estaciones.has(e.id) ? { ...e, isActive: false } : e)),
      },
      ruleset: V1_RESEARCH,
    });

    const aviso = sinEstacion.warnings.find((w) => w.includes('sentadilla'));
    expect(aviso, 'no avisó').toBeDefined();
    expect(aviso).toContain('no están disponibles');
  });

  it('ningún aviso de ningún perfil deja escapar un identificador interno', () => {
    // La red ancha: los patrones son once y este barrido mira los 33 perfiles.
    // Es el mismo descuido que ya había pasado con `goal.goal`, así que lo que
    // conviene fijar no es el caso sino la clase.
    const escapes: string[] = [];

    for (const perfil of PERFILES) {
      for (const aviso of planDe(perfil, V1_RESEARCH).warnings) {
        for (const pattern of MOVEMENT_PATTERNS) {
          // `cardio` y `core` son palabras del castellano además de ids; se
          // miran entrecomilladas, que es como salían.
          if (aviso.includes(`"${pattern}"`)) escapes.push(`${perfil.nombre}: "${pattern}"`);
        }
      }
    }

    expect(escapes.join('\n')).toBe('');
  });
});

/**
 * EL ORDEN DEL HISTORIAL NO PUEDE CAMBIAR LO QUE EL MOTOR PROPONE
 *
 * El contrato pide `history` de más reciente a más viejo y toda la adaptación lo
 * daba por cierto sin verificarlo: `proposeAbsenceDeload` toma la primera serie
 * como la última que hizo el socio.
 *
 * Medido antes de arreglarlo, con el mismo historial al revés: el motor le
 * proponía a alguien que entrenó **hoy** cortar el volumen a la mitad porque
 * "pasaron 100 días". La app lo ordena bien, pero es una línea de una query que
 * alguien puede tocar, y el error no rompe nada — sale una propuesta absurda.
 *
 * Ver `30-el-orden-del-historial.md`.
 */
describe('el orden del historial', () => {
  const PERFIL = PERFILES.find((p) => p.nombre === 'hipertrofia · intermedio');
  const DIA = 86400000;

  /** Seis sesiones: las dos más recientes con RIR de sobra, el resto al fallo. */
  function historialDe(item: SessionItemBlueprint, cada = 3): SetLog[] {
    return [0, 1, 2, 3, 4, 5].map((i) => ({
      id: `s${i}`,
      workoutLogId: `l${i}`,
      planSessionItemId: null,
      exerciseId: item.exerciseId,
      equipmentId: item.equipmentId,
      load: { value: 40, unit: 'kg' as const },
      loadKg: 40,
      reps: item.targetRepsMax,
      repsTarget: item.targetRepsMax,
      rir: i < 2 ? 4 : 0,
      durationSeconds: null,
      distanceMeters: null,
      restPrescribedSeconds: item.restSeconds,
      restActualSeconds: item.restSeconds,
      isWarmup: false,
      completedAt: new Date(Date.parse(AHORA) - i * cada * DIA).toISOString(),
      clientId: `c${i}`,
    }));
  }

  function proponer(perfil: Perfil, history: SetLog[]) {
    return engine
      .reviewProgress({
        context: { now: AHORA, seed: 42 },
        user: socioDe(perfil),
        gym,
        plan: {
          id: 'p',
          userId: 'socio',
          gymId: GYM_ID,
          rulesetVersion: V1_RESEARCH.version,
          generatedAt: AHORA,
          status: 'active',
        },
        history,
        resolvedProposals: [],
        ruleset: V1_RESEARCH,
      })
      .map((p) => `${p.type}/${p.reasonCode}:${p.toValue}`)
      .sort();
  }

  it('da lo mismo cómo venga ordenado, sobre todos los perfiles', () => {
    const distintos: string[] = [];
    let medidos = 0;

    for (const perfil of PERFILES) {
      const item = planDe(perfil, V1_RESEARCH)
        .sessions.flatMap((s) => s.items)
        .find((i) => i.targetDurationSeconds === null);
      if (!item) continue;

      const enOrden = historialDe(item);
      const esperado = proponer(perfil, enOrden);
      if (esperado.length > 0) medidos += 1;

      // Al revés y barajado con un orden fijo: el test tiene que ser
      // determinista, así que nada de `Math.random`.
      const alReves = [...enOrden].reverse();
      const barajado = [2, 5, 0, 3, 1, 4].map((i) => enOrden[i]).filter((s) => s !== undefined);

      for (const [comoVino, otro] of [
        ['al revés', alReves],
        ['barajado', barajado],
      ] as const) {
        const salida = proponer(perfil, otro);
        if (salida.join('|') !== esperado.join('|')) {
          distintos.push(
            `${perfil.nombre} (${comoVino}): ${salida.join(', ')} ≠ ${esperado.join(', ')}`,
          );
        }
      }
    }

    expect(distintos.join('\n')).toBe('');
    // Si ningún perfil propusiera nada, comparar listas vacías pasa sin mirar.
    expect(medidos, 'ningún perfil produjo una propuesta').toBeGreaterThan(10);
  });

  it('la serie que cuenta es la más reciente, no la más vieja', () => {
    // El test de arriba pide que el orden de entrada no importe, y eso lo cumple
    // igual un motor que ordene al revés: las tres entradas darían la misma
    // respuesta equivocada. Esto fija la dirección.
    //
    // Historial repartido: la última sesión es de hoy, la primera de hace 100
    // días. Mirando la más reciente no hay ausencia; mirando la más vieja, sí.
    if (!PERFIL) return;
    const item = planDe(PERFIL, V1_RESEARCH).sessions.flatMap((s) => s.items)[0];
    if (!item) return;
    const { deload } = resolveParams(V1_RESEARCH, PERFIL.goal ?? 'hypertrophy', PERFIL.nivel);

    const repartido = historialDe(item, 20);
    const masViejo =
      Math.max(...repartido.map((s) => Date.parse(AHORA) - Date.parse(s.completedAt))) / DIA;
    expect(masViejo, 'la sesión más vieja tiene que pasar el umbral').toBeGreaterThan(
      deload.absenceDays,
    );

    for (const entrada of [repartido, [...repartido].reverse()]) {
      expect(
        proponer(PERFIL, entrada).filter((p) => p.includes('absence')),
        'le descargó a alguien que entrenó hoy',
      ).toEqual([]);
    }
  });

  it('el descargo por ausencia sale del umbral del ruleset, no de un número suelto', () => {
    if (!PERFIL) return;
    const item = planDe(PERFIL, V1_RESEARCH).sessions.flatMap((s) => s.items)[0];
    if (!item) return;
    const { deload } = resolveParams(V1_RESEARCH, PERFIL.goal ?? 'hypertrophy', PERFIL.nivel);

    // Justo por debajo del umbral: la última serie es de ayer.
    const reciente = historialDe(item, 1);
    expect(proponer(PERFIL, reciente).filter((p) => p.includes('absence'))).toEqual([]);

    // Y justo por encima: la última, `absenceDays` atrás.
    const vieja = historialDe(item, 1).map((s, i) => ({
      ...s,
      completedAt: new Date(Date.parse(AHORA) - (deload.absenceDays + i) * DIA).toISOString(),
    }));
    const conDescargo = proponer(PERFIL, vieja).find((p) => p.includes('absence'));
    expect(conDescargo, `no descargó a los ${deload.absenceDays} días`).toBeDefined();
    // El porcentaje sale del ruleset: un 50 escrito acá sería la regla dura 3 rota.
    expect(conDescargo).toContain(`${Math.round(deload.volumeMultiplier * 100)}%`);
  });
});
