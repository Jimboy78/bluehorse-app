import { describe, expect, it } from 'vitest';
import { diaDelGimnasio, diasEntre, lunesDeLaSemana } from './gym-time.ts';

/**
 * Arroyo Seco está en UTC−3, y un gimnasio se llena a la noche: la franja
 * donde las dos zonas no coinciden es exactamente la que más se usa.
 */
describe('diaDelGimnasio', () => {
  it('una sesión de la noche no se corre al día siguiente', () => {
    // Lunes 2026-09-07, 22:00 en Arroyo Seco.
    expect(diaDelGimnasio('2026-09-08T01:00:00Z')).toBe('2026-09-07');
  });

  it('la mañana del día siguiente sí es otro día', () => {
    expect(diaDelGimnasio('2026-09-08T13:00:00Z')).toBe('2026-09-08');
  });

  it('acepta el offset explícito que devuelve Postgres, no solo la Z', () => {
    expect(diaDelGimnasio('2026-01-15T02:30:00+00:00')).toBe('2026-01-14');
  });
});

describe('lunesDeLaSemana', () => {
  it('un lunes es su propio lunes', () => {
    expect(lunesDeLaSemana('2026-08-31')).toBe('2026-08-31');
  });

  it('el domingo cierra la semana, no la abre', () => {
    expect(lunesDeLaSemana('2026-09-06')).toBe('2026-08-31');
  });

  it('cruza el cambio de mes sin perderse', () => {
    expect(lunesDeLaSemana('2026-09-01')).toBe('2026-08-31');
  });
});

describe('diasEntre', () => {
  it('días seguidos dan 1', () => {
    expect(diasEntre('2026-09-08', '2026-09-07')).toBe(1);
  });

  it('cruzar el fin de mes no cambia la cuenta', () => {
    expect(diasEntre('2026-09-01', '2026-08-31')).toBe(1);
  });

  it('el mismo día da 0', () => {
    expect(diasEntre('2026-09-08', '2026-09-08')).toBe(0);
  });
});
