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
  HealthCondition,
  JumpDirection,
  LoadUnit,
  MovementLimit,
  MovementPattern,
  MuscleGroup,
  PreventionProgram,
  SeasonPhase,
  Sex,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import { EXPERIENCE_LEVELS } from '@bh/domain';
import type {
  GeneratePlanInput,
  GymSnapshot,
  PainRule,
  PlanBlueprint,
  Ruleset,
  SessionItemBlueprint,
  UserSnapshot,
} from '@bh/engine';
import {
  createPlaceholderEngine,
  excluido,
  resolveParams,
  resolverContexto,
  V1_RESEARCH,
} from '@bh/engine';
import { describe, expect, it } from 'vitest';
import catalogo from '../supabase/catalog/blue-horse.json' with { type: 'json' };

/**
 * BARRIDO: EL MOTOR CONTRA MILES DE SOCIOS GENERADOS
 *
 * La matriz (`motor-matriz.test.ts`) mira 35 perfiles elegidos a mano: sirve
 * para leer un plan y discutirlo. No sirve para lo que se rompe en la
 * **combinación** de dos cosas que nadie pensó juntas. Pasó el 18/09/2026: una
 * molestia leve más un deporte le daba saltos a alguien con dolor lumbar, y
 * ningún perfil de la matriz tenía las dos a la vez.
 *
 * Esto genera socios combinando nueve dimensiones (objetivo, nivel, edad,
 * frecuencia, minutos, deporte, fase, molestia, ausencia) y chequea en cada
 * uno las invariantes que no dependen de ningún número del ruleset. Además
 * mide dos cosas que se commitean en `tools/reportes/barrido-v1-research.json`:
 *
 * - **Cobertura**: qué ejercicios y estaciones del gimnasio no entran nunca.
 * - **Sensibilidad**: si cambia UNA dimensión y nada más, ¿cambia el plan? Una
 *   dimensión al 0 % es un dato que se le pide al socio y el motor no usa.
 *
 * Es determinista (semilla fija): dos corridas dan el mismo reporte, y un
 * cambio en el motor aparece en el diff. `docs/research/38`.
 */

const AQUI = dirname(fileURLToPath(import.meta.url));
const N = Number(process.env.BARRIDO_N ?? 3000);

const GYM_ID = 'gym';
const AHORA = '2026-09-10T12:00:00.000Z';

/**
 * Lo que lleva mes (operación, esguince). `sinSaltos` y `unPie` dicen, escrito a
 * mano y no leído del ruleset, qué tiene que pasar en el plan.
 */
type ConMes = { occurredOn: string; rehabDone?: boolean; sinSaltos: boolean; unPie?: boolean };

/**
 * Las condiciones que sacan saltos, lanzamientos y el bloque de impacto. Escrito
 * a mano y no leído del ruleset: si alguien le borra el flag a una entrada, el
 * barrido tiene que darse cuenta (`docs/research/46` y `48`).
 */
const SIN_SALTOS: readonly HealthCondition[] = [
  'pelvic_floor',
  'pregnancy',
  'postpartum',
  'joint_replacement',
];

function idDe(prefijo: string, nombre: string): string {
  const limpio = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${prefijo}-${limpio}`;
}

function gimnasio(): GymSnapshot {
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
    loadsSpinalFlexion: 'loadsSpinalFlexion' in x ? Boolean(x.loadsSpinalFlexion) : false,
    headBelowHeart: 'headBelowHeart' in x ? Boolean(x.headBelowHeart) : false,
    requiresMovements: 'requiresMovements' in x ? (x.requiresMovements as MovementLimit[]) : [],
    prevents: 'prevents' in x ? (x.prevents as PreventionProgram[]) : [],
    jumpDirection: 'jumpDirection' in x ? (x.jumpDirection as JumpDirection) : null,
    skillLevel: x.skillLevel as ExperienceLevel,
    cues: x.cues ?? null,
    equipmentIds: (x.equipment ?? [])
      .map((n) => porNombre.get(n))
      .filter((id): id is string => !!id),
    isActive: true,
  }));
  return { gymId: GYM_ID, equipment, exercises, substitutions: [] };
}

/** Lo que una dimensión puede tocar al armar el socio. */
interface Borrador {
  profile: { -readonly [K in keyof UserSnapshot['profile']]: UserSnapshot['profile'][K] };
  goal: { -readonly [K in keyof UserGoal]: UserGoal[K] };
  constraints: UserConstraint[];
  conditions: HealthCondition[];
  daysSinceLastSession: number | undefined;
}

/**
 * Una dimensión es sus valores y cómo se escriben en el socio. Sumar una variable
 * nueva al barrido es sumar una entrada acá: el sorteo, las invariantes y la
 * sensibilidad la toman solas.
 *
 * El orden importa: se aplican en el orden en que están declaradas (la fase
 * mira el deporte), y sumar una dimensión cambia la secuencia del sorteo, así
 * que el reporte cambia entero. Eso es esperable; lo que no, es que cambie sin
 * sumar nada.
 */
function dim<T>(valores: readonly T[], aplicar: (b: Borrador, v: T) => void) {
  return { valores, aplicar };
}

const DIM = {
  goal: dim(
    ['strength', 'hypertrophy', 'power', 'endurance', 'recomposition', 'cardio'] as Goal[],
    (b, v) => {
      b.goal.goal = v;
    },
  ),
  nivel: dim(['beginner', 'novice', 'intermediate', 'advanced'] as ExperienceLevel[], (b, v) => {
    b.profile.experienceLevel = v;
  }),
  edad: dim([15, 22, 40, 58, 66, 76, 84], (b, v) => {
    b.profile.birthDate = `${2026 - v}-03-01`;
  }),
  sexo: dim(['female', 'male', 'undisclosed'] as Sex[], (b, v) => {
    b.profile.sex = v;
  }),
  sesiones: dim([1, 2, 3, 4, 5, 6], (b, v) => {
    b.goal.sessionsPerWeekTarget = v;
  }),
  minutos: dim([15, 30, 45, 60, 90], (b, v) => {
    b.goal.sessionMinutesTarget = v;
  }),
  deporte: dim(
    [null, 'futbol', 'tenis', 'running', 'rugby', 'golf', 'voley'] as (string | null)[],
    (b, v) => {
      b.goal.sport = v;
    },
  ),
  fase: dim(['none', 'preseason', 'in_season'] as SeasonPhase[], (b, v) => {
    b.goal.seasonPhase = b.goal.sport ? v : 'none';
  }),
  // Sin molestia pesa cuatro veces: es lo que declara la mayoría, y es la
  // condición del bloque de impacto. Con una zona nueva por tanda (`49`–`51`), un
  // solo `null` entre catorce dejaba ese bloque casi sin mirar.
  molestia: dim(
    [
      null,
      null,
      null,
      null,
      ['lower_back', 2, 'pain'],
      ['lower_back', 5, 'pain'],
      ['knee', 4, 'injury'],
      ['shoulder', 3, 'pain'],
      ['hip', 3, 'pain'],
      ['hip', 4, 'pain'],
      ['hip', 3, 'injury'],
      ['ankle', 3, 'pain'],
      ['ankle', 4, 'pain'],
      ['ankle', 3, 'injury'],
      ['elbow', 4, 'pain'],
      ['elbow', 5, 'pain'],
      ['elbow', 4, 'injury'],
      ['upper_back', 4, 'pain'],
      ['upper_back', 3, 'injury'],
      ['knee', 3, 'tendinopathy'],
      ['elbow', 4, 'tendinopathy'],
      // Operaciones (`docs/research/56`). El último campo dice, escrito a mano y
      // no leído del ruleset, si esa operación deja al socio sin saltos: en
      // rehabilitación siempre; con el alta, solo la rodilla de hace menos de
      // nueve meses. Una operación vieja con el alta es un socio sano.
      ['knee', 1, 'surgery', { occurredOn: '2026-07-01', rehabDone: false, sinSaltos: true }],
      ['knee', 1, 'surgery', { occurredOn: '2026-04-01', rehabDone: true, sinSaltos: true }],
      ['knee', 1, 'surgery', { occurredOn: '2025-06-01', rehabDone: true, sinSaltos: false }],
      ['shoulder', 1, 'surgery', { occurredOn: '2026-08-01', rehabDone: false, sinSaltos: true }],
      // Esguinces (`docs/research/57`): el de tobillo de menos de un año suma
      // equilibrio en un pie; el viejo y el de otra zona no cambian nada.
      ['ankle', 1, 'sprain', { occurredOn: '2026-06-01', sinSaltos: false, unPie: true }],
      ['ankle', 1, 'sprain', { occurredOn: '2025-03-01', sinSaltos: false, unPie: false }],
      ['knee', 1, 'sprain', { occurredOn: '2026-06-01', sinSaltos: false, unPie: false }],
    ] as (
      | [BodyRegion, number, UserConstraint['type']]
      | [BodyRegion, number, 'surgery' | 'sprain', ConMes]
      | null
    )[],
    (b, v) => {
      if (!v) return;
      const op = v[3];
      b.constraints.push({
        type: v[2],
        bodyRegion: v[0],
        exerciseId: null,
        equipmentId: null,
        severity: v[1],
        ...(op ? { occurredOn: op.occurredOn } : {}),
        ...(op?.rehabDone !== undefined ? { rehabDone: op.rehabDone } : {}),
      });
    },
  ),
  ausencia: dim([undefined, 20, 120, 400] as (number | undefined)[], (b, v) => {
    b.daysSinceLastSession = v;
  }),
  salud: dim(
    [
      [],
      ['hypertension'],
      ['heart_disease'],
      ['beta_blockers'],
      ['hypertension', 'beta_blockers'],
      ['diabetes'],
      ['diabetes', 'beta_blockers'],
      ['anticoagulants'],
      ['osteoporosis'],
      ['pelvic_floor'],
      ['osteoporosis', 'pelvic_floor'],
      ['abdominal_hernia'],
      ['glaucoma_retina'],
      ['asthma'],
      ['copd'],
      ['epilepsy_vertigo'],
      ['pregnancy'],
      ['pregnancy', 'hypertension'],
      ['postpartum'],
      ['postpartum', 'pelvic_floor'],
      ['osteoporosis', 'postpartum'],
      ['osteoarthritis'],
      ['joint_replacement'],
      ['back_problem'],
      ['osteoarthritis', 'joint_replacement', 'osteoporosis'],
    ] as HealthCondition[][],
    (b, v) => {
      b.conditions = [...v];
    },
  ),
  // Movimientos que no puede (`docs/research/58`). Sin ninguno pesa cuatro
  // veces, igual que la molestia: es lo que declara la mayoría.
  movimientos: dim(
    [
      [],
      [],
      [],
      [],
      ['overhead'],
      ['floor'],
      ['hanging'],
      ['jumping'],
      ['floor', 'overhead'],
      ['jumping', 'overhead'],
      ['overhead', 'floor', 'hanging', 'jumping'],
    ] as MovementLimit[][],
    (b, v) => {
      for (const movement of v) {
        b.constraints.push({
          type: 'avoid_movement',
          bodyRegion: null,
          exerciseId: null,
          equipmentId: null,
          severity: 5,
          movement,
        });
      }
    },
  ),
};
type Clave = keyof typeof DIM;

/**
 * Qué pide cada movimiento, escrito a mano desde la decisión del dueño
 * (19/09/2026) y no leído del catálogo: si alguien desmarca un ejercicio en el
 * JSON, el barrido lo ve (`docs/research/58`).
 */
const PIDE: Readonly<Record<MovementLimit, readonly string[]>> = {
  overhead: [
    'Press de hombro en máquina',
    'Press de hombro con mancuernas',
    'Press militar con barra',
    'Dorsalera al pecho',
    'Dorsalera con agarre neutro',
    'Dominadas',
    'Elevación de piernas colgado',
    'Extensión de tríceps con mancuerna',
    'Wall ball',
    'Slam ball',
  ],
  floor: [
    'Plancha',
    'Dead bug',
    'Flexiones de brazos',
    'Rueda abdominal',
    'Movilidad de cadera y tobillo',
    'Crunch en polea',
    'Hip thrust con barra',
    // De rodillas en la colchoneta (`docs/research/62`).
    'Curl nórdico',
  ],
  hanging: ['Dominadas', 'Elevación de piernas colgado'],
  jumping: [
    'Salto al cajón',
    'Salto con vallas',
    'Pogo jumps',
    'Salto en profundidad',
    'Zancada con salto',
    'Salto con barra hexagonal',
    'Saltitos en el lugar',
    'Aterrizaje desde cajón',
    'Salto lateral a un pie con aterrizaje clavado',
    // El horizontal del par explosivo (`docs/research/67`).
    'Salto horizontal a pies juntos',
  ],
};
type Perfil = { [K in Clave]: (typeof DIM)[K]['valores'][number] };

/** Con un esguince de tobillo reciente, según su último campo. */
function conEsguince(p: Perfil): boolean {
  return p.molestia?.[3]?.unPie === true;
}

/** Toda molestia deja sin saltos; una operación o un esguince, solo si su último campo lo dice. */
function sinSaltosPorMolestia(p: Perfil): boolean {
  if (!p.molestia) return false;
  return p.molestia[3]?.sinSaltos ?? true;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function borrador(p: Perfil): Borrador {
  const b: Borrador = {
    profile: {
      id: 'u',
      gymId: GYM_ID,
      displayName: 'x',
      birthDate: null,
      sex: 'undisclosed',
      experienceLevel: 'beginner',
    },
    goal: {
      goal: 'strength',
      sport: null,
      seasonPhase: 'none',
      priority: 1,
      sessionsPerWeekTarget: 3,
      sessionMinutesTarget: 60,
    },
    constraints: [],
    conditions: [],
    daysSinceLastSession: undefined,
  };
  for (const k of Object.keys(DIM) as Clave[]) {
    const d = DIM[k] as { aplicar: (b: Borrador, v: unknown) => void };
    d.aplicar(b, p[k]);
  }
  return b;
}

const engine = createPlaceholderEngine();
const gym = gimnasio();
const exPorId = new Map(gym.exercises.map((e) => [e.id, e]));
const eqPorId = new Map(gym.equipment.map((e) => [e.id, e]));

function entrada(p: Perfil, seed: number): GeneratePlanInput {
  const b = borrador(p);
  return {
    context: { now: AHORA, seed },
    user: {
      profile: b.profile,
      goals: [b.goal],
      constraints: b.constraints,
      baselines: [],
      conditions: b.conditions,
    },
    gym,
    ruleset: V1_RESEARCH,
    ...(b.daysSinceLastSession === undefined
      ? {}
      : { daysSinceLastSession: b.daysSinceLastSession }),
  };
}

function plan(p: Perfil, seed: number): PlanBlueprint {
  return engine.generatePlan(entrada(p, seed));
}

/** Firma comparable: ejercicio, series, reps, rir, descanso por ítem. */
function firma(b: PlanBlueprint): string {
  return b.sessions
    .map((s) =>
      s.items
        .map(
          (i) =>
            `${i.exerciseId}:${i.targetSets}x${i.targetRepsMin}-${i.targetRepsMax}r${i.targetRir}d${i.restSeconds}t${i.targetDurationSeconds}`,
        )
        .join(','),
    )
    .join('|');
}

/** Lo que tiene de mal un par por tiempo de dos ítems pegados, si tiene algo. */
function quejasDelPar(miembros: readonly SessionItemBlueprint[]): string[] {
  const t = V1_RESEARCH.sessionTime;
  const exs = miembros.map((i) => exPorId.get(i.exerciseId));
  const [a, b] = exs;
  if (!a || !b || !t) return ['par por tiempo sin ejercicio'];
  const quejas: string[] = [];
  if (a.primaryMuscles.some((m) => b.primaryMuscles.includes(m))) {
    quejas.push(`${a.name} y ${b.name} en par con músculo en común`);
  }
  miembros.forEach((it, k) => {
    const cat = it.equipmentId ? eqPorId.get(it.equipmentId)?.category : undefined;
    if (exs[k]?.isCompound && cat && t.noPairEquipment.includes(cat)) {
      quejas.push(`${exs[k]?.name} de peso libre en un par`);
    }
  });
  if (miembros[0]?.restSeconds !== t.pairIntraRestSeconds)
    quejas.push(`${a.name} abre un par con pausa`);
  return quejas;
}

describe('barrido de socios generados', () => {
  const r = rng(7);
  const elegir = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)] as T;
  const claves = Object.keys(DIM) as Clave[];
  const explosivo = V1_RESEARCH.explosive;

  const usoEx = new Map<string, number>();
  const usoEq = new Map<string, number>();
  const avisosPorPlan: number[] = [];
  const minutos = { total: 0, sobre: 0 };
  /** Por minutos declarados y objetivo: cuántas sesiones igual no entran. */
  const noEntran = new Map<string, { total: number; sobre: number }>();
  const violaciones: string[] = [];
  const sensibilidad = Object.fromEntries(claves.map((k) => [k, { mirados: 0, cambia: 0 }]));
  let items = 0;
  let conMolestia = 0;
  let conEquilibrio = 0;
  let conImpacto = 0;
  let conPisoDeRir = 0;
  let conZonaEvitada = 0;
  let conEnRehab = 0;
  let conUnPie = 0;
  let conMovimiento = 0;
  let conAjuste = 0;
  let conCardio = 0;
  let cardioCorto = 0;
  let conParPorTiempo = 0;
  let conPrevencion = 0;
  /** Pares explosivos mirados, y cuántos con el salto que pide el ruleset. */
  const direccion = { pares: 0, preferidos: 0 };
  /** En temporada: cuántas veces por semana sale la prevención, por plan. */
  const prevencionEnTemporada: number[] = [];

  /**
   * El impacto para el hueso: mujeres desde la edad del ruleset y sin molestias
   * declaradas, en toda sesión; nadie más (`docs/research/42`).
   */
  function chequearImpacto(p: Perfil, items: readonly SessionItemBlueprint[]) {
    const cfg = V1_RESEARCH.impact;
    const id = JSON.stringify(p);
    const cuantos = items.filter((i) => exPorId.get(i.exerciseId)?.pattern === 'impact').length;
    // Por sexo y edad, o por osteoporosis; nunca con molestia, con pérdidas de
    // orina, en el embarazo ni después del parto (`docs/research/46` y `48`).
    const porEdad = !!cfg && cfg.sexes.includes(p.sexo) && p.edad >= cfg.fromAge;
    const corresponde =
      !!cfg &&
      (porEdad || p.salud.includes('osteoporosis')) &&
      !sinSaltosPorMolestia(p) &&
      !p.salud.some((c) => SIN_SALTOS.includes(c));
    if (!corresponde && cuantos > 0) violaciones.push(`impacto sin corresponder: ${id}`);
    if (corresponde) {
      conImpacto += 1;
      if (cuantos === 0) violaciones.push(`sesión sin impacto: ${id}`);
    }
  }

  /**
   * Con una condición que pone piso de RIR, ninguna serie de fuerza termina más
   * cerca del fallo que eso (`docs/research/44`). Lo que no se mide por RIR
   * (potencia, cardio, bloques) queda en `null` y no cuenta.
   */
  function chequearPisoDeRir(p: Perfil, items: readonly SessionItemBlueprint[]) {
    const pisos = (V1_RESEARCH.conditions ?? [])
      .filter((c) => p.salud.includes(c.id) && c.minRir !== null)
      .map((c) => c.minRir ?? 0);
    if (pisos.length === 0) return;
    const piso = Math.max(...pisos);
    for (const it of items) {
      if (it.targetRir === null) continue;
      conPisoDeRir += 1;
      if (it.targetRir < piso) {
        violaciones.push(`RIR ${it.targetRir} con piso ${piso}: ${JSON.stringify(p)}`);
      }
    }
  }

  /**
   * Desde la edad del ruleset, o con un esguince de tobillo reciente, toda
   * sesión cierra con equilibrio; si no, ninguna lo trae. Y va al final: Otago
   * hace primero la fuerza (`docs/research/39`). Con el esguince, los primeros
   * del bloque son en un pie (`57`).
   */
  function chequearEquilibrio(
    p: Perfil,
    items: readonly SessionItemBlueprint[],
    achicoBloques: boolean,
  ) {
    const cfg = V1_RESEARCH.balance;
    const id = JSON.stringify(p);
    const deEquilibrio = items
      .map((i) => exPorId.get(i.exerciseId))
      .filter((e) => e?.pattern === 'balance');
    const marca = items.map((i) => exPorId.get(i.exerciseId)?.pattern === 'balance');
    const cuantos = deEquilibrio.length;
    const esguince = conEsguince(p);
    if ((!cfg || p.edad < cfg.fromAge) && !esguince) {
      if (cuantos > 0) violaciones.push(`equilibrio sin edad ni esguince: ${id}`);
      return;
    }
    conEquilibrio += 1;
    if (cuantos === 0) violaciones.push(`sesión sin equilibrio: ${id}`);
    if (marca.indexOf(true) !== marca.length - cuantos) {
      violaciones.push(`el equilibrio no va al final: ${id}`);
    }
    if (esguince) chequearUnPie(id, deEquilibrio, achicoBloques);
  }

  /**
   * Con el esguince, los primeros del bloque son en un pie. Si el tiempo no
   * alcanzó y el plan avisa que achicó los bloques (`59`), queda al menos uno.
   */
  function chequearUnPie(
    id: string,
    deEquilibrio: readonly (Exercise | undefined)[],
    achicoBloques: boolean,
  ) {
    conUnPie += 1;
    const dosis = V1_RESEARCH.sprain?.exercisesPerSession ?? 0;
    const k = achicoBloques ? Math.min(1, dosis) : dosis;
    const primeros = deEquilibrio.slice(0, k);
    if (primeros.length < k || primeros.some((e) => !e?.isUnilateral)) {
      violaciones.push(`esguince sin equilibrio en un pie: ${id}`);
    }
  }

  /**
   * Los avisos del contexto están todos en el plan, y los de molestia van
   * primero: la pantalla muestra los primeros y guarda el resto, y "cuándo
   * consultar" no puede quedar detrás de "ver más".
   */
  function chequearAvisos(p: Perfil, inp: GeneratePlanInput, b: PlanBlueprint) {
    const avisos = resolverContexto(inp).avisos;
    const id = JSON.stringify(p);
    for (const a of avisos) {
      if (!b.warnings.includes(a.texto)) violaciones.push(`aviso de ${a.modulo} perdido: ${id}`);
    }
    const molestia = avisos.filter((a) => a.modulo === 'molestia').map((a) => a.texto);
    if (molestia.length === 0) return;
    conMolestia += 1;
    if (b.warnings.slice(0, molestia.length).join('|') !== molestia.join('|')) {
      violaciones.push(`los avisos de molestia no van primero: ${id}`);
    }
  }

  /** Una operación en rehabilitación deja su zona entera en manos del kinesiólogo (`56`). */
  function chequearRehabilitacion(p: Perfil, evitar: readonly PainRule[]) {
    const op = p.molestia?.[3];
    if (op?.rehabDone !== false) return;
    conEnRehab += 1;
    if (!evitar.some((r) => r.bodyRegion === p.molestia?.[0])) {
      violaciones.push(`zona en rehabilitación sin evitar: ${JSON.stringify(p)}`);
    }
  }

  /**
   * Lo que una regla de dolor saca no vuelve a entrar por ningún lado: ni por la
   * plantilla, ni por un bloque, ni por una sustitución (`docs/research/49`).
   */
  function chequearZonaQueDuele(p: Perfil, it: SessionItemBlueprint, reglas: readonly PainRule[]) {
    const ex = exPorId.get(it.exerciseId);
    if (!ex) return;
    // Equilibrio en un pie que dobla la rodilla con el peso encima = zancada (`57`).
    const comoZancada = ex.pattern === 'balance' && ex.isUnilateral && ex.isCompound;
    const regla = reglas.find(
      (r) =>
        r.avoidPatterns.includes(ex.pattern) ||
        (comoZancada && r.avoidPatterns.includes('lunge')) ||
        ex.primaryMuscles.some((m) => r.avoidMuscles.includes(m)),
    );
    if (regla)
      violaciones.push(`${ex.name} con ${regla.bodyRegion} a evitar: ${JSON.stringify(p)}`);
  }

  /** Lo que pide un movimiento declarado no entra por ningún lado (`58`). */
  function chequearMovimientos(p: Perfil, it: SessionItemBlueprint) {
    const ex = exPorId.get(it.exerciseId);
    if (!ex) return;
    for (const m of p.movimientos) {
      if (PIDE[m].includes(ex.name)) {
        violaciones.push(`${ex.name} sin poder ${m}: ${JSON.stringify(p)}`);
      }
    }
  }

  function chequearItem(
    p: Perfil,
    it: SessionItemBlueprint,
    previo: SessionItemBlueprint | undefined,
  ) {
    const id = JSON.stringify(p);
    const ex = exPorId.get(it.exerciseId);
    if (!ex) {
      violaciones.push(`ejercicio fuera del catálogo: ${id}`);
      return;
    }
    if (EXPERIENCE_LEVELS.indexOf(ex.skillLevel) > EXPERIENCE_LEVELS.indexOf(p.nivel)) {
      violaciones.push(`${ex.name} pide más técnica que ${p.nivel}`);
    }
    if (it.targetSets < 1 || it.targetRepsMin > it.targetRepsMax || it.restSeconds < 0) {
      violaciones.push(`dosis imposible en ${ex.name}: ${id}`);
    }
    chequearExplosivo(p, it, previo, ex);
    if (ex.loadsSpinalFlexion && p.salud.includes('osteoporosis')) {
      violaciones.push(`${ex.name} con osteoporosis: ${id}`);
    }
    if (ex.headBelowHeart && p.salud.includes('glaucoma_retina')) {
      violaciones.push(`${ex.name} con glaucoma: ${id}`);
    }
    chequearAdolescente(p, it, ex);
  }

  /**
   * Un adolescente que recién empieza no recibe más series ni menos
   * repeticiones que la dosis de inicio (`docs/research/41`). El par explosivo,
   * el equilibrio, el impacto y la prevención llevan su propia dosis (el impacto
   * le llega a un adolescente con osteoporosis, `docs/research/46`; el nórdico,
   * a un adolescente que juega al fútbol, `62`); el cardio va por tiempo.
   */
  /** Un explosivo del par: los aterrizajes de rodilla son explosivos de bloque (`63`). */
  function esDelPar(ex: Exercise): boolean {
    return ex.isExplosive && ex.prevents.length === 0;
  }

  function chequearAdolescente(p: Perfil, it: SessionItemBlueprint, ex: Exercise) {
    const y = V1_RESEARCH.modifiers?.youth;
    if (!y || p.edad < y.fromAge || p.edad > y.toAge || !y.levels.includes(p.nivel)) return;
    const bloque = ex.pattern === 'balance' || ex.pattern === 'impact' || ex.prevents.length > 0;
    if (ex.isExplosive || bloque || it.targetDurationSeconds !== null) return;
    if (it.targetSets > y.maxSets || it.targetRepsMin < y.repsWindow[0]) {
      violaciones.push(
        `${ex.name} ${it.targetSets}×${it.targetRepsMin} a los ${p.edad}: ${JSON.stringify(p)}`,
      );
    }
  }

  /** Un ejercicio de bloque nunca lleva la dosis del par (`docs/research/67`). */
  function chequearBloqueFueraDelPar(p: Perfil, it: SessionItemBlueprint, ex: Exercise) {
    if (explosivo && it.rationale === explosivo.rationale) {
      violaciones.push(`${ex.name} de un bloque, en el par explosivo: ${JSON.stringify(p)}`);
    }
  }

  function chequearExplosivo(
    p: Perfil,
    it: SessionItemBlueprint,
    previo: SessionItemBlueprint | undefined,
    ex: Exercise,
  ) {
    if (!esDelPar(ex)) return chequearBloqueFueraDelPar(p, it, ex);
    const id = JSON.stringify(p);
    const nombre = ex.name;
    if (it.supersetGroup === null || previo?.supersetGroup !== it.supersetGroup) {
      violaciones.push(`${nombre} suelto, sin su levantamiento: ${id}`);
    }
    if (sinSaltosPorMolestia(p)) violaciones.push(`${nombre} con una molestia declarada: ${id}`);
    const sinSaltos = p.salud.filter((c) => SIN_SALTOS.includes(c));
    if (sinSaltos.length > 0) violaciones.push(`${nombre} con ${sinSaltos.join(', ')}: ${id}`);
    if (explosivo && p.edad > explosivo.maxAge) violaciones.push(`${nombre} a los ${p.edad}`);
  }

  /**
   * El salto del par es el de la dirección que pide el ruleset, salvo que este
   * socio no tuviera ninguno de su patrón (`docs/research/67`).
   */
  function chequearDireccion(
    p: Perfil,
    inp: GeneratePlanInput,
    items: readonly SessionItemBlueprint[],
  ) {
    const quiere = explosivo?.preferJumpDirection;
    if (!quiere) return;
    const ctx = resolverContexto(inp);
    const nivel = EXPERIENCE_LEVELS.indexOf(p.nivel);
    for (const it of items) {
      const ex = exPorId.get(it.exerciseId);
      // Solo saltos: un swing o un lanzamiento no tienen dirección de salto.
      if (!ex || !esDelPar(ex) || it.supersetGroup === null || ex.jumpDirection === null) continue;
      direccion.pares += 1;
      if (ex.jumpDirection === quiere) {
        direccion.preferidos += 1;
        continue;
      }
      const habia = gym.exercises.some(
        (e) =>
          e.pattern === ex.pattern &&
          esDelPar(e) &&
          e.jumpDirection === quiere &&
          !excluido(ctx, e) &&
          EXPERIENCE_LEVELS.indexOf(e.skillLevel) <= nivel,
      );
      if (habia)
        violaciones.push(
          `${ex.name} en el par con un salto ${quiere} a mano: ${JSON.stringify(p)}`,
        );
    }
  }

  /**
   * El tiempo (`docs/research/59`): cada sesión entra en los minutos
   * declarados, o el plan dice cuál no entra y cuánto dura.
   */
  function chequearMinutos(p: Perfil, b: PlanBlueprint) {
    for (const s of b.sessions) {
      minutos.total += 1;
      const clave = `${String(p.minutos).padStart(2, '0')} min · ${p.goal}`;
      const c = noEntran.get(clave) ?? { total: 0, sobre: 0 };
      noEntran.set(clave, c);
      c.total += 1;
      if (s.estimatedMinutes <= p.minutos) continue;
      minutos.sobre += 1;
      c.sobre += 1;
      const dice = b.warnings.some(
        (w) => w.includes(s.label) && w.includes(String(s.estimatedMinutes)),
      );
      if (!dice) violaciones.push(`${s.label} pasa los minutos sin decirlo: ${JSON.stringify(p)}`);
    }
  }

  /**
   * Un par por tiempo junta dos ejercicios sin músculo principal en común, y
   * ninguno es un multiarticular de peso libre (Iversen 2021). El primero va
   * sin pausa y los dos van pegados. El par explosivo tiene sus propias reglas
   * (`chequearExplosivo`).
   */
  function chequearPares(p: Perfil, items: readonly SessionItemBlueprint[]) {
    const grupos = new Set(
      items.flatMap((i) => (i.supersetGroup === null ? [] : [i.supersetGroup])),
    );
    for (const g of grupos) {
      const idx = items.flatMap((i, k) => (i.supersetGroup === g ? [k] : []));
      const miembros = idx.map((k) => items[k] as SessionItemBlueprint);
      if (miembros.some((i) => exPorId.get(i.exerciseId)?.isExplosive)) continue;
      conParPorTiempo += 1;
      const pegados = idx.length === 2 && (idx[1] ?? 0) - (idx[0] ?? 0) === 1;
      const quejas = pegados ? quejasDelPar(miembros) : ['par por tiempo mal armado'];
      for (const q of quejas) violaciones.push(`${q}: ${JSON.stringify(p)}`);
    }
  }

  const esDeFuerza = (i: SessionItemBlueprint, e: Exercise | undefined): e is Exercise =>
    !!e &&
    !e.isExplosive &&
    i.targetDurationSeconds === null &&
    !['balance', 'impact'].includes(e.pattern) &&
    e.prevents.length === 0;

  /** Los ítems de la semana del aviso de volumen, y cuánto pesa cada uno. */
  function semanaDe(b: PlanBlueprint, p: Perfil, quedan?: ReadonlySet<string>) {
    const tpl = V1_RESEARCH.templates.find((t) => t.id === b.templateId);
    const dias = Math.min(p.sesiones, tpl?.sessionsPerWeek[1] ?? p.sesiones);
    const n = tpl?.sessions.length ?? 1;
    const semana = b.sessions.slice(0, Math.max(dias, n));
    const cuentan = semana.flatMap((s, k) =>
      s.items.filter((i) => !quedan || quedan.has(`${k % n}:${i.exerciseId}`)),
    );
    return { cuentan, peso: dias < n ? dias / n : 1 };
  }

  /**
   * Series por semana de cada músculo que el plan trabaja con algún
   * multiarticular, en la semana del aviso de volumen: las primeras sesiones de
   * la cola, tantas como días. Con menos días que sesiones, el promedio.
   * Escrito de nuevo acá, no importado: si el motor cuenta mal, el test no
   * tiene que contar igual de mal.
   */
  function seriesPorSemana(
    b: PlanBlueprint,
    p: Perfil,
    quedan?: ReadonlySet<string>,
  ): Map<string, number> {
    const { cuentan, peso } = semanaDe(b, p, quedan);
    const deFuerza = cuentan.flatMap((i) => {
      const e = exPorId.get(i.exerciseId);
      return esDeFuerza(i, e) ? [{ i, e }] : [];
    });
    const conMultiarticular = new Set(
      deFuerza.filter(({ e }) => e.isCompound).flatMap(({ e }) => e.primaryMuscles),
    );
    const out = new Map<string, number>();
    for (const { i, e } of deFuerza) {
      for (const m of e.primaryMuscles) out.set(m, (out.get(m) ?? 0) + i.targetSets * peso);
    }
    return new Map([...out].filter(([m]) => conMultiarticular.has(m)));
  }

  /** Los tramos continuos cuyo texto no dice sus minutos. */
  function textosDeCardio(items: readonly SessionItemBlueprint[]): string[] {
    return items
      .filter((i) => i.targetIntervalRestSeconds === null)
      .map((i) => Math.round((i.targetDurationSeconds ?? 0) / 60))
      .flatMap((min, k) =>
        items
          .filter((i) => i.targetIntervalRestSeconds === null)
          [k]?.rationale.includes(`${min} minutos`)
          ? []
          : [`cardio de ${min} min que dice otra cosa`],
      );
  }

  /** Minutos de cardio de la semana del plan, con el peso de la OMS por zona. */
  function cardioSemanal(b: PlanBlueprint, p: Perfil): number {
    const w = V1_RESEARCH.cardio?.weeklyMinimum;
    const vale = { light: 0, moderate: 1, vigorous: w?.vigorousWeight ?? 0 };
    const { cuentan, peso } = semanaDe(b, p);
    return cuentan.reduce((t, i) => {
      const z = V1_RESEARCH.cardio?.zones.find((x) => x.zone === i.targetIntensityZone);
      const seg = i.targetSets * (i.targetDurationSeconds ?? 0);
      return t + (seg * peso * (z ? vale[z.whoIntensity] : 0)) / 60;
    }, 0);
  }

  /**
   * El cardio (`docs/research/61`): el texto de un tramo continuo dice sus
   * minutos, también cuando el tiempo lo acortó; y el aviso de la OMS sale
   * justo cuando el tiempo acortó el cardio y la semana no llega. La cuenta se
   * hace acá de nuevo.
   */
  function chequearCardio(p: Perfil, b: PlanBlueprint) {
    const w = V1_RESEARCH.cardio?.weeklyMinimum;
    const t = V1_RESEARCH.sessionTime;
    const items = b.sessions.flatMap((s) => s.items).filter((i) => i.targetDurationSeconds);
    if (!w || !t || items.length === 0) return;
    conCardio += 1;
    const id = JSON.stringify(p);
    for (const q of textosDeCardio(items)) violaciones.push(`${q}: ${id}`);
    const acorto = b.warnings.some((x) => x.includes(t.changes.cardio));
    const corto = acorto && cardioSemanal(b, p) < w.moderateMinutes;
    if (corto) cardioCorto += 1;
    const marca = w.note.split('{')[0] ?? '';
    if (b.warnings.some((x) => x.startsWith(marca)) !== corto) {
      violaciones.push(`aviso de cardio ${corto ? 'que falta' : 'de más'}: ${id}`);
    }
  }

  /**
   * La prevención del deporte (`docs/research/62`): solo con un deporte de su
   * programa, solo en sesiones de pierna y al final. Si le toca y no está
   * excluida, en toda sesión de pierna de la plantilla; en temporada, en tantas
   * como diga el programa.
   */
  function chequearPrevencion(p: Perfil, inp: GeneratePlanInput, b: PlanBlueprint) {
    const ctx = resolverContexto(inp);
    const n = V1_RESEARCH.templates.find((t) => t.id === b.templateId)?.sessions.length ?? 1;
    for (const prog of V1_RESEARCH.sports?.prevention?.programs ?? []) {
      for (const q of quejasDePrevencion(p, prog, ctx, b, n)) {
        violaciones.push(`${q}: ${JSON.stringify(p)}`);
      }
    }
    if (p.fase !== 'in_season') return;
    // Solo los programas con tope en temporada (el nórdico): los de rodilla van
    // en toda sesión de pierna a propósito (`63`).
    const conTope = new Set(
      (V1_RESEARCH.sports?.prevention?.programs ?? [])
        .filter((x) => x.inSeasonSessions !== null)
        .map((x) => x.id),
    );
    const { cuentan, peso } = semanaDe(b, p);
    const veces = cuentan.filter((i) =>
      exPorId.get(i.exerciseId)?.prevents.some((x) => conTope.has(x)),
    );
    if (veces.length > 0) prevencionEnTemporada.push(veces.length * peso);
  }

  type Programa = NonNullable<NonNullable<Ruleset['sports']>['prevention']>['programs'][number];

  function quejasDePrevencion(
    p: Perfil,
    prog: Programa,
    ctx: ReturnType<typeof resolverContexto>,
    b: PlanBlueprint,
    n: number,
  ): string[] {
    const deEste = (i: SessionItemBlueprint) =>
      exPorId.get(i.exerciseId)?.prevents.includes(prog.id) === true;
    const vuelta = b.sessions.slice(0, n);
    const conEste = vuelta.filter((s) => s.items.some(deEste));
    const toca = p.deporte !== null && prog.sports.includes(p.deporte);
    const puede = gym.exercises.some((e) => e.prevents.includes(prog.id) && !excluido(ctx, e));
    if (!toca || !puede) {
      return conEste.length > 0 ? [`prevención ${toca ? 'excluida' : 'sin su deporte'}`] : [];
    }
    conPrevencion += 1;
    const quejas = conEste
      .filter((s) => !s.items.some(esDePierna))
      .map(() => 'prevención sin pierna');
    const dePierna = vuelta.filter((s) => s.items.some(esDePierna)).length;
    const cuota = cuotaDePrevencion(p, prog, dePierna);
    if (conEste.length !== cuota) {
      quejas.push(`prevención en ${conEste.length} sesiones, tocaban ${cuota}`);
    }
    return quejas;
  }

  /** En cuántas sesiones de pierna de la plantilla va el programa: todas, o su tope en temporada. */
  function cuotaDePrevencion(p: Perfil, prog: Programa, dePierna: number): number {
    const tope = p.fase === 'in_season' ? prog.inSeasonSessions : null;
    return tope === null ? dePierna : Math.min(tope, dePierna);
  }

  /**
   * Un multiarticular de pierna, sin contar el cardio: lo que hace "de pierna" a
   * una sesión. Un aislado no, porque el ajuste al tiempo lo puede sacar.
   */
  function esDePierna(i: SessionItemBlueprint): boolean {
    const e = exPorId.get(i.exerciseId);
    return (
      !!e &&
      e.isCompound &&
      e.pattern !== 'cardio' &&
      e.prevents.length === 0 &&
      !e.isExplosive &&
      !['balance', 'impact'].includes(e.pattern) &&
      e.primaryMuscles.some((m) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m))
    );
  }

  /**
   * Contra el mismo socio con tiempo de sobra: el ajuste no saca ningún
   * multiarticular, no toca repeticiones ni RIR, y bajar series no deja un
   * músculo por debajo del piso semanal, salvo que ya estuviera abajo. Sacar
   * un aislado sí puede (es el paso 3, decidido antes que las series): por eso
   * el "antes" es el plan holgado sin los ejercicios que el ajuste sacó.
   */
  function chequearAjuste(p: Perfil, b: PlanBlueprint, seed: number) {
    const holgado = plan({ ...p, minutos: 600 }, seed);
    if (firma(holgado) === firma(b)) return;
    conAjuste += 1;
    const id = JSON.stringify(p);
    const multis = (x: PlanBlueprint) =>
      x.sessions
        .flatMap((s) => s.items)
        .filter((i) => {
          const e = exPorId.get(i.exerciseId);
          return esDeFuerza(i, e) && e.isCompound;
        })
        .map((i) => i.exerciseId)
        .sort()
        .join();
    if (multis(holgado) !== multis(b)) violaciones.push(`el tiempo sacó un multiarticular: ${id}`);
    chequearPisoSemanal(p, holgado, b);
    // Por sesión y ejercicio: el mismo puede ir de secundario en una sesión y de
    // aislado en otra, con otra dosis, y el ajuste sacar solo el aislado.
    const dosis = (x: PlanBlueprint) =>
      new Map(
        x.sessions.flatMap((s) =>
          s.items.map((i) => [
            `${s.label}:${i.exerciseId}`,
            `${i.targetRepsMin}-${i.targetRepsMax}r${i.targetRir}`,
          ]),
        ),
      );
    const d0 = dosis(holgado);
    for (const [ex, d] of dosis(b)) {
      if (d0.has(ex) && d0.get(ex) !== d) violaciones.push(`el tiempo cambió reps o RIR: ${id}`);
    }
  }

  function chequearPisoSemanal(p: Perfil, holgado: PlanBlueprint, b: PlanBlueprint) {
    const piso = resolveParams(V1_RESEARCH, p.goal, p.nivel).weeklyVolume.minSetsPerMuscle;
    const n = V1_RESEARCH.templates.find((t) => t.id === b.templateId)?.sessions.length ?? 1;
    const quedan = new Set(
      b.sessions.flatMap((x, k) => x.items.map((i) => `${k % n}:${i.exerciseId}`)),
    );
    const despues = seriesPorSemana(b, p);
    for (const [m, antes] of seriesPorSemana(holgado, p, quedan)) {
      const ahora = despues.get(m) ?? 0;
      if (ahora + 1e-9 < Math.min(piso, antes)) {
        violaciones.push(`${m} bajó a ${ahora} series por semana: ${JSON.stringify(p)}`);
      }
    }
  }

  for (let n = 0; n < N; n++) {
    const p = Object.fromEntries(claves.map((k) => [k, elegir(DIM[k].valores)])) as Perfil;
    const seed = Math.floor(r() * 1e9);
    const inp = entrada(p, seed);
    const b = engine.generatePlan(inp);
    avisosPorPlan.push(b.warnings.length);
    chequearAvisos(p, inp, b);
    const evitar = resolverContexto(inp).avoidRules;
    if (evitar.length > 0) conZonaEvitada += 1;
    chequearRehabilitacion(p, evitar);
    if (p.movimientos.length > 0) conMovimiento += 1;
    chequearMinutos(p, b);
    chequearAjuste(p, b, seed);
    chequearCardio(p, b);
    chequearPrevencion(p, inp, b);
    const achicoBloques = b.warnings.some(
      (w) => !!V1_RESEARCH.sessionTime && w.includes(V1_RESEARCH.sessionTime.changes.blocks),
    );
    for (const s of b.sessions) {
      if (s.items.length === 0) violaciones.push(`sesión vacía: ${JSON.stringify(p)}`);
      s.items.forEach((it, i) => {
        items += 1;
        chequearItem(p, it, s.items[i - 1]);
        chequearZonaQueDuele(p, it, evitar);
        chequearMovimientos(p, it);
        usoEx.set(it.exerciseId, (usoEx.get(it.exerciseId) ?? 0) + 1);
        if (it.equipmentId) usoEq.set(it.equipmentId, (usoEq.get(it.equipmentId) ?? 0) + 1);
      });
      chequearPares(p, s.items);
      chequearEquilibrio(p, s.items, achicoBloques);
      chequearImpacto(p, s.items);
      chequearPisoDeRir(p, s.items);
      chequearDireccion(p, inp, s.items);
    }
    // Una dimensión distinta, misma semilla: ¿cambia el plan?
    const k = elegir(claves);
    const otro = elegir(
      (DIM[k].valores as readonly unknown[]).filter(
        (v) => JSON.stringify(v) !== JSON.stringify(p[k]),
      ),
    );
    const sk = sensibilidad[k];
    if (sk) {
      sk.mirados += 1;
      if (firma(plan({ ...p, [k]: otro } as Perfil, seed)) !== firma(b)) sk.cambia += 1;
    }
  }

  it('recorrió de verdad', () => {
    expect(items).toBeGreaterThan(N * 10);
    expect(conMolestia).toBeGreaterThan(N / 3);
    expect(conEquilibrio).toBeGreaterThan(N);
    expect(conImpacto).toBeGreaterThan(N / 10);
    expect(conPisoDeRir).toBeGreaterThan(N);
    expect(conZonaEvitada).toBeGreaterThan(N / 10);
    expect(conEnRehab).toBeGreaterThan(N / 50);
    expect(conUnPie).toBeGreaterThan(N / 50);
    expect(conMovimiento).toBeGreaterThan(N / 3);
    expect(conAjuste).toBeGreaterThan(N / 5);
    expect(conParPorTiempo).toBeGreaterThan(N / 10);
    expect(conCardio).toBeGreaterThan(N / 10);
    expect(cardioCorto).toBeGreaterThan(0);
    expect(cardioCorto).toBeLessThan(conCardio);
    expect(conPrevencion).toBeGreaterThan(N / 10);
    expect(direccion.preferidos).toBeGreaterThan(N / 10);
    expect(prevencionEnTemporada.length).toBeGreaterThan(N / 50);
  });

  it('el catálogo marca justo lo que la lista a mano dice que pide cada movimiento', () => {
    for (const m of Object.keys(PIDE) as MovementLimit[]) {
      const marcados = gym.exercises.filter((e) => e.requiresMovements.includes(m));
      expect(marcados.map((e) => e.name).sort(), m).toEqual([...PIDE[m]].sort());
    }
  });

  it('ninguna combinación rompe una invariante', () => {
    expect([...new Set(violaciones)].slice(0, 20)).toEqual([]);
  });

  it('es determinista: mismo socio y misma semilla, mismo plan', () => {
    const p = Object.fromEntries(claves.map((k) => [k, DIM[k].valores[1]])) as Perfil;
    expect(firma(plan(p, 123))).toBe(firma(plan(p, 123)));
  });

  it('el objetivo y el nivel cambian el plan casi siempre', () => {
    // Si esto cae, el motor dejó de leer lo más básico del socio.
    for (const k of ['goal', 'nivel'] as const) {
      const v = sensibilidad[k];
      expect(v?.mirados).toBeGreaterThan(50);
      if (v) expect(v.cambia / v.mirados).toBeGreaterThan(0.9);
    }
  });

  it('las condiciones de salud mueven el plan', () => {
    // Si da 0, el motor no las lee (`docs/research/44`).
    const v = sensibilidad.salud;
    expect(v?.mirados).toBeGreaterThan(50);
    expect(v?.cambia).toBeGreaterThan(0);
  });

  it('escribe el reporte', () => {
    const nombre = (id: string) => exPorId.get(id)?.name ?? id;
    const eqNombre = (id: string) => gym.equipment.find((e) => e.id === id)?.name ?? id;
    const pct = (a: number, b: number) => Math.round((100 * a) / Math.max(1, b));
    const orden = (a: [string, number], b: [string, number]) =>
      b[1] - a[1] || a[0].localeCompare(b[0]);
    const salida = {
      ruleset: V1_RESEARCH.version,
      socios: N,
      ejerciciosQueNuncaEntran: gym.exercises.filter((e) => !usoEx.has(e.id)).map((e) => e.name),
      estacionesQueNuncaSeUsan: gym.equipment.filter((e) => !usoEq.has(e.id)).map((e) => e.name),
      ejerciciosMasUsados: [...usoEx]
        .sort(orden)
        .slice(0, 10)
        .map(([id, c]) => `${nombre(id)}: ${pct(c, items)} % de los ítems`),
      estacionesMasUsadas: [...usoEq]
        .sort(orden)
        .slice(0, 5)
        .map(([id, c]) => `${eqNombre(id)}: ${pct(c, items)} % de los ítems`),
      avisosPorPlan: {
        media: Math.round((10 * avisosPorPlan.reduce((a, b) => a + b, 0)) / N) / 10,
        max: Math.max(...avisosPorPlan),
      },
      // En temporada el programa pide una sesión de la plantilla; con menos
      // sesiones de plantilla que días, esa sesión se repite en la semana.
      prevencionPorSemanaEnTemporada: {
        media:
          Math.round(
            (10 * prevencionEnTemporada.reduce((a, b) => a + b, 0)) /
              Math.max(1, prevencionEnTemporada.length),
          ) / 10,
        max: Math.max(0, ...prevencionEnTemporada),
      },
      // De los pares con un salto. El resto es de quien no tiene el horizontal
      // de ese patrón a mano, por nivel (`docs/research/67`).
      saltosDelParEnLaDireccionPreferida: `${pct(direccion.preferidos, direccion.pares)} %`,
      sesionesQuePasanLosMinutosDeclarados: `${pct(minutos.sobre, minutos.total)} %`,
      // Solo las combinaciones donde alguna no entra: lo que el ajuste no pudo
      // achicar sin romper un piso, y que el plan avisa.
      noEntranPorMinutosYObjetivo: Object.fromEntries(
        [...noEntran]
          .filter(([, v]) => v.sobre > 0)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, `${pct(v.sobre, v.total)} %`]),
      ),
      cambiaElPlanAlCambiarSolo: Object.fromEntries(
        Object.entries(sensibilidad).map(([k, v]) => [k, `${pct(v.cambia, v.mirados)} %`]),
      ),
    };
    const destino = join(AQUI, 'reportes', 'barrido-v1-research.json');
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, `${JSON.stringify(salida, null, 2)}\n`);
    expect(salida.socios).toBe(N);
  });
});
