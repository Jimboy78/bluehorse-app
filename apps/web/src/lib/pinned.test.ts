import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_PINNED, usePinnedExercises } from './pinned.ts';

/**
 * Los ejercicios fijados arriba de la lista de récords.
 *
 * Vive en `localStorage` porque es una preferencia de cómo mirar la pantalla,
 * no un dato del socio. Lo que estos tests cuidan es que el almacenamiento
 * roto —ventana privada, cookies bloqueadas, captura de miniatura— no rompa la
 * pantalla: ahí el acceso tira excepción, y la lista tiene que seguir
 * dibujándose sin nada fijado.
 */
describe('usePinnedExercises', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('arranca vacío y fija al tocar', () => {
    const { result } = renderHook(() => usePinnedExercises());
    expect(result.current.pinned).toEqual([]);

    act(() => result.current.toggle('ex-1'));
    expect(result.current.isPinned('ex-1')).toBe(true);
  });

  it('el segundo toque suelta', () => {
    const { result } = renderHook(() => usePinnedExercises());
    act(() => result.current.toggle('ex-1'));
    act(() => result.current.toggle('ex-1'));
    expect(result.current.pinned).toEqual([]);
  });

  it(`no fija más de ${MAX_PINNED}: el más viejo se cae`, () => {
    const { result } = renderHook(() => usePinnedExercises());
    for (let i = 0; i < MAX_PINNED + 2; i += 1) {
      act(() => result.current.toggle(`ex-${i}`));
    }
    expect(result.current.pinned).toHaveLength(MAX_PINNED);
    expect(result.current.isFull).toBe(true);
    // El último en entrar queda; el primero ya no.
    expect(result.current.isPinned(`ex-${MAX_PINNED + 1}`)).toBe(true);
    expect(result.current.isPinned('ex-0')).toBe(false);
  });

  it('lee lo que quedó guardado de una visita anterior', () => {
    localStorage.setItem('bh.pinned-exercises', JSON.stringify(['ex-9']));
    const { result } = renderHook(() => usePinnedExercises());
    expect(result.current.isPinned('ex-9')).toBe(true);
  });

  it('un valor corrupto no rompe la pantalla', () => {
    localStorage.setItem('bh.pinned-exercises', 'esto no es json');
    const { result } = renderHook(() => usePinnedExercises());
    expect(result.current.pinned).toEqual([]);
  });

  it('un valor que no es lista se descarta', () => {
    localStorage.setItem('bh.pinned-exercises', JSON.stringify({ ex: 1 }));
    const { result } = renderHook(() => usePinnedExercises());
    expect(result.current.pinned).toEqual([]);
  });

  it('si el almacenamiento tira excepción, la pantalla sigue viva', () => {
    // Es lo que pasa en una ventana privada o con las cookies bloqueadas: el
    // acceso mismo lanza, no devuelve null.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('acceso denegado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('acceso denegado');
    });

    const { result } = renderHook(() => usePinnedExercises());
    expect(result.current.pinned).toEqual([]);
    // Fijar sigue funcionando en memoria: dura lo que dura la pantalla, que es
    // mejor que tirar la pantalla abajo.
    act(() => result.current.toggle('ex-1'));
    expect(result.current.isPinned('ex-1')).toBe(true);
  });
});
