import { GOALS } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { objetivoDeLaUrl, ordenDeObjetivos } from '../lib/evidence-link.ts';

/**
 * A esta pantalla se llega desde el aviso que "Hoy" muestra arriba del plan:
 * `/evidencia?objetivo=cardio`. Lo que estos tests cuidan son las dos cosas
 * que hacen que ese enlace sirva para algo — que el objetivo llegue entero, y
 * que quede primero en vez de perdido entre seis.
 *
 * El primer intento de lo segundo fue desplazar la pantalla hasta la tarjeta,
 * y perdía contra la restauración de scroll de la navegación (medido: la
 * página quedaba arriba de todo con la tarjeta a 718 px del borde). Reordenar
 * no depende de cuándo corra.
 */
describe('objetivoDeLaUrl', () => {
  it('acepta un objetivo que el ruleset conoce', () => {
    expect(objetivoDeLaUrl('cardio')).toBe('cardio');
  });

  it('descarta cualquier otra cosa', () => {
    // La dirección la escribe cualquiera. Un valor inventado no puede terminar
    // buscando un bloque de prescripción que no existe.
    expect(objetivoDeLaUrl('fuerza-bruta')).toBeNull();
    expect(objetivoDeLaUrl('')).toBeNull();
    expect(objetivoDeLaUrl(null)).toBeNull();
  });
});

describe('ordenDeObjetivos', () => {
  it('sin objetivo en la dirección deja el orden del onboarding', () => {
    expect(ordenDeObjetivos(null)).toEqual([...GOALS]);
  });

  it('el objetivo por el que se entró queda primero', () => {
    expect(ordenDeObjetivos('cardio')[0]).toBe('cardio');
  });

  it('no pierde ni repite ninguno al reordenar', () => {
    // Mover uno al frente con un `filter` es fácil de escribir mal: duplicar
    // el elegido dibujaría dos tarjetas del mismo objetivo, y olvidarlo en el
    // resto lo borraría de la lista.
    for (const goal of GOALS) {
      const orden = ordenDeObjetivos(goal);
      expect(orden).toHaveLength(GOALS.length);
      expect([...orden].sort()).toEqual([...GOALS].sort());
    }
  });
});
