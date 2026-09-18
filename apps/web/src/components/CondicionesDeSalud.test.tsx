import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CondicionesDeSalud } from './CondicionesDeSalud.tsx';

/**
 * LA PUERTA ANTES DE LA LISTA
 *
 * Lo que pidió el dueño: primero un sí o un no, y recién con un sí la lista.
 * Se fija que la lista no aparece de entrada, que un "no" guarda vacío (y en el
 * perfil, borra lo que había), y que un "sí" sin nada marcado no se puede
 * guardar, porque no se sabe qué quiso decir.
 */

// happy-dom cancela las animaciones de `whileTap` al desmontar y motion lo
// deja como rechazo sin manejar: la corrida sale en rojo con los tests en verde.
MotionGlobalConfig.skipAnimations = true;

afterEach(cleanup);

const guardar = vi.fn(async (c: readonly string[]) => [...c]);

vi.mock('../lib/health-conditions.ts', async (original) => ({
  ...(await original<typeof import('../lib/health-conditions.ts')>()),
  useSaveHealthConditions: () => ({ mutateAsync: guardar, isPending: false, isError: false }),
}));

beforeEach(() => {
  guardar.mockClear();
});

const boton = () => screen.getByRole('button', { name: 'Seguir' });

describe('CondicionesDeSalud', () => {
  it('sin responder la puerta no hay lista ni se puede seguir; con un no, guarda vacío', async () => {
    const onGuardado = vi.fn();
    render(
      <CondicionesDeSalud inicial={[]} sex={null} textoBoton="Seguir" onGuardado={onGuardado} />,
    );
    expect(screen.queryByText('Presión alta')).toBeNull();
    expect(boton()).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    fireEvent.click(boton());
    await waitFor(() => expect(onGuardado).toHaveBeenCalledWith([]));
    expect(guardar).toHaveBeenCalledWith([]);
  });

  it('con un sí aparece la lista, y hace falta marcar algo para guardar', async () => {
    render(<CondicionesDeSalud inicial={[]} sex={null} textoBoton="Seguir" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    expect(boton()).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'Presión alta' }));
    fireEvent.click(boton());
    await waitFor(() => expect(guardar).toHaveBeenCalledWith(['hypertension']));
  });

  it('en el perfil arranca abierta con lo guardado, y un no lo borra', async () => {
    render(<CondicionesDeSalud inicial={['asthma']} sex="male" textoBoton="Seguir" />);
    expect(screen.getByRole('button', { name: 'Asma' }).getAttribute('aria-pressed')).toBe('true');
    // A un hombre no se le pregunta por embarazo.
    expect(screen.queryByText('Estoy embarazada')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    fireEvent.click(boton());
    await waitFor(() => expect(guardar).toHaveBeenCalledWith([]));
  });
});
