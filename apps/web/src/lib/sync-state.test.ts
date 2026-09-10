import { describe, expect, it } from 'vitest';
import { estadoDeSincronia, loQueEspera } from './sync-state.ts';

/**
 * Distinguir "esperando señal" de "trabado" es todo el punto: lo primero se
 * arregla solo y lo segundo no. Si se muestran igual, la persona espera para
 * siempre una sincronización que nunca va a pasar.
 */
describe('estadoDeSincronia', () => {
  it('sin cola, no hay nada que avisar', () => {
    expect(estadoDeSincronia({ pending: 0, sets: 0, failing: 0, worstError: null })).toEqual({
      kind: 'al-dia',
    });
  });

  it('mientras la salud de la cola no se leyó todavía, no inventa un aviso', () => {
    expect(estadoDeSincronia(undefined)).toEqual({ kind: 'al-dia' });
  });

  it('pendientes que nadie intentó mandar es falta de señal', () => {
    expect(estadoDeSincronia({ pending: 3, sets: 2, failing: 0, worstError: null })).toEqual({
      kind: 'esperando',
      pendientes: 3,
      series: 2,
    });
  });

  it('un solo fallo ya lo saca de "esperando": eso no se arregla esperando', () => {
    expect(
      estadoDeSincronia({
        pending: 4,
        sets: 3,
        failing: 1,
        worstError: '23503 · violates foreign key',
      }),
    ).toEqual({
      kind: 'trabado',
      pendientes: 4,
      fallando: 1,
      error: '23503 · violates foreign key',
    });
  });

  it('trabado sin mensaje guardado sigue siendo trabado', () => {
    const out = estadoDeSincronia({ pending: 1, sets: 1, failing: 1, worstError: null });
    expect(out.kind).toBe('trabado');
  });
});

describe('loQueEspera', () => {
  it('no dice "1 series"', () => {
    expect(loQueEspera(1, 2)).toBe('1 serie');
  });

  it('pluraliza el resto', () => {
    expect(loQueEspera(2, 3)).toBe('2 series');
    expect(loQueEspera(11, 12)).toBe('11 series');
  });

  it('cuenta series, no filas de la cola', () => {
    // Dos series más el `workout_log` de la sesión son tres pendientes. Decir
    // "3 series" sería un número inventado.
    expect(loQueEspera(2, 3)).toBe('2 series');
  });

  it('sin ninguna serie, no habla de series', () => {
    // Puede pasar: el `workout_log` se encola al abrir la sesión, antes de que
    // se marque la primera.
    expect(loQueEspera(0, 1)).toBe('1 cambio');
    expect(loQueEspera(0, 2)).toBe('2 cambios');
  });
});
