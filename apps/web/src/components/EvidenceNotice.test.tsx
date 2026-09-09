import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { activeRuleset } from '../lib/engine.ts';
import { EvidenceNotice } from './EvidenceNotice.tsx';

/**
 * El aviso de evidencia del objetivo elegido.
 *
 * Antes solo aparecía con `confidence: 'low'`, así que las notas de `cardio` y
 * `recomposition` —que son `medium` y explican limitaciones reales del plan—
 * quedaban escritas en el ruleset y nunca se mostraban. Ver
 * `docs/research/12-objetivo.md`.
 *
 * El detalle va plegado porque las notas miden entre 279 y 432 caracteres y
 * esto vive arriba de todo en la pantalla de inicio. Lo que NO se pliega es el
 * encabezado que avisa que la evidencia es floja: eso lo pide la regla dura 4.
 */
describe('EvidenceNotice', () => {
  afterEach(cleanup);

  const notaDe = (goal: 'cardio' | 'recomposition' | 'power' | 'strength') =>
    activeRuleset.prescription[goal]?.confidenceNote;

  it('muestra la nota de un objetivo de confianza media', () => {
    const nota = notaDe('recomposition');
    if (!nota) throw new Error('El ruleset activo no tiene nota para recomposición.');

    render(<EvidenceNotice goal="recomposition" />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(new RegExp(nota.slice(0, 40)))).toBeTruthy();
  });

  it('la nota de confianza baja sigue apareciendo, y con otro encabezado', () => {
    const nota = notaDe('power');
    if (!nota) throw new Error('El ruleset activo no tiene nota para potencia.');

    render(<EvidenceNotice goal="power" />);
    // El encabezado no se pliega: es la advertencia, no el detalle.
    expect(screen.getByText('Sobre este objetivo:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(new RegExp(nota.slice(0, 40)))).toBeTruthy();
  });

  it('distingue lo flojo de lo que solo hay que explicar', () => {
    render(<EvidenceNotice goal="cardio" />);
    expect(screen.getByText('Cómo se arma este objetivo:')).toBeTruthy();
    expect(screen.queryByText('Sobre este objetivo:')).toBeNull();
  });

  it('el detalle arranca plegado y se abre al tocarlo', () => {
    const nota = notaDe('cardio');
    if (!nota) throw new Error('El ruleset activo no tiene nota para cardio.');

    render(<EvidenceNotice goal="cardio" />);
    const boton = screen.getByRole('button');
    expect(boton.getAttribute('aria-expanded')).toBe('false');
    // El texto está en el DOM pero oculto: `hidden` lo saca de la vista y de
    // la línea de accesibilidad sin desmontarlo.
    expect(screen.getByText(new RegExp(nota.slice(0, 40))).hasAttribute('hidden')).toBe(true);

    fireEvent.click(boton);
    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText(new RegExp(nota.slice(0, 40))).hasAttribute('hidden')).toBe(false);
  });

  it('un objetivo sin nada que aclarar no muestra nada', () => {
    const { container } = render(<EvidenceNotice goal="strength" />);
    expect(container.textContent).toBe('');
  });

  it('sin objetivo elegido no muestra nada', () => {
    const { container } = render(<EvidenceNotice goal={null} />);
    expect(container.textContent).toBe('');
  });
});
