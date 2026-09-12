import type { Equipment, Exercise, Profile, SetLog, UserGoal } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import type { EngineContext, GymSnapshot, UserSnapshot } from './contract.ts';
import { V0_PLACEHOLDER, V1_RESEARCH } from './index.ts';
import { createPlaceholderEngine } from './placeholder-engine.ts';
import type { Ruleset } from './ruleset.ts';

const GYM_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000002';

const context: EngineContext = { now: '2026-09-04T10:00:00.000Z', seed: 42 };

function equipment(id: string, name: string, over: Partial<Equipment> = {}): Equipment {
  return {
    id,
    gymId: GYM_ID,
    name,
    category: 'selectorized',
    brand: null,
    model: null,
    photoUrl: null,
    locationNote: null,
    setupNotes: null,
    load: { unit: 'kg', min: 10, max: 200, increment: 5 },
    quantity: 1,
    isActive: true,
    ...over,
  };
}

function exercise(id: string, name: string, over: Partial<Exercise> = {}): Exercise {
  return {
    id,
    gymId: GYM_ID,
    name,
    pattern: 'squat',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    modality: 'reps_weight',
    isCompound: true,
    isUnilateral: false,
    isExplosive: false,
    skillLevel: 'beginner',
    cues: null,
    equipmentIds: [],
    ...over,
  };
}

/** Un gimnasio mínimo que cubre los patrones de la plantilla de cuerpo completo. */
function buildGym(): GymSnapshot {
  const prensa = equipment('eq-prensa', 'Prensa 45°');
  const pressBanco = equipment('eq-press', 'Press de banco', {
    load: { unit: 'lb', min: 20, max: 200, increment: 10 },
  });
  const remo = equipment('eq-remo', 'Remo sentado', {
    load: {
      unit: 'stack_level',
      min: 1,
      max: 12,
      increment: 1,
      stackKg: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60],
    },
  });
  const hombro = equipment('eq-hombro', 'Press de hombro');
  const camilla = equipment('eq-camilla', 'Camilla abdominal', {
    category: 'accessory',
    load: { unit: 'none' },
  });
  const pesoMuerto = equipment('eq-barra', 'Barra olímpica', {
    category: 'free_weight',
    load: { unit: 'plates_kg', min: 0, max: 200, increment: 2.5, baseWeightKg: 20 },
  });
  const dorsalera = equipment('eq-dorsalera', 'Dorsalera');
  const zancada = equipment('eq-mancuernas', 'Mancuernas', {
    category: 'free_weight',
    load: { unit: 'kg', min: 2, max: 40, increment: 2 },
  });

  return {
    gymId: GYM_ID,
    equipment: [prensa, pressBanco, remo, hombro, camilla, pesoMuerto, dorsalera, zancada],
    exercises: [
      exercise('ex-prensa', 'Prensa 45°', { pattern: 'squat', equipmentIds: ['eq-prensa'] }),
      exercise('ex-press', 'Press de banco', {
        pattern: 'horizontal_push',
        primaryMuscles: ['chest'],
        equipmentIds: ['eq-press'],
      }),
      exercise('ex-remo', 'Remo sentado', {
        pattern: 'horizontal_pull',
        primaryMuscles: ['back'],
        equipmentIds: ['eq-remo'],
      }),
      exercise('ex-hombro', 'Press de hombro', {
        pattern: 'vertical_push',
        primaryMuscles: ['front_delts'],
        equipmentIds: ['eq-hombro'],
      }),
      exercise('ex-abs', 'Abdominales en camilla', {
        pattern: 'core',
        primaryMuscles: ['abs'],
        modality: 'reps_bodyweight',
        isCompound: false,
        equipmentIds: ['eq-camilla'],
      }),
      exercise('ex-peso-muerto', 'Peso muerto rumano', {
        pattern: 'hinge',
        primaryMuscles: ['hamstrings', 'glutes'],
        equipmentIds: ['eq-barra'],
      }),
      exercise('ex-dorsalera', 'Dorsalera al pecho', {
        pattern: 'vertical_pull',
        primaryMuscles: ['lats'],
        equipmentIds: ['eq-dorsalera'],
      }),
      exercise('ex-zancada', 'Zancadas con mancuernas', {
        pattern: 'lunge',
        primaryMuscles: ['quads', 'glutes'],
        equipmentIds: ['eq-mancuernas'],
      }),
      exercise('ex-biceps', 'Curl de bíceps', {
        pattern: 'isolation',
        primaryMuscles: ['biceps'],
        isCompound: false,
        equipmentIds: ['eq-mancuernas'],
      }),
      // Alternativa al press de banco, para probar sustitución.
      exercise('ex-press-maquina', 'Press de pecho en máquina', {
        pattern: 'horizontal_push',
        primaryMuscles: ['chest'],
        equipmentIds: ['eq-hombro'],
      }),
    ],
    substitutions: [],
  };
}

function buildUser(over: Partial<UserSnapshot> = {}): UserSnapshot {
  const profile: Profile = {
    id: USER_ID,
    gymId: GYM_ID,
    displayName: 'Socio de prueba',
    birthDate: '1994-05-10',
    sex: 'male',
    experienceLevel: 'intermediate',
  };
  const goal: UserGoal = {
    goal: 'hypertrophy',
    sport: null,
    seasonPhase: 'none',
    priority: 1,
    sessionsPerWeekTarget: 3,
    sessionMinutesTarget: 60,
  };
  return { profile, goals: [goal], constraints: [], baselines: [], ...over };
}

function setLog(over: Partial<SetLog> & Pick<SetLog, 'workoutLogId' | 'completedAt'>): SetLog {
  return {
    id: `set-${over.workoutLogId}-${over.setIndex ?? 0}`,
    planSessionItemId: null,
    exerciseId: 'ex-prensa',
    equipmentId: 'eq-prensa',
    setIndex: 0,
    load: { value: 60, unit: 'kg' },
    loadKg: 60,
    reps: 10,
    repsTarget: 10,
    rir: 3,
    durationSeconds: null,
    distanceMeters: null,
    restPrescribedSeconds: 120,
    restActualSeconds: 110,
    isWarmup: false,
    clientId: `c-${over.workoutLogId}`,
    ...over,
  };
}

const engine = createPlaceholderEngine();

describe('generatePlan · variedad entre sesiones', () => {
  // `full_body_ab` pide `horizontal_pull` en la sesión A y también en la B.
  // Antes el set de "ya usados" se reiniciaba en cada sesión, así que las dos
  // recibían el MISMO ejercicio con el resto del catálogo sin tocar: en el
  // gimnasio real eso era remo con mancuerna dos veces por semana mientras el
  // remo sentado quedaba libre.
  it('un patrón que aparece en dos sesiones recibe ejercicios distintos', () => {
    const gym = buildGym();
    const conDosRemos = {
      ...gym,
      exercises: [
        ...gym.exercises,
        exercise('ex-remo-mancuerna', 'Remo con mancuerna', {
          pattern: 'horizontal_pull',
          primaryMuscles: ['back'],
          equipmentIds: ['eq-barra'],
        }),
      ],
    };

    // Varias semillas a propósito: con dos candidatos, `pickDeterministic`
    // elige uno según el rng, así que UNA semilla puede dar ejercicios
    // distintos por casualidad y no porque la preferencia exista. Si la
    // variedad es de verdad, tiene que valer para todas.
    for (let seed = 1; seed <= 12; seed += 1) {
      const plan = engine.generatePlan({
        context: { ...context, seed },
        user: buildUser(),
        gym: conDosRemos,
        ruleset: V0_PLACEHOLDER,
      });

      // Las dos primeras sesiones de la cola son A y B de la plantilla.
      const [a, b] = plan.sessions;
      const remoDeA = a?.items.find((i) => i.exerciseId.startsWith('ex-remo'));
      const remoDeB = b?.items.find((i) => i.exerciseId.startsWith('ex-remo'));

      expect(remoDeA, `semilla ${seed}`).toBeDefined();
      expect(remoDeB, `semilla ${seed}`).toBeDefined();
      expect(remoDeA?.exerciseId, `semilla ${seed}`).not.toBe(remoDeB?.exerciseId);
    }
  });

  it('con un solo ejercicio para el patrón, se repite antes que dejar el slot vacío', () => {
    // La variedad es preferencia, no requisito: el gimnasio de prueba tiene un
    // único `horizontal_pull`, y el plan tiene que cubrir el patrón igual.
    const plan = engine.generatePlan({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V0_PLACEHOLDER,
    });

    const [a, b] = plan.sessions;
    expect(a?.items.some((i) => i.exerciseId === 'ex-remo')).toBe(true);
    expect(b?.items.some((i) => i.exerciseId === 'ex-remo')).toBe(true);
  });
});

describe('generatePlan · variedad entre socios', () => {
  const conSeleccion: Ruleset = {
    ...V0_PLACEHOLDER,
    selection: { minPoolSize: 3, levelTolerance: 1, confidence: 'low' },
  };

  /** Tres sentadillas cargables, una por nivel, cada una en su propia estación. */
  function gymConTresSentadillas(): GymSnapshot {
    const gym = buildGym();
    return {
      ...gym,
      equipment: [
        ...gym.equipment,
        equipment('eq-smith', 'Máquina Smith'),
        equipment('eq-hack', 'Sentadilla hack'),
      ],
      exercises: [
        ...gym.exercises,
        exercise('ex-smith', 'Sentadilla en Smith', {
          skillLevel: 'novice',
          equipmentIds: ['eq-smith'],
        }),
        exercise('ex-hack', 'Sentadilla hack', {
          skillLevel: 'intermediate',
          equipmentIds: ['eq-hack'],
        }),
      ],
    };
  }

  function sentadillasElegidas(gym: GymSnapshot, ruleset: Ruleset): Set<string> {
    const elegidas = new Set<string>();
    // Cada socio genera su plan con su propia semilla. Con una sola semilla no
    // se puede distinguir "el motor varía" de "esta semilla tuvo suerte".
    for (let seed = 1; seed <= 12; seed += 1) {
      const plan = engine.generatePlan({
        context: { ...context, seed },
        user: buildUser(),
        gym,
        ruleset,
      });
      for (const item of plan.sessions.flatMap((s) => s.items)) {
        if (['ex-prensa', 'ex-smith', 'ex-hack'].includes(item.exerciseId)) {
          elegidas.add(item.exerciseId);
        }
      }
    }
    return elegidas;
  }

  // Antes se colapsaba al nivel MÁS ALTO del pool: todo socio intermedio recibía
  // la única sentadilla `intermediate` y las otras dos no se usaban nunca. En el
  // gimnasio real eso mandaba al 60% de los socios al mismo rack.
  it('no manda a todos los socios del mismo nivel al mismo ejercicio', () => {
    const elegidas = sentadillasElegidas(gymConTresSentadillas(), conSeleccion);
    expect(elegidas.size).toBeGreaterThan(1);
  });

  /**
   * EL PISO TIENE QUE CUIDAR AL POOL CHICO, QUE ES DONDE DUELE
   *
   * La guarda de `preferSoft` era `list.length > floor && kept.length < floor`.
   * Con `minPoolSize` 3, un pool de **2** no entraba nunca (2 > 3 es falso) y el
   * filtro lo colapsaba a 1 sin ninguna protección: el piso cuidaba los pools
   * grandes —que no lo necesitan— y dejaba sin cuidar a los chicos.
   *
   * Medido sobre el catálogo real con 30 socios del mismo perfil: el tirón
   * horizontal queda en 2 candidatos después de filtrar por modalidad y por
   * compuestos, la tolerancia de nivel dejaba 1, y **el 100% de los socios
   * intermedios hacía remo con mancuerna a una mano, en las dos sesiones de la
   * semana**, con el remo sentado disponible y sin usar. Después del arreglo:
   * 37% / 33% / 30% entre tres remos.
   *
   * Acá se reproduce con dos sentadillas, que es el mínimo para exponerlo: tres
   * ya entraban por la guarda vieja.
   */
  it('con solo dos candidatos tampoco manda a todos al mismo', () => {
    const gym = buildGym();
    const conDos: GymSnapshot = {
      ...gym,
      equipment: [...gym.equipment, equipment('eq-hack', 'Sentadilla hack')],
      exercises: [
        // `ex-prensa` ya es `squat` de nivel beginner: a un intermedio con
        // tolerancia 1 le queda fuera (2 - 0 = 2 > 1).
        ...gym.exercises,
        exercise('ex-hack', 'Sentadilla hack', {
          skillLevel: 'intermediate',
          equipmentIds: ['eq-hack'],
        }),
      ],
    };

    const elegidas = new Set<string>();
    for (let seed = 1; seed <= 12; seed += 1) {
      const plan = engine.generatePlan({
        context: { ...context, seed },
        user: buildUser(),
        gym: conDos,
        ruleset: conSeleccion,
      });
      for (const item of plan.sessions.flatMap((s) => s.items)) {
        if (item.exerciseId === 'ex-prensa' || item.exerciseId === 'ex-hack') {
          elegidas.add(item.exerciseId);
        }
      }
    }

    expect(elegidas.size, `doce socios recibieron ${[...elegidas].join(', ')}`).toBe(2);
  });

  // Hacia arriba la tolerancia no afloja nada: proponerle a un principiante un
  // ejercicio que exige más técnica de la que tiene es justo lo que el filtro de
  // seguridad existe para evitar.
  it('nunca propone un ejercicio por encima del nivel de la persona', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const plan = engine.generatePlan({
        context: { ...context, seed },
        user: buildUser({
          profile: { ...buildUser().profile, experienceLevel: 'beginner' },
        }),
        gym: gymConTresSentadillas(),
        ruleset: conSeleccion,
      });
      const ids = plan.sessions.flatMap((s) => s.items).map((i) => i.exerciseId);
      expect(ids, `semilla ${seed}`).not.toContain('ex-smith');
      expect(ids, `semilla ${seed}`).not.toContain('ex-hack');
    }
  });

  // Las estaciones de un mismo ejercicio son intercambiables, pero se elegía
  // siempre la primera de la lista: dos ejercicios distintos que comparten
  // estaciones caían los dos en la misma máquina. Era la causa del 87% de
  // socios con el mismo Lat Pulldown en el plan.
  it('reparte entre las estaciones que sirven para el mismo ejercicio', () => {
    const gym = buildGym();
    const conDosDorsaleras: GymSnapshot = {
      ...gym,
      equipment: [...gym.equipment, equipment('eq-dorsalera-2', 'Dual Lat Pulldown')],
      exercises: gym.exercises.map((e) =>
        e.id === 'ex-dorsalera' ? { ...e, equipmentIds: ['eq-dorsalera', 'eq-dorsalera-2'] } : e,
      ),
    };

    const estaciones = new Set<string | null>();
    for (let seed = 1; seed <= 12; seed += 1) {
      const plan = engine.generatePlan({
        context: { ...context, seed },
        user: buildUser(),
        gym: conDosDorsaleras,
        ruleset: conSeleccion,
      });
      for (const item of plan.sessions.flatMap((s) => s.items)) {
        if (item.exerciseId === 'ex-dorsalera') estaciones.add(item.equipmentId);
      }
    }

    expect(estaciones.size).toBeGreaterThan(1);
  });
});

describe('generatePlan', () => {
  it('arma la cola completa que pide el ruleset', () => {
    const plan = engine.generatePlan({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V0_PLACEHOLDER,
    });

    expect(plan.sessions).toHaveLength(V0_PLACEHOLDER.planning.sessionsAhead);
    expect(plan.sessions[0]?.sequenceIndex).toBe(0);
    expect(plan.sessions[0]?.items.length).toBeGreaterThan(0);
  });

  it('marca todo como provisorio mientras el ruleset sea placeholder', () => {
    const plan = engine.generatePlan({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V0_PLACEHOLDER,
    });

    expect(plan.source).toBe('placeholder');
    expect(plan.sessions.every((s) => s.items.every((i) => i.isPlaceholder))).toBe(true);
    expect(plan.warnings.some((w) => w.includes('provisorio'))).toBe(true);
  });

  it('es determinista: mismo input y misma semilla, mismo plan', () => {
    const args = { context, user: buildUser(), gym: buildGym(), ruleset: V0_PLACEHOLDER };
    expect(JSON.stringify(engine.generatePlan(args))).toBe(
      JSON.stringify(engine.generatePlan(args)),
    );
  });

  it('usa el mismo ejercicio cada vez que vuelve una sesión, para poder medir progreso', () => {
    const plan = engine.generatePlan({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V0_PLACEHOLDER,
    });
    const primera = plan.sessions[0];
    const repeticion = plan.sessions.find((s) => s.sequenceIndex > 0 && s.label === primera?.label);

    expect(repeticion?.items.map((i) => i.exerciseId)).toEqual(
      primera?.items.map((i) => i.exerciseId),
    );
  });

  it('nunca propone un ejercicio bloqueado por una restricción del usuario', () => {
    const plan = engine.generatePlan({
      context,
      user: buildUser({
        constraints: [
          {
            type: 'avoid_exercise',
            bodyRegion: 'knee',
            exerciseId: 'ex-prensa',
            equipmentId: null,
            severity: 4,
          },
        ],
      }),
      gym: buildGym(),
      ruleset: V0_PLACEHOLDER,
    });

    const todos = plan.sessions.flatMap((s) => s.items.map((i) => i.exerciseId));
    expect(todos).not.toContain('ex-prensa');
  });

  it('avisa cuando el gimnasio no cubre un patrón en vez de inventar un ejercicio', () => {
    const gym = buildGym();
    const plan = engine.generatePlan({
      context,
      user: buildUser(),
      gym: { ...gym, exercises: gym.exercises.filter((e) => e.pattern !== 'core') },
      ruleset: V0_PLACEHOLDER,
    });

    // En castellano: este test decía `includes('core')` y por eso el aviso pudo
    // interpolar el identificador interno durante meses sin que nada avisara.
    const aviso = plan.warnings.find((w) => w.includes('zona media'));
    expect(aviso, 'no avisó del patrón sin cubrir').toBeDefined();
    // Y dice cuál de las causas es: acá el catálogo directamente no lo tiene.
    expect(aviso).toContain('el catálogo del gimnasio no tiene ninguno');
  });

  /**
   * El catálogo real recién relevado, o borrado por `npm run db:reset` sin
   * volver a cargar `db:catalog` (trampa documentada en `CLAUDE.md`): el
   * motor no puede tirar una excepción solo porque todavía no hay máquinas
   * cargadas. `docs/research/30-el-orden-del-historial.md` lo medía como
   * "no construido"; `Hoy.tsx` ya tiene `DiaVacio` para el lado de la app, y
   * esto fija el lado del motor para que no se rompa en el próximo cambio.
   */
  it('con el catálogo vacío arma la cola completa, vacía, y avisa sin repetirse por sesión', () => {
    const gym = buildGym();
    const plan = engine.generatePlan({
      context,
      user: buildUser(),
      gym: { ...gym, equipment: [], exercises: [] },
      ruleset: V1_RESEARCH,
    });

    expect(plan.sessions).toHaveLength(V1_RESEARCH.planning.sessionsAhead);
    expect(plan.sessions.every((s) => s.items.length === 0)).toBe(true);

    // Ocho sesiones alternan A/B: un aviso por patrón sin cubrir en CADA
    // sesión de la cola daría 40, no 10. Deduplicar por etiqueta de sesión es
    // lo que evita que un catálogo vacío se lea como un error del motor.
    expect(plan.warnings).toHaveLength(10);
    expect(new Set(plan.warnings).size).toBe(plan.warnings.length);
  });

  it('respeta el escalón de la máquina al proponer la carga inicial', () => {
    const plan = engine.generatePlan({
      context,
      user: buildUser({
        baselines: [
          {
            exerciseId: 'ex-prensa',
            source: 'declared',
            load: { value: 63, unit: 'kg' }, // la prensa sube de a 5
            reps: 10,
            recordedAt: '2026-09-01T10:00:00.000Z',
          },
        ],
      }),
      gym: buildGym(),
      ruleset: V0_PLACEHOLDER,
    });

    const item = plan.sessions.flatMap((s) => s.items).find((i) => i.exerciseId === 'ex-prensa');
    expect(item?.targetLoad).toEqual({ value: 65, unit: 'kg' });
  });
});

describe('reviewProgress', () => {
  const plan = {
    id: 'plan-1',
    userId: USER_ID,
    gymId: GYM_ID,
    rulesetVersion: 'v0-placeholder',
    generatedAt: context.now,
    status: 'active' as const,
  };

  it('propone subir cuando sobran repeticiones dos sesiones seguidas', () => {
    const history: SetLog[] = [
      setLog({ workoutLogId: 'w2', completedAt: '2026-09-03T10:00:00.000Z', rir: 3 }),
      setLog({ workoutLogId: 'w1', completedAt: '2026-09-01T10:00:00.000Z', rir: 4 }),
    ];

    const [proposal] = engine.reviewProgress({
      context,
      user: buildUser(),
      gym: buildGym(),
      plan,
      history,
      resolvedProposals: [],
      ruleset: V0_PLACEHOLDER,
    });

    expect(proposal?.type).toBe('load_increase');
    expect(proposal?.reasonCode).toBe('rir_above_target');
    expect(proposal?.toValue).toBe('65'); // 60 + 2.5% ajustado al escalón de 5
  });

  it('no repite una propuesta que ya se aceptó y todavía no se entrenó', () => {
    const history: SetLog[] = [
      setLog({ workoutLogId: 'w2', completedAt: '2026-09-03T10:00:00.000Z', rir: 3 }),
      setLog({ workoutLogId: 'w1', completedAt: '2026-09-01T10:00:00.000Z', rir: 4 }),
    ];

    const proposals = engine.reviewProgress({
      context,
      user: buildUser(),
      gym: buildGym(),
      plan,
      history,
      // Mismo ejercicio, mismo destino: la persona ya dijo que sí. Volver a
      // preguntarlo antes de que entrene con 65 es repetir la pregunta.
      resolvedProposals: [
        {
          id: 'p-1',
          userId: USER_ID,
          planId: 'plan-1',
          type: 'load_increase',
          targetRef: { exerciseId: 'ex-prensa' },
          fromValue: '60',
          toValue: '65',
          reasonCode: 'rir_above_target',
          reasonText: '',
          rulesetVersion: 'v0-placeholder',
          loadUnit: 'kg',
          status: 'accepted',
          createdAt: '2026-09-01T10:00:00.000Z',
          resolvedAt: '2026-09-01T10:05:00.000Z',
        },
      ],
      ruleset: V0_PLACEHOLDER,
    });

    expect(proposals.filter((p) => p.type === 'load_increase')).toHaveLength(0);
  });

  it('no propone subir una serie sin carga anotada: no hay desde dónde', () => {
    const history: SetLog[] = [
      setLog({
        workoutLogId: 'w2',
        completedAt: '2026-09-03T10:00:00.000Z',
        rir: 4,
        load: null,
        loadKg: null,
      }),
      setLog({
        workoutLogId: 'w1',
        completedAt: '2026-09-01T10:00:00.000Z',
        rir: 4,
        load: null,
        loadKg: null,
      }),
    ];

    const proposals = engine.reviewProgress({
      context,
      user: buildUser(),
      gym: buildGym(),
      plan,
      history,
      resolvedProposals: [],
      ruleset: V0_PLACEHOLDER,
    });

    expect(proposals.filter((p) => p.type === 'load_increase')).toHaveLength(0);
  });

  it('no propone nada si el RIR está en el objetivo', () => {
    const history: SetLog[] = [
      setLog({ workoutLogId: 'w2', completedAt: '2026-09-03T10:00:00.000Z', rir: 1 }),
      setLog({ workoutLogId: 'w1', completedAt: '2026-09-02T10:00:00.000Z', rir: 2 }),
    ];

    const proposals = engine.reviewProgress({
      context,
      user: buildUser(),
      gym: buildGym(),
      plan,
      history,
      resolvedProposals: [],
      ruleset: V0_PLACEHOLDER,
    });

    expect(proposals.filter((p) => p.type === 'load_increase')).toHaveLength(0);
  });

  it('propone descarga después de una ausencia larga', () => {
    const history: SetLog[] = [
      setLog({ workoutLogId: 'w1', completedAt: '2026-08-01T10:00:00.000Z', rir: 1 }),
    ];

    const proposals = engine.reviewProgress({
      context,
      user: buildUser(),
      gym: buildGym(),
      plan,
      history,
      resolvedProposals: [],
      ruleset: V0_PLACEHOLDER,
    });

    expect(proposals.some((p) => p.reasonCode === 'absence')).toBe(true);
  });

  it('no vuelve a proponer lo que el usuario ya rechazó', () => {
    const history: SetLog[] = [
      setLog({ workoutLogId: 'w2', completedAt: '2026-09-03T10:00:00.000Z', rir: 4 }),
      setLog({ workoutLogId: 'w1', completedAt: '2026-09-02T10:00:00.000Z', rir: 4 }),
    ];

    const proposals = engine.reviewProgress({
      context,
      user: buildUser(),
      gym: buildGym(),
      plan,
      history,
      resolvedProposals: [
        {
          id: 'p-1',
          userId: USER_ID,
          planId: 'plan-1',
          type: 'load_increase',
          targetRef: { exerciseId: 'ex-prensa' },
          fromValue: '60',
          toValue: '65',
          reasonCode: 'rir_above_target',
          reasonText: '',
          rulesetVersion: 'v0-placeholder',
          loadUnit: 'kg',
          status: 'rejected',
          createdAt: '2026-09-01T10:00:00.000Z',
          resolvedAt: '2026-09-01T10:05:00.000Z',
        },
      ],
      ruleset: V0_PLACEHOLDER,
    });

    expect(proposals.filter((p) => p.targetRef.exerciseId === 'ex-prensa')).toHaveLength(0);
  });
});

describe('findSubstitutes', () => {
  it('ofrece un ejercicio del mismo patrón cuando la máquina está ocupada', () => {
    const options = engine.findSubstitutes({
      context,
      item: { exerciseId: 'ex-press', equipmentId: 'eq-press' },
      gym: buildGym(),
      constraints: [],
      unavailableEquipmentIds: ['eq-press'],
      ruleset: V0_PLACEHOLDER,
    });

    expect(options.map((o) => o.exerciseId)).toContain('ex-press-maquina');
    expect(options[0]?.equipmentId).not.toBe('eq-press');
  });

  it('no ofrece nada que use una estación ocupada', () => {
    const options = engine.findSubstitutes({
      context,
      item: { exerciseId: 'ex-press', equipmentId: 'eq-press' },
      gym: buildGym(),
      constraints: [],
      unavailableEquipmentIds: ['eq-press', 'eq-hombro'],
      ruleset: V0_PLACEHOLDER,
    });

    expect(options.every((o) => o.equipmentId !== 'eq-hombro')).toBe(true);
  });

  it('respeta las restricciones del usuario al sugerir reemplazos', () => {
    const options = engine.findSubstitutes({
      context,
      item: { exerciseId: 'ex-press', equipmentId: 'eq-press' },
      gym: buildGym(),
      constraints: [
        {
          type: 'avoid_exercise',
          bodyRegion: 'shoulder',
          exerciseId: 'ex-press-maquina',
          equipmentId: null,
          severity: 3,
        },
      ],
      unavailableEquipmentIds: ['eq-press'],
      ruleset: V0_PLACEHOLDER,
    });

    expect(options.map((o) => o.exerciseId)).not.toContain('ex-press-maquina');
  });

  it('marca `curated` en la opción que viene de gym.substitutions, no en las calculadas', () => {
    const gym = buildGym();
    const gymConSustitucion = {
      ...gym,
      substitutions: [
        { exerciseId: 'ex-press', substituteId: 'ex-press-maquina', equivalence: 0.95, note: null },
      ],
    };

    const options = engine.findSubstitutes({
      context,
      item: { exerciseId: 'ex-press', equipmentId: 'eq-press' },
      gym: gymConSustitucion,
      constraints: [],
      unavailableEquipmentIds: ['eq-press'],
      ruleset: V0_PLACEHOLDER,
    });

    const curada = options.find((o) => o.exerciseId === 'ex-press-maquina');
    expect(curada?.curated).toBe(true);
    expect(curada?.equivalence).toBe(0.95);
    expect(
      options.filter((o) => o.exerciseId !== 'ex-press-maquina').every((o) => !o.curated),
    ).toBe(true);
  });

  it('una equivalencia curada por debajo de minEquivalence igual se ofrece: el piso es del cálculo automático', () => {
    const gym = buildGym();
    // v0-placeholder.substitution.minEquivalence es 0.5: 0.3 automático nunca
    // pasaría el filtro, pero acá es una decisión explícita del staff.
    const gymConEquivalenciaBaja = {
      ...gym,
      substitutions: [
        { exerciseId: 'ex-press', substituteId: 'ex-press-maquina', equivalence: 0.3, note: null },
      ],
    };

    const options = engine.findSubstitutes({
      context,
      item: { exerciseId: 'ex-press', equipmentId: 'eq-press' },
      gym: gymConEquivalenciaBaja,
      constraints: [],
      unavailableEquipmentIds: ['eq-press'],
      ruleset: V0_PLACEHOLDER,
    });

    const curada = options.find((o) => o.exerciseId === 'ex-press-maquina');
    expect(curada?.curated).toBe(true);
    expect(curada?.equivalence).toBe(0.3);
  });

  it('usa la nota del staff como motivo cuando existe, en vez del texto genérico', () => {
    const gym = buildGym();
    const gymConNota = {
      ...gym,
      substitutions: [
        {
          exerciseId: 'ex-press',
          substituteId: 'ex-press-maquina',
          equivalence: 0.95,
          note: 'Misma demanda en pecho y hombro, sin comprometer la muñeca.',
        },
      ],
    };

    const options = engine.findSubstitutes({
      context,
      item: { exerciseId: 'ex-press', equipmentId: 'eq-press' },
      gym: gymConNota,
      constraints: [],
      unavailableEquipmentIds: ['eq-press'],
      ruleset: V0_PLACEHOLDER,
    });

    const curada = options.find((o) => o.exerciseId === 'ex-press-maquina');
    expect(curada?.reason).toBe('Misma demanda en pecho y hombro, sin comprometer la muñeca.');
  });

  it('sin nota, la equivalencia curada cae al texto genérico de "cargado a mano"', () => {
    const gym = buildGym();
    const gymSinNota = {
      ...gym,
      substitutions: [
        { exerciseId: 'ex-press', substituteId: 'ex-press-maquina', equivalence: 0.95, note: null },
      ],
    };

    const options = engine.findSubstitutes({
      context,
      item: { exerciseId: 'ex-press', equipmentId: 'eq-press' },
      gym: gymSinNota,
      constraints: [],
      unavailableEquipmentIds: ['eq-press'],
      ruleset: V0_PLACEHOLDER,
    });

    const curada = options.find((o) => o.exerciseId === 'ex-press-maquina');
    expect(curada?.reason).toContain('cargado a mano');
  });
});

describe('deporte, temporada y día de partido', () => {
  const conDeporte: Ruleset = {
    ...V0_PLACEHOLDER,
    selection: { minPoolSize: 3, levelTolerance: 1, confidence: 'low' },
    sports: {
      categories: {
        local_gesture: { label: 'Gesto', hasMatches: true, volumeMultiplier: 1, note: 'gesto' },
        global_endurance: {
          label: 'Resistencia',
          hasMatches: false,
          volumeMultiplier: 0.8,
          note: 'resistencia',
        },
        strength_contact: {
          label: 'Fuerza',
          hasMatches: true,
          volumeMultiplier: 1,
          note: 'fuerza',
        },
        recreational: { label: 'Nada', hasMatches: false, volumeMultiplier: 1, note: 'nada' },
      },
      catalog: [
        { id: 'boxeo', label: 'Boxeo', category: 'local_gesture', emphasis: ['front_delts'] },
        { id: 'running', label: 'Running', category: 'global_endurance', emphasis: [] },
      ],
      seasonPhases: {
        preseason: { label: 'Pre', volumeMultiplier: 1, note: 'pre' },
        in_season: { label: 'En temporada', volumeMultiplier: 0.5, note: 'en temporada' },
        off_season: { label: 'Off', volumeMultiplier: 1, note: 'off' },
        none: { label: 'No compite', volumeMultiplier: 1, note: 'no compite' },
      },
      matchDay: {
        normal: {
          label: 'Normal',
          lowerBodyVolumeMultiplier: 1,
          upperBodyVolumeMultiplier: 1,
          avoidExplosive: false,
          note: 'normal',
        },
        day_after: {
          label: 'Ayer',
          lowerBodyVolumeMultiplier: 0.5,
          upperBodyVolumeMultiplier: 1,
          avoidExplosive: true,
          note: 'jugaste ayer',
        },
        two_days_after: {
          label: 'Anteayer',
          lowerBodyVolumeMultiplier: 0.8,
          upperBodyVolumeMultiplier: 1,
          avoidExplosive: true,
          note: 'anteayer',
        },
        day_before: {
          label: 'Mañana',
          lowerBodyVolumeMultiplier: 0.5,
          upperBodyVolumeMultiplier: 1,
          avoidExplosive: true,
          note: 'jugás mañana',
        },
        match_day: {
          label: 'Hoy',
          lowerBodyVolumeMultiplier: 0,
          upperBodyVolumeMultiplier: 0.5,
          avoidExplosive: true,
          note: 'jugás hoy',
        },
      },
      confidence: 'low',
    },
  };

  const userCon = (sport: string | null, seasonPhase: 'none' | 'in_season') => {
    const base = buildUser();
    const goal = base.goals[0];
    if (!goal) throw new Error('El usuario de prueba no tiene objetivo.');
    return buildUser({ goals: [{ ...goal, sport, seasonPhase }] });
  };

  const totalSeries = (items: readonly { targetSets: number }[]) =>
    items.reduce((a, i) => a + i.targetSets, 0);

  const planCon = (sport: string | null, phase: 'none' | 'in_season') =>
    engine.generatePlan({
      context,
      user: userCon(sport, phase),
      gym: buildGym(),
      ruleset: conDeporte,
    });

  it('el momento de la temporada baja el volumen', () => {
    const enTemporada = totalSeries(planCon('boxeo', 'in_season').sessions.flatMap((s) => s.items));
    const fuera = totalSeries(planCon('boxeo', 'none').sessions.flatMap((s) => s.items));
    expect(enTemporada).toBeLessThan(fuera);
  });

  // El nulo de pesado-vs-liviano (SMD -0,03, I² = 0%) no deja que el deporte
  // toque la carga ni las repeticiones: solo puede mover series y selección.
  it('el deporte no cambia repeticiones ni RIR', () => {
    const firma = (sport: string | null) =>
      planCon(sport, 'none')
        .sessions.flatMap((s) => s.items)
        .map((i) => `${i.targetRepsMin}-${i.targetRepsMax}/${i.targetRir}`)
        .join(',');
    expect(firma('boxeo')).toBe(firma(null));
  });

  it('un deporte que el ruleset no conoce avisa en vez de ignorarse en silencio', () => {
    const plan = planCon('quidditch', 'none');
    expect(plan.warnings.some((w) => w.includes('quidditch'))).toBe(true);
  });

  describe('adjustSession', () => {
    const items = () => {
      const primera = planCon('boxeo', 'none').sessions[0];
      if (!primera) throw new Error('El plan de prueba no tiene sesiones.');
      return primera.items;
    };

    it('un día normal no toca nada', () => {
      const original = items();
      const out = engine.adjustSession({
        items: original,
        gym: buildGym(),
        state: 'normal',
        ruleset: conDeporte,
      });
      expect(out.changed).toBe(false);
      expect(out.note).toBeNull();
      expect(totalSeries(out.items)).toBe(totalSeries(original));
    });

    it('el día después del partido recorta, y no menos que dos días después', () => {
      const original = items();
      const gym = buildGym();
      const ayer = engine.adjustSession({
        items: original,
        gym,
        state: 'day_after',
        ruleset: conDeporte,
      });
      const anteayer = engine.adjustSession({
        items: original,
        gym,
        state: 'two_days_after',
        ruleset: conDeporte,
      });

      expect(totalSeries(ayer.items)).toBeLessThan(totalSeries(original));
      expect(totalSeries(ayer.items)).toBeLessThanOrEqual(totalSeries(anteayer.items));
      expect(ayer.note).toContain('jugaste ayer');
    });

    it('el día del partido saca la pierna y deja el resto liviano', () => {
      const gym = buildGym();
      const out = engine.adjustSession({
        items: items(),
        gym,
        state: 'match_day',
        ruleset: conDeporte,
      });

      const pierna = new Set(
        gym.exercises
          .filter((e) =>
            e.primaryMuscles.some((m) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m)),
          )
          .map((e) => e.id),
      );
      expect(out.items.some((i) => pierna.has(i.exerciseId))).toBe(false);
      expect(out.items.length).toBeGreaterThan(0);
    });

    it('saca el trabajo explosivo cuando la regla lo pide', () => {
      const gym = buildGym();
      const conSalto: GymSnapshot = {
        ...gym,
        exercises: gym.exercises.map((e) =>
          e.id === 'ex-prensa' ? { ...e, isExplosive: true } : e,
        ),
      };
      const out = engine.adjustSession({
        items: items(),
        gym: conSalto,
        state: 'day_after',
        ruleset: conDeporte,
      });
      expect(out.items.some((i) => i.exerciseId === 'ex-prensa')).toBe(false);
    });

    // Un ruleset viejo, sin bloque `sports`, no puede romper la sesión de hoy.
    it('sin bloque de deportes en el ruleset, no cambia nada', () => {
      const original = items();
      const out = engine.adjustSession({
        items: original,
        gym: buildGym(),
        state: 'day_after',
        ruleset: V0_PLACEHOLDER,
      });
      expect(out.changed).toBe(false);
      expect(out.items).toBe(original);
    });
  });
});

/**
 * Lesión aguda contra dolor crónico. Ver `docs/research/17-lesion-aguda.md`.
 *
 * Antes de esta iteración el motor colapsaba los dos tipos en un `||`, así que
 * un esguince de ayer y una molestia de meses producían el mismo plan y el mismo
 * mensaje — incluido el que autoriza a cargar hasta 5 sobre 10, que sale de
 * literatura de dolor crónico.
 */
describe('lesión declarada contra dolor de arrastre', () => {
  const engine = createPlaceholderEngine();

  function planCon(type: 'injury' | 'pain', severity: number) {
    return engine.generatePlan({
      context,
      user: buildUser({
        constraints: [
          { type, bodyRegion: 'lower_back', exerciseId: null, equipmentId: null, severity },
        ],
      }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });
  }

  it('una lesión no recibe el permiso de cargar con dolor que sale del dolor crónico', () => {
    const monitoring = V1_RESEARCH.safety?.painMonitoring.text as string;
    const lesion = planCon('injury', 3);
    const dolor = planCon('pain', 3);

    expect(dolor.warnings).toContain(monitoring);
    expect(lesion.warnings).not.toContain(monitoring);
  });

  it('una lesión recibe en su lugar la nota de lesión', () => {
    const nota = V1_RESEARCH.safety?.acuteInjury.note as string;
    expect(planCon('injury', 3).warnings).toContain(nota);
    expect(planCon('pain', 3).warnings).not.toContain(nota);
  });

  it('a una lesión no se le dice "molestia"', () => {
    expect(planCon('injury', 3).warnings.some((w) => w.startsWith('Por la lesión en'))).toBe(true);
    expect(planCon('pain', 3).warnings.some((w) => w.startsWith('Por la molestia en'))).toBe(true);
  });

  it('en el tramo de en medio la lesión saca el patrón y el dolor crónico lo mantiene', () => {
    // Severidad 3 en lumbar: `monitorFrom` 3, `avoidFrom` 4. El dolor crónico
    // conserva el `hinge` a propósito —sacarlo ataca la exposición, que es lo
    // que las fuentes señalan como determinante—; la lesión no tiene detrás
    // ninguna evidencia que sostenga eso.
    const patrones = (plan: ReturnType<typeof planCon>) =>
      plan.sessions.flatMap((s) => s.items.map((i) => i.exerciseId));

    expect(patrones(planCon('pain', 3))).toContain('ex-peso-muerto');
    expect(patrones(planCon('injury', 3))).not.toContain('ex-peso-muerto');
  });

  it('con severidad por debajo del umbral de monitoreo la lesión no cambia nada', () => {
    // El piso conservador arranca en `monitorFrom`, no antes: una lesión leve
    // que ni siquiera dispara el aviso tampoco puede vaciar el plan.
    expect(JSON.stringify(planCon('injury', 2))).toEqual(JSON.stringify(planCon('pain', 2)));
  });
});

/**
 * UNA MOLESTIA CAMBIA QUÉ SE ENTRENA, NO SI SE ENTRENA
 *
 * El motor dejaba el slot vacío y explicaba por qué. Ahora busca en el catálogo
 * trabajo que mueva los músculos que el patrón bloqueado cubría, sin tocar la
 * zona. Lo que se fija acá son las dos garantías que hacen que eso no sea peor
 * que el hueco: que el sustituto **nunca** puede ser algo que la molestia
 * prohibió, y que se elige por los músculos que definen al patrón y no por uno
 * que aparece en un solo ejercicio.
 */
describe('sustitución por molestia', () => {
  const engine = createPlaceholderEngine();

  /**
   * Un gimnasio donde la sentadilla tiene un ejercicio raro.
   *
   * `ex-wall-ball` declara `front_delts` además de lo de siempre. Es el caso
   * del catálogo real —de las ocho sentadillas de Blue Horse, el wall ball es
   * la única que los lista— y es lo que hacía que el motor ofreciera un press
   * de hombro como reemplazo de la sentadilla.
   */
  function gimnasioConRareza(): GymSnapshot {
    const base = buildGym();
    return {
      ...base,
      exercises: [
        ...base.exercises,
        exercise('ex-sentadilla', 'Sentadilla', {
          pattern: 'squat',
          primaryMuscles: ['quads', 'glutes'],
          equipmentIds: ['eq-prensa'],
        }),
        exercise('ex-wall-ball', 'Wall ball', {
          pattern: 'squat',
          primaryMuscles: ['quads', 'glutes', 'front_delts', 'abs'],
          equipmentIds: ['eq-prensa'],
        }),
        // El impostor. Con la unión ingenua de músculos le gana a la patada de
        // glúteo —toca dos de los "músculos de la sentadilla" contra uno— y el
        // motor termina ofreciendo hombro donde iba pierna. Va sin usar en
        // ningún slot a propósito: el primer intento de este test puso uno que
        // ya estaba elegido en el slot de empuje vertical, así que `used` lo
        // descartaba antes de llegar acá y el test pasaba en verde con el bug
        // puesto.
        exercise('ex-hombro-mancuernas', 'Press de hombro con mancuernas', {
          pattern: 'vertical_push',
          primaryMuscles: ['front_delts', 'abs'],
          equipmentIds: ['eq-mancuernas'],
        }),
        // Glúteo puro, sin cargar la rodilla: el reemplazo que tiene sentido.
        exercise('ex-patada-gluteo', 'Patada de glúteo', {
          pattern: 'isolation',
          primaryMuscles: ['glutes'],
          isCompound: false,
          equipmentIds: ['eq-hombro'],
        }),
        /*
         * El señuelo balístico.
         *
         * Va de `carry` porque es el único patrón sin slot en la plantilla: un
         * señuelo que tiene slot propio se lo queda, entra en `used` y deja de
         * ser candidato a complemento — o sea que el test pasa en verde con el
         * bug puesto. Ya pasó dos veces en este archivo (el press de hombro, y
         * una primera versión de este mismo con patrón `hinge`).
         *
         * Y lleva `glutes` sin `quads`: la regla de rodilla bloquea el
         * cuádriceps, así que un señuelo con cuádriceps nunca llega al pool y
         * tampoco prueba nada.
         */
        exercise('ex-slam-ball', 'Slam ball', {
          pattern: 'carry',
          primaryMuscles: ['glutes', 'hamstrings'],
          isExplosive: true,
          equipmentIds: ['eq-mancuernas'],
        }),
      ],
    };
  }

  function planConRodillaRota(gym = gimnasioConRareza()) {
    return engine.generatePlan({
      context,
      user: buildUser({
        constraints: [
          { type: 'injury', bodyRegion: 'knee', exerciseId: null, equipmentId: null, severity: 5 },
        ],
      }),
      gym,
      ruleset: V1_RESEARCH,
    });
  }

  it('el sustituto no puede ser nada que la molestia haya prohibido', () => {
    const gym = gimnasioConRareza();
    const plan = planConRodillaRota(gym);
    const elegidos = plan.sessions.flatMap((s) => s.items.map((i) => i.exerciseId));
    expect(elegidos.length, 'el plan salió vacío y no se midió nada').toBeGreaterThan(0);

    const porId = new Map(gym.exercises.map((e) => [e.id, e]));
    for (const id of elegidos) {
      const e = porId.get(id);
      expect(e, `${id} no está en el catálogo`).toBeDefined();
      // La regla de rodilla del ruleset saca los patrones de rodilla y el cuádriceps.
      expect(['squat', 'lunge'], `entró ${e?.name}`).not.toContain(e?.pattern);
      expect(e?.primaryMuscles, `entró ${e?.name}`).not.toContain('quads');
    }
  });

  it('no reemplaza una sentadilla por un press de hombro', () => {
    const gym = gimnasioConRareza();
    const sano = engine.generatePlan({ context, user: buildUser(), gym, ruleset: V1_RESEARCH });
    const conMolestia = planConRodillaRota(gym);
    const porId = new Map(gym.exercises.map((e) => [e.id, e]));

    // El press de hombro entra legítimamente en **su** slot de empuje vertical:
    // prohibirlo en todo el plan no mide nada. Lo que importa es qué ocupó el
    // lugar de la sentadilla, así que se compara slot contra slot — los dos
    // planes tienen la misma cantidad de ítems, y el orden es el de la plantilla.
    let medidos = 0;
    for (const [i, sesion] of conMolestia.sessions.entries()) {
      const original = sano.sessions[i];
      if (!original) continue;
      for (const [j, item] of sesion.items.entries()) {
        const antes = porId.get(original.items[j]?.exerciseId ?? '');
        if (antes?.pattern !== 'squat' && antes?.pattern !== 'lunge') continue;
        medidos += 1;
        const ahora = porId.get(item.exerciseId);
        // `front_delts` y `abs` estaban entre los "músculos de la sentadilla"
        // solo por el wall ball. Con el peso por frecuencia dejan de estarlo,
        // así que lo que ocupa ese lugar toca glúteo, que sí define al patrón.
        expect(ahora?.primaryMuscles, `${ahora?.name} reemplazó a ${antes?.name}`).toContain(
          'glutes',
        );
      }
    }

    // Sin esto, un plan donde nada se sustituyó pasaría en verde sin mirar nada.
    expect(medidos, 'ningún slot de pierna se sustituyó').toBeGreaterThan(0);
  });

  /**
   * A quien acaba de declarar severidad 5 no se le ofrece un lanzamiento.
   *
   * Los tres explosivos del catálogo real (salto al cajón, wall ball, slam
   * ball) nunca habían entrado a un plan, pero por un efecto colateral —son de
   * peso corporal y el slot principal prefiere algo a lo que se le pueda subir
   * la carga—, no por una regla. La sustitución no pasa por ese filtro, así que
   * los dejaba entrar: medido sobre el catálogo real, lumbalgia recibía un wall
   * ball y rodilla lesionada un slam ball.
   *
   * Y contradice al propio ruleset, que en `acuteInjury` dice "se saca todo lo
   * que cargue la zona" y "mientras esté reciente, no uses el dolor como
   * permiso para cargar".
   */
  it('no ofrece trabajo explosivo como reemplazo de una molestia', () => {
    const gym = gimnasioConRareza();
    // Lumbalgia y no rodilla, porque es el caso que se midió en el catálogo
    // real: la regla lumbar saca el patrón `hinge` entero, cuyo único
    // ejercicio acá mueve isquios y glúteos — los dos músculos que el señuelo
    // balístico toca. Por solapamiento le gana a la patada de glúteo, así que
    // si aparece es porque nadie lo filtró.
    const plan = engine.generatePlan({
      context,
      user: buildUser({
        constraints: [
          {
            type: 'injury',
            bodyRegion: 'lower_back',
            exerciseId: null,
            equipmentId: null,
            severity: 5,
          },
        ],
      }),
      gym,
      ruleset: V1_RESEARCH,
    });

    const elegidos = plan.sessions.flatMap((s) => s.items.map((i) => i.exerciseId));
    expect(elegidos.length, 'el plan salió vacío').toBeGreaterThan(0);
    expect(elegidos, 'entró un ejercicio balístico').not.toContain('ex-slam-ball');

    // Y el día no se quedó corto por haberlo filtrado.
    const sano = engine.generatePlan({ context, user: buildUser(), gym, ruleset: V1_RESEARCH });
    expect(elegidos.length).toBe(sano.sessions.flatMap((s) => s.items).length);
  });

  it('el día no queda más corto que el de alguien sano', () => {
    const gym = gimnasioConRareza();
    const sano = engine.generatePlan({ context, user: buildUser(), gym, ruleset: V1_RESEARCH });
    const conMolestia = planConRodillaRota(gym);

    for (const [i, sesion] of conMolestia.sessions.entries()) {
      const original = sano.sessions[i];
      if (!original) continue;
      expect(sesion.items.length, `${sesion.label} quedó más corta`).toBe(original.items.length);
    }
  });

  it('lo avisa con el texto del ruleset, nombrando la zona y la sesión', () => {
    const plantilla = V1_RESEARCH.safety?.painSubstitution?.text ?? '';
    expect(plantilla, 'el ruleset no trae el texto de sustitución').not.toBe('');

    const cola = plantilla.split('{pattern}')[1] ?? '';
    const aviso = planConRodillaRota().warnings.find((w) => w.includes(cola));
    expect(aviso, 'no avisó que había sustituido').toBeDefined();
    expect(aviso).toContain('la rodilla');
    // Y nada de identificadores internos: el socio lee castellano.
    expect(aviso).not.toContain('{');
    expect(aviso).not.toContain('squat');
  });
});

/**
 * Desentrenamiento aeróbico. Ver `docs/research/19-desentrenamiento-aerobico.md`.
 *
 * `detraining` solo ajustaba la carga de sala, y el aviso de vuelta hablaba de
 * fuerza y tendones — a alguien cuyo plan son 40 minutos de cinta le decía que
 * no había perdido nada, que es lo contrario de lo que pasa con lo aeróbico.
 */
describe('volver al cardio después de una pausa', () => {
  const engine = createPlaceholderEngine();

  function gymConCardio(): GymSnapshot {
    const gym = buildGym();
    return {
      ...gym,
      equipment: [...gym.equipment, equipment('eq-cinta', 'Cinta', { load: { unit: 'none' } })],
      exercises: [
        ...gym.exercises,
        exercise('ex-cinta', 'Cinta de correr', {
          pattern: 'cardio',
          primaryMuscles: ['quads'],
          modality: 'time',
          equipmentIds: ['eq-cinta'],
        }),
      ],
    };
  }

  const objetivoCardio: UserGoal = {
    goal: 'cardio',
    sport: null,
    seasonPhase: 'none',
    priority: 1,
    sessionsPerWeekTarget: 3,
    sessionMinutesTarget: 60,
  };

  const nota = V1_RESEARCH.modifiers?.detraining?.cardioNote as string;

  function plan(dias: number | undefined, goal: UserGoal = objetivoCardio) {
    return engine.generatePlan({
      context,
      user: buildUser({ goals: [goal] }),
      gym: gymConCardio(),
      ruleset: V1_RESEARCH,
      ...(dias === undefined ? {} : { daysSinceLastSession: dias }),
    });
  }

  it('avisa que lo aeróbico se perdió, y no solo que la fuerza se conserva', () => {
    const avisos = plan(400).warnings;
    expect(avisos.some((w) => w.startsWith('Pasaron 400 días, y con el cardio'))).toBe(true);
  });

  it('el aviso sale desde el primer escalón, no recién en el último', () => {
    // El primer escalón de `cardio` son 10 días. No se inventa un umbral nuevo:
    // se reusa el que el objetivo ya define.
    expect(plan(10).warnings).toContain(nota.replace('{dias}', '10'));
  });

  it('por debajo del primer escalón no se avisa', () => {
    expect(plan(5).warnings.some((w) => w.includes('con el cardio la historia'))).toBe(false);
  });

  it('sin pausa declarada no se avisa nada de cardio', () => {
    expect(plan(undefined).warnings.some((w) => w.includes('con el cardio la historia'))).toBe(
      false,
    );
  });

  it('un plan sin cardio no recibe el aviso de cardio', () => {
    const hipertrofia: UserGoal = { ...objetivoCardio, goal: 'hypertrophy' };
    const avisos = plan(400, hipertrofia).warnings;
    expect(avisos.some((w) => w.includes('con el cardio la historia'))).toBe(false);
    // Pero el de sala sí, que es el que le corresponde.
    expect(avisos.some((w) => w.includes('tendones'))).toBe(true);
  });
});
