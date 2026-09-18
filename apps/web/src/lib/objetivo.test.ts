import { describe, expect, it } from 'vitest';
import { activeRuleset } from './engine.ts';
import { type ObjetivoItem, objetivoDeLaFila, repsDeLaSerie, zonaDe } from './objetivo.ts';

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
