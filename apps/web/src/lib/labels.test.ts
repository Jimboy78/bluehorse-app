import { MUSCLE_GROUPS } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { activeRuleset } from './engine.ts';
import { deporteLabel, MUSCLE_REGIONS, REGION_LABELS, regionOf } from './labels.ts';

/**
 * Las regiones que agrupan la lista de récords.
 *
 * Son de presentación: no entran al motor ni deciden nada del plan. Lo que
 * estos tests cuidan es que la agrupación no pierda ejercicios — un músculo
 * sin región lo haría desaparecer de la pantalla en silencio, que es peor que
 * ponerlo en el grupo equivocado.
 */
describe('regionOf', () => {
  it('cada grupo muscular del dominio cae en una región conocida', () => {
    // Si mañana se agrega un músculo al enum y nadie lo mapea, su ejercicio no
    // aparecería en ninguna sección. Este test lo frena antes.
    const huerfanos = MUSCLE_GROUPS.filter((m) => !MUSCLE_REGIONS.includes(regionOf([m])));
    expect(huerfanos).toEqual([]);
  });

  it('agrupa por el primer músculo primario, no por todos', () => {
    // Una sentadilla toca cuádriceps y glúteos: es "pierna" una vez, no dos.
    expect(regionOf(['quads', 'glutes'])).toBe('pierna');
    expect(regionOf(['chest', 'triceps'])).toBe('pecho');
  });

  it('un ejercicio sin músculos declarados no se pierde', () => {
    expect(MUSCLE_REGIONS).toContain(regionOf([]));
  });

  it('toda región tiene su nombre en castellano', () => {
    const sinNombre = MUSCLE_REGIONS.filter((r) => !REGION_LABELS[r]);
    expect(sinNombre).toEqual([]);
  });
});

/**
 * El nombre del deporte que el socio lee en el perfil. Ver `deporteLabel`: el
 * campo guarda un id del catálogo del ruleset, no lo que la persona escribió.
 */
describe('deporteLabel', () => {
  const catalogo = activeRuleset.sports?.catalog ?? [];

  it('traduce todos los ids del catálogo a algo distinto del id', () => {
    expect(catalogo.length).toBeGreaterThan(5);
    for (const d of catalogo) {
      expect(deporteLabel(d.id), d.id).toBe(d.label);
      expect(deporteLabel(d.id), d.id).not.toBe(d.id);
    }
  });

  it('el fútbol se lee con tilde, que es lo que el id no puede tener', () => {
    expect(deporteLabel('futbol')).toBe('Fútbol');
  });

  it('un valor viejo de cuando el campo era texto libre se muestra tal cual', () => {
    // Nadie puede guardar esto desde hoy, pero puede estar guardado: el paso de
    // onboarding era un `<input type="text">`. Mejor que lea lo que cargó que un hueco.
    expect(deporteLabel('Fútbol de los martes')).toBe('Fútbol de los martes');
    expect(deporteLabel('')).toBe('');
  });
});
