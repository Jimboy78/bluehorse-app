import type { Exercise } from '@bh/domain';
import type { GymSnapshot } from '@bh/engine';
import { describe, expect, it } from 'vitest';
import { activeRuleset } from './engine.ts';
import { ajustarAlPartido } from './partido.ts';
import type { ActiveSessionItem } from './plan.ts';

/**
 * EL AJUSTE DEL PARTIDO EN LA PANTALLA (`docs/research/65`)
 *
 * `ajustarAlPartido` pasa los ítems de Hoy por `adjustSession` y vuelve. Lo que
 * se prueba es la ida y la vuelta: que cada ítem vuelva a ser el suyo (id,
 * nombre, carga) con lo que el motor cambió, y que lo que sale no vuelva.
 */

function ejercicio(id: string, over: Partial<Exercise>): Exercise {
  return {
    id,
    gymId: 'gym',
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
    jumpDirection: null,
    skillLevel: 'beginner',
    cues: null,
    equipmentIds: [],
    ...over,
  };
}

const gym: GymSnapshot = {
  gymId: 'gym',
  equipment: [],
  exercises: [
    ejercicio('sentadilla', {}),
    ejercicio('salto', { isExplosive: true }),
    ejercicio('press', { pattern: 'horizontal_push', primaryMuscles: ['chest'] }),
  ],
  substitutions: [],
};

function item(id: string, exerciseId: string, over: Partial<ActiveSessionItem> = {}) {
  const base: ActiveSessionItem = {
    id,
    exerciseId,
    equipmentId: null,
    name: `nombre de ${id}`,
    sector: null,
    pattern: 'squat',
    primaryMuscles: ['quads'],
    load: '60 kg',
    targetLoad: { value: 60, unit: 'kg' },
    equipmentLoadSpec: null,
    sets: 4,
    repsTarget: 8,
    reps: '6-10',
    targetRir: 2,
    restSeconds: 120,
    rationale: 'por qué',
    isPlaceholder: false,
    durationSeconds: null,
    intensityZone: null,
    intervalRestSeconds: null,
    zone: null,
    toFailure: false,
    isUnilateral: false,
    pct1rm: null,
    supersetGroup: null,
  };
  return { ...base, ...over };
}

const sesion = [
  item('i-sentadilla', 'sentadilla', { supersetGroup: 1, restSeconds: 30 }),
  item('i-salto', 'salto', { supersetGroup: 1, restSeconds: 180 }),
  item('i-press', 'press', { pattern: 'horizontal_push', primaryMuscles: ['chest'] }),
];

describe('ajustarAlPartido (`docs/research/65`)', () => {
  const reglas = activeRuleset.sports?.matchDay;
  if (!reglas) throw new Error('el ruleset no trae matchDay');

  it('el día normal devuelve la sesión tal cual, sin nota', () => {
    const out = ajustarAlPartido(sesion, gym, 'normal');
    expect(out.items).toBe(sesion);
    expect(out.nota).toBeNull();
  });

  it('el día del partido saca la pierna y baja arriba lo que diga el ruleset', () => {
    const out = ajustarAlPartido(sesion, gym, 'match_day');
    expect(reglas.match_day.lowerBodyVolumeMultiplier).toBe(0);
    expect(out.items.map((i) => i.id)).toEqual(['i-press']);
    const esperado = Math.max(1, Math.round(4 * reglas.match_day.upperBodyVolumeMultiplier));
    expect(out.items[0]?.sets).toBe(esperado);
    expect(out.nota).not.toBeNull();
  });

  it('el día después: el salto sale y el levantamiento queda suelto, con la pausa de la vuelta', () => {
    expect(reglas.day_after.avoidExplosive).toBe(true);
    const out = ajustarAlPartido(sesion, gym, 'day_after');
    const sentadilla = out.items.find((i) => i.id === 'i-sentadilla');
    expect(out.items.some((i) => i.id === 'i-salto')).toBe(false);
    expect(sentadilla?.supersetGroup).toBeNull();
    expect(sentadilla?.restSeconds).toBe(180);
    expect(sentadilla?.sets).toBe(
      Math.max(1, Math.round(4 * reglas.day_after.lowerBodyVolumeMultiplier)),
    );
  });

  it('cada ítem vuelve a ser el suyo: id, nombre, carga y RIR no se tocan', () => {
    for (const estado of ['day_after', 'two_days_after', 'day_before', 'match_day'] as const) {
      for (const it of ajustarAlPartido(sesion, gym, estado).items) {
        const original = sesion.find((o) => o.id === it.id);
        expect(original, estado).toBeDefined();
        expect(it.name).toBe(original?.name);
        expect(it.targetLoad).toEqual(original?.targetLoad);
        expect(it.targetRir).toBe(original?.targetRir);
        expect(it.reps).toBe(original?.reps);
      }
    }
  });
});
