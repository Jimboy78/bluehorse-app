import type { Equipment, Exercise, Profile, SetLog, UserGoal } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import type { EngineContext, GymSnapshot, UserSnapshot } from './contract.ts';
import { V0_PLACEHOLDER } from './index.ts';
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

    expect(plan.warnings.some((w) => w.includes('core'))).toBe(true);
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
