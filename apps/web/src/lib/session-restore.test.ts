import { describe, expect, it } from 'vitest';
import type { OutboxItem } from './outbox.ts';
import { fusionar, rebuild } from './session-restore.ts';

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

  it('cada serie conserva SU carga, no la de la última', () => {
    // Desde que cada serie lleva la suya, guardar solo la del ejercicio hacía
    // que al volver a la sesión una serie de 60 y otra de 70 se vieran las dos
    // con 70.
    const out = rebuild([
      fila({ set_index: 0, id: 'a', load_value: 60, load_unit: 'kg' }),
      fila({ set_index: 1, id: 'b', load_value: 70, load_unit: 'kg' }),
    ]);
    expect(out.loadBySet['item-1:0']).toEqual({ value: 60, unit: 'kg' });
    expect(out.loadBySet['item-1:1']).toEqual({ value: 70, unit: 'kg' });
    // Y la del ejercicio sigue siendo la de la última, que es con la que
    // arranca la próxima.
    expect(out.loadByItem['item-1']).toEqual({ value: 70, unit: 'kg' });
  });

  it('una serie sin carga no deja entrada propia', () => {
    const out = rebuild([fila({ set_index: 0, id: 'a' })]);
    expect(out.loadBySet['item-1:0']).toBeUndefined();
  });
});

/**
 * La cola offline es la otra mitad de la verdad. Lo que se marcó sin señal
 * todavía no está en Postgres, pero está escrito: si la reconstrucción no lo
 * mira, después de recargar la serie vuelve destildada y volver a marcarla
 * duplica el registro —y abre un segundo `workout_log` para la misma sesión—.
 */
function pendiente(kind: OutboxItem['kind'], payload: unknown, createdAt = 0): OutboxItem {
  return {
    clientId: `c-${createdAt}`,
    kind,
    payload,
    createdAt,
    attempts: 0,
    lastError: null,
    ownerId: 'u1',
  };
}

const SESION = 'ps-1';

describe('fusionar', () => {
  it('sin cola, es lo que dice el servidor', () => {
    const out = fusionar({ workoutLogId: 'wl-1', rows: [fila()] }, [], SESION);
    expect(out.workoutLogId).toBe('wl-1');
    expect(out.doneByItem).toEqual({ 'item-1': [0] });
  });

  it('una serie que sigue en la cola cuenta como hecha', () => {
    const out = fusionar(
      { workoutLogId: 'wl-1', rows: [] },
      [pendiente('set_log', { ...fila({ id: 'set-cola' }), workout_log_id: 'wl-1' })],
      SESION,
    );
    expect(out.doneByItem).toEqual({ 'item-1': [0] });
    expect(out.setLogIds.get('item-1:0')).toBe('set-cola');
  });

  it('el workout_log encolado evita abrir un segundo registro de la misma sesión', () => {
    const out = fusionar(
      { workoutLogId: null, rows: [] },
      [
        pendiente('workout_log', { id: 'wl-cola', plan_session_id: SESION }),
        pendiente('set_log', { ...fila({ id: 'set-cola' }), workout_log_id: 'wl-cola' }, 1),
      ],
      SESION,
    );
    expect(out.workoutLogId).toBe('wl-cola');
    expect(out.doneByItem).toEqual({ 'item-1': [0] });
  });

  it('no trae series de otra sesión que estén en la misma cola', () => {
    const out = fusionar(
      { workoutLogId: 'wl-1', rows: [] },
      [
        pendiente('workout_log', { id: 'wl-otro', plan_session_id: 'ps-2' }),
        pendiente('set_log', { ...fila({ id: 'ajena' }), workout_log_id: 'wl-otro' }, 1),
      ],
      SESION,
    );
    expect(out.workoutLogId).toBe('wl-1');
    expect(out.doneByItem).toEqual({});
  });

  it('un borrado encolado deshace la serie aunque el servidor todavía la tenga', () => {
    const out = fusionar(
      { workoutLogId: 'wl-1', rows: [fila({ id: 'set-1' })] },
      [pendiente('set_log_delete', { id: 'set-1' })],
      SESION,
    );
    expect(out.doneByItem).toEqual({});
    expect(out.setLogIds.size).toBe(0);
  });

  it('la misma serie en los dos lados se cuenta una sola vez', () => {
    // La respuesta se perdió: la fila llegó al servidor y el ítem quedó en cola.
    const cruda = { ...fila({ id: 'set-1' }), workout_log_id: 'wl-1' };
    const out = fusionar(
      { workoutLogId: 'wl-1', rows: [cruda] },
      [pendiente('set_log', cruda)],
      SESION,
    );
    expect(out.doneByItem).toEqual({ 'item-1': [0] });
  });

  it('la carga anotada sin señal se recupera al volver', () => {
    const out = fusionar(
      { workoutLogId: 'wl-1', rows: [] },
      [
        pendiente('set_log', {
          ...fila({ id: 's0', set_index: 0, load_value: 60, load_unit: 'kg' }),
          workout_log_id: 'wl-1',
        }),
        pendiente(
          'set_log',
          {
            ...fila({ id: 's1', set_index: 1, load_value: 70, load_unit: 'kg' }),
            workout_log_id: 'wl-1',
          },
          1,
        ),
      ],
      SESION,
    );
    expect(out.loadBySet['item-1:0']).toEqual({ value: 60, unit: 'kg' });
    expect(out.loadByItem['item-1']).toEqual({ value: 70, unit: 'kg' });
  });
});
