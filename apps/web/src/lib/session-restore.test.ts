import { describe, expect, it } from 'vitest';
import { rebuild } from './session-restore.ts';

/**
 * Reconstruir la sesión en curso desde lo que quedó registrado. Es lo que se
 * ve al volver a "Hoy" después de cambiar de pestaña, bloquear el teléfono o
 * recargar: si acá falta algo, la persona ve series destildadas que sí hizo, y
 * volver a marcarlas duplica el registro.
 */

function fila(over: Partial<Record<string, unknown>> = {}) {
  return {
    plan_session_item_id: 'item-1',
    set_index: 0,
    id: 'set-1',
    load_value: null,
    load_unit: null,
    ...over,
  };
}

describe('rebuild', () => {
  it('sin series registradas, no hay nada que reconstruir', () => {
    const out = rebuild([]);
    expect(out.doneByItem).toEqual({});
    expect(out.setLogIds.size).toBe(0);
    expect(out.loadByItem).toEqual({});
  });

  it('agrupa las series por ejercicio', () => {
    const out = rebuild([
      fila({ set_index: 0, id: 'a' }),
      fila({ set_index: 1, id: 'b' }),
      fila({ plan_session_item_id: 'item-2', set_index: 0, id: 'c' }),
    ]);
    expect(out.doneByItem).toEqual({ 'item-1': [0, 1], 'item-2': [0] });
  });

  it('guarda el id de cada serie, para poder deshacerla después de recargar', () => {
    const out = rebuild([fila({ set_index: 2, id: 'set-xyz' })]);
    expect(out.setLogIds.get('item-1:2')).toBe('set-xyz');
  });

  it('una serie sin ejercicio no tiene dónde mostrarse: se saltea', () => {
    const out = rebuild([fila({ plan_session_item_id: null })]);
    expect(out.doneByItem).toEqual({});
  });

  it('trae la carga con la que se venía trabajando', () => {
    const out = rebuild([fila({ load_value: 60, load_unit: 'kg' })]);
    expect(out.loadByItem['item-1']).toEqual({ value: 60, unit: 'kg' });
  });

  it('si subió la carga sobre la marcha, gana la última serie', () => {
    // Llegan desordenadas a propósito: el orden del JSON no es el de las series.
    const out = rebuild([
      fila({ set_index: 2, id: 'c', load_value: 70, load_unit: 'kg' }),
      fila({ set_index: 0, id: 'a', load_value: 60, load_unit: 'kg' }),
      fila({ set_index: 1, id: 'b', load_value: 65, load_unit: 'kg' }),
    ]);
    expect(out.loadByItem['item-1']).toEqual({ value: 70, unit: 'kg' });
  });

  it('una serie sin carga no pisa la que sí tenía', () => {
    const out = rebuild([
      fila({ set_index: 0, id: 'a', load_value: 60, load_unit: 'kg' }),
      fila({ set_index: 1, id: 'b' }),
    ]);
    expect(out.loadByItem['item-1']).toEqual({ value: 60, unit: 'kg' });
  });

  it('la unidad viaja con el número: nunca se asume kg', () => {
    const out = rebuild([fila({ load_value: 7, load_unit: 'stack_level' })]);
    expect(out.loadByItem['item-1']).toEqual({ value: 7, unit: 'stack_level' });
  });
});
