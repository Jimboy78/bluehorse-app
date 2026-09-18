import { describe, expect, it } from 'vitest';
import { retomarDesde, type SesionDeCola, tandasDeEscritura } from './retomar.ts';

// Lunes y martes hechos, el resto pendiente: el plan del socio al 18/09.
const SEMANA: SesionDeCola[] = [
  { id: 'lun', sequenceIndex: 0, status: 'completed' },
  { id: 'mar', sequenceIndex: 1, status: 'completed' },
  { id: 'mie', sequenceIndex: 2, status: 'pending' },
  { id: 'jue', sequenceIndex: 3, status: 'pending' },
  { id: 'vie', sequenceIndex: 4, status: 'pending' },
];

const orden = (cambios: readonly { id: string; sequenceIndex: number }[] | null) =>
  [...(cambios ?? [])].sort((a, b) => a.sequenceIndex - b.sequenceIndex).map((c) => c.id);

describe('retomarDesde, plan a mano (se reinicia)', () => {
  it('la elegida pasa adelante y la semana sigue en su orden', () => {
    expect(orden(retomarDesde(SEMANA, 'jue', true))).toEqual(['jue', 'vie', 'lun', 'mar', 'mie']);
  });

  it('todo vuelve a pendiente: es un ciclo, no un bloque que se termina', () => {
    const cambios = retomarDesde(SEMANA, 'lun', true);
    expect(cambios?.every((c) => c.status === 'pending')).toBe(true);
    expect(orden(cambios)).toEqual(['lun', 'mar', 'mie', 'jue', 'vie']);
  });

  it('se puede elegir un día ya hecho', () => {
    expect(orden(retomarDesde(SEMANA, 'mar', true))[0]).toBe('mar');
  });

  it('no depende del orden en que lleguen las filas', () => {
    expect(orden(retomarDesde([...SEMANA].reverse(), 'jue', true))).toEqual([
      'jue',
      'vie',
      'lun',
      'mar',
      'mie',
    ]);
  });
});

describe('retomarDesde, plan del motor (solo rota lo pendiente)', () => {
  it('lo hecho conserva su lugar y su estado', () => {
    const cambios = retomarDesde(SEMANA, 'jue', false);
    expect(cambios?.map((c) => c.id).sort()).toEqual(['jue', 'mie', 'vie']);
    expect(orden(cambios)).toEqual(['jue', 'vie', 'mie']);
    // Las posiciones son las que ya tenían las pendientes: 2, 3 y 4.
    expect(cambios?.map((c) => c.sequenceIndex).sort()).toEqual([2, 3, 4]);
  });

  it('un día ya hecho no se puede elegir', () => {
    expect(retomarDesde(SEMANA, 'lun', false)).toBeNull();
  });
});

describe('tandasDeEscritura', () => {
  it('la primera tanda no pisa ninguna posición existente y ya deja el orden bien', () => {
    const cambios = retomarDesde(SEMANA, 'jue', true) ?? [];
    const [primera, segunda] = tandasDeEscritura(cambios, SEMANA);
    const ocupadas = new Set(SEMANA.map((s) => s.sequenceIndex));
    for (const c of primera) expect(ocupadas.has(c.sequenceIndex)).toBe(false);
    expect(orden(primera)).toEqual(orden(segunda));
    expect(new Set(primera.map((c) => c.sequenceIndex)).size).toBe(primera.length);
  });

  it('la segunda tanda cae en posiciones que la primera liberó', () => {
    const cambios = retomarDesde(SEMANA, 'jue', false) ?? [];
    const [primera, segunda] = tandasDeEscritura(cambios, SEMANA);
    const quedanOcupadas = new Set(
      SEMANA.filter((s) => !primera.some((c) => c.id === s.id)).map((s) => s.sequenceIndex),
    );
    for (const c of segunda) expect(quedanOcupadas.has(c.sequenceIndex)).toBe(false);
  });
});
