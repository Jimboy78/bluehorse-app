import type { MovementLimit } from '@bh/domain';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MovimientosQueNoPuede } from './MovimientosQueNoPuede.tsx';

/**
 * LOS MOVIMIENTOS QUE NO PUEDE (`docs/research/58`)
 *
 * La misma puerta que la de lesiones: un no guarda vacío, un sí sin nada no se
 * puede guardar. Los chips se marcan y desmarcan, y lo ya anotado no se ofrece.
 */

MotionGlobalConfig.skipAnimations = true;

afterEach(cleanup);

const declarar = vi.fn(async (_m: readonly MovementLimit[]) => undefined);

vi.mock('../lib/profile.ts', async (original) => ({
  ...(await original<typeof import('../lib/profile.ts')>()),
  useDeclareMovements: () => ({ mutateAsync: declarar, isPending: false, isError: false }),
}));

beforeEach(() => {
  declarar.mockClear();
});

const seguir = () => screen.getByRole('button', { name: 'Seguir' });

describe('MovimientosQueNoPuede', () => {
  it('sin responder no se puede seguir; con un no, guarda vacío', async () => {
    const onGuardado = vi.fn();
    render(
      <MovimientosQueNoPuede
        conPuerta
        yaDeclarados={[]}
        textoBoton="Seguir"
        onGuardado={onGuardado}
      />,
    );
    expect(screen.queryByText('Saltar')).toBeNull();
    expect(seguir()).toHaveProperty('disabled', true);

    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    fireEvent.click(seguir());
    await waitFor(() => expect(onGuardado).toHaveBeenCalled());
    expect(declarar).toHaveBeenCalledWith([]);
  });

  it('con un sí y ninguno marcado no se puede seguir', () => {
    render(<MovimientosQueNoPuede conPuerta yaDeclarados={[]} textoBoton="Seguir" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    expect(seguir()).toHaveProperty('disabled', true);
  });

  it('guarda los que quedaron marcados, en el orden en que se marcaron', async () => {
    render(<MovimientosQueNoPuede conPuerta yaDeclarados={[]} textoBoton="Seguir" />);
    fireEvent.click(screen.getByRole('button', { name: 'Sí' }));
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bajar al piso y levantarme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Colgarme de una barra' }));
    // Desmarcar uno lo saca.
    fireEvent.click(screen.getByRole('button', { name: 'Saltar' }));
    fireEvent.click(seguir());
    await waitFor(() => expect(declarar).toHaveBeenCalledWith(['floor', 'hanging']));
  });

  it('sin puerta van directo los chips, sin los que ya están anotados', () => {
    render(
      <MovimientosQueNoPuede
        conPuerta={false}
        yaDeclarados={['overhead', 'jumping']}
        textoBoton="Guardar"
      />,
    );
    expect(screen.queryByRole('button', { name: 'Sí' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Brazos arriba de la cabeza' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Saltar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Bajar al piso y levantarme' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Colgarme de una barra' })).toBeDefined();
  });
});
