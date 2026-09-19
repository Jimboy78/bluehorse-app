import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MolestiaDeclarada } from '../lib/profile.ts';
import { conBorrador, LesionesDeclaradas } from './LesionesDeclaradas.tsx';

/**
 * LA PUERTA DE LESIONES
 *
 * Hasta `docs/research/55` la app no tenía dónde declarar una lesión reciente
 * ni un tendón: toda restricción nacía del reporte de dolor de la sesión, como
 * `pain`. Se fija que la puerta funcione como la de salud (un no guarda vacío,
 * un sí sin nada no se puede guardar), que se guarde el tipo que eligió, y que
 * lo cargado sin apretar "Agregar" no se pierda.
 */

MotionGlobalConfig.skipAnimations = true;

afterEach(cleanup);

const declarar = vi.fn(async (_m: readonly MolestiaDeclarada[]) => undefined);

vi.mock('../lib/profile.ts', async (original) => ({
  ...(await original<typeof import('../lib/profile.ts')>()),
  useDeclareConstraints: () => ({ mutateAsync: declarar, isPending: false, isError: false }),
}));

beforeEach(() => {
  declarar.mockClear();
});

const seguir = () => screen.getByRole('button', { name: 'Seguir' });

function cargar(zona: string, tipo: string, escalon: number) {
  fireEvent.click(screen.getByRole('button', { name: zona }));
  fireEvent.click(screen.getByRole('button', { name: tipo }));
  const escala = screen
    .getAllByRole('button', { pressed: false })
    .filter((b) => b.className.includes('rounded-card'));
  const boton = escala[escalon - 1];
  if (!boton) throw new Error(`no hay escalón ${escalon}`);
  fireEvent.click(boton);
}

describe('LesionesDeclaradas', () => {
  it('sin responder no se puede seguir; con un no, guarda vacío', async () => {
    const onGuardado = vi.fn();
    render(<LesionesDeclaradas conPuerta textoBoton="Seguir" onGuardado={onGuardado} />);
    expect(screen.queryByText('¿Dónde?')).toBeNull();
    expect(seguir()).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    fireEvent.click(seguir());
    await waitFor(() => expect(onGuardado).toHaveBeenCalled());
    expect(declarar).toHaveBeenCalledWith([]);
  });

  it('con un sí y nada cargado no se puede seguir', () => {
    render(<LesionesDeclaradas conPuerta textoBoton="Seguir" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    expect(seguir()).toHaveProperty('disabled', true);
  });

  it('guarda el tendón como tendinopatía, aunque no haya apretado "Agregar"', async () => {
    render(<LesionesDeclaradas conPuerta textoBoton="Seguir" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    cargar('Rodilla', 'Una tendinitis o tendinopatía', 3);
    fireEvent.click(seguir());
    await waitFor(() =>
      expect(declarar).toHaveBeenCalledWith([
        { region: 'knee', type: 'tendinopathy', severity: 3 },
      ]),
    );
  });

  it('agrega varias, y la misma zona y tipo se reemplaza', async () => {
    render(<LesionesDeclaradas conPuerta textoBoton="Seguir" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    cargar('Hombro', 'Una lesión reciente', 4);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    cargar('Tobillo', 'Un dolor que vengo arrastrando', 2);
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    fireEvent.click(seguir());
    await waitFor(() =>
      expect(declarar).toHaveBeenCalledWith([
        { region: 'shoulder', type: 'injury', severity: 4 },
        { region: 'ankle', type: 'pain', severity: 2 },
      ]),
    );
  });

  it('conBorrador: una por zona y tipo', () => {
    const a: MolestiaDeclarada = { region: 'knee', type: 'pain', severity: 2 };
    const b: MolestiaDeclarada = { region: 'knee', type: 'pain', severity: 4 };
    const c: MolestiaDeclarada = { region: 'knee', type: 'tendinopathy', severity: 3 };
    expect(conBorrador([a], b)).toEqual([b]);
    expect(conBorrador([a], c)).toEqual([a, c]);
  });
});
