import { describe, expect, it } from 'vitest';
import catalogo from '../supabase/catalog/blue-horse.json' with { type: 'json' };

/**
 * EL PESO DE LA BARRA SE SUMA A TODO LO QUE SE ANOTA EN ESA ESTACIÓN
 *
 * `base_weight_kg` convierte "60 en discos" en 80 kg de masa total: lo usan el
 * máximo estimado (para pasar "80 % 1RM" a discos) y `toKg` (para Progreso).
 * La estación que ejercicio y registro comparten es UNA: si un ejercicio con
 * mancuernas cuelga de un banco con rack, el motor puede asignarle ese banco
 * (elige al azar entre las estaciones del ejercicio), la serie se anota en
 * "discos", y a unas mancuernas de 20 se les suman 20 kg de una barra que
 * nadie levantó. Pasó: "Press de banca con mancuernas" estaba en el banco
 * plano con rack, con dos ítems de plan en producción.
 */

interface Estacion {
  readonly name: string;
  readonly load_unit: string;
  readonly base_weight_kg?: number;
}

interface Ejercicio {
  readonly name: string;
  readonly equipment: readonly string[];
}

const estaciones = new Map(
  (catalogo.equipment as readonly Estacion[]).map((e) => [e.name, e] as const),
);
const ejercicios = catalogo.exercises as readonly Ejercicio[];

const conBarra = (nombre: string) => estaciones.get(nombre)?.base_weight_kg !== undefined;

describe('estaciones con peso de barra', () => {
  it('hay estaciones con la barra cargada (si no, el %1RM no se puede calcular en ninguna)', () => {
    expect([...estaciones.values()].filter((e) => e.base_weight_kg !== undefined).length).toBe(7);
  });

  it('solo las estaciones de discos llevan peso de barra', () => {
    for (const e of estaciones.values()) {
      if (e.base_weight_kg === undefined) continue;
      expect(e.load_unit, e.name).toMatch(/^plates_/);
    }
  });

  it('ningún ejercicio con mancuernas cuelga de una estación con barra', () => {
    // Por la estación y no por el nombre: "Curl de bíceps" y "Zancadas" también
    // se hacen con mancuernas y no lo dicen.
    const conMancuerna = ejercicios.filter((x) => x.equipment.includes('Mancuernas sueltas (set)'));
    expect(conMancuerna.length).toBeGreaterThan(10);
    const mal = conMancuerna.flatMap((x) =>
      x.equipment.filter(conBarra).map((estacion) => `${x.name} → ${estacion}`),
    );
    expect(mal).toEqual([]);
  });

  it('toda estación con barra tiene al menos un ejercicio', () => {
    const usadas = new Set(ejercicios.flatMap((x) => x.equipment));
    const sinUso = [...estaciones.values()]
      .filter((e) => e.base_weight_kg !== undefined && !usadas.has(e.name))
      .map((e) => e.name);
    expect(sinUso).toEqual([]);
  });
});
