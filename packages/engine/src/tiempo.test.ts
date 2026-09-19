import type { Equipment, EquipmentCategory, Exercise } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import type { SessionItemBlueprint } from './contract.ts';
import { V1_RESEARCH } from './index.ts';
import type { SlotRole } from './ruleset.ts';
import {
  ajustarAlTiempo,
  type SesionAAjustar,
  segundosDeSesion,
  type TimeConfig,
} from './tiempo.ts';

/**
 * El ajuste al tiempo (`docs/research/59`), paso por paso. La configuración es
 * propia del test: los números tienen que ser fáciles de seguir a mano, y el
 * ruleset real se prueba en la matriz y el barrido.
 */

const cfg: TimeConfig = {
  secondsPerSet: 30,
  restFloorSeconds: { beginner: 90, novice: 90, intermediate: 120, advanced: 120 },
  pairIntraRestSeconds: 0,
  antagonists: [
    ['horizontal_push', 'horizontal_pull'],
    ['vertical_push', 'vertical_pull'],
  ],
  noPairEquipment: ['free_weight', 'rack'],
  fittedNote: 'Para {minutos}: {cambios}.',
  changes: {
    rest: 'pausa',
    pairs: 'pares',
    isolation: 'aislados',
    sets: 'series',
    cardio: 'cardio',
    blocks: 'bloques',
  },
  overNote: 'No entra en {minutos}: {sesiones}.',
  sessionOver: '{sesion} dura {estimado}',
  confidence: 'medium',
};

function ex(id: string, over: Partial<Exercise> = {}): Exercise {
  return {
    id,
    gymId: 'g',
    name: id,
    pattern: 'squat',
    primaryMuscles: ['quads'],
    secondaryMuscles: [],
    modality: 'reps_weight',
    isCompound: true,
    isUnilateral: false,
    isExplosive: false,
    loadsSpinalFlexion: false,
    headBelowHeart: false,
    requiresMovements: [],
    prevents: [],
    skillLevel: 'beginner',
    cues: null,
    equipmentIds: [],
    ...over,
  };
}

function eq(id: string, category: EquipmentCategory): Equipment {
  return {
    id,
    gymId: 'g',
    name: id,
    category,
    brand: null,
    model: null,
    photoUrl: null,
    locationNote: null,
    setupNotes: null,
    load: { unit: 'kg' },
    quantity: 1,
    isActive: true,
  };
}

const EJ = [
  ex('prensa', { primaryMuscles: ['quads', 'glutes'] }),
  ex('sentadilla-barra', { primaryMuscles: ['quads', 'glutes'] }),
  ex('press-pecho', { pattern: 'horizontal_push', primaryMuscles: ['chest'] }),
  ex('remo', { pattern: 'horizontal_pull', primaryMuscles: ['back'] }),
  ex('press-hombro', { pattern: 'vertical_push', primaryMuscles: ['front_delts'] }),
  ex('dorsalera', { pattern: 'vertical_pull', primaryMuscles: ['lats'] }),
  ex('curl', { pattern: 'isolation', primaryMuscles: ['biceps'], isCompound: false }),
  ex('triceps', { pattern: 'isolation', primaryMuscles: ['triceps'], isCompound: false }),
  ex('aductores', { pattern: 'isolation', primaryMuscles: ['quads'], isCompound: false }),
  ex('salto', { isExplosive: true }),
  ex('equilibrio-1', { pattern: 'balance', primaryMuscles: ['glutes'], isCompound: false }),
  ex('equilibrio-2', { pattern: 'balance', primaryMuscles: ['glutes'], isCompound: false }),
  ex('caminata', { pattern: 'cardio', primaryMuscles: ['full_body'], modality: 'time' }),
];
const exerciseById = new Map(EJ.map((e) => [e.id, e]));
const EQ = [eq('maquina', 'selectorized'), eq('barra', 'rack'), eq('mancuernas', 'free_weight')];
const equipmentById = new Map(EQ.map((e) => [e.id, e]));

function item(
  exerciseId: string,
  sets: number,
  rest: number,
  over: Partial<SessionItemBlueprint> = {},
): SessionItemBlueprint {
  return {
    exerciseId,
    equipmentId: 'maquina',
    orderIndex: 0,
    targetSets: sets,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetLoad: null,
    targetRir: 2,
    restSeconds: rest,
    rationale: '',
    isPlaceholder: false,
    targetDurationSeconds: null,
    targetIntensityZone: null,
    targetIntervalRestSeconds: null,
    supersetGroup: null,
    ...over,
  };
}

function sesion(
  items: SessionItemBlueprint[],
  roles: Record<string, SlotRole> = {},
  label = 'Sesión A',
): SesionAAjustar {
  return {
    label,
    items: items.map((it, i) => ({ ...it, orderIndex: i })),
    roles: new Map(Object.entries(roles)),
  };
}

function ajustar(
  sesiones: SesionAAjustar[],
  minutos: number,
  over: { pisoSemanal?: number; vecesPorSemana?: number[] } = {},
) {
  return ajustarAlTiempo({
    sesiones,
    cfg,
    minutos,
    level: 'beginner',
    vecesPorSemana: over.vecesPorSemana ?? sesiones.map(() => 1),
    pisoSemanal: over.pisoSemanal ?? 0,
    exerciseById,
    equipmentById,
  });
}

const minutosDe = (items: readonly SessionItemBlueprint[]) => segundosDeSesion(items, cfg) / 60;
const ids = (items: readonly SessionItemBlueprint[]) => items.map((i) => i.exerciseId);

describe('cuánto dura una sesión', () => {
  it('cada serie más su pausa', () => {
    // 3 × (30 + 90) + 2 × (30 + 60) = 360 + 180
    expect(segundosDeSesion([item('prensa', 3, 90), item('curl', 2, 60)], cfg)).toBe(540);
  });

  it('el cardio va por su duración y la pausa de cada vuelta', () => {
    const continuo = item('caminata', 1, 0, { targetDurationSeconds: 1200, targetRir: null });
    const intervalos = item('caminata', 4, 0, {
      targetDurationSeconds: 60,
      targetIntervalRestSeconds: 120,
      targetRir: null,
    });
    expect(segundosDeSesion([continuo], cfg)).toBe(1200);
    expect(segundosDeSesion([intervalos], cfg)).toBe(4 * 180);
  });

  it('el ruleset real trae la configuración', () => {
    expect(V1_RESEARCH.sessionTime).toBeDefined();
  });
});

describe('ajustar al tiempo', () => {
  it('si entra, no toca nada', () => {
    const s = sesion([item('prensa', 3, 180), item('press-pecho', 3, 180)]);
    const r = ajustar([s], 60);
    expect(r.sesiones[0]).toEqual(s.items);
    expect(r.cambios).toEqual([]);
    expect(r.excedidas).toEqual([]);
  });

  it('1. baja la pausa hasta el piso del nivel, y si con eso entra, para ahí', () => {
    // 2 × 3 × (30 + 180) = 21 min; con 90 s son 12.
    const s = sesion([item('prensa', 3, 180), item('press-pecho', 3, 180)]);
    const r = ajustar([s], 12);
    expect(r.sesiones[0]?.map((i) => i.restSeconds)).toEqual([90, 90]);
    expect(r.sesiones[0]?.every((i) => i.supersetGroup === null)).toBe(true);
    expect(r.cambios).toEqual(['rest']);
  });

  it('1. la pausa nunca sube, y no toca lo que no se regula por RIR', () => {
    const s = sesion([
      item('prensa', 3, 60),
      item('press-pecho', 3, 240, { targetRir: null }),
      item('remo', 3, 240),
    ]);
    // 31,5 min; con la pausa del remo en el piso, 24: para ahí.
    const r = ajustar([s], 24);
    const pausa = (id: string) => r.sesiones[0]?.find((i) => i.exerciseId === id)?.restSeconds;
    expect(pausa('prensa')).toBe(60);
    // Potencia (RIR nulo): su pausa larga es la dosis, no relleno.
    expect(pausa('press-pecho')).toBe(240);
    expect(pausa('remo')).toBe(90);
    expect(r.cambios).toEqual(['rest']);
  });

  it('2. junta primero antagonistas: sin pausa adentro, la de la vuelta al final', () => {
    const s = sesion([item('press-pecho', 3, 90), item('prensa', 3, 90), item('remo', 3, 90)]);
    const r = ajustar([s], 10);
    const out = r.sesiones[0] ?? [];
    expect(ids(out).slice(0, 2)).toEqual(['press-pecho', 'remo']);
    expect(out[0]?.supersetGroup).toBe(1);
    expect(out[1]?.supersetGroup).toBe(1);
    expect(out[0]?.restSeconds).toBe(0);
    expect(out[1]?.restSeconds).toBe(90);
    expect(r.cambios).toContain('pairs');
  });

  it('2. nunca junta dos que comparten un músculo principal', () => {
    const s = sesion([item('prensa', 3, 90), item('aductores', 3, 90)]);
    const r = ajustar([s], 1);
    expect(r.sesiones[0]?.some((i) => i.supersetGroup !== null)).toBe(false);
  });

  it('2. nunca junta un multiarticular de peso libre o de rack', () => {
    const s = sesion([
      item('sentadilla-barra', 3, 90, { equipmentId: 'barra' }),
      item('press-pecho', 3, 90),
      item('press-hombro', 3, 90, { equipmentId: 'mancuernas' }),
    ]);
    const r = ajustar([s], 1);
    for (const id of ['sentadilla-barra', 'press-hombro']) {
      expect(r.sesiones[0]?.find((i) => i.exerciseId === id)?.supersetGroup ?? null).toBeNull();
    }
  });

  it('2. no toca el par explosivo', () => {
    const s = sesion([
      item('prensa', 3, 60, { supersetGroup: 1 }),
      item('salto', 3, 180, { supersetGroup: 1, targetRir: null }),
      item('press-pecho', 3, 90),
      item('remo', 3, 90),
    ]);
    // 27 min; juntando pecho y remo, 22,5.
    const r = ajustar([s], 23);
    const out = r.sesiones[0] ?? [];
    expect(out.slice(0, 2).map((i) => [i.exerciseId, i.restSeconds, i.supersetGroup])).toEqual([
      ['prensa', 60, 1],
      ['salto', 180, 1],
    ]);
    // El nuevo par sigue la numeración.
    expect(out.find((i) => i.exerciseId === 'remo')?.supersetGroup).toBe(2);
  });

  it('3. saca los aislados desde el final y deja los multiarticulares', () => {
    const s = sesion([
      item('prensa', 3, 90, { equipmentId: 'barra' }),
      item('sentadilla-barra', 3, 90, { equipmentId: 'barra' }),
      item('curl', 3, 90),
      item('triceps', 3, 90),
    ]);
    // Sin pares posibles (rack): 24 min. Sin el tríceps, 18.
    const r = ajustar([s], 18);
    expect(ids(r.sesiones[0] ?? [])).toEqual(['prensa', 'sentadilla-barra', 'curl']);
    expect(r.cambios).toContain('isolation');
    expect(r.cambios).not.toContain('sets');
  });

  it('3. si el aislado iba de a dos, el compañero queda solo con la pausa de la vuelta', () => {
    const s = sesion([
      item('sentadilla-barra', 4, 90, { equipmentId: 'barra' }),
      item('press-pecho', 3, 90),
      item('curl', 3, 90),
    ]);
    // Con 1 minuto no entra nada: pasa por todos los pasos.
    const r = ajustar([s], 1);
    const pecho = r.sesiones[0]?.find((i) => i.exerciseId === 'press-pecho');
    expect(ids(r.sesiones[0] ?? [])).not.toContain('curl');
    expect(pecho?.supersetGroup).toBeNull();
    expect(pecho?.restSeconds).toBe(90);
  });

  it('4. baja primero al que más series tiene, y entre iguales al secundario', () => {
    const s = sesion(
      [
        item('prensa', 3, 90, { equipmentId: 'barra' }),
        item('dorsalera', 3, 90, { equipmentId: 'barra' }),
      ],
      { prensa: 'primary', dorsalera: 'secondary' },
    );
    // Sin pares posibles (rack): 6 × 2 = 12 min. Con 10, una serie menos.
    const r = ajustar([s], 10);
    expect(r.sesiones[0]?.map((i) => i.targetSets)).toEqual([3, 2]);
    expect(r.cambios).toEqual(['sets']);
  });

  it('4. nunca baja de una serie', () => {
    const s = sesion([item('prensa', 3, 90, { equipmentId: 'barra' })]);
    const r = ajustar([s], 1);
    expect(r.sesiones[0]?.[0]?.targetSets).toBe(1);
    expect(r.excedidas).toEqual([{ label: 'Sesión A', minutos: 2 }]);
  });

  it('4. no deja un músculo trabajado con multiarticulares abajo del piso semanal', () => {
    const s = sesion([
      item('prensa', 3, 90, { equipmentId: 'barra' }),
      item('dorsalera', 3, 90, { equipmentId: 'barra' }),
    ]);
    // Dos veces por semana: 6 series de cada uno. Piso 4: cada uno baja a 2.
    const r = ajustar([s], 1, { pisoSemanal: 4, vecesPorSemana: [2] });
    expect(r.sesiones[0]?.map((i) => i.targetSets)).toEqual([2, 2]);
  });

  it('4. el piso cuenta las series de todas las sesiones, después de sacar los aislados de todas', () => {
    // La A tiene la sentadilla; la B, aductores (cuádriceps) y press. Si la A
    // bajara series antes de que la B saque sus aductores, contaría las series
    // de un aislado que después se va.
    const a = sesion([item('sentadilla-barra', 3, 90, { equipmentId: 'barra' })], {}, 'A');
    const b = sesion(
      [item('press-pecho', 3, 90, { equipmentId: 'barra' }), item('aductores', 3, 90)],
      {},
      'B',
    );
    const r = ajustar([a, b], 1, { pisoSemanal: 3 });
    expect(ids(r.sesiones[1] ?? [])).toEqual(['press-pecho']);
    expect(r.sesiones[0]?.[0]?.targetSets).toBe(3);
  });

  it('4. con menos días que sesiones, cuenta el promedio de la rotación', () => {
    const s = sesion([item('prensa', 4, 90, { equipmentId: 'barra' })]);
    // Media vez por semana: 4 series de prensa son 2 por semana, ya abajo de 3.
    // Contada entera, eran 4 y bajaba hasta 3.
    const r = ajustar([s], 1, { pisoSemanal: 3, vecesPorSemana: [0.5] });
    expect(r.sesiones[0]?.[0]?.targetSets).toBe(4);
  });

  it('5. los bloques van últimos: primero el explosivo del par, después los de más', () => {
    const s = sesion([
      item('prensa', 1, 60, { supersetGroup: 1, equipmentId: 'barra' }),
      item('salto', 1, 180, { supersetGroup: 1, targetRir: null }),
      item('equilibrio-1', 2, 60, { targetRir: null }),
      item('equilibrio-2', 2, 60, { targetRir: null }),
    ]);
    const r = ajustar([s], 1);
    const out = r.sesiones[0] ?? [];
    expect(ids(out)).toEqual(['prensa', 'equilibrio-1']);
    expect(out[0]?.supersetGroup).toBeNull();
    expect(out[0]?.restSeconds).toBe(180);
    expect(r.cambios).toEqual(['blocks']);
  });

  it('5. si achicar lo demás alcanza, los bloques quedan enteros', () => {
    const s = sesion([
      item('prensa', 3, 90, { equipmentId: 'barra' }),
      item('curl', 3, 90),
      item('equilibrio-1', 2, 60, { targetRir: null }),
      item('equilibrio-2', 2, 60, { targetRir: null }),
    ]);
    // 6 + 6 + 3 + 3 = 18 min; sin el curl, 12.
    const r = ajustar([s], 12);
    expect(ids(r.sesiones[0] ?? [])).toEqual(['prensa', 'equilibrio-1', 'equilibrio-2']);
  });

  it('los cambios salen en el orden del recorte, sin repetir', () => {
    const a = sesion(
      [item('prensa', 4, 180, { equipmentId: 'barra' }), item('curl', 3, 90)],
      {},
      'A',
    );
    const b = sesion([item('press-pecho', 3, 180), item('remo', 3, 180)], {}, 'B');
    const r = ajustar([a, b], 3);
    expect(r.cambios).toEqual(['rest', 'pairs', 'isolation', 'sets']);
  });

  it('el orden de los ítems queda numerado de corrido', () => {
    const s = sesion([item('press-pecho', 3, 90), item('prensa', 3, 90), item('remo', 3, 90)]);
    const r = ajustar([s], 10);
    expect(r.sesiones[0]?.map((i) => i.orderIndex)).toEqual([0, 1, 2]);
  });

  it('nunca toca repeticiones ni RIR', () => {
    const s = sesion([
      item('prensa', 4, 180, {
        equipmentId: 'barra',
        targetRepsMin: 3,
        targetRepsMax: 5,
        targetRir: 1,
      }),
      item('curl', 3, 90),
    ]);
    const r = ajustar([s], 1);
    expect(r.sesiones[0]?.[0]).toMatchObject({ targetRepsMin: 3, targetRepsMax: 5, targetRir: 1 });
  });

  it('lo que aun achicado no entra se devuelve con su duración', () => {
    // Los intervalos no se acortan: 4 × (4 + 3) = 28 min.
    const intervalos = item('caminata', 4, 180, {
      targetDurationSeconds: 240,
      targetIntervalRestSeconds: 180,
      targetRir: null,
    });
    const r = ajustar([sesion([intervalos])], 20);
    expect(r.excedidas).toEqual([{ label: 'Sesión A', minutos: 28 }]);
    expect(minutosDe(r.sesiones[0] ?? [])).toBe(28);
  });

  it('5. el cardio continuo se acorta a lo que queda, en minutos enteros', () => {
    const continuo = item('caminata', 1, 0, { targetDurationSeconds: 2400, targetRir: null });
    // 40 min de cinta + 2 × (30 + 60) s de abdominales = 43 min.
    const s = sesion([continuo, item('curl', 2, 60)]);
    const r = ajustar([s], 30);
    // Primero se va el aislado; recién después se acorta el cardio, a 30.
    expect(ids(r.sesiones[0] ?? [])).toEqual(['caminata']);
    expect(r.sesiones[0]?.[0]?.targetDurationSeconds).toBe(1800);
    expect(r.cambios).toEqual(['isolation', 'cardio']);
    expect(r.excedidas).toEqual([]);
  });

  it('5. el cardio va después de las series y antes de los bloques', () => {
    const s = sesion([
      item('prensa', 3, 90, { equipmentId: 'barra' }),
      item('caminata', 1, 0, { targetDurationSeconds: 1200, targetRir: null }),
      item('equilibrio-1', 2, 60, { targetRir: null }),
      item('equilibrio-2', 2, 60, { targetRir: null }),
    ]);
    // 6 + 20 + 3 + 3 = 32 min. Con 20: la prensa baja a 1 serie (2 min), y el
    // cardio queda en lo que sobra con los dos bloques enteros: 20 - 2 - 6 = 12.
    const r = ajustar([s], 20);
    const out = r.sesiones[0] ?? [];
    expect(out.find((i) => i.exerciseId === 'prensa')?.targetSets).toBe(1);
    expect(out.find((i) => i.exerciseId === 'caminata')?.targetDurationSeconds).toBe(720);
    expect(ids(out)).toContain('equilibrio-2');
    expect(r.cambios).toEqual(['sets', 'cardio']);
  });

  it('5. el cardio no baja de un minuto, y los intervalos no se tocan', () => {
    const continuo = item('caminata', 1, 0, { targetDurationSeconds: 600, targetRir: null });
    const intervalos = item('caminata', 4, 180, {
      targetDurationSeconds: 240,
      targetIntervalRestSeconds: 180,
      targetRir: null,
    });
    const r = ajustar([sesion([continuo]), sesion([intervalos], {}, 'B')], 0);
    expect(r.sesiones[0]?.[0]?.targetDurationSeconds).toBe(60);
    expect(r.sesiones[1]?.[0]).toEqual({ ...intervalos, orderIndex: 0 });
  });
});
