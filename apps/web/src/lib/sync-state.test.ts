import { describe, expect, it } from 'vitest';
import { estadoDeSincronia, seriesPendientes } from './sync-state.ts';

/**
 * Distinguir "esperando señal" de "trabado" es todo el punto: lo primero se
 * arregla solo y lo segundo no. Si se muestran igual, la persona espera para
 * siempre una sincronización que nunca va a pasar.
 */
describe('estadoDeSincronia', () => {
  it('sin cola, no hay nada que avisar', () => {
    expect(estadoDeSincronia({ pending: 0, failing: 0, worstError: null })).toEqual({
      kind: 'al-dia',
    });
  });

  it('mientras la salud de la cola no se leyó todavía, no inventa un aviso', () => {
    expect(estadoDeSincronia(undefined)).toEqual({ kind: 'al-dia' });
  });

  it('pendientes que nadie intentó mandar es falta de señal', () => {
    expect(estadoDeSincronia({ pending: 3, failing: 0, worstError: null })).toEqual({
      kind: 'esperando',
      pendientes: 3,
    });
  });

  it('un solo fallo ya lo saca de "esperando": eso no se arregla esperando', () => {
    expect(
      estadoDeSincronia({ pending: 4, failing: 1, worstError: '23503 · violates foreign key' }),
    ).toEqual({
      kind: 'trabado',
      pendientes: 4,
      fallando: 1,
      error: '23503 · violates foreign key',
    });
  });

  it('trabado sin mensaje guardado sigue siendo trabado', () => {
    const out = estadoDeSincronia({ pending: 1, failing: 1, worstError: null });
    expect(out.kind).toBe('trabado');
  });
});

describe('seriesPendientes', () => {
  it('no dice "1 series"', () => {
    expect(seriesPendientes(1)).toBe('1 serie');
  });

  it('pluraliza el resto', () => {
    expect(seriesPendientes(2)).toBe('2 series');
    expect(seriesPendientes(11)).toBe('11 series');
  });
});
