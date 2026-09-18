import type { Exercise, UserConstraint } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { excluido, ordenarAvisos, resolverContexto } from './contexto.ts';
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

  it('con una molestia declarada no hay bloque explosivo, aunque el deporte lo pida', () => {
    const leve: UserConstraint = { ...lesionRodilla, type: 'pain', severity: 1 };
    expect(resolverContexto(input({ sport: 'futbol', edad: 25 })).explosivos).not.toBeNull();
    expect(
      resolverContexto(input({ sport: 'futbol', edad: 25, constraints: [leve] })).explosivos,
    ).toBeNull();
  });
});
