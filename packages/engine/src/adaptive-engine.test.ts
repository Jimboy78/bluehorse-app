import type { Equipment, Exercise, Plan, Profile, SetLog, UserGoal } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import type { EngineContext, GymSnapshot, UserSnapshot } from './contract.ts';
import { V1_RESEARCH } from './index.ts';
import { createPlaceholderEngine } from './placeholder-engine.ts';

/**
 * Las reglas que deciden qué le llega a una persona real.
 *
 * Corre contra `V1_RESEARCH` a propósito: el ruleset provisorio no define
 * `safety` ni `cardio`, así que la mitad de esto no tendría con qué probarse.
 * Que estos tests pasen es lo que separa "genera un plan" de "genera un plan que
 * no lastima a nadie".
 */

const GYM_ID = '00000000-0000-4000-8000-000000000001';
const USER_ID = '00000000-0000-4000-8000-000000000002';

const context: EngineContext = { now: '2026-09-08T10:00:00.000Z', seed: 42 };
const engine = createPlaceholderEngine();

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

/**
 * Gimnasio de prueba: cubre los patrones de la plantilla de cuerpo completo, con
 * dos opciones en empuje horizontal (para probar rotación) y una sola en
 * bisagra (para probar que rotar no deja el patrón vacío).
 */
function buildGym(): GymSnapshot {
  return {
    gymId: GYM_ID,
    equipment: [
      equipment('eq-prensa', 'Prensa'),
      equipment('eq-press', 'Banco'),
      equipment('eq-maquina', 'Press de pecho en máquina'),
      equipment('eq-remo', 'Remo'),
      equipment('eq-hombro', 'Press de hombro'),
      equipment('eq-camilla', 'Camilla', { category: 'accessory', load: { unit: 'none' } }),
      equipment('eq-barra', 'Barra', {
        category: 'free_weight',
        load: { unit: 'plates_kg', min: 0, max: 200, increment: 2.5, baseWeightKg: 20 },
      }),
      equipment('eq-dorsalera', 'Dorsalera'),
      equipment('eq-mancuernas', 'Mancuernas', {
        category: 'free_weight',
        load: { unit: 'kg', min: 2, max: 40, increment: 2 },
      }),
      equipment('eq-cinta', 'Cinta', { category: 'cardio', load: { unit: 'none' } }),
    ],
    exercises: [
      exercise('ex-prensa', 'Prensa', { pattern: 'squat', equipmentIds: ['eq-prensa'] }),
      exercise('ex-press', 'Press de banco', {
        pattern: 'horizontal_push',
        primaryMuscles: ['chest'],
        equipmentIds: ['eq-press'],
      }),
      exercise('ex-press-maquina', 'Press en máquina', {
        pattern: 'horizontal_push',
        primaryMuscles: ['chest'],
        equipmentIds: ['eq-maquina'],
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
      exercise('ex-abs', 'Abdominales', {
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
      exercise('ex-dorsalera', 'Dorsalera', {
        pattern: 'vertical_pull',
        primaryMuscles: ['lats'],
        equipmentIds: ['eq-dorsalera'],
      }),
      exercise('ex-zancada', 'Zancadas', {
        pattern: 'lunge',
        primaryMuscles: ['quads', 'glutes'],
        equipmentIds: ['eq-mancuernas'],
      }),
      exercise('ex-biceps', 'Curl', {
        pattern: 'isolation',
        primaryMuscles: ['biceps'],
        isCompound: false,
        equipmentIds: ['eq-mancuernas'],
      }),
      exercise('ex-cinta', 'Caminata en cinta', {
        pattern: 'cardio',
        primaryMuscles: ['full_body'],
        modality: 'time',
        equipmentIds: ['eq-cinta'],
      }),
    ],
    substitutions: [],
  };
}

const baseProfile: Profile = {
  id: USER_ID,
  gymId: GYM_ID,
  displayName: 'Socio de prueba',
  birthDate: '1994-05-10',
  sex: 'male',
  experienceLevel: 'intermediate',
};

function goalOf(goal: UserGoal['goal'], sessionsPerWeekTarget = 3): UserGoal {
  return {
    goal,
    sport: null,
    seasonPhase: 'none' as const,
    priority: 1,
    sessionsPerWeekTarget,
    sessionMinutesTarget: 60,
  };
}

function buildUser(over: Partial<UserSnapshot> = {}): UserSnapshot {
  return {
    profile: baseProfile,
    goals: [goalOf('hypertrophy')],
    constraints: [],
    baselines: [],
    ...over,
  };
}

const plan: Plan = {
  id: 'plan-1',
  userId: USER_ID,
  gymId: GYM_ID,
  rulesetVersion: V1_RESEARCH.version,
  generatedAt: context.now,
  status: 'active',
};

function setLog(over: Partial<SetLog> & Pick<SetLog, 'workoutLogId' | 'completedAt'>): SetLog {
  return {
    id: `set-${over.workoutLogId}-${over.exerciseId ?? 'ex-prensa'}`,
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

/** Todos los ejercicios que el plan propone, en toda la cola. */
function exerciseIdsOf(input: Parameters<typeof engine.generatePlan>[0]): string[] {
  return engine.generatePlan(input).sessions.flatMap((s) => s.items.map((i) => i.exerciseId));
}

// ---------------------------------------------------------------- nivel

describe('nivel de experiencia', () => {
  it('no le propone a un principiante un ejercicio que exige más técnica de la que tiene', () => {
    const gym = buildGym();
    const conHingeAvanzado: GymSnapshot = {
      ...gym,
      exercises: gym.exercises.map((e) =>
        e.id === 'ex-peso-muerto' ? { ...e, skillLevel: 'advanced' as const } : e,
      ),
    };

    const result = engine.generatePlan({
      context,
      user: buildUser({ profile: { ...baseProfile, experienceLevel: 'beginner' } }),
      gym: conHingeAvanzado,
      ruleset: V1_RESEARCH,
    });

    const ids = result.sessions.flatMap((s) => s.items.map((i) => i.exerciseId));
    expect(ids).not.toContain('ex-peso-muerto');
    // Y lo dice, en vez de dejar un hueco silencioso en la sesión.
    expect(result.warnings.some((w) => w.includes('hinge'))).toBe(true);
  });

  it('a un avanzado sí se lo propone', () => {
    const gym = buildGym();
    const conHingeAvanzado: GymSnapshot = {
      ...gym,
      exercises: gym.exercises.map((e) =>
        e.id === 'ex-peso-muerto' ? { ...e, skillLevel: 'advanced' as const } : e,
      ),
    };

    const ids = exerciseIdsOf({
      context,
      user: buildUser({ profile: { ...baseProfile, experienceLevel: 'advanced' } }),
      gym: conHingeAvanzado,
      ruleset: V1_RESEARCH,
    });

    expect(ids).toContain('ex-peso-muerto');
  });
});

// ---------------------------------------------------------------- dolor

describe('dolor por zona', () => {
  function patternsFor(severity: number): (string | undefined)[] {
    const gym = buildGym();
    const ids = exerciseIdsOf({
      context,
      user: buildUser({
        constraints: [
          {
            type: 'pain',
            bodyRegion: 'lower_back',
            exerciseId: null,
            equipmentId: null,
            severity,
          },
        ],
      }),
      gym,
      ruleset: V1_RESEARCH,
    });
    return ids.map((id) => gym.exercises.find((e) => e.id === id)?.pattern);
  }

  it('saca los patrones que irritan la zona que duele', () => {
    expect(patternsFor(4)).not.toContain('hinge');
  });

  it('una molestia leve no saca nada: la regla tiene umbral de severidad', () => {
    expect(patternsFor(1)).toContain('hinge');
  });

  // El corazón del cambio de `docs/research/09`: con dolor moderado el ejercicio
  // se mantiene. Tres metaanálisis coinciden en que cargar la zona es seguro y
  // al menos igual de bueno que evitarla, y que lo que decide el resultado es la
  // exposición, no la carga. Sacar el `hinge` acá elimina el tratamiento.
  it('con dolor moderado no saca el patrón: lo mantiene y avisa', () => {
    expect(patternsFor(3)).toContain('hinge');
  });

  it('con dolor alto sí lo saca', () => {
    expect(patternsFor(5)).not.toContain('hinge');
  });

  const avisosCon = (severity: number) =>
    engine.generatePlan({
      context,
      user: buildUser({
        constraints: [
          { type: 'pain', bodyRegion: 'lower_back', exerciseId: null, equipmentId: null, severity },
        ],
      }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    }).warnings;

  // `referIf` estaba escrito en el ruleset para las seis regiones y no se
  // emitía nunca. Es la frase que separa una molestia de gimnasio de algo que
  // hay que hacer ver.
  it('dice cuándo hay que ir al médico, no solo qué evitar', () => {
    const rule = V1_RESEARCH.safety?.painRules.find((r) => r.bodyRegion === 'lower_back');
    if (!rule) throw new Error('El ruleset no tiene la regla lumbar.');
    const esperado = rule.referIf.slice(1);
    expect(avisosCon(3).some((w) => w.includes(esperado))).toBe(true);
  });

  it('muestra hasta cuánto dolor es aceptable, en vez de dejarlo a la intuición', () => {
    const texto = V1_RESEARCH.safety?.painMonitoring.text;
    if (!texto) throw new Error('El ruleset no tiene la regla de monitoreo.');
    expect(avisosCon(3)).toContain(texto);
  });

  it('sin dolor reportado no aparece ninguna regla de monitoreo', () => {
    const texto = V1_RESEARCH.safety?.painMonitoring.text;
    if (!texto) throw new Error('El ruleset no tiene la regla de monitoreo.');
    expect(avisosCon(1)).not.toContain(texto);
  });

  it('explica qué sí se puede seguir haciendo, en vez de solo prohibir', () => {
    const result = engine.generatePlan({
      context,
      user: buildUser({
        constraints: [
          {
            type: 'pain',
            bodyRegion: 'lower_back',
            exerciseId: null,
            equipmentId: null,
            severity: 4,
          },
        ],
      }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    expect(result.warnings.some((w) => w.includes('zona lumbar'))).toBe(true);
  });
});

// ---------------------------------------------------------------- ausencia

describe('volver después de una ausencia', () => {
  const userConBaseline = buildUser({
    baselines: [
      {
        exerciseId: 'ex-prensa',
        source: 'declared',
        load: { value: 100, unit: 'kg' },
        reps: 10,
        recordedAt: '2026-06-01T10:00:00.000Z',
      },
    ],
  });

  function loadAfter(days: number | null): number | null | undefined {
    return engine
      .generatePlan({
        context,
        user: userConBaseline,
        gym: buildGym(),
        ruleset: V1_RESEARCH,
        daysSinceLastSession: days,
      })
      .sessions[0]?.items.find((i) => i.exerciseId === 'ex-prensa')?.targetLoad?.value;
  }

  it('baja la carga de arranque tras una ausencia larga', () => {
    const conAusencia = loadAfter(95);
    const sinAusencia = loadAfter(2);
    expect(conAusencia).toBeDefined();
    expect(sinAusencia).toBeDefined();
    expect(conAusencia as number).toBeLessThan(sinAusencia as number);
  });

  it('lo explica en vez de bajar la carga en silencio', () => {
    const result = engine.generatePlan({
      context,
      user: userConBaseline,
      gym: buildGym(),
      ruleset: V1_RESEARCH,
      daysSinceLastSession: 95,
    });
    expect(result.warnings.some((w) => w.includes('95 días'))).toBe(true);
  });

  it('no toca nada si la ausencia fue corta', () => {
    const result = engine.generatePlan({
      context,
      user: userConBaseline,
      gym: buildGym(),
      ruleset: V1_RESEARCH,
      daysSinceLastSession: 5,
    });
    expect(result.warnings.some((w) => w.includes('desde tu última sesión'))).toBe(false);
  });
});

// ---------------------------------------------------------------- rotación

describe('rotación de ejercicios', () => {
  it('evita los del plan anterior cuando hay alternativa', () => {
    const ids = exerciseIdsOf({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
      previousExerciseIds: ['ex-press'],
    });

    expect(ids).toContain('ex-press-maquina');
    expect(ids).not.toContain('ex-press');
  });

  it('repite antes que dejar un patrón sin cubrir', () => {
    // La prensa es el único ejercicio de sentadilla del gimnasio de prueba.
    const ids = exerciseIdsOf({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
      previousExerciseIds: ['ex-prensa'],
    });

    expect(ids).toContain('ex-prensa');
  });
});

// ---------------------------------------------------------------- progresión

describe('progresión por tren', () => {
  /** Estación de escalón fino: hace visible la diferencia entre 1,25% y 2,5%. */
  const finoId = 'eq-fino';
  function gymConEscalonFino(): GymSnapshot {
    const gym = buildGym();
    return {
      ...gym,
      equipment: [
        ...gym.equipment,
        equipment(finoId, 'Polea de escalón fino', {
          load: { unit: 'kg', min: 5, max: 300, increment: 1 },
        }),
      ],
    };
  }

  function proposeFor(exerciseId: string, equipmentId: string, gym = gymConEscalonFino()) {
    const history: SetLog[] = [
      setLog({
        workoutLogId: 'w2',
        completedAt: '2026-09-06T10:00:00.000Z',
        exerciseId,
        equipmentId,
        load: { value: 100, unit: 'kg' },
        rir: 4,
      }),
      setLog({
        workoutLogId: 'w1',
        completedAt: '2026-09-04T10:00:00.000Z',
        exerciseId,
        equipmentId,
        load: { value: 100, unit: 'kg' },
        rir: 4,
      }),
    ];

    return engine
      .reviewProgress({
        context,
        user: buildUser(),
        gym,
        plan,
        history,
        resolvedProposals: [],
        ruleset: V1_RESEARCH,
      })
      .find((p) => p.type === 'load_increase');
  }

  it('sube menos en el tren superior que en el inferior', () => {
    // Mismo escenario, misma estación, misma carga: lo único que cambia es qué
    // músculo trabaja el ejercicio. El tren inferior mueve más carga absoluta,
    // así que el mismo porcentaje sería un salto proporcionalmente más chico.
    const inferior = proposeFor('ex-prensa', finoId);
    const superior = proposeFor('ex-press', finoId);

    expect(inferior).toBeDefined();
    expect(superior).toBeDefined();
    const saltoInferior = Number(inferior?.toValue) - Number(inferior?.fromValue);
    const saltoSuperior = Number(superior?.toValue) - Number(superior?.fromValue);
    expect(saltoInferior).toBeGreaterThan(saltoSuperior);
  });

  it('en una estación de escalón grueso los dos suben lo mismo: no hay medio disco', () => {
    // La diferencia por tren es un porcentaje, pero la máquina manda: si el
    // escalón más chico son 5 kg, no existe un aumento de 1,25 kg.
    const inferior = proposeFor('ex-prensa', 'eq-prensa');
    const superior = proposeFor('ex-press', 'eq-prensa');

    expect(inferior?.toValue).toBe(superior?.toValue);
  });
});

describe('potencia', () => {
  it('no propone subir carga sola: se regula por velocidad, no por repeticiones en reserva', () => {
    const history: SetLog[] = [
      setLog({ workoutLogId: 'w2', completedAt: '2026-09-06T10:00:00.000Z', rir: 5 }),
      setLog({ workoutLogId: 'w1', completedAt: '2026-09-04T10:00:00.000Z', rir: 5 }),
    ];

    const proposals = engine.reviewProgress({
      context,
      user: buildUser({ goals: [goalOf('power')] }),
      gym: buildGym(),
      plan,
      history,
      resolvedProposals: [],
      ruleset: V1_RESEARCH,
    });

    expect(proposals.some((p) => p.type === 'load_increase')).toBe(false);
  });

  it('en cambio con hipertrofia el mismo historial sí dispara la propuesta', () => {
    const history: SetLog[] = [
      setLog({ workoutLogId: 'w2', completedAt: '2026-09-06T10:00:00.000Z', rir: 5 }),
      setLog({ workoutLogId: 'w1', completedAt: '2026-09-04T10:00:00.000Z', rir: 5 }),
    ];

    const proposals = engine.reviewProgress({
      context,
      user: buildUser(),
      gym: buildGym(),
      plan,
      history,
      resolvedProposals: [],
      ruleset: V1_RESEARCH,
    });

    expect(proposals.some((p) => p.type === 'load_increase')).toBe(true);
  });
});

// ---------------------------------------------------------------- cardio

describe('cardio', () => {
  it('se prescribe por duración y zona, no por series y repeticiones', () => {
    const result = engine.generatePlan({
      context,
      user: buildUser({ goals: [goalOf('cardio')] }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    const item = result.sessions.flatMap((s) => s.items).find((i) => i.exerciseId === 'ex-cinta');
    expect(item).toBeDefined();
    expect(item?.targetDurationSeconds).toBeGreaterThan(0);
    expect(item?.targetIntensityZone).toBeGreaterThanOrEqual(1);
    // Sin repeticiones en reserva: el trabajo aeróbico no se mide así.
    expect(item?.targetRir).toBeNull();
  });

  it('el trabajo de sala no queda con campos de cardio', () => {
    const result = engine.generatePlan({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    const item = result.sessions[0]?.items[0];
    expect(item?.targetDurationSeconds).toBeNull();
    expect(item?.targetIntensityZone).toBeNull();
  });

  it('explica el bloque en castellano, con los minutos', () => {
    const result = engine.generatePlan({
      context,
      user: buildUser({ goals: [goalOf('cardio')] }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    const item = result.sessions.flatMap((s) => s.items).find((i) => i.exerciseId === 'ex-cinta');
    expect(item?.rationale).toMatch(/min/);
  });
});

// ---------------------------------------------------------------- edad

describe('edad', () => {
  // El modificador viejo bajaba la carga un 20% y sumaba repeticiones. Los dos
  // metaanálisis de `docs/research/08-edad.md` dicen lo contrario: la ventana
  // medida en 60-90 años es 70-79% del 1RM en series de 7 a 9, y rebajar la
  // carga no reduce ni caídas ni eventos adversos.
  it('a partir de cierta edad prescribe la ventana medida, no una rebaja', () => {
    const mayor = engine.generatePlan({
      context,
      user: buildUser({ profile: { ...baseProfile, birthDate: '1950-01-01' } }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    const rule = V1_RESEARCH.modifiers?.olderAdults;
    if (!rule) throw new Error('El ruleset de prueba no tiene el modificador de edad.');

    for (const item of mayor.sessions.flatMap((s) => s.items)) {
      if (item.targetDurationSeconds !== null) continue;
      expect(item.targetRepsMin).toBe(rule.repsWindow[0]);
      expect(item.targetRepsMax).toBe(rule.repsWindow[1]);
    }
  });

  it('no alarga el descanso: ninguna fuente respalda hacerlo por edad', () => {
    const joven = engine.generatePlan({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });
    const mayor = engine.generatePlan({
      context,
      user: buildUser({ profile: { ...baseProfile, birthDate: '1950-01-01' } }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    expect(mayor.sessions[0]?.items[0]?.restSeconds).toBe(joven.sessions[0]?.items[0]?.restSeconds);
  });

  // Borde midió fuerza y morfología. En potencia la evidencia dice otra cosa
  // (baja intensidad rinde igual), así que la ventana no se extrapola.
  it('en un objetivo que la evidencia no cubre, la edad no cambia nada', () => {
    const conPotencia = (birthDate: string | null) =>
      engine.generatePlan({
        context,
        user: buildUser({ goals: [goalOf('power')], profile: { ...baseProfile, birthDate } }),
        gym: buildGym(),
        ruleset: V1_RESEARCH,
      });

    const firma = (birthDate: string | null) =>
      conPotencia(birthDate)
        .sessions.flatMap((s) => s.items)
        .map((i) => `${i.targetRepsMin}-${i.targetRepsMax}/${i.restSeconds}`)
        .join(',');

    expect(firma('1950-01-01')).toBe(firma('1995-01-01'));
  });

  // Un rango de una sola repetición no es una prescripción, es un error
  // aritmético: el `Math.max` del modificador viejo colapsaba 4-6 en 6-6.
  it('nunca deja un rango de repeticiones colapsado en un punto', () => {
    for (const goal of ['strength', 'hypertrophy', 'power', 'endurance'] as const) {
      const plan = engine.generatePlan({
        context,
        user: buildUser({
          goals: [goalOf(goal)],
          profile: { ...baseProfile, birthDate: '1950-01-01' },
        }),
        gym: buildGym(),
        ruleset: V1_RESEARCH,
      });
      for (const item of plan.sessions.flatMap((s) => s.items)) {
        if (item.targetDurationSeconds !== null) continue;
        expect(item.targetRepsMax).toBeGreaterThan(item.targetRepsMin);
      }
    }
  });

  it('sin fecha de nacimiento no ajusta nada, en vez de asumir una edad', () => {
    const sinFecha = engine.generatePlan({
      context,
      user: buildUser({ profile: { ...baseProfile, birthDate: null } }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });
    const joven = engine.generatePlan({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    expect(sinFecha.sessions[0]?.items[0]?.restSeconds).toBe(
      joven.sessions[0]?.items[0]?.restSeconds,
    );
  });
});

// ---------------------------------------------------------------- volumen

describe('volumen semanal', () => {
  it('avisa cuando entrenar pocas veces por semana deja músculos abajo del mínimo', () => {
    // Dos sesiones por semana reparten el volumen entre A y B: cada músculo se
    // toca una sola vez y varios quedan abajo de las 6 series semanales que la
    // evidencia marca como piso para hipertrofia.
    const result = engine.generatePlan({
      context,
      user: buildUser({ goals: [goalOf('hypertrophy', 2)] }),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    expect(result.warnings.some((w) => w.includes('series semanales mínimas'))).toBe(true);
  });

  it('con la frecuencia recomendada las plantillas quedan dentro del rango de la evidencia', () => {
    // Si esto empieza a fallar es que una plantilla se pasó del techo útil: no
    // es un test de forma, es el control de que el contenido sigue siendo sano.
    for (const goal of ['hypertrophy', 'strength', 'recomposition'] as const) {
      const result = engine.generatePlan({
        context,
        user: buildUser({ goals: [goalOf(goal, 3)] }),
        gym: buildGym(),
        ruleset: V1_RESEARCH,
      });
      expect(result.warnings.some((w) => w.includes('techo útil'))).toBe(false);
    }
  });
});

// ---------------------------------------------------------------- marcado

describe('el ruleset de investigación', () => {
  it('no marca sus planes como provisorios', () => {
    const result = engine.generatePlan({
      context,
      user: buildUser(),
      gym: buildGym(),
      ruleset: V1_RESEARCH,
    });

    expect(result.source).toBe('research');
    expect(result.sessions.every((s) => s.items.every((i) => !i.isPlaceholder))).toBe(true);
    expect(result.warnings.some((w) => w.includes('provisorio'))).toBe(false);
  });

  it('sigue siendo determinista: misma semilla, mismo plan', () => {
    const input = { context, user: buildUser(), gym: buildGym(), ruleset: V1_RESEARCH };
    expect(exerciseIdsOf(input)).toEqual(exerciseIdsOf(input));
  });
});
