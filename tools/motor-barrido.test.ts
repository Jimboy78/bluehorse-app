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
  MovementPattern,
  MuscleGroup,
  SeasonPhase,
  UserConstraint,
  UserGoal,
} from '@bh/domain';
import { EXPERIENCE_LEVELS } from '@bh/domain';
import type { GymSnapshot, PlanBlueprint, SessionItemBlueprint, UserSnapshot } from '@bh/engine';
import { createPlaceholderEngine, V1_RESEARCH } from '@bh/engine';
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
  edad: dim([22, 40, 58, 66, 76, 84], (b, v) => {
    b.profile.birthDate = `${2026 - v}-03-01`;
  }),
  sesiones: dim([2, 3, 4, 5, 6], (b, v) => {
    b.goal.sessionsPerWeekTarget = v;
  }),
  minutos: dim([30, 45, 60, 90], (b, v) => {
    b.goal.sessionMinutesTarget = v;
  }),
  deporte: dim(
    [null, 'futbol', 'tenis', 'running', 'rugby', 'golf'] as (string | null)[],
    (b, v) => {
      b.goal.sport = v;
    },
  ),
  fase: dim(['none', 'preseason', 'in_season'] as SeasonPhase[], (b, v) => {
    b.goal.seasonPhase = b.goal.sport ? v : 'none';
  }),
  molestia: dim(
    [
      null,
      ['lower_back', 2, 'pain'],
      ['lower_back', 5, 'pain'],
      ['knee', 4, 'injury'],
      ['shoulder', 3, 'pain'],
      ['hip', 3, 'pain'],
    ] as ([BodyRegion, number, UserConstraint['type']] | null)[],
    (b, v) => {
      if (!v) return;
      b.constraints.push({
        type: v[2],
        bodyRegion: v[0],
        exerciseId: null,
        equipmentId: null,
        severity: v[1],
      });
    },
  ),
  ausencia: dim([undefined, 20, 120, 400] as (number | undefined)[], (b, v) => {
    b.daysSinceLastSession = v;
  }),
};
type Clave = keyof typeof DIM;
type Perfil = { [K in Clave]: (typeof DIM)[K]['valores'][number] };

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

function plan(p: Perfil, seed: number): PlanBlueprint {
  const b = borrador(p);
  return engine.generatePlan({
    context: { now: AHORA, seed },
    user: { profile: b.profile, goals: [b.goal], constraints: b.constraints, baselines: [] },
    gym,
    ruleset: V1_RESEARCH,
    ...(b.daysSinceLastSession === undefined
      ? {}
      : { daysSinceLastSession: b.daysSinceLastSession }),
  });
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

describe('barrido de socios generados', () => {
  const r = rng(7);
  const elegir = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)] as T;
  const claves = Object.keys(DIM) as Clave[];
  const explosivo = V1_RESEARCH.explosive;

  const usoEx = new Map<string, number>();
  const usoEq = new Map<string, number>();
  const avisosPorPlan: number[] = [];
  const minutos = { total: 0, sobre: 0 };
  const violaciones: string[] = [];
  const sensibilidad = Object.fromEntries(claves.map((k) => [k, { mirados: 0, cambia: 0 }]));
  let items = 0;

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
    if (ex.isExplosive) chequearExplosivo(p, it, previo, ex.name);
  }

  function chequearExplosivo(
    p: Perfil,
    it: SessionItemBlueprint,
    previo: SessionItemBlueprint | undefined,
    nombre: string,
  ) {
    const id = JSON.stringify(p);
    if (it.supersetGroup === null || previo?.supersetGroup !== it.supersetGroup) {
      violaciones.push(`${nombre} suelto, sin su levantamiento: ${id}`);
    }
    if (p.molestia) violaciones.push(`${nombre} con una molestia declarada: ${id}`);
    if (explosivo && p.edad > explosivo.maxAge) violaciones.push(`${nombre} a los ${p.edad}`);
  }

  function medirSesion(p: Perfil, items: readonly SessionItemBlueprint[]) {
    // Estimación gruesa: cada serie son 40 s de trabajo más su descanso.
    const seg = items.reduce(
      (t, i) =>
        t +
        (i.targetDurationSeconds !== null
          ? i.targetSets * (i.targetDurationSeconds + (i.targetIntervalRestSeconds ?? 0))
          : i.targetSets * (i.restSeconds + 40)),
      0,
    );
    minutos.total += 1;
    if (seg / 60 > p.minutos * 1.15) minutos.sobre += 1;
  }

  for (let n = 0; n < N; n++) {
    const p = Object.fromEntries(claves.map((k) => [k, elegir(DIM[k].valores)])) as Perfil;
    const seed = Math.floor(r() * 1e9);
    const b = plan(p, seed);
    avisosPorPlan.push(b.warnings.length);
    for (const s of b.sessions) {
      if (s.items.length === 0) violaciones.push(`sesión vacía: ${JSON.stringify(p)}`);
      s.items.forEach((it, i) => {
        items += 1;
        chequearItem(p, it, s.items[i - 1]);
        usoEx.set(it.exerciseId, (usoEx.get(it.exerciseId) ?? 0) + 1);
        if (it.equipmentId) usoEq.set(it.equipmentId, (usoEq.get(it.equipmentId) ?? 0) + 1);
      });
      medirSesion(p, s.items);
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
      sesionesQuePasanLosMinutosDeclarados: `${pct(minutos.sobre, minutos.total)} %`,
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
