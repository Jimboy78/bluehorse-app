import type { Goal } from '@bh/domain';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
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
 *
 * Va dentro de un router porque el detalle lleva el enlace a `/evidencia`: sin
 * contexto de rutas, `Link` tira al construirse.
 */
describe('EvidenceNotice', () => {
  afterEach(cleanup);

  const montar = (goal: Goal | null) =>
    render(
      <MemoryRouter>
        <EvidenceNotice goal={goal} />
      </MemoryRouter>,
    );

  const notaDe = (goal: 'cardio' | 'recomposition' | 'power' | 'strength') =>
    activeRuleset.prescription[goal]?.confidenceNote;

  it('muestra la nota de un objetivo de confianza media', () => {
    const nota = notaDe('recomposition');
    if (!nota) throw new Error('El ruleset activo no tiene nota para recomposición.');

    montar('recomposition');
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(new RegExp(nota.slice(0, 40)))).toBeTruthy();
  });

  it('la nota de confianza baja sigue apareciendo, y con otro encabezado', () => {
    const nota = notaDe('power');
    if (!nota) throw new Error('El ruleset activo no tiene nota para potencia.');

    montar('power');
    // El encabezado no se pliega: es la advertencia, no el detalle.
    expect(screen.getByText('Sobre este objetivo:')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(new RegExp(nota.slice(0, 40)))).toBeTruthy();
  });

  it('distingue lo flojo de lo que solo hay que explicar', () => {
    montar('cardio');
    expect(screen.getByText('Cómo se arma este objetivo:')).toBeTruthy();
    expect(screen.queryByText('Sobre este objetivo:')).toBeNull();
  });

  it('el detalle arranca plegado y se abre al tocarlo', () => {
    const nota = notaDe('cardio');
    if (!nota) throw new Error('El ruleset activo no tiene nota para cardio.');

    const { container } = montar('cardio');
    const boton = screen.getByRole('button');
    expect(boton.getAttribute('aria-expanded')).toBe('false');

    // Se mira el bloque que el botón declara controlar, no el párrafo suelto:
    // adentro hay más de un hijo (la nota y el enlace a las fuentes), y es el
    // contenedor el que lleva el `hidden`. Buscar el `hidden` en el elemento
    // que contiene el texto daba falso negativo apenas se le sumó el enlace.
    const detalle = container.querySelector(
      `#${CSS.escape(boton.getAttribute('aria-controls') ?? '')}`,
    );
    if (!detalle) throw new Error('El botón no apunta a ningún bloque de detalle.');

    // El texto está en el DOM pero oculto: `hidden` lo saca de la vista y de
    // la línea de accesibilidad sin desmontarlo.
    expect(detalle.hasAttribute('hidden')).toBe(true);
    expect(detalle.textContent).toContain(nota.slice(0, 40));

    fireEvent.click(boton);
    expect(boton.getAttribute('aria-expanded')).toBe('true');
    expect(detalle.hasAttribute('hidden')).toBe(false);
  });

  it('el detalle lleva a las fuentes de ese objetivo, no a la lista entera', () => {
    // La nota plegada es un resumen de dos renglones; abierta se come casi la
    // mitad de la pantalla de un teléfono. El lugar donde esa información
    // respira es `/evidencia`, y llegar ahí sin el objetivo puesto obliga a
    // buscarlo entre seis.
    montar('power');
    fireEvent.click(screen.getByRole('button'));
    const enlace = screen.getByRole('link');
    expect(enlace.getAttribute('href')).toBe('/evidencia?objetivo=power');
  });

  it('un objetivo sin nada que aclarar no muestra nada', () => {
    const { container } = montar('strength');
    expect(container.textContent).toBe('');
  });

  it('sin objetivo elegido no muestra nada', () => {
    const { container } = montar(null);
    expect(container.textContent).toBe('');
  });
});
