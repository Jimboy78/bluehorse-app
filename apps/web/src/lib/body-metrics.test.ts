import type { BodyMetric } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { currentMetrics, toBodyMetric, weightChange } from './body-metrics.ts';

/**
 * `body_metrics` es append-only: cada medición agrega una fila y la vigente se
 * arma leyendo hacia atrás. Lo que se prueba acá es que registrar un peso
 * suelto no "borre" la altura en pantalla, que es lo que pasaría si la vigente
 * fuera simplemente la última fila.
 */

function metric(overrides: Partial<BodyMetric> = {}): BodyMetric {
  return { weightKg: 70, heightCm: 175, recordedAt: '2026-09-01T10:00:00.000Z', ...overrides };
}

describe('toBodyMetric', () => {
  it('convierte los numeric de Postgres, que llegan como string', () => {
    const parsed = toBodyMetric({
      weight_kg: '68.50' as unknown as number,
      height_cm: '168.0' as unknown as number,
      recorded_at: '2026-09-08T12:00:00.000Z',
    });
    expect(parsed.weightKg).toBe(68.5);
    expect(parsed.heightCm).toBe(168);
  });

  it('deja los nulos como nulos, no como cero', () => {
    // Un 0 acá sería un peso de 0 kg, que es un dato, no una ausencia.
    const parsed = toBodyMetric({ weight_kg: null, height_cm: null, recorded_at: 'x' });
    expect(parsed.weightKg).toBeNull();
    expect(parsed.heightCm).toBeNull();
  });
});

describe('currentMetrics', () => {
  it('sin ninguna medición devuelve null', () => {
    expect(currentMetrics([])).toBeNull();
  });

  it('toma la medición más reciente cuando está completa', () => {
    const historia = [
      metric({ weightKg: 72, recordedAt: '2026-09-08T10:00:00.000Z' }),
      metric({ weightKg: 70, recordedAt: '2026-09-01T10:00:00.000Z' }),
    ];
    expect(currentMetrics(historia)?.weightKg).toBe(72);
  });

  it('conserva la altura aunque la última medición solo traiga el peso', () => {
    const historia = [
      metric({ weightKg: 72, heightCm: null, recordedAt: '2026-09-08T10:00:00.000Z' }),
      metric({ weightKg: 70, heightCm: 175, recordedAt: '2026-09-01T10:00:00.000Z' }),
    ];
    const vigente = currentMetrics(historia);
    expect(vigente?.weightKg).toBe(72);
    expect(vigente?.heightCm).toBe(175);
  });

  it('fecha la vigente con la medición más nueva, no con la que aportó la altura', () => {
    const historia = [
      metric({ heightCm: null, recordedAt: '2026-09-08T10:00:00.000Z' }),
      metric({ recordedAt: '2026-09-01T10:00:00.000Z' }),
    ];
    expect(currentMetrics(historia)?.recordedAt).toBe('2026-09-08T10:00:00.000Z');
  });

  it('devuelve null en el campo que nunca se cargó', () => {
    const historia = [metric({ heightCm: null }), metric({ heightCm: null })];
    expect(currentMetrics(historia)?.heightCm).toBeNull();
  });
});

describe('weightChange', () => {
  it('con una sola medición no hay nada que comparar', () => {
    expect(weightChange([metric()])).toBeNull();
  });

  it('mide contra la primera medición, no contra la anterior', () => {
    const historia = [
      metric({ weightKg: 66, recordedAt: '2026-09-08T10:00:00.000Z' }),
      metric({ weightKg: 68, recordedAt: '2026-09-04T10:00:00.000Z' }),
      metric({ weightKg: 70, recordedAt: '2026-09-01T10:00:00.000Z' }),
    ];
    expect(weightChange(historia)?.delta).toBeCloseTo(-4);
  });

  it('no reporta tendencia si las dos mediciones son del mismo día', () => {
    // Pesarse dos veces en una tarde no es una tendencia.
    const historia = [
      metric({ weightKg: 67.2, recordedAt: '2026-09-08T22:00:00.000Z' }),
      metric({ weightKg: 68.5, recordedAt: '2026-09-08T12:00:00.000Z' }),
    ];
    expect(weightChange(historia)).toBeNull();
  });

  it('no reporta diferencias que se redondean a cero', () => {
    const historia = [
      metric({ weightKg: 70.02, recordedAt: '2026-09-08T10:00:00.000Z' }),
      metric({ weightKg: 70, recordedAt: '2026-09-01T10:00:00.000Z' }),
    ];
    expect(weightChange(historia)).toBeNull();
  });

  it('ignora las filas que solo traen altura', () => {
    const historia = [
      metric({ weightKg: null, recordedAt: '2026-09-08T10:00:00.000Z' }),
      metric({ weightKg: 72, recordedAt: '2026-09-05T10:00:00.000Z' }),
      metric({ weightKg: 70, recordedAt: '2026-09-01T10:00:00.000Z' }),
    ];
    expect(weightChange(historia)?.delta).toBeCloseTo(2);
  });
});
