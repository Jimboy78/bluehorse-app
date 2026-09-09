import type { Equipment, Exercise } from '@bh/domain';
import type {
  GymSnapshot,
  PlanBlueprint,
  SessionItemBlueprint,
  SubstituteOption,
} from '@bh/engine';
import { describe, expect, it } from 'vitest';
import type { PlanPreview, PreviewItem } from './plan-preview.ts';
import { itemKey, swapPreviewItem, toPreview } from './plan-preview.ts';

/**
 * La previa es lo único entre "contesté el cuestionario" y "estoy entrenando",
 * así que lo que se prueba acá es lo que la hace confiable: que cambiar un
 * ejercicio no toque ningún número de la prescripción, y que el cambio valga
 * para toda la cola y no solo para la fila que se tocó.
 */

const equipmentBase: Omit<Equipment, 'id' | 'name'> = {
  gymId: 'gym-1',
  category: 'selectorized',
  brand: null,
  model: null,
  photoUrl: null,
  locationNote: null,
  setupNotes: null,
  load: { unit: 'stack_level' },
  quantity: 1,
  isActive: true,
};

const exerciseBase: Omit<Exercise, 'id' | 'name'> = {
  gymId: 'gym-1',
  pattern: 'squat',
  primaryMuscles: ['quads'],
  secondaryMuscles: [],
  modality: 'reps_weight',
  isCompound: true,
  isUnilateral: false,
  isExplosive: false,
  skillLevel: 'beginner',
  cues: null,
  equipmentIds: ['eq-1'],
};

const gym: GymSnapshot = {
  gymId: 'gym-1',
  equipment: [
    { ...equipmentBase, id: 'eq-1', name: 'Rack' },
    { ...equipmentBase, id: 'eq-2', name: 'Prensa', locationNote: 'Fondo, pared derecha' },
  ],
  exercises: [
    { ...exerciseBase, id: 'ex-sentadilla', name: 'Sentadilla' },
    { ...exerciseBase, id: 'ex-prensa', name: 'Prensa', equipmentIds: ['eq-2'] },
    { ...exerciseBase, id: 'ex-remo', name: 'Remo', pattern: 'horizontal_pull' },
  ],
  substitutions: [],
};

function item(overrides: Partial<SessionItemBlueprint> = {}): SessionItemBlueprint {
  return {
    exerciseId: 'ex-sentadilla',
    equipmentId: 'eq-1',
    orderIndex: 0,
    targetSets: 4,
    targetRepsMin: 6,
    targetRepsMax: 12,
    targetLoad: null,
    targetRir: 2,
    restSeconds: 120,
    rationale: 'La sentadilla va primero.',
    isPlaceholder: false,
    targetDurationSeconds: null,
    targetIntensityZone: null,
    targetIntervalRestSeconds: null,
    ...overrides,
  };
}

/** Dos sesiones "A" iguales, como arma el motor cuando la cola repite bloques. */
const blueprint: PlanBlueprint = {
  rulesetVersion: 'v1-research',
  source: 'research',
  templateId: 'full_body_ab',
  warnings: ['Un aviso cualquiera.'],
  sessions: [
    {
      sequenceIndex: 0,
      label: 'Sesión A',
      focus: 'Cuerpo completo · empuje',
      estimatedMinutes: 55,
      items: [item(), item({ exerciseId: 'ex-remo', orderIndex: 1, targetSets: 3 })],
    },
    {
      sequenceIndex: 1,
      label: 'Sesión A',
      focus: 'Cuerpo completo · empuje',
      estimatedMinutes: 55,
      items: [item(), item({ exerciseId: 'ex-remo', orderIndex: 1, targetSets: 3 })],
    },
  ],
};

/**
 * `noUncheckedIndexedAccess` está prendido, y en un test una fila que no
 * existe es un test roto, no un `undefined` que haya que manejar: esto falla
 * ahí mismo con el índice que se pidió.
 */
function fila(preview: PlanPreview, session: number, index: number): PreviewItem {
  const item = preview.sessions[session]?.items[index];
  if (!item) throw new Error(`No hay ítem en la sesión ${session}, posición ${index}.`);
  return item;
}

const prensa: SubstituteOption = {
  exerciseId: 'ex-prensa',
  equipmentId: 'eq-2',
  equivalence: 0.9,
  reason: 'Mismo patrón.',
  curated: false,
};

describe('toPreview', () => {
  it('resuelve nombres, patrón y músculos desde el catálogo', () => {
    const preview = toPreview(blueprint, gym, 0);
    const primero = fila(preview, 0, 0);
    expect(primero.name).toBe('Sentadilla');
    expect(primero.pattern).toBe('squat');
    expect(primero.primaryMuscles).toEqual(['quads']);
  });

  it('deja el sector en null cuando la estación no lo tiene cargado', () => {
    const preview = toPreview(blueprint, gym, 0);
    // La regla es no inventar: "sin ubicación" repetido en cada fila ocupa el
    // lugar de un dato sin serlo.
    expect(fila(preview, 0, 0).sector).toBeNull();
  });

  it('cuenta todas las series de la cola, no las de una sesión', () => {
    // 2 sesiones × (4 + 3) series.
    expect(toPreview(blueprint, gym, 0).totalSets).toBe(14);
  });

  it('pasa los avisos del motor tal cual', () => {
    expect(toPreview(blueprint, gym, 0).warnings).toEqual(['Un aviso cualquiera.']);
  });
});

describe('swapPreviewItem', () => {
  it('cambia el ejercicio en TODA la cola, no solo en la sesión que se tocó', () => {
    const preview = toPreview(blueprint, gym, 0);
    const next = swapPreviewItem(preview, itemKey(0, 0), prensa);

    // El motor repite la sesión A: cambiarlo en la primera y dejarlo en la
    // segunda obligaría a repetir el cambio sesión por sesión.
    expect(fila(next, 0, 0).name).toBe('Prensa');
    expect(fila(next, 1, 0).name).toBe('Prensa');
  });

  it('no toca ningún número de la prescripción', () => {
    const preview = toPreview(blueprint, gym, 0);
    const antes = fila(preview, 0, 0);
    const despues = fila(swapPreviewItem(preview, itemKey(0, 0), prensa), 0, 0);

    // Regla dura 3: se puede cambiar QUÉ ejercicio, nunca CUÁNTO.
    expect(despues.sets).toBe(antes.sets);
    expect(despues.reps).toBe(antes.reps);
    expect(despues.restSeconds).toBe(antes.restSeconds);
  });

  it('deja intactos los ejercicios que no son el que se cambió', () => {
    const preview = toPreview(blueprint, gym, 0);
    const next = swapPreviewItem(preview, itemKey(0, 0), prensa);
    expect(fila(next, 0, 1).name).toBe('Remo');
    expect(fila(next, 1, 1).name).toBe('Remo');
  });

  it('marca como cambiadas todas las filas afectadas', () => {
    const preview = toPreview(blueprint, gym, 0);
    const next = swapPreviewItem(preview, itemKey(0, 0), prensa);
    expect(fila(next, 0, 0).swapped).toBe(true);
    expect(fila(next, 1, 0).swapped).toBe(true);
    expect(fila(next, 0, 1).swapped).toBe(false);
  });

  it('reescribe el motivo para que no explique un ejercicio que ya no está', () => {
    const preview = toPreview(blueprint, gym, 0);
    const next = swapPreviewItem(preview, itemKey(0, 0), prensa);
    expect(fila(next, 0, 0).rationale).toContain('Sentadilla');
    expect(fila(next, 0, 0).rationale).not.toBe('La sentadilla va primero.');
  });

  it('toma la ubicación de la estación nueva', () => {
    const preview = toPreview(blueprint, gym, 0);
    const next = swapPreviewItem(preview, itemKey(0, 0), prensa);
    expect(fila(next, 0, 0).sector).toBe('Fondo, pared derecha');
  });

  it('acumula cambios: el segundo no deshace el primero', () => {
    const preview = toPreview(blueprint, gym, 0);
    const uno = swapPreviewItem(preview, itemKey(0, 0), prensa);
    const dos = swapPreviewItem(uno, itemKey(0, 1), {
      exerciseId: 'ex-prensa',
      equipmentId: 'eq-2',
      equivalence: 0.5,
      reason: 'Lo que haya.',
      curated: false,
    });
    expect(fila(dos, 0, 0).swapped).toBe(true);
    expect(fila(dos, 0, 1).swapped).toBe(true);
  });

  it('devuelve la previa sin tocar si la fila no existe', () => {
    const preview = toPreview(blueprint, gym, 0);
    expect(swapPreviewItem(preview, 's9-i9', prensa)).toBe(preview);
  });

  it('no muta la previa original', () => {
    const preview = toPreview(blueprint, gym, 0);
    swapPreviewItem(preview, itemKey(0, 0), prensa);
    expect(fila(preview, 0, 0).name).toBe('Sentadilla');
  });
});
