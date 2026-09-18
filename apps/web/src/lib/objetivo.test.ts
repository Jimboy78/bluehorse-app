import { describe, expect, it } from 'vitest';
import { activeRuleset } from './engine.ts';
import {
  type ObjetivoItem,
  objetivoDeLaFila,
  type ResumenItem,
  repsDeLaSerie,
  resumenDelItem,
  zonaDe,
} from './objetivo.ts';

const zonas = activeRuleset.cardio?.zones;

const sala = (over: Partial<ObjetivoItem> = {}): ObjetivoItem => ({
  reps: '6-12',
  durationSeconds: null,
  toFailure: false,
  isUnilateral: false,
  zone: null,
  ...over,
});

describe('objetivoDeLaFila', () => {
  it('trabajo de sala: repeticiones', () => {
    expect(objetivoDeLaFila(sala())).toBe('6-12 reps');
  });

  it('unilateral: dice que es por lado', () => {
    expect(objetivoDeLaFila(sala({ isUnilateral: true }))).toBe('6-12 reps por lado');
    expect(repsDeLaSerie(sala({ reps: '3', isUnilateral: true }))).toBe('3 por lado');
  });

  it('al fallo técnico: no muestra un rango que no es el objetivo', () => {
    const item = sala({ reps: '1-1', toFailure: true });
    expect(objetivoDeLaFila(item)).toBe('al fallo técnico');
    expect(repsDeLaSerie(item)).toBe('al fallo');
    expect(objetivoDeLaFila(item)).not.toContain('1');
  });

  it('cardio: minutos y la zona con el nombre del ruleset, nunca "reps"', () => {
    const zona = zonaDe(2, zonas);
    expect(zona).not.toBeNull();
    const texto = objetivoDeLaFila(sala({ reps: '40 min', durationSeconds: 2400, zone: zona }));
    expect(texto).toBe(`40 min · zona 2, ${zona?.label.toLowerCase()}`);
    expect(texto).not.toContain('reps');
  });

  it('cardio sin zona: solo los minutos', () => {
    expect(objetivoDeLaFila(sala({ reps: '30 min', durationSeconds: 1800 }))).toBe('30 min');
  });
});

describe('zonaDe', () => {
  it('las cinco zonas que el motor puede prescribir están descriptas en el ruleset', () => {
    for (const z of [1, 2, 3, 4, 5]) expect(zonaDe(z, zonas)?.feels).toBeTruthy();
  });

  it('sin zona o fuera del ruleset, null', () => {
    expect(zonaDe(null, zonas)).toBeNull();
    expect(zonaDe(9, zonas)).toBeNull();
  });
});

describe('resumenDelItem (editor del plan a mano)', () => {
  const base = (over: Partial<ResumenItem> = {}): ResumenItem => ({
    targetSets: 4,
    targetRepsMin: 5,
    targetRepsMax: 5,
    durationSeconds: null,
    intervalRestSeconds: null,
    toFailure: false,
    isUnilateral: false,
    zone: null,
    pct1rm: null,
    ...over,
  });

  it('series, repeticiones y el porcentaje si lo hay', () => {
    expect(resumenDelItem(base({ pct1rm: { min: 80, max: 85 } }))).toBe('4 × 5 · 80-85 % 1RM');
  });

  it('al fallo no dice "× 1"', () => {
    const texto = resumenDelItem(
      base({ targetSets: 3, targetRepsMin: 1, targetRepsMax: 1, toFailure: true }),
    );
    expect(texto).toBe('3 × al fallo técnico');
  });

  it('por lado', () => {
    expect(
      resumenDelItem(
        base({ targetSets: 3, targetRepsMin: 3, targetRepsMax: 3, isUnilateral: true }),
      ),
    ).toBe('3 × 3 por lado');
  });

  it('cardio: minutos y zona, no "1 × 1"', () => {
    const texto = resumenDelItem(
      base({
        targetSets: 1,
        targetRepsMin: 1,
        targetRepsMax: 1,
        durationSeconds: 2100,
        zone: zonaDe(2, zonas),
      }),
    );
    expect(texto.startsWith('35 min · zona 2')).toBe(true);
    expect(texto).not.toContain('×');
  });

  it('cardio por vueltas', () => {
    expect(
      resumenDelItem(base({ targetSets: 4, durationSeconds: 240, intervalRestSeconds: 180 })),
    ).toBe('4 × 4 min · 3 min suave');
  });
});
