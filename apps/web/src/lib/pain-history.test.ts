import type { BodyRegion } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { countByRegion, type PainReport } from './pain-history.ts';

function report(overrides: Partial<PainReport> = {}): PainReport {
  return {
    id: 'r-1',
    bodyRegion: 'knee' as BodyRegion,
    severity: 3,
    note: null,
    reportedAt: '2026-09-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('countByRegion', () => {
  it('sin reportes, mapa vacío', () => {
    expect(countByRegion([]).size).toBe(0);
  });

  it('cuenta una sola aparición como 1, no como señal de patrón', () => {
    const counts = countByRegion([report({ id: 'r-1', bodyRegion: 'shoulder' })]);
    expect(counts.get('shoulder')).toBe(1);
  });

  it('junta la misma zona reportada varias veces', () => {
    const counts = countByRegion([
      report({ id: 'r-1', bodyRegion: 'knee' }),
      report({ id: 'r-2', bodyRegion: 'knee' }),
      report({ id: 'r-3', bodyRegion: 'knee' }),
    ]);
    expect(counts.get('knee')).toBe(3);
  });

  it('mantiene zonas distintas separadas', () => {
    const counts = countByRegion([
      report({ id: 'r-1', bodyRegion: 'knee' }),
      report({ id: 'r-2', bodyRegion: 'lower_back' }),
      report({ id: 'r-3', bodyRegion: 'knee' }),
    ]);
    expect(counts.get('knee')).toBe(2);
    expect(counts.get('lower_back')).toBe(1);
  });
});
