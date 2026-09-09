import { describe, expect, it } from 'vitest';
import { yearsSince } from './profile.ts';

/**
 * `yearsSince` es la única cuenta que hace Perfil con la fecha de
 * nacimiento (la base guarda la fecha, nunca la edad — regla dura: nada
 * derivado se guarda cuando se puede calcular). No tenía test propio,
 * a diferencia de cada otra función pura agregada este año: quedó afuera
 * por descuido, no a propósito.
 *
 * Usa `new Date()` de verdad adentro (es una cuenta de UI, no el motor —
 * la regla dura 2 de "nunca leer el reloj" es para `packages/engine`, no
 * para esto), así que las fechas de prueba se calculan relativas a "ahora"
 * en vez de fijas — mismo criterio que ya usa
 * `onboarding/schemas.test.ts` para el mismo tipo de cuenta.
 */

/** N años atrás, mismo día — para no depender de en qué mes se corra el test. */
function yearsAgo(n: number, dayOffset = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
}

describe('yearsSince', () => {
  it('sin fecha, null', () => {
    expect(yearsSince(null)).toBeNull();
  });

  it('fecha ilegible, null — no un NaN silencioso', () => {
    expect(yearsSince('no-es-una-fecha')).toBeNull();
  });

  it('cumplidos hoy: cuenta el año completo', () => {
    expect(yearsSince(yearsAgo(30))).toBe(30);
  });

  it('todavía no llegó el cumpleaños este año: resta uno', () => {
    // Nació hace "30 años" pero un día en el futuro dentro de este año —
    // el cumpleaños de este año no pasó todavía.
    expect(yearsSince(yearsAgo(30, 1))).toBe(29);
  });

  it('el cumpleaños ya pasó este año: cuenta el año completo', () => {
    expect(yearsSince(yearsAgo(30, -1))).toBe(30);
  });

  it('fecha en el futuro: la edad daría negativa, null en vez de inventar', () => {
    expect(yearsSince(yearsAgo(-1))).toBeNull();
  });

  it('edad fuera de rango humano (130+): null, no un número absurdo', () => {
    expect(yearsSince(yearsAgo(140))).toBeNull();
  });

  it('límite exacto: 129 es válido, 130 ya no', () => {
    expect(yearsSince(yearsAgo(129))).toBe(129);
    expect(yearsSince(yearsAgo(130))).toBeNull();
  });
});
