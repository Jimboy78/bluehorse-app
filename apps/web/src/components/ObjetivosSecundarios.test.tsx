import type { SecondaryGoal } from '@bh/domain';
import { SECONDARY_GOALS } from '@bh/domain';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { alternarSecundario, SECUNDARIOS } from '../lib/objetivos.ts';
import { ObjetivosSecundarios } from './ObjetivosSecundarios.tsx';

afterEach(cleanup);

describe('alternarSecundario (`docs/research/68`)', () => {
  it('marca al final y desmarca sin mover a los demás: el orden es la prioridad', () => {
    expect(alternarSecundario([], 'health')).toEqual(['health']);
    expect(alternarSecundario(['health'], 'fat_loss')).toEqual(['health', 'fat_loss']);
    expect(alternarSecundario(['health', 'fat_loss'], 'health')).toEqual(['fat_loss']);
  });

  it('ofrece todos los secundarios que el motor sabe usar, y ninguno más', () => {
    expect(SECUNDARIOS.map((s) => s.id)).toEqual([...SECONDARY_GOALS]);
  });
});

function Probar({ inicial = [] }: { readonly inicial?: SecondaryGoal[] }) {
  const [v, setV] = useState<SecondaryGoal[]>(inicial);
  return (
    <>
      <ObjetivosSecundarios value={v} onChange={setV} />
      <output data-testid="valor">{v.join(',')}</output>
    </>
  );
}

describe('ObjetivosSecundarios', () => {
  const boton = (label: string) => screen.getByRole('button', { name: new RegExp(label) });

  it('se eligen en orden, y con más de uno se ve el número', () => {
    render(<Probar />);
    fireEvent.click(boton('Cuidar la salud'));
    fireEvent.click(boton('Bajar grasa'));
    expect(screen.getByTestId('valor').textContent).toBe('health,fat_loss');
    expect(boton('Cuidar la salud').getAttribute('aria-pressed')).toBe('true');
    expect(boton('Cuidar la salud').textContent).toContain('1');
    expect(boton('Bajar grasa').textContent).toContain('2');
  });

  it('desmarcar saca solo ese', () => {
    render(<Probar inicial={['fat_loss', 'health']} />);
    fireEvent.click(boton('Bajar grasa'));
    expect(screen.getByTestId('valor').textContent).toBe('health');
    expect(boton('Bajar grasa').getAttribute('aria-pressed')).toBe('false');
  });
});
