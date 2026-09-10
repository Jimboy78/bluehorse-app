import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  Equipment,
  EquipmentCategory,
  Exercise,
  ExperienceLevel,
  Goal,
  LoadUnit,
  MovementPattern,
  MuscleGroup,
  Profile,
  UserGoal,
} from '@bh/domain';
import type { GymSnapshot, PlanBlueprint, Ruleset, UserSnapshot } from '@bh/engine';
import { createPlaceholderEngine, V1_RESEARCH } from '@bh/engine';
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
];

function socioDe(p: Perfil): UserSnapshot {
  const profile: Profile = {
    id: `user-${p.goal}-${p.nivel}`,
    gymId: GYM_ID,
    displayName: p.nombre,
    birthDate: p.nacimiento,
    sex: 'undisclosed',
    experienceLevel: p.nivel,
  };
  const goal: UserGoal = {
    goal: p.goal,
    sport: null,
    seasonPhase: 'none',
    priority: 1,
    sessionsPerWeekTarget: p.sesiones,
    sessionMinutesTarget: p.minutos,
  };
  return { profile, goals: [goal], constraints: [], baselines: [] };
}

const engine = createPlaceholderEngine();
const gym = construirGimnasio();

function planDe(p: Perfil, ruleset: Ruleset): PlanBlueprint {
  return engine.generatePlan({
    context: { now: AHORA, seed: 42 },
    user: socioDe(p),
    gym,
    ruleset,
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
    expect([...desbordes]).toEqual(['frecuencia mínima']);
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
