import { cleanup, render, screen } from '@testing-library/react';
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
 */
describe('EvidenceNotice', () => {
  afterEach(cleanup);

  const notaDe = (goal: 'cardio' | 'recomposition' | 'power' | 'strength') =>
    activeRuleset.prescription[goal]?.confidenceNote;

  it('muestra la nota de un objetivo de confianza media', () => {
    const nota = notaDe('recomposition');
    if (!nota) throw new Error('El ruleset activo no tiene nota para recomposición.');

    render(<EvidenceNotice goal="recomposition" />);
    expect(screen.getByText(new RegExp(nota.slice(0, 40)))).toBeTruthy();
  });

  it('la nota de confianza baja sigue apareciendo, y con otro encabezado', () => {
    const nota = notaDe('power');
    if (!nota) throw new Error('El ruleset activo no tiene nota para potencia.');

    render(<EvidenceNotice goal="power" />);
    expect(screen.getByText(new RegExp(nota.slice(0, 40)))).toBeTruthy();
    expect(screen.getByText('Sobre este objetivo:')).toBeTruthy();
  });

  it('distingue lo flojo de lo que solo hay que explicar', () => {
    render(<EvidenceNotice goal="cardio" />);
    expect(screen.getByText('Cómo se arma este objetivo:')).toBeTruthy();
    expect(screen.queryByText('Sobre este objetivo:')).toBeNull();
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
