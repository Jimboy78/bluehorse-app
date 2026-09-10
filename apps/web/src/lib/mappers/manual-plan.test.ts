import { describe, expect, it } from 'vitest';
import {
  type ManualItemDraft,
  manualSessionDraftSchema,
  nextIndex,
  toManualItemInsert,
  toManualPlanInsert,
  toManualSessionInsert,
} from './manual-plan.ts';

const USER = '11e652e1-f91d-44f1-a4f8-72a1ea38b4df';
const GYM = '22e652e1-f91d-44f1-a4f8-72a1ea38b4df';
const SESSION = '33e652e1-f91d-44f1-a4f8-72a1ea38b4df';
const EXERCISE = '44e652e1-f91d-44f1-a4f8-72a1ea38b4df';

function draft(over: Partial<ManualItemDraft> = {}): ManualItemDraft {
  return {
    exerciseId: EXERCISE,
    equipmentId: null,
    targetSets: 4,
    targetRepsMin: 8,
    targetRepsMax: 12,
    targetLoad: { value: 60, unit: 'kg' },
    targetRir: 2,
    restSeconds: 120,
    ...over,
  };
}

/**
 * Un plan armado a mano no pasó por el motor, y el esquema lo dice dejando en
 * nulo las tres columnas que solo existen porque hubo motor. Lo que estos
 * tests cuidan es que nadie las rellene "para que no queden vacías": anotar
 * ahí el ruleset activo convertiría un plan que eligió una persona en un plan
 * que la pantalla puede mostrar como respaldado por la investigación, que es
 * la regla dura 4 rota de la peor forma — en silencio.
 */
describe('toManualPlanInsert', () => {
  it('no le atribuye ningún ruleset ni template', () => {
    const row = toManualPlanInsert(USER, GYM, 'Mi rutina');
    expect(row.ruleset_version).toBeNull();
    expect(row.template_id).toBeNull();
    expect(row.origin).toBe('manual');
  });

  it('no le atribuye ningún objetivo: no se armó a partir de uno', () => {
    expect(toManualPlanInsert(USER, GYM, 'Mi rutina').goal_snapshot).toEqual({});
  });

  it('no trae avisos del motor, porque ningún motor lo revisó', () => {
    expect(toManualPlanInsert(USER, GYM, 'Mi rutina').warnings).toEqual([]);
  });

  it('nace guardado, no activo', () => {
    // Un plan activo sin ningún día deja "Hoy" sin nada que ofrecer. Se activa
    // desde la lista cuando ya tiene con qué entrenar.
    expect(toManualPlanInsert(USER, GYM, 'Mi rutina').status).toBe('archived');
  });

  it('recorta el nombre y lo corta en el largo que aguanta la columna', () => {
    expect(toManualPlanInsert(USER, GYM, '  Pierna  ').name).toBe('Pierna');
    expect(toManualPlanInsert(USER, GYM, 'x'.repeat(80)).name).toHaveLength(60);
  });
});

describe('toManualItemInsert', () => {
  it('no inventa una razón: el "por qué va acá" queda nulo', () => {
    // El motor escribe ahí una frase citando el ruleset. Acá el ejercicio lo
    // eligió la persona, y armarle una explicación sería ponerle voz de
    // evidencia a una decisión que no la tiene.
    expect(toManualItemInsert(SESSION, 0, draft()).rationale).toBeNull();
  });

  it('no queda marcado como provisorio: no hay ruleset provisorio detrás', () => {
    // La columna trae `default true`, que en un ítem manual sería mentira: esa
    // bandera habla del ruleset que generó el ítem, y acá no generó ninguno.
    expect(toManualItemInsert(SESSION, 0, draft()).is_placeholder).toBe(false);
  });

  it('guarda la carga cruda, con la unidad que dice la máquina', () => {
    const row = toManualItemInsert(SESSION, 0, draft({ targetLoad: { value: 45, unit: 'lb' } }));
    expect(row.target_load).toBe(45);
    expect(row.target_load_unit).toBe('lb');
  });

  it('sin carga elegida no inventa un cero', () => {
    const row = toManualItemInsert(SESSION, 0, draft({ targetLoad: null }));
    expect(row.target_load).toBeNull();
    expect(row.target_load_unit).toBeNull();
  });

  it('ordena el rango de repeticiones aunque venga al revés', () => {
    // El formulario tiene dos campos sueltos: escribir 12 y después 8 es un
    // rango inválido para la base, no un error de la persona.
    const row = toManualItemInsert(SESSION, 0, draft({ targetRepsMin: 12, targetRepsMax: 8 }));
    expect(row.target_reps_min).toBe(8);
    expect(row.target_reps_max).toBe(12);
  });

  it('deja los campos de cardio en nulo', () => {
    const row = toManualItemInsert(SESSION, 0, draft());
    expect(row.target_duration_seconds).toBeNull();
    expect(row.target_intensity_zone).toBeNull();
    expect(row.target_interval_rest_seconds).toBeNull();
  });
});

describe('toManualSessionInsert', () => {
  it('el nombre de la cola es la posición, no un día de la semana', () => {
    // Atar sesiones a días genera "sesiones vencidas" cuando la persona falta,
    // que es la trampa documentada en CLAUDE.md. Lo que la persona escribe va
    // en `focus`, que es descripción, no calendario.
    const row = toManualSessionInsert('plan', 2, {
      focus: 'Lunes de pierna',
      estimatedMinutes: 50,
    });
    expect(row.label).toBe('Día 3');
    expect(row.focus).toBe('Lunes de pierna');
    expect(row.sequence_index).toBe(2);
  });

  it('la duración la declara la persona: no se deduce de nada', () => {
    expect(
      toManualSessionInsert('plan', 0, { focus: 'Torso', estimatedMinutes: 45 }).estimated_minutes,
    ).toBe(45);
  });

  it('un día sin nombre no se guarda', () => {
    expect(() => manualSessionDraftSchema.parse({ focus: '   ', estimatedMinutes: 45 })).toThrow();
  });
});

describe('nextIndex', () => {
  it('la primera posición de una cola vacía es cero', () => {
    expect(nextIndex([])).toBe(0);
  });

  it('después de borrar el día del medio, el hueco no se reusa', () => {
    // Contar filas devolvería 2, que ya está ocupado, y el insert chocaría
    // contra el `unique (plan_id, sequence_index)`. La cola se ordena por el
    // índice; que falte uno en el medio no molesta.
    expect(nextIndex([0, 2])).toBe(3);
  });

  it('no depende del orden en que vengan los índices', () => {
    expect(nextIndex([5, 1, 3])).toBe(6);
  });
});
