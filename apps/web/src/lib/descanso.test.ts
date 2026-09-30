import { beforeEach, describe, expect, it } from 'vitest';
import {
  type DescansoEnCurso,
  guardarDescanso,
  leerDescanso,
  proximoPendiente,
  segundosDescansados,
} from './descanso.ts';
import type { ActiveSessionItem } from './plan.ts';

/**
 * El descanso que sigue corriendo fuera de la pantalla del ejercicio.
 *
 * Lo que se cuida: que sobreviva a salir de "Hoy" (almacenamiento), que no
 * reviva en otra sesión, y que el tiempo que se registra sea el descansado,
 * no el que pasó con el socio ya en otra máquina.
 */

function item(id: string, over: Partial<ActiveSessionItem> = {}): ActiveSessionItem {
  return {
    id,
    exerciseId: `ej-${id}`,
    equipmentId: null,
    name: `nombre de ${id}`,
    sector: null,
    pattern: 'squat',
    primaryMuscles: ['quads'],
    load: '60 kg',
    targetLoad: { value: 60, unit: 'kg' },
    equipmentLoadSpec: null,
    sets: 3,
    repsTarget: 8,
    reps: '6-10',
    targetRir: 2,
    restSeconds: 120,
    rationale: null,
    isPlaceholder: false,
    durationSeconds: null,
    intensityZone: null,
    intervalRestSeconds: null,
    zone: null,
    toFailure: false,
    isUnilateral: false,
    pct1rm: null,
    supersetGroup: null,
    ...over,
  };
}

function descanso(over: Partial<DescansoEnCurso> = {}): DescansoEnCurso {
  return {
    planSessionId: 'ps-1',
    item: item('a'),
    setIndex: 2,
    startedAt: 1_000_000,
    prescribedSeconds: 120,
    actual: { reps: 7, rir: 1, load: { value: 65, unit: 'kg' }, durationSeconds: null },
    ...over,
  };
}

describe('leerDescanso / guardarDescanso', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('vuelve tal como se guardó, con lo anotado', () => {
    guardarDescanso('u1', descanso());
    expect(leerDescanso('u1', 'ps-1')).toEqual(descanso());
  });

  it('el de otra sesión no revive', () => {
    guardarDescanso('u1', descanso());
    expect(leerDescanso('u1', 'ps-2')).toBeNull();
  });

  it('es de cada socio', () => {
    guardarDescanso('u1', descanso());
    expect(leerDescanso('u2', 'ps-1')).toBeNull();
  });

  it('guardar null lo borra', () => {
    guardarDescanso('u1', descanso());
    guardarDescanso('u1', null);
    expect(leerDescanso('u1', 'ps-1')).toBeNull();
  });

  it('algo que no tiene la forma se descarta', () => {
    localStorage.setItem('bh.descanso.u1', JSON.stringify({ planSessionId: 'ps-1' }));
    expect(leerDescanso('u1', 'ps-1')).toBeNull();
    localStorage.setItem('bh.descanso.u1', '{no es json');
    expect(leerDescanso('u1', 'ps-1')).toBeNull();
  });
});

describe('segundosDescansados', () => {
  const d = { startedAt: 1_000_000, prescribedSeconds: 120 };

  it('cortado antes, lo que duró', () => {
    expect(segundosDescansados(d, 1_000_000 + 45_000)).toBe(45);
  });

  it('nunca más que lo prescripto: lo que sobra ya no es descanso', () => {
    expect(segundosDescansados(d, 1_000_000 + 600_000)).toBe(120);
  });

  it('un reloj que va para atrás no da negativo', () => {
    expect(segundosDescansados(d, 999_000)).toBe(0);
  });
});

describe('proximoPendiente', () => {
  const items = [item('a'), item('b', { sets: 2 }), item('c')];

  it('el primero al que le faltan series, sin contar el excluido', () => {
    expect(proximoPendiente(items, { a: [0, 1, 2] }, 'a')?.id).toBe('b');
  });

  it('saltea los terminados aunque vengan antes en la lista', () => {
    expect(proximoPendiente(items, { a: [0, 1, 2], b: [0, 1] }, 'c')).toBeNull();
    expect(proximoPendiente(items, { b: [0, 1] }, 'a')?.id).toBe('c');
  });

  it('sin nada pendiente, null', () => {
    expect(proximoPendiente(items, { a: [0, 1, 2], b: [0, 1], c: [0, 1, 2] }, 'a')).toBeNull();
  });
});
