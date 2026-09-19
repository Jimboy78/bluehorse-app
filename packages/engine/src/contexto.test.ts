import type { Exercise, MovementLimit, UserConstraint } from '@bh/domain';
import { HEALTH_CONDITIONS, MOVEMENT_LIMITS } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { excluido, ocultaElPulso, ordenarAvisos, resolverContexto } from './contexto.ts';
import type { GeneratePlanInput, GymSnapshot, UserSnapshot } from './contract.ts';
import { V1_RESEARCH } from './index.ts';
import { createPlaceholderEngine } from './placeholder-engine.ts';

const GYM = 'gym';

function ex(id: string, over: Partial<Exercise> = {}): Exercise {
  return {
    id,
    gymId: GYM,
    name: id,
    pattern: 'squat',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    modality: 'reps_bodyweight',
    isCompound: true,
    isUnilateral: false,
    isExplosive: false,
    loadsSpinalFlexion: false,
    headBelowHeart: false,
    requiresMovements: [],
    prevents: [],
    jumpDirection: null,
    skillLevel: 'beginner',
    cues: null,
    equipmentIds: [],
    ...over,
  };
}

const sentadilla = ex('sentadilla');
const pesoMuerto = ex('peso-muerto', { pattern: 'hinge', primaryMuscles: ['hamstrings'] });
const tecnico = ex('arranque', {
  pattern: 'hinge',
  primaryMuscles: ['hamstrings'],
  skillLevel: 'advanced',
});
const flexiones = ex('flexiones', { pattern: 'horizontal_push', primaryMuscles: ['chest'] });
const remo = ex('remo', { pattern: 'horizontal_pull', primaryMuscles: ['back'] });

const gym: GymSnapshot = {
  gymId: GYM,
  equipment: [],
  exercises: [sentadilla, pesoMuerto, tecnico, flexiones, remo],
  substitutions: [],
};

function input(over: {
  edad?: number;
  sport?: string | null;
  constraints?: UserConstraint[];
  goal?: UserSnapshot['goals'][number]['goal'];
  conditions?: UserSnapshot['conditions'];
}): GeneratePlanInput {
  return {
    context: { now: '2026-09-10T12:00:00.000Z', seed: 1 },
    user: {
      profile: {
        id: 'u',
        gymId: GYM,
        displayName: 'x',
        birthDate: `${2026 - (over.edad ?? 30)}-01-01`,
        sex: 'undisclosed',
        experienceLevel: 'beginner',
      },
      goals: [
        {
          goal: over.goal ?? 'strength',
          sport: over.sport ?? null,
          seasonPhase: 'none',
          priority: 1,
          sessionsPerWeekTarget: 3,
          sessionMinutesTarget: 60,
        },
      ],
      constraints: over.constraints ?? [],
      baselines: [],
      conditions: over.conditions ?? [],
    },
    gym,
    ruleset: V1_RESEARCH,
  };
}

const lesionRodilla: UserConstraint = {
  type: 'injury',
  bodyRegion: 'knee',
  exerciseId: null,
  equipmentId: null,
  severity: 5,
};

describe('resolverContexto', () => {
  it('cada exclusión dice de qué módulo sale, y se suman', () => {
    const ctx = resolverContexto(
      input({
        constraints: [
          lesionRodilla,
          {
            type: 'avoid_exercise',
            bodyRegion: null,
            exerciseId: 'remo',
            equipmentId: null,
            severity: 0,
          },
        ],
      }),
    );
    const porModulo = (e: Exercise) =>
      ctx.exclusiones.filter((x) => x.excluye(e)).map((x) => x.modulo);

    expect(porModulo(sentadilla)).toEqual(['molestia']);
    expect(porModulo(remo)).toEqual(['restriccion']);
    expect(porModulo(tecnico)).toEqual(['nivel']);
    expect(excluido(ctx, flexiones)).toBe(false);
  });

  it('los avisos salen etiquetados con su módulo', () => {
    const modulos = (i: GeneratePlanInput) => resolverContexto(i).avisos.map((a) => a.modulo);

    expect(modulos(input({ edad: 70 }))).toContain('edad');
    expect(modulos(input({ edad: 30 }))).not.toContain('edad');
    expect(modulos(input({ sport: 'deporte-inventado' }))).toContain('deporte');
    expect(modulos(input({ constraints: [lesionRodilla] }))).toContain('molestia');
  });

  it('el plan trae todos los avisos del contexto, y los de molestia primero', () => {
    const engine = createPlaceholderEngine();
    const casos = [
      input({}),
      input({ edad: 70, constraints: [lesionRodilla] }),
      input({ sport: 'futbol', goal: 'power' }),
      input({ sport: 'deporte-inventado', goal: 'cardio', constraints: [lesionRodilla] }),
    ];
    let conMolestia = 0;
    for (const i of casos) {
      const avisos = resolverContexto(i).avisos;
      const plan = engine.generatePlan(i).warnings;
      for (const a of avisos) expect(plan).toContain(a.texto);
      const molestia = avisos.filter((a) => a.modulo === 'molestia').map((a) => a.texto);
      if (molestia.length > 0) conMolestia += 1;
      expect(plan.slice(0, molestia.length)).toEqual(molestia);
    }
    expect(conMolestia).toBe(2);
  });

  it('ordena por módulo y, dentro de un módulo, como se escribieron', () => {
    expect(
      ordenarAvisos([
        { modulo: 'nivel', texto: 'n' },
        { modulo: 'molestia', texto: 'm1' },
        { modulo: 'volumen', texto: 'v' },
        { modulo: 'molestia', texto: 'm2' },
      ]),
    ).toEqual(['m1', 'm2', 'v', 'n']);
  });

  it('el equilibrio entra justo desde la edad del ruleset, con cualquier objetivo', () => {
    const desde = V1_RESEARCH.balance?.fromAge ?? 0;
    expect(desde).toBeGreaterThan(0);
    expect(resolverContexto(input({ edad: desde - 1 })).equilibrio).toBeNull();
    for (const goal of ['strength', 'cardio', 'power'] as const) {
      expect(resolverContexto(input({ edad: desde + 1, goal })).equilibrio).not.toBeNull();
    }
    // Sin fecha de nacimiento no se inventa una edad.
    const sinFecha = input({ edad: desde + 10 });
    const perfil = { ...sinFecha.user.profile, birthDate: null };
    expect(
      resolverContexto({ ...sinFecha, user: { ...sinFecha.user, profile: perfil } }).equilibrio,
    ).toBeNull();
  });

  it('con menos sesiones de las que pide el equilibrio, avisa cómo completarlas', () => {
    const cfg = V1_RESEARCH.balance;
    if (!cfg) throw new Error('sin bloque de equilibrio');
    const equilibrio = ex('talon-punta', { pattern: 'balance', primaryMuscles: ['calves'] });
    const conEquilibrio = { ...gym, exercises: [...gym.exercises, equilibrio] };
    const engine = createPlaceholderEngine();
    const plan = (sesiones: number) => {
      const i = input({ edad: cfg.fromAge + 5 });
      const goals = [
        { ...i.user.goals[0], sessionsPerWeekTarget: sesiones },
      ] as typeof i.user.goals;
      return engine.generatePlan({ ...i, gym: conEquilibrio, user: { ...i.user, goals } });
    };
    const aviso = (w: readonly string[]) => w.some((t) => t.includes('mesada firme'));

    const pocas = plan(cfg.minSessionsPerWeek - 1);
    expect(pocas.sessions[0]?.items.at(-1)?.exerciseId).toBe('talon-punta');
    expect(aviso(pocas.warnings)).toBe(true);
    expect(aviso(plan(cfg.minSessionsPerWeek).warnings)).toBe(false);
  });

  it('un adolescente que empieza recibe la dosis de inicio; a los 18 o con experiencia, la del adulto', () => {
    const y = V1_RESEARCH.modifiers?.youth;
    if (!y) throw new Error('sin bloque de adolescentes');
    const conNivel = (
      edad: number,
      nivel: 'beginner' | 'intermediate',
      goal: 'strength' | 'power',
    ) => {
      const i = input({ edad, goal });
      const profile = { ...i.user.profile, experienceLevel: nivel };
      return resolverContexto({ ...i, user: { ...i.user, profile } });
    };

    for (const goal of ['strength', 'power'] as const) {
      const joven = conNivel(y.fromAge + 1, 'beginner', goal);
      for (const rol of [joven.params.primary, joven.params.secondary, joven.params.isolation]) {
        expect(rol.sets).toBeLessThanOrEqual(y.maxSets);
        expect([rol.repsMin, rol.repsMax]).toEqual(y.repsWindow);
      }
      expect(joven.avisos.map((a) => a.modulo)).toContain('supervision');
      // Con la dosis de inicio el nivel sí cambió la dosis: no se dice lo contrario.
      expect(joven.avisos.map((a) => a.modulo)).not.toContain('nivel');
    }

    const adulto = conNivel(y.toAge + 1, 'beginner', 'strength');
    const entrenado = conNivel(y.fromAge + 1, 'intermediate', 'strength');
    for (const ctx of [adulto, entrenado]) {
      expect(ctx.params.primary.repsMin).not.toBe(y.repsWindow[0]);
      expect(ctx.avisos.map((a) => a.modulo)).not.toContain('supervision');
    }
  });

  it('impacto para el hueso: mujeres desde la edad del ruleset, sin molestias, antes del equilibrio', () => {
    const cfg = V1_RESEARCH.impact;
    if (!cfg) throw new Error('sin bloque de impacto');
    const con = (edad: number, sex: 'female' | 'male' | 'undisclosed', molestia = false) => {
      const i = input({ edad, constraints: molestia ? [lesionRodilla] : [] });
      const profile = { ...i.user.profile, sex };
      return resolverContexto({ ...i, user: { ...i.user, profile } }).bloques.map((b) => b.modulo);
    };

    expect(con(cfg.fromAge, 'female')).toContain('impacto');
    expect(con(cfg.fromAge - 1, 'female')).not.toContain('impacto');
    expect(con(cfg.fromAge + 5, 'male')).not.toContain('impacto');
    // Sin sexo declarado no se deduce una menopausia.
    expect(con(cfg.fromAge + 5, 'undisclosed')).not.toContain('impacto');
    expect(con(cfg.fromAge + 5, 'female', true)).not.toContain('impacto');
    // Con equilibrio también, el impacto va antes: el equilibrio cierra la sesión.
    expect(con(Math.max(cfg.fromAge, V1_RESEARCH.balance?.fromAge ?? 0), 'female')).toEqual([
      'impacto',
      'equilibrio',
    ]);
  });

  it('presión alta o corazón: ninguna serie más cerca del fallo que el piso, y no propone subir por cumplirlo', () => {
    const conds = V1_RESEARCH.conditions ?? [];
    const piso = conds.find((c) => c.id === 'hypertension')?.minRir;
    if (piso == null) throw new Error('sin piso de RIR para la presión');
    const con = (conditions: UserSnapshot['conditions'], goal: 'hypertrophy' | 'power') => {
      const i = input({ goal, conditions });
      const profile = { ...i.user.profile, experienceLevel: 'advanced' as const };
      return resolverContexto({ ...i, user: { ...i.user, profile } });
    };

    const sano = con([], 'hypertrophy');
    // Si el objetivo ya no baja del piso, el test no prueba nada.
    expect(sano.params.primary.rirTarget).toBeLessThan(piso);
    for (const c of ['hypertension', 'heart_disease'] as const) {
      const ctx = con([c], 'hypertrophy');
      for (const rol of [ctx.params.primary, ctx.params.secondary, ctx.params.isolation]) {
        expect(rol.rirTarget).toBeGreaterThanOrEqual(piso);
      }
      // Cumplir el RIR del plan no puede contar como "te sobraron repeticiones".
      expect(ctx.params.progression.triggerRirAtLeast).toBeGreaterThan(
        ctx.params.primary.rirTarget ?? 0,
      );
      // La carga y las repeticiones quedan las del objetivo.
      expect(ctx.params.primary.repsMin).toBe(sano.params.primary.repsMin);
      expect(ctx.params.primary.intensityPct1RM).toEqual(sano.params.primary.intensityPct1RM);
      expect(ctx.avisos.map((a) => a.modulo)).toContain('salud');
    }
    // Lo que no se regula por RIR no se toca.
    expect(con(['hypertension'], 'power').params.primary.rirTarget).toBeNull();
    // Betabloqueantes no ponen piso: cambian cómo se lee el cardio.
    expect(con(['beta_blockers'], 'hypertrophy').params).toEqual(sano.params);
  });

  it('las condiciones suman avisos sin repetirlos, y solo los betabloqueantes ocultan el pulso', () => {
    const avisos = (conditions: UserSnapshot['conditions']) =>
      resolverContexto(input({ conditions }))
        .avisos.filter((a) => a.modulo === 'salud')
        .map((a) => a.texto);
    const juntas = avisos(['hypertension', 'beta_blockers']);
    expect(new Set(juntas).size).toBe(juntas.length);
    expect(juntas.length).toBeGreaterThan(avisos(['hypertension']).length);
    expect(avisos([])).toEqual([]);
    // Una condición sin entrada en el ruleset no cambia nada.
    const sinEntrada = HEALTH_CONDITIONS.find(
      (c) => !(V1_RESEARCH.conditions ?? []).some((x) => x.id === c),
    );
    if (!sinEntrada) throw new Error('todas las condiciones tienen entrada');
    expect(avisos([sinEntrada])).toEqual([]);

    expect(ocultaElPulso(V1_RESEARCH, ['beta_blockers'])).toBe(true);
    expect(ocultaElPulso(V1_RESEARCH, ['hypertension', 'heart_disease'])).toBe(false);
    expect(ocultaElPulso(V1_RESEARCH, [])).toBe(false);
  });

  it('diabetes y anticoagulantes no tocan la dosis; diabetes con betabloqueantes suma su aviso', () => {
    // Avanzado: hipertrofia queda por debajo del piso de la presión, así que un
    // piso puesto por error en otra condición se notaría.
    const ctx = (conditions: UserSnapshot['conditions']) => {
      const i = input({ goal: 'hypertrophy', conditions });
      const profile = { ...i.user.profile, experienceLevel: 'advanced' as const };
      return resolverContexto({ ...i, user: { ...i.user, profile } });
    };
    const sano = ctx([]);
    const pisoPresion = V1_RESEARCH.conditions?.find((c) => c.id === 'hypertension')?.minRir ?? 0;
    expect(sano.params.primary.rirTarget).toBeLessThan(pisoPresion);
    // La fuerza intensa es la que más ayuda a la glucosa (`docs/research/45`), y
    // entrenar no sube el sangrado: ninguna de las dos baja nada.
    for (const c of ['diabetes', 'anticoagulants'] as const) {
      expect(ctx([c]).params).toEqual(sano.params);
    }
    const salud = (conditions: UserSnapshot['conditions']) =>
      ctx(conditions)
        .avisos.filter((a) => a.modulo === 'salud')
        .map((a) => a.texto);
    expect(salud(['diabetes']).length).toBeGreaterThan(0);
    expect(salud(['anticoagulants'])).toEqual([]);

    const combinado = V1_RESEARCH.conditions
      ?.find((c) => c.id === 'diabetes')
      ?.withOther.find((o) => o.id === 'beta_blockers')?.note;
    if (!combinado) throw new Error('sin el aviso de diabetes con betabloqueantes');
    expect(salud(['diabetes', 'beta_blockers'])).toContain(combinado);
    expect(salud(['diabetes'])).not.toContain(combinado);
    expect(salud(['beta_blockers'])).not.toContain(combinado);
  });

  it('osteoporosis: sin flexión de columna, y con impacto aunque el sexo y la edad no lo pidan', () => {
    const crunch = ex('crunch', {
      pattern: 'core',
      primaryMuscles: ['abs'],
      loadsSpinalFlexion: true,
    });
    const plancha = ex('plancha', { pattern: 'core', primaryMuscles: ['abs'] });
    const hombre = (conditions: UserSnapshot['conditions'], molestia = false) => {
      const i = input({ edad: 40, conditions, constraints: molestia ? [lesionRodilla] : [] });
      const profile = { ...i.user.profile, sex: 'male' as const };
      return resolverContexto({ ...i, user: { ...i.user, profile } });
    };
    const sano = hombre([]);
    expect(excluido(sano, crunch)).toBe(false);
    expect(sano.bloques.map((b) => b.modulo)).not.toContain('impacto');

    const oste = hombre(['osteoporosis']);
    expect(excluido(oste, crunch)).toBe(true);
    expect(excluido(oste, plancha)).toBe(false);
    expect(oste.bloques.map((b) => b.modulo)).toContain('impacto');
    // Con una molestia, el impacto no se suma tampoco por la osteoporosis.
    expect(hombre(['osteoporosis'], true).bloques.map((b) => b.modulo)).not.toContain('impacto');
    // La dosis no cambia: fuerza progresiva es lo que pide el consenso.
    expect(oste.params).toEqual(sano.params);
  });

  it('suelo pélvico: sin impacto ni saltos, y gana sobre la osteoporosis con su aviso', () => {
    const mujer = (conditions: UserSnapshot['conditions']) => {
      const i = input({ edad: 55, sport: 'futbol', conditions });
      const profile = { ...i.user.profile, sex: 'female' as const };
      return resolverContexto({ ...i, user: { ...i.user, profile } });
    };
    const salto = ex('salto', { isExplosive: true });
    const sana = mujer([]);
    // Si sin la condición no hubiera impacto ni par, el test no probaría nada.
    expect(sana.bloques.map((b) => b.modulo)).toContain('impacto');
    expect(sana.explosivos).not.toBeNull();

    const conPerdidas = mujer(['pelvic_floor']);
    expect(conPerdidas.bloques.map((b) => b.modulo)).not.toContain('impacto');
    expect(conPerdidas.explosivos).toBeNull();
    expect(excluido(conPerdidas, salto)).toBe(true);

    const ambas = mujer(['osteoporosis', 'pelvic_floor']);
    expect(ambas.bloques.map((b) => b.modulo)).not.toContain('impacto');
    const combinado = V1_RESEARCH.conditions
      ?.find((c) => c.id === 'osteoporosis')
      ?.withOther.find((o) => o.id === 'pelvic_floor')?.note;
    expect(ambas.avisos.map((a) => a.texto)).toContain(combinado);
  });

  it('glaucoma o retina: piso de RIR, sin cabeza abajo, y el aviso de respirar una sola vez con la presión', () => {
    const declinado = ex('declinado', { pattern: 'core', headBelowHeart: true });
    const avanzado = (conditions: UserSnapshot['conditions']) => {
      const i = input({ goal: 'hypertrophy', conditions });
      const profile = { ...i.user.profile, experienceLevel: 'advanced' as const };
      return resolverContexto({ ...i, user: { ...i.user, profile } });
    };
    const piso = V1_RESEARCH.conditions?.find((c) => c.id === 'glaucoma_retina')?.minRir ?? 0;
    const ojo = avanzado(['glaucoma_retina']);
    expect(avanzado([]).params.primary.rirTarget).toBeLessThan(piso);
    expect(ojo.params.primary.rirTarget).toBeGreaterThanOrEqual(piso);
    expect(excluido(ojo, declinado)).toBe(true);
    expect(excluido(avanzado([]), declinado)).toBe(false);

    const salud = (c: UserSnapshot['conditions']) =>
      avanzado(c)
        .avisos.filter((a) => a.modulo === 'salud')
        .map((a) => a.texto);
    const juntas = salud(['glaucoma_retina', 'hypertension']);
    expect(new Set(juntas).size).toBe(juntas.length);
  });

  it('embarazo y posparto: la dosis de siempre, sin saltos ni impacto, con sus avisos', () => {
    // La edad es la que hace entrar impacto y par explosivo en la mujer sana:
    // sin eso no habría nada que sacar. El motor no mira la edad para esto.
    const mujer = (conditions: UserSnapshot['conditions']) => {
      const i = input({ edad: 55, sport: 'futbol', goal: 'hypertrophy', conditions });
      const profile = {
        ...i.user.profile,
        sex: 'female' as const,
        experienceLevel: 'advanced' as const,
      };
      return resolverContexto({ ...i, user: { ...i.user, profile } });
    };
    const salto = ex('salto', { isExplosive: true });
    const sana = mujer([]);
    expect(sana.bloques.map((b) => b.modulo)).toContain('impacto');
    expect(sana.explosivos).not.toBeNull();

    for (const c of ['pregnancy', 'postpartum'] as const) {
      const ctx = mujer([c]);
      // La fuerza intensa fue bien tolerada en el embarazo (`docs/research/48`):
      // ni piso de RIR ni menos series.
      expect(ctx.params).toEqual(sana.params);
      expect(ctx.bloques.map((b) => b.modulo)).not.toContain('impacto');
      expect(ctx.explosivos).toBeNull();
      expect(ctx.sinExplosivosConAviso).toBe(true);
      expect(excluido(ctx, salto)).toBe(true);
      const notas = V1_RESEARCH.conditions?.find((x) => x.id === c)?.notes ?? [];
      expect(notas.length).toBeGreaterThan(0);
      for (const n of notas) expect(ctx.avisos.map((a) => a.texto)).toContain(n);
    }
    // Con osteoporosis también: sacar gana sobre sumar.
    expect(mujer(['osteoporosis', 'postpartum']).bloques.map((b) => b.modulo)).not.toContain(
      'impacto',
    );
    expect(sana.sinExplosivosConAviso).toBe(false);
  });

  it('cadera: sin zancadas desde 4, sin sentadillas con 4; el trabajo de glúteo sigue', () => {
    // `docs/research/49`: la fuerza es el tratamiento; lo que empeora es la
    // sentadilla profunda y las escaleras (zancada, subida al cajón).
    const zancada = ex('zancada', { pattern: 'lunge' });
    const sentadilla = ex('sentadilla', { pattern: 'squat' });
    const hipThrust = ex('hip-thrust', { pattern: 'hinge', primaryMuscles: ['glutes'] });
    const cadera = (severity: number, type: UserConstraint['type'] = 'pain') =>
      resolverContexto(
        input({
          constraints: [{ type, bodyRegion: 'hip', exerciseId: null, equipmentId: null, severity }],
        }),
      );
    const leve = cadera(3);
    expect(excluido(leve, zancada)).toBe(false);
    expect(leve.avisos.some((a) => a.texto.includes('la cadera'))).toBe(true);
    const fuerte = cadera(4);
    expect(excluido(fuerte, zancada)).toBe(true);
    expect(excluido(fuerte, sentadilla)).toBe(true);
    expect(excluido(fuerte, hipThrust)).toBe(false);
    // Una lesión saca desde el umbral de monitoreo.
    expect(excluido(cadera(3, 'injury'), zancada)).toBe(true);
    // Ya no es una zona sin regla.
    const sinRegla = V1_RESEARCH.safety?.noRuleForRegion?.text.replace('{region}', 'la cadera');
    expect(fuerte.avisos.map((a) => a.texto)).not.toContain(sinRegla);
  });

  it('tobillo: sin saltos con cualquier molestia, sin zancadas desde 4; gemelos y equilibrio siguen', () => {
    // `docs/research/50`: lo que se para es correr y saltar; la pantorrilla y el
    // equilibrio son el tratamiento.
    const zancada = ex('zancada', { pattern: 'lunge' });
    const gemelos = ex('gemelos', { pattern: 'isolation', primaryMuscles: ['calves'] });
    const talones = ex('talones', { pattern: 'balance', primaryMuscles: ['calves'] });
    const salto = ex('salto', { isExplosive: true });
    const tobillo = (severity: number, type: UserConstraint['type'] = 'pain') =>
      resolverContexto({
        ...input({
          edad: 70,
          constraints: [
            { type, bodyRegion: 'ankle', exerciseId: null, equipmentId: null, severity },
          ],
        }),
      });
    const leve = tobillo(3);
    expect(excluido(leve, salto)).toBe(true);
    expect(excluido(leve, zancada)).toBe(false);
    const fuerte = tobillo(4);
    expect(excluido(fuerte, zancada)).toBe(true);
    expect(excluido(fuerte, gemelos)).toBe(false);
    expect(excluido(fuerte, talones)).toBe(false);
    expect(fuerte.bloques.map((b) => b.modulo)).toContain('equilibrio');
    expect(excluido(tobillo(3, 'injury'), zancada)).toBe(true);
    const sinRegla = V1_RESEARCH.safety?.noRuleForRegion?.text.replace('{region}', 'el tobillo');
    expect(fuerte.avisos.map((a) => a.texto)).not.toContain(sinRegla);
  });

  it('codo: sin agarre puro desde 4, sin curl con "no puedo"; los tirones siguen', () => {
    // `docs/research/51`: lo que carga el tendón es agarrar fuerte; con
    // ejercicio mejora antes que esperando (Bisset 2006).
    const granjero = ex('granjero', { pattern: 'carry', primaryMuscles: ['forearms', 'traps'] });
    const curl = ex('curl', { pattern: 'isolation', primaryMuscles: ['biceps'] });
    const remo = ex('remo', {
      pattern: 'horizontal_pull',
      primaryMuscles: ['back', 'lats'],
      secondaryMuscles: ['biceps'],
    });
    const codo = (severity: number, type: UserConstraint['type'] = 'pain') =>
      resolverContexto(
        input({
          constraints: [
            { type, bodyRegion: 'elbow', exerciseId: null, equipmentId: null, severity },
          ],
        }),
      );
    expect(excluido(codo(3), granjero)).toBe(false);
    expect(excluido(codo(4), granjero)).toBe(true);
    expect(excluido(codo(4), curl)).toBe(false);
    expect(excluido(codo(5), curl)).toBe(true);
    expect(excluido(codo(5), remo)).toBe(false);
    // Una lesión saca desde el umbral de monitoreo de cada tramo.
    expect(excluido(codo(4, 'injury'), curl)).toBe(true);
    const sinRegla = V1_RESEARCH.safety?.noRuleForRegion?.text.replace('{region}', 'el codo');
    expect(codo(4).avisos.map((a) => a.texto)).not.toContain(sinRegla);
  });

  it('espalda alta: con dolor no sale nada hasta "no puedo"; con lesión sale la carga axial', () => {
    // `docs/research/52`: el dolor dorsal suele ser mecánico e inespecífico;
    // lo que importa son las señales (golpe, corticoides, cáncer, pecho).
    const muerto = ex('muerto', {
      pattern: 'hinge',
      primaryMuscles: ['hamstrings', 'glutes', 'lower_back'],
    });
    const encogimientos = ex('encogimientos', { pattern: 'isolation', primaryMuscles: ['traps'] });
    const remo = ex('remo', { pattern: 'horizontal_pull', primaryMuscles: ['back', 'lats'] });
    const hipThrust = ex('hip-thrust', { pattern: 'hinge', primaryMuscles: ['glutes'] });
    const dorsal = (severity: number, type: UserConstraint['type'] = 'pain') =>
      resolverContexto(
        input({
          constraints: [
            { type, bodyRegion: 'upper_back', exerciseId: null, equipmentId: null, severity },
          ],
        }),
      );
    expect(excluido(dorsal(4), muerto)).toBe(false);
    expect(excluido(dorsal(5), muerto)).toBe(true);
    expect(excluido(dorsal(5), encogimientos)).toBe(true);
    expect(excluido(dorsal(5), remo)).toBe(false);
    expect(excluido(dorsal(5), hipThrust)).toBe(false);
    expect(excluido(dorsal(3, 'injury'), muerto)).toBe(true);
    const regla = V1_RESEARCH.safety?.painRules.find((r) => r.bodyRegion === 'upper_back');
    expect(dorsal(3).avisos.map((a) => a.texto)).toContain(
      `Consultá si ${(regla?.referIf ?? '').charAt(0).toLowerCase()}${(regla?.referIf ?? '').slice(1)}`,
    );
  });

  it('artrosis: solo el aviso; prótesis: la dosis de siempre, sin saltos ni impacto', () => {
    const mujer = (conditions: UserSnapshot['conditions']) => {
      const i = input({ edad: 60, sport: 'futbol', conditions });
      const profile = { ...i.user.profile, sex: 'female' as const };
      return resolverContexto({ ...i, user: { ...i.user, profile } });
    };
    const salto = ex('salto', { isExplosive: true });
    const sana = mujer([]);
    expect(sana.bloques.map((b) => b.modulo)).toContain('impacto');
    expect(sana.explosivos).not.toBeNull();

    const artrosis = mujer(['osteoarthritis']);
    expect(artrosis.params).toEqual(sana.params);
    expect(artrosis.bloques).toEqual(sana.bloques);
    expect(artrosis.avisos.filter((a) => a.modulo === 'salud')).toHaveLength(1);

    const protesis = mujer(['joint_replacement']);
    expect(protesis.params).toEqual(sana.params);
    expect(protesis.bloques.map((b) => b.modulo)).not.toContain('impacto');
    expect(protesis.explosivos).toBeNull();
    expect(excluido(protesis, salto)).toBe(true);
    // Con osteoporosis también: sacar gana sobre sumar.
    const ambas = mujer(['osteoporosis', 'joint_replacement']);
    expect(ambas.bloques.map((b) => b.modulo)).not.toContain('impacto');
  });

  it('hernia de disco o columna: el plan no cambia; la urgencia sale también con dolor lumbar', () => {
    const sano = resolverContexto(input({}));
    const columna = resolverContexto(input({ conditions: ['back_problem'] }));
    expect(columna.params).toEqual(sano.params);
    expect(columna.bloques).toEqual(sano.bloques);
    const avisos = columna.avisos.filter((a) => a.modulo === 'salud').map((a) => a.texto);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain('guardia');
    // Quien no marcó la condición pero declara dolor lumbar recibe la misma
    // señal de cauda equina (`docs/research/54`).
    const lumbar = resolverContexto(
      input({
        constraints: [
          {
            type: 'pain',
            bodyRegion: 'lower_back',
            exerciseId: null,
            equipmentId: null,
            severity: 3,
          },
        ],
      }),
    );
    expect(lumbar.avisos.some((a) => a.texto.includes('entre las piernas'))).toBe(true);
  });

  it('tendón: va por el camino del dolor crónico, no el de lesión, y trae su aviso', () => {
    // `docs/research/55`: la carga es el tratamiento (Kongsgaard 2009, Pavlova
    // 2023), y seguir con el dolor controlado no empeora (Silbernagel 2007).
    const zancada = ex('zancada', { pattern: 'lunge' });
    const salto = ex('salto', { isExplosive: true });
    const rodilla = (type: UserConstraint['type'], severity: number) =>
      resolverContexto(
        input({
          constraints: [
            { type, bodyRegion: 'knee', exerciseId: null, equipmentId: null, severity },
          ],
        }),
      );
    // Con 3, una lesión saca la zancada; un tendón, igual que un dolor, no.
    expect(excluido(rodilla('injury', 3), zancada)).toBe(true);
    expect(excluido(rodilla('tendinopathy', 3), zancada)).toBe(false);
    expect(excluido(rodilla('pain', 3), zancada)).toBe(false);
    // Desde 4, la regla de la zona aplica igual que a un dolor.
    expect(excluido(rodilla('tendinopathy', 4), zancada)).toBe(true);
    // Cuenta como molestia: sin saltos.
    expect(excluido(rodilla('tendinopathy', 2), salto)).toBe(true);

    const nota = V1_RESEARCH.safety?.tendinopathy?.note.replace('{region}', 'la rodilla');
    const tendon = rodilla('tendinopathy', 3).avisos.map((a) => a.texto);
    expect(tendon).toContain(nota);
    // No recibe la nota de lesión aguda, que le diría que no cargue.
    expect(tendon).not.toContain(V1_RESEARCH.safety?.acuteInjury.note);
    expect(rodilla('pain', 3).avisos.map((a) => a.texto)).not.toContain(nota);
  });

  describe('operación (`docs/research/56`)', () => {
    // `now` del input: 2026-09-10.
    const zancada = ex('zancada', { pattern: 'lunge' });
    const salto = ex('salto', { isExplosive: true });
    const reglas = V1_RESEARCH.safety?.postSurgery;
    const operado = (
      bodyRegion: UserConstraint['bodyRegion'],
      occurredOn: string,
      rehabDone: boolean,
    ) =>
      resolverContexto(
        input({
          constraints: [
            {
              type: 'surgery',
              bodyRegion,
              exerciseId: null,
              equipmentId: null,
              severity: 1,
              occurredOn,
              rehabDone,
            },
          ],
        }),
      );
    const textos = (ctx: ReturnType<typeof resolverContexto>) => ctx.avisos.map((a) => a.texto);

    it('en rehabilitación: la zona queda afuera entera, con el aviso de rehab y no el de dolor', () => {
      const ctx = operado('knee', '2026-08-01', false);
      expect(excluido(ctx, zancada)).toBe(true);
      expect(excluido(ctx, sentadilla)).toBe(true);
      expect(excluido(ctx, salto)).toBe(true);
      const t = textos(ctx);
      expect(t.some((x) => x.startsWith('Mientras dure la rehabilitación'))).toBe(true);
      // El consejo de dolor autoriza a cargar hasta 5 de 10: no va.
      expect(t).not.toContain(V1_RESEARCH.safety?.painMonitoring?.text);
      expect(t.some((x) => x.startsWith('Por la'))).toBe(false);
    });

    it('con el alta y menos de los meses del ruleset: entrena la rodilla, sin saltos ni impacto', () => {
      const ctx = operado('knee', '2026-06-01', true);
      expect(excluido(ctx, zancada)).toBe(false);
      expect(excluido(ctx, sentadilla)).toBe(false);
      expect(excluido(ctx, salto)).toBe(true);
      expect(textos(ctx)).toContain(reglas?.jumpFree.note);
      expect(textos(ctx).some((x) => x.startsWith('Mientras dure'))).toBe(false);
    });

    it('el borde de los meses: se cuentan meses cumplidos, no meses de calendario', () => {
      const meses = reglas?.jumpFree.months ?? 0;
      expect(meses).toBeGreaterThan(0);
      // 2025-12-15 → 2026-09-10: ocho meses y veintiséis días. Todavía no.
      expect(meses).toBe(9);
      expect(excluido(operado('knee', '2025-12-15', true), salto)).toBe(true);
      // 2025-12-10 → 2026-09-10: nueve cumplidos. Ya puede.
      expect(excluido(operado('knee', '2025-12-10', true), salto)).toBe(false);
    });

    it('con el alta y pasado el plazo, o en una zona sin plazo: el plan es el de alguien sano', () => {
      const sano = resolverContexto(input({}));
      for (const ctx of [
        operado('knee', '2025-01-01', true),
        operado('shoulder', '2026-08-01', true),
      ]) {
        expect(ctx.params).toEqual(sano.params);
        expect(excluido(ctx, salto)).toBe(false);
        expect(ctx.avisos).toEqual(sano.avisos);
      }
    });

    it('en potencia, el aviso de la operación explica los saltos; el de potencia no inventa otro motivo', () => {
      const i = input({
        goal: 'power',
        constraints: [
          {
            type: 'surgery',
            bodyRegion: 'knee',
            exerciseId: null,
            equipmentId: null,
            severity: 1,
            occurredOn: '2026-06-01',
            rehabDone: true,
          },
        ],
      });
      expect(resolverContexto(i).sinExplosivosConAviso).toBe(true);
      const w = createPlaceholderEngine().generatePlan(i).warnings;
      expect(w).toContain(reglas?.jumpFree.note);
      expect(w.some((t) => t.startsWith('Este plan no trae saltos'))).toBe(false);
    });

    it('una fecha que no se lee no inventa un plazo', () => {
      expect(excluido(operado('knee', 'no-es-fecha', true), salto)).toBe(false);
    });
  });

  describe('esguince (`docs/research/57`)', () => {
    // `now` del input: 2026-09-10.
    const cfg = V1_RESEARCH.sprain;
    const esguince = (bodyRegion: UserConstraint['bodyRegion'], occurredOn: string) => ({
      type: 'sprain' as const,
      bodyRegion,
      exerciseId: null,
      equipmentId: null,
      severity: 1,
      occurredOn,
    });
    const deEquilibrio = (ctx: ReturnType<typeof resolverContexto>) =>
      ctx.bloques.filter((b) => b.modulo === 'equilibrio');
    const unPie = ['un-pie-a', 'un-pie-b', 'un-pie-c', 'un-pie-d'].map((id) =>
      ex(id, { pattern: 'balance', isUnilateral: true, primaryMuscles: ['calves'] }),
    );
    const caminatas = ['caminata-a', 'caminata-b', 'caminata-c', 'caminata-d', 'caminata-e'].map(
      (id) => ex(id, { pattern: 'balance', primaryMuscles: ['calves'] }),
    );
    const conEquilibrio: GymSnapshot = {
      ...gym,
      exercises: [...gym.exercises, ...caminatas, ...unPie],
    };
    const bloqueDelPlan = (i: GeneratePlanInput) => {
      const plan = createPlaceholderEngine().generatePlan({ ...i, gym: conEquilibrio });
      const ids = new Set([...unPie, ...caminatas].map((e) => e.id));
      return (plan.sessions[0]?.items ?? [])
        .filter((it) => ids.has(it.exerciseId))
        .map((it) => it.exerciseId);
    };

    it('tobillo de hace dos meses: un bloque de equilibrio en un pie, con su aviso, sin sacar nada', () => {
      if (!cfg) throw new Error('sin bloque de esguince');
      const i = input({ constraints: [esguince('ankle', '2026-07-01')] });
      const ctx = resolverContexto(i);
      const bloques = deEquilibrio(ctx);
      expect(bloques).toHaveLength(1);
      expect(bloques[0]?.exercisesPerSession).toBe(cfg.exercisesPerSession);
      expect(bloques[0]?.unilateralesPrimero).toBe(cfg.exercisesPerSession);
      expect(ctx.avisos.map((a) => a.texto)).toContain(cfg.note.replace('{region}', 'el tobillo'));
      // No es una molestia: no saca ejercicios ni saltos.
      expect(excluido(ctx, ex('zancada', { pattern: 'lunge' }))).toBe(false);
      expect(excluido(ctx, ex('salto', { isExplosive: true }))).toBe(false);

      const elegidos = bloqueDelPlan(i);
      expect(elegidos).toHaveLength(cfg.exercisesPerSession);
      for (const id of elegidos) expect(id.startsWith('un-pie')).toBe(true);
    });

    it('la flexión de rodilla en un pie carga como una zancada: la saca quien saca la zancada', () => {
      const flexion = ex('flexion-un-pie', {
        pattern: 'balance',
        isUnilateral: true,
        isCompound: true,
      });
      const talon = ex('talon-un-pie', {
        pattern: 'balance',
        isUnilateral: true,
        isCompound: false,
        primaryMuscles: ['calves'],
      });
      const dolor = (bodyRegion: UserConstraint['bodyRegion'], severity: number) =>
        resolverContexto(
          input({
            constraints: [
              { type: 'pain', bodyRegion, exerciseId: null, equipmentId: null, severity },
            ],
          }),
        );
      // Rodilla, cadera y tobillo sacan la zancada desde 4 de 10.
      for (const zona of ['knee', 'hip', 'ankle'] as const) {
        expect(excluido(dolor(zona, 4), flexion)).toBe(true);
        expect(excluido(dolor(zona, 4), talon)).toBe(false);
      }
      expect(excluido(dolor('shoulder', 4), flexion)).toBe(false);
    });

    it('el borde del año: once meses cumplidos todavía; doce, ya no', () => {
      expect(cfg?.months).toBe(12);
      expect(
        deEquilibrio(resolverContexto(input({ constraints: [esguince('ankle', '2025-09-11')] }))),
      ).toHaveLength(1);
      expect(
        deEquilibrio(resolverContexto(input({ constraints: [esguince('ankle', '2025-09-10')] }))),
      ).toHaveLength(0);
    });

    it('en una zona sin programa, o con una fecha que no se lee, el plan es el de alguien sano', () => {
      const sano = resolverContexto(input({}));
      for (const c of [esguince('knee', '2026-07-01'), esguince('ankle', 'no-es-fecha')]) {
        const ctx = resolverContexto(input({ constraints: [c] }));
        expect(ctx.bloques).toEqual(sano.bloques);
        expect(ctx.avisos).toEqual(sano.avisos);
      }
    });

    it('un mayor con esguince: un solo bloque, el suyo, con los unilaterales primero', () => {
      const balance = V1_RESEARCH.balance;
      if (!cfg || !balance) throw new Error('sin bloques');
      const i = input({
        edad: balance.fromAge + 10,
        constraints: [esguince('ankle', '2026-07-01')],
      });
      const bloques = deEquilibrio(resolverContexto(i));
      expect(bloques).toHaveLength(1);
      expect(bloques[0]?.exercisesPerSession).toBe(balance.exercisesPerSession);
      expect(bloques[0]?.unilateralesPrimero).toBe(cfg.exercisesPerSession);

      const elegidos = bloqueDelPlan(i);
      expect(elegidos).toHaveLength(balance.exercisesPerSession);
      const primeros = elegidos.slice(0, cfg.exercisesPerSession);
      for (const id of primeros) expect(id.startsWith('un-pie')).toBe(true);
      // Sin esguince, el mayor no pide unilaterales.
      const sinEsguince = deEquilibrio(resolverContexto(input({ edad: balance.fromAge + 10 })));
      expect(sinEsguince[0]?.unilateralesPrimero).toBe(0);
    });
  });

  describe('movimientos que no puede (`docs/research/58`)', () => {
    const cfg = V1_RESEARCH.safety?.movementLimits;
    const noPuede = (movement: MovementLimit): UserConstraint => ({
      type: 'avoid_movement',
      bodyRegion: null,
      exerciseId: null,
      equipmentId: null,
      severity: 5,
      movement,
    });
    const deMovimiento = (ctx: ReturnType<typeof resolverContexto>) =>
      ctx.avisos.filter((a) => a.modulo === 'movimiento').map((a) => a.texto);

    it('cada movimiento saca lo que lo pide y nada más, desde la restricción', () => {
      for (const m of MOVEMENT_LIMITS) {
        const ctx = resolverContexto(input({ constraints: [noPuede(m)] }));
        const restriccion = ctx.exclusiones.find((e) => e.modulo === 'restriccion');
        for (const otro of MOVEMENT_LIMITS) {
          const pide = ex(`pide-${otro}`, { requiresMovements: [otro] });
          expect(excluido(ctx, pide), `${m} contra ${otro}`).toBe(otro === m);
          expect(restriccion?.excluye(pide), `${m} contra ${otro}`).toBe(otro === m);
        }
        // Uno que pide dos movimientos sale con cualquiera de los dos.
        expect(excluido(ctx, ex('dos', { requiresMovements: ['overhead', m] }))).toBe(true);
        expect(excluido(ctx, sentadilla)).toBe(false);
      }
    });

    it('no es una molestia: no saca saltos sueltos, ni el par, ni suma avisos de dolor', () => {
      const sano = resolverContexto(input({ sport: 'futbol', edad: 25 }));
      for (const m of MOVEMENT_LIMITS) {
        const ctx = resolverContexto(
          input({ sport: 'futbol', edad: 25, constraints: [noPuede(m)] }),
        );
        expect(ctx.explosivos).toEqual(sano.explosivos);
        expect(ctx.bloques).toEqual(sano.bloques);
        expect(ctx.painRules).toEqual([]);
        expect(ctx.avisos.filter((a) => a.modulo === 'molestia')).toEqual([]);
        // Un explosivo que no pide el movimiento sigue entrando.
        expect(excluido(ctx, ex('lanzamiento', { isExplosive: true }))).toBe(false);
      }
    });

    it('el aviso del piso sale solo con el piso, y una sola vez aunque esté dos veces', () => {
      const nota = cfg?.notes.floor;
      if (!nota) throw new Error('sin aviso de piso');
      const piso = resolverContexto(input({ constraints: [noPuede('floor'), noPuede('floor')] }));
      expect(deMovimiento(piso)).toEqual([nota]);
      for (const m of MOVEMENT_LIMITS.filter((x) => x !== 'floor')) {
        expect(deMovimiento(resolverContexto(input({ constraints: [noPuede(m)] })))).toEqual([]);
      }
    });

    it('una fila sin movimiento no saca nada', () => {
      const { movement: _, ...sinMovimiento } = noPuede('overhead');
      const ctx = resolverContexto(input({ constraints: [sinMovimiento] }));
      expect(excluido(ctx, ex('press', { requiresMovements: ['overhead'] }))).toBe(false);
    });

    describe('en el plan', () => {
      const pressMaquina = ex('press-maquina', {
        pattern: 'vertical_push',
        primaryMuscles: ['front_delts'],
        requiresMovements: ['overhead'],
      });
      const pressMancuernas = ex('press-mancuernas', {
        pattern: 'vertical_push',
        primaryMuscles: ['front_delts', 'side_delts'],
        requiresMovements: ['overhead'],
      });
      const laterales = ex('laterales', {
        pattern: 'isolation',
        primaryMuscles: ['front_delts', 'side_delts'],
        isCompound: false,
      });
      const dorsalera = ex('dorsalera', {
        pattern: 'vertical_pull',
        primaryMuscles: ['lats'],
        requiresMovements: ['overhead'],
      });
      const dominadas = ex('dominadas', {
        pattern: 'vertical_pull',
        primaryMuscles: ['lats'],
        requiresMovements: ['overhead', 'hanging'],
      });
      const remoDorsal = ex('remo-dorsal', {
        pattern: 'horizontal_pull',
        primaryMuscles: ['lats'],
      });
      const conHombro: GymSnapshot = {
        ...gym,
        exercises: [
          ...gym.exercises,
          pressMaquina,
          pressMancuernas,
          laterales,
          dorsalera,
          dominadas,
          remoDorsal,
        ],
      };
      const plan = (constraints: UserConstraint[]) =>
        createPlaceholderEngine().generatePlan({ ...input({ constraints }), gym: conHombro });
      const ids = (p: ReturnType<typeof plan>) =>
        new Set(p.sessions.flatMap((s) => s.items.map((i) => i.exerciseId)));

      it('sin brazos arriba se van el empuje y el tirón verticales, y el aviso dice por qué', () => {
        const texto = cfg?.substitutionText;
        if (!texto) throw new Error('sin texto de sustitución');
        const sano = plan([]);
        expect(ids(sano).has(pressMaquina.id) || ids(sano).has(pressMancuernas.id)).toBe(true);

        const p = plan([noPuede('overhead')]);
        for (const e of [pressMaquina, pressMancuernas, dorsalera, dominadas]) {
          expect(ids(p).has(e.id), e.id).toBe(false);
        }
        const [antes] = texto
          .replace('{movement}', 'llevar los brazos arriba de la cabeza')
          .split('{session}');
        if (!antes) throw new Error('el texto no lleva {session}');
        // Uno por patrón: el empuje en la sesión A y el tirón en la B.
        expect(p.warnings.filter((w) => w.startsWith(antes))).toHaveLength(2);
        // Y el día no queda corto: el complemento ocupa el lugar.
        expect(ids(p).has(laterales.id)).toBe(true);
        expect(ids(p).has(remoDorsal.id)).toBe(true);
      });

      it('sin colgarse queda la dorsalera: no hay patrón vacío ni aviso', () => {
        const p = plan([noPuede('hanging')]);
        expect(ids(p).has(dominadas.id)).toBe(false);
        expect(ids(p).has(dorsalera.id)).toBe(true);
        expect(p.warnings.some((w) => w.includes('no podés colgarte'))).toBe(false);
      });

      it('sin nada con qué sustituir, el aviso igual nombra el movimiento', () => {
        const texto = cfg?.emptyText;
        if (!texto) throw new Error('sin texto de patrón vacío');
        const sinLaterales = {
          ...conHombro,
          exercises: conHombro.exercises.filter((e) => e.id !== laterales.id),
        };
        const p = createPlaceholderEngine().generatePlan({
          ...input({ constraints: [noPuede('overhead')] }),
          gym: sinLaterales,
        });
        const esperado = texto
          .replace('{movement}', 'llevar los brazos arriba de la cabeza')
          .replace('{session}', 'Sesión A')
          .replace('{pattern}', 'empuje vertical');
        expect(p.warnings).toContain(esperado);
      });

      it('"cambiar ejercicio" tampoco ofrece lo que pide el movimiento', () => {
        const opciones = (constraints: UserConstraint[]) =>
          createPlaceholderEngine()
            .findSubstitutes({
              context: { now: '2026-09-10T12:00:00.000Z', seed: 1 },
              item: { exerciseId: dorsalera.id, equipmentId: null },
              gym: conHombro,
              constraints,
              unavailableEquipmentIds: [],
              ruleset: V1_RESEARCH,
            })
            .map((o) => o.exerciseId);
        expect(opciones([])).toContain(dominadas.id);
        expect(opciones([noPuede('hanging')])).not.toContain(dominadas.id);
      });
    });

    describe('potencia', () => {
      const nota = cfg?.noExplosiveNote ?? '';
      const salto = ex('salto', { isExplosive: true, requiresMovements: ['jumping'] });
      const lanzamiento = ex('lanzamiento', {
        pattern: 'horizontal_push',
        primaryMuscles: ['chest'],
        isExplosive: true,
      });
      const avisos = (exercises: Exercise[], edad: number, constraints: UserConstraint[]) =>
        createPlaceholderEngine().generatePlan({
          ...input({ goal: 'power', edad, constraints }),
          gym: { ...gym, exercises: [...gym.exercises, ...exercises] },
        }).warnings;
      const porMovimiento = nota.replace('{movement}', 'saltar');
      const generico = (w: readonly string[]) =>
        w.some((x) => x.startsWith('Este plan no trae saltos') && x !== porMovimiento);

      it('si todo lo explosivo pide saltar, el aviso lo dice en vez de culpar a una molestia', () => {
        const w = avisos([salto], 25, [noPuede('jumping')]);
        expect(w).toContain(porMovimiento);
        expect(generico(w)).toBe(false);
      });

      it('si queda un lanzamiento, el par lo usa y no hay aviso', () => {
        const w = avisos([salto, lanzamiento], 25, [noPuede('jumping')]);
        expect(w).not.toContain(porMovimiento);
        expect(generico(w)).toBe(false);
      });

      it('si lo que sacó lo explosivo fue la edad, el aviso no culpa al movimiento', () => {
        const w = avisos([salto, lanzamiento], 85, [noPuede('jumping')]);
        expect(w).not.toContain(porMovimiento);
        expect(generico(w)).toBe(true);
      });

      it('con una molestia, la razón es la molestia', () => {
        const leve: UserConstraint = { ...lesionRodilla, type: 'pain', severity: 1 };
        const i = input({ goal: 'power', constraints: [noPuede('jumping'), leve] });
        const sinMolestia = input({ goal: 'power', constraints: [noPuede('jumping')] });
        const conSalto = { ...gym, exercises: [...gym.exercises, salto] };
        expect(resolverContexto({ ...sinMolestia, gym: conSalto }).explosivosPorMovimiento).toEqual(
          ['jumping'],
        );
        expect(resolverContexto({ ...i, gym: conSalto }).explosivosPorMovimiento).toEqual([]);
      });

      it('un explosivo de bloque no cuenta: no entra al par (`docs/research/63`)', () => {
        // Un aterrizaje de rodilla que no pidiera saltar no deja al par con qué armarse.
        const deBloque = ex('aterrizaje', { isExplosive: true, prevents: ['knee'] });
        const i = input({ goal: 'power', constraints: [noPuede('jumping')] });
        const conAmbos = { ...gym, exercises: [...gym.exercises, salto, deBloque] };
        expect(resolverContexto({ ...i, gym: conAmbos }).explosivosPorMovimiento).toEqual([
          'jumping',
        ]);
      });
    });
  });

  it('asma: el plan no cambia, sale el aviso del broncodilatador', () => {
    const sano = resolverContexto(input({}));
    const asma = resolverContexto(input({ conditions: ['asthma'] }));
    expect(asma.params).toEqual(sano.params);
    expect(asma.avisos.filter((a) => a.modulo === 'salud')).toHaveLength(1);
  });

  it('hernia abdominal: el plan no cambia, sale el aviso de urgencia', () => {
    const sano = resolverContexto(input({}));
    const hernia = resolverContexto(input({ conditions: ['abdominal_hernia'] }));
    expect(hernia.params).toEqual(sano.params);
    expect(hernia.bloques).toEqual(sano.bloques);
    expect(hernia.avisos.filter((a) => a.modulo === 'salud')).toHaveLength(1);
  });

  it('con una molestia declarada no hay bloque explosivo, aunque el deporte lo pida', () => {
    const leve: UserConstraint = { ...lesionRodilla, type: 'pain', severity: 1 };
    expect(resolverContexto(input({ sport: 'futbol', edad: 25 })).explosivos).not.toBeNull();
    const conLeve = resolverContexto(input({ sport: 'futbol', edad: 25, constraints: [leve] }));
    expect(conLeve.explosivos).toBeNull();
    // Tampoco por un slot común: el selector solo *prefiere* no explosivos, y
    // cuando no quedaba otro core, entraba el lanzamiento suelto.
    const lanzamiento = ex('lanzamiento', { pattern: 'core', isExplosive: true });
    expect(excluido(conLeve, lanzamiento)).toBe(true);
    expect(excluido(resolverContexto(input({ edad: 25 })), lanzamiento)).toBe(false);
  });
});

describe('prevención del deporte (`docs/research/62`)', () => {
  const cfg = V1_RESEARCH.sports?.prevention;
  const isquios = cfg?.programs.find((p) => p.id === 'hamstring');
  const nordico = ex('nordico', {
    pattern: 'isolation',
    primaryMuscles: ['hamstrings'],
    isCompound: false,
    prevents: ['hamstring'],
  });

  function conFase(sport: string | null, seasonPhase: 'none' | 'in_season' | 'preseason') {
    const i = input({ sport, edad: 25 });
    const goals = i.user.goals.map((g) => ({ ...g, seasonPhase }));
    return resolverContexto({ ...i, user: { ...i.user, goals } });
  }
  const dePrevencion = (ctx: ReturnType<typeof resolverContexto>) =>
    ctx.bloques.filter((b) => b.modulo === 'deporte');

  it('el ruleset trae el programa de isquios y la entrada en calor del fútbol', () => {
    expect(isquios, 'sin programa de isquios').toBeDefined();
    expect(cfg?.notes.length).toBeGreaterThan(0);
  });

  type Programa = NonNullable<typeof cfg>['programs'][number];

  /** El bloque de un programa para un deporte y una fase, contra lo que dice el ruleset. */
  function revisarBloque(p: Programa, sport: string, fase: 'none' | 'in_season') {
    // Un ejercicio de ese programa y nada más: el bloque que lo trae es el suyo.
    const suyo = ex(`de-${p.id}`, { prevents: [p.id] });
    const bloques = dePrevencion(conFase(sport, fase)).filter((b) => b.entra(suyo));
    if (!p.sports.includes(sport)) {
      expect(bloques, `${p.id}/${sport}`).toEqual([]);
      return;
    }
    expect(bloques, `${p.id}/${sport}`).toHaveLength(1);
    const [b] = bloques;
    expect(b?.soloPierna).toBe(true);
    expect(b?.maxSesiones).toBe(fase === 'in_season' ? p.inSeasonSessions : null);
    expect([b?.exercisesPerSession, b?.sets, b?.repsMin, b?.repsMax, b?.restSeconds]).toEqual([
      p.exercisesPerSession,
      p.sets,
      p.repsMin,
      p.repsMax,
      p.restSeconds,
    ]);
  }

  it('un bloque por programa, solo en sus deportes, con su dosis y su tope', () => {
    const programas = cfg?.programs ?? [];
    expect(programas.length).toBeGreaterThan(1);
    const casos = programas.flatMap((p) =>
      (V1_RESEARCH.sports?.catalog ?? []).flatMap((s) =>
        (['none', 'in_season'] as const).map((fase) => ({ p, sport: s.id, fase })),
      ),
    );
    for (const { p, sport, fase } of casos) revisarBloque(p, sport, fase);
    expect(casos.length).toBeGreaterThan(programas.length * 20);
    expect(dePrevencion(conFase(null, 'none'))).toEqual([]);
  });

  it('trae los ejercicios de su programa y ninguno más', () => {
    const b = dePrevencion(conFase('futbol', 'none')).find((x) => x.entra(nordico));
    expect(b?.entra(nordico)).toBe(true);
    expect(b?.entra(pesoMuerto)).toBe(false);
    expect(b?.entra(ex('equilibrio', { pattern: 'balance' }))).toBe(false);
  });

  it('en temporada, en tantas sesiones como diga el programa; fuera de temporada, en todas', () => {
    expect(dePrevencion(conFase('futbol', 'in_season'))[0]?.maxSesiones).toBe(
      isquios?.inSeasonSessions,
    );
    expect(dePrevencion(conFase('futbol', 'preseason'))[0]?.maxSesiones).toBeNull();
  });

  it('va antes que el impacto y el equilibrio, que cierran la sesión', () => {
    const i = input({ sport: 'futbol', edad: 70 });
    const modulos = resolverContexto(i).bloques.map((b) => b.modulo);
    expect(modulos[0]).toBe('deporte');
    expect(modulos).toContain('equilibrio');
  });

  it('el aviso de la entrada en calor sale solo en los deportes de su nota', () => {
    for (const nota of cfg?.notes ?? []) {
      for (const s of V1_RESEARCH.sports?.catalog ?? []) {
        const avisos = conFase(s.id, 'none').avisos.map((a) => a.texto);
        expect(avisos.includes(nota.text), s.id).toBe(nota.sports.includes(s.id));
      }
    }
  });
});
