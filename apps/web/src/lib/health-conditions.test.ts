import { HEALTH_CONDITIONS } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import {
  diffCondiciones,
  GRUPOS_DE_CONDICIONES,
  gruposPara,
  muestraElPulso,
} from './health-conditions.ts';

describe('condiciones de salud', () => {
  it('cada condición del dominio está en un solo grupo', () => {
    const listadas = GRUPOS_DE_CONDICIONES.flatMap((g) => g.opciones.map((o) => o.id));
    expect([...listadas].sort()).toEqual([...HEALTH_CONDITIONS].sort());
  });

  it('el embarazo no se le pregunta a un hombre, y a quien no declaró el sexo sí', () => {
    const tiene = (sex: Parameters<typeof gruposPara>[0]) =>
      gruposPara(sex).some((g) => g.opciones.some((o) => o.id === 'pregnancy'));
    expect(tiene('male')).toBe(false);
    expect(tiene('female')).toBe(true);
    expect(tiene('undisclosed')).toBe(true);
    expect(tiene(null)).toBe(true);
  });

  it('el % de pulso sale solo cuando se sabe que le sirve', () => {
    expect(muestraElPulso([])).toBe(true);
    expect(muestraElPulso(['hypertension'])).toBe(true);
    expect(muestraElPulso(['beta_blockers'])).toBe(false);
    expect(muestraElPulso(['hypertension', 'beta_blockers'])).toBe(false);
    // Sin leer sus condiciones no se sabe: no se muestra.
    expect(muestraElPulso(undefined)).toBe(false);
  });

  it('el diff agrega lo nuevo, saca lo desmarcado y no toca lo que sigue', () => {
    expect(diffCondiciones(['hypertension', 'asthma'], ['asthma', 'diabetes'])).toEqual({
      agregar: ['diabetes'],
      sacar: ['hypertension'],
    });
    expect(diffCondiciones(['asthma'], ['asthma'])).toEqual({ agregar: [], sacar: [] });
    // Marcar dos veces lo mismo no inserta dos filas: la base lo rechazaría.
    expect(diffCondiciones([], ['asthma', 'asthma']).agregar).toEqual(['asthma']);
  });
});
