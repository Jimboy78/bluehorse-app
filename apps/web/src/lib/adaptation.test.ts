import { describe, expect, it } from 'vitest';
import { sesionesDeHistorialNecesarias } from './adaptation.ts';
import { activeRuleset } from './engine.ts';

/**
 * CUÁNTO HISTORIAL SE LEE
 *
 * Acá había un `HISTORY_LIMIT = 200` sobre `set_logs`, y ese número decidía qué
 * reglas del ruleset podían dispararse. Medido sobre los 35 perfiles de
 * `tools/reportes/motor-v1-research.json`, contando cuántas series hay que leer
 * para que **cada** ejercicio del plan acumule las 3 apariciones que pide
 * `deload.stallSessions`: dos de ellos necesitan 201. Una más que el límite, así
 * que para esos socios el ejercicio que cae último en la rotación nunca llegaba a
 * su tercera aparición y no podía recibir una descarga por estancamiento.
 *
 * Lo que se fija acá no es un número sino las dos propiedades que un número
 * suelto no puede tener: que salga del ruleset, y que crezca con la cola.
 */
describe('sesionesDeHistorialNecesarias', () => {
  /**
   * El requisito más profundo del ruleset, leído por ruta explícita y no
   * recorriendo el objeto: recorrerlo sería repetir lo que hace la función que se
   * está probando, y un test que reimplementa su sujeto no prueba nada.
   */
  function masProfundoDelRuleset(): number {
    const bloque = activeRuleset.prescription.hypertrophy?.default;
    expect(bloque, 'el ruleset dejó de traer el bloque de hipertrofia').toBeDefined();
    if (!bloque) return 1;
    return Math.max(
      bloque.deload.stallSessions,
      bloque.progression.consecutiveSessions,
      bloque.regression.missedRepsSessions,
    );
  }

  it('el ruleset declara los requisitos que esto tiene que cubrir', () => {
    // Verde y vacío no sirve: si el ruleset dejara de traerlos, el cálculo de
    // abajo caería a 1 y los dos tests siguientes pasarían sin significar nada.
    expect(masProfundoDelRuleset()).toBeGreaterThan(1);
  });

  it('alcanza para que cada ejercicio de la cola acumule lo que el ruleset pide', () => {
    const pasadas = masProfundoDelRuleset();
    // Una pasada completa de la cola contiene cada ejercicio al menos una vez.
    for (const cola of [2, 4, 8, 12]) {
      expect(sesionesDeHistorialNecesarias(cola)).toBeGreaterThanOrEqual(pasadas * cola);
    }
  });

  it('crece con la cola, que es lo que un número fijo no podía hacer', () => {
    // El 200 viejo era el mismo para una cola de 2 sesiones que para una de 12,
    // y por eso se quedaba corto justo en los planes más largos.
    expect(sesionesDeHistorialNecesarias(12)).toBeGreaterThan(sesionesDeHistorialNecesarias(4));
  });

  it('una cola vacía o absurda no devuelve cero', () => {
    // Sin esto, un plan sin sesiones cargadas pediría `.limit(0)` y el motor se
    // quedaría sin historial sin que nada falle.
    expect(sesionesDeHistorialNecesarias(0)).toBeGreaterThan(0);
    expect(sesionesDeHistorialNecesarias(-3)).toBeGreaterThan(0);
  });
});
