import { describe, expect, it } from 'vitest';
import { minutosDeLaSemana, pesoDeZona, repartirAerobico } from './aerobico.ts';
import type { SessionItemBlueprint } from './contract.ts';
import { V1_RESEARCH } from './index.ts';
import { createRng } from './rng.ts';

/**
 * EL CARDIO DE LA SEMANA (`docs/research/68`)
 *
 * `repartirAerobico` decide cuántos minutos suma cada sesión: tiene que llegar
 * a lo que falta si el tiempo alcanza, no pasar nunca lo que sobra en una
 * sesión, y quedar lo más parejo posible.
 */

describe('repartirAerobico', () => {
  it('con lugar en todas, parejo', () => {
    expect(
      repartirAerobico({ faltan: 90, libres: [60, 60, 60], vecesPorSemana: [1, 1, 1] }),
    ).toEqual([30, 30, 30]);
  });

  it('la que tiene poco lugar usa todo, y lo que no entró se lo llevan las otras', () => {
    expect(
      repartirAerobico({ faltan: 90, libres: [10, 60, 60], vecesPorSemana: [1, 1, 1] }),
    ).toEqual([10, 40, 40]);
  });

  it('si no alcanza, todo lo que hay', () => {
    expect(
      repartirAerobico({ faltan: 200, libres: [10, 20, 30], vecesPorSemana: [1, 1, 1] }),
    ).toEqual([10, 20, 30]);
  });

  it('una sesión que sale dos veces por semana rinde el doble', () => {
    expect(repartirAerobico({ faltan: 90, libres: [60, 60], vecesPorSemana: [2, 1] })).toEqual([
      30, 30,
    ]);
  });

  it('con menos días que sesiones, cuenta la rotación', () => {
    expect(repartirAerobico({ faltan: 30, libres: [60, 60], vecesPorSemana: [0.5, 0.5] })).toEqual([
      30, 30,
    ]);
  });

  it('en minutos enteros, y nada donde no entra ni un minuto', () => {
    expect(
      repartirAerobico({ faltan: 100, libres: [10.7, 0.4, 20], vecesPorSemana: [1, 1, 1] }),
    ).toEqual([10, 0, 20]);
  });

  it('en 2.000 casos al azar: nunca pasa lo que sobra, y llega siempre que el tiempo alcance', () => {
    const rng = createRng(11);
    const entero = (max: number) => Math.floor(rng() * (max + 1));
    let llegaron = 0;
    for (let c = 0; c < 2000; c++) {
      const n = 1 + entero(5);
      const libres = Array.from({ length: n }, () => entero(90) + rng());
      const vecesPorSemana = Array.from({ length: n }, () => [0.5, 1, 2][entero(2)] ?? 1);
      const faltan = entero(300);
      const out = repartirAerobico({ faltan, libres, vecesPorSemana });
      const suma = out.reduce((t, m, k) => t + m * (vecesPorSemana[k] ?? 0), 0);
      const alcanza =
        libres.reduce((t, l, k) => t + Math.floor(l) * (vecesPorSemana[k] ?? 0), 0) >= faltan;
      out.forEach((m, k) => {
        expect(m).toBeLessThanOrEqual(libres[k] ?? 0);
        expect(Number.isInteger(m)).toBe(true);
      });
      if (alcanza) {
        expect(suma, JSON.stringify({ faltan, libres, vecesPorSemana })).toBeGreaterThanOrEqual(
          faltan,
        );
        llegaron += 1;
      }
    }
    expect(llegaron).toBeGreaterThan(500);
  });
});

describe('minutosDeLaSemana', () => {
  const cardio = V1_RESEARCH.cardio;
  if (!cardio?.weeklyMinimum) throw new Error('el ruleset no trae el piso semanal');
  const peso = pesoDeZona(cardio.zones, cardio.weeklyMinimum.vigorousWeight);
  const tramo = (over: Partial<SessionItemBlueprint>): SessionItemBlueprint => ({
    exerciseId: 'x',
    equipmentId: null,
    orderIndex: 0,
    targetSets: 1,
    targetRepsMin: 1,
    targetRepsMax: 1,
    targetLoad: null,
    targetRir: null,
    restSeconds: 0,
    rationale: '',
    isPlaceholder: false,
    targetDurationSeconds: 600,
    targetIntensityZone: 2,
    targetIntervalRestSeconds: null,
    supersetGroup: null,
    ...over,
  });

  it('lo suave no suma, lo moderado vale uno y lo vigoroso su peso', () => {
    const zona = (w: string) => cardio.zones.find((z) => z.whoIntensity === w)?.zone ?? null;
    expect(minutosDeLaSemana([[tramo({ targetIntensityZone: zona('light') })]], [1], peso)).toBe(0);
    expect(minutosDeLaSemana([[tramo({ targetIntensityZone: zona('moderate') })]], [1], peso)).toBe(
      10,
    );
    expect(minutosDeLaSemana([[tramo({ targetIntensityZone: zona('vigorous') })]], [1], peso)).toBe(
      10 * (cardio.weeklyMinimum?.vigorousWeight ?? 0),
    );
  });

  it('la pausa de los intervalos no cuenta, y cada sesión cuenta sus veces', () => {
    const intervalos = tramo({
      targetSets: 4,
      targetDurationSeconds: 240,
      targetIntervalRestSeconds: 180,
    });
    const vigoroso = cardio.weeklyMinimum?.vigorousWeight ?? 0;
    const zona4 = peso(4);
    expect(zona4).toBe(vigoroso);
    expect(minutosDeLaSemana([[{ ...intervalos, targetIntensityZone: 4 }]], [2], peso)).toBe(
      2 * 16 * vigoroso,
    );
  });
});
