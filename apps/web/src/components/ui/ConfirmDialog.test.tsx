import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog.tsx';

/**
 * El cuadro de confirmar, probado en un DOM de verdad.
 *
 * Existe por un bug que llegó a producción: borrar un plan pide escribir su
 * nombre, y el campo perdía el foco en CADA tecla. Había que tocar el campo,
 * escribir una letra, tocar de nuevo, otra letra, hasta completar el nombre.
 *
 * Dos causas, las dos invisibles para un test de función pura:
 *
 * 1. El efecto tenía `onCancel` en las dependencias. Quien usa el cuadro le
 *    pasa una función nueva en cada render, así que el efecto se rearmaba
 *    siempre — y su limpieza devuelve el foco a donde estaba antes de abrirse.
 * 2. `onAnimationComplete` mandaba el foco al botón de confirmar en cada
 *    animación terminada, no solo en la de entrada.
 *
 * Con un cuadro de solo botones ninguna de las dos se notaba. Por eso el test
 * simula lo que rompe: un padre que cambia de estado mientras el cuadro está
 * abierto.
 */

afterEach(cleanup);

/** Un cuadro con un campo adentro y un padre que re-renderiza al escribir. */
function ConNombre() {
  const [typed, setTyped] = useState('');
  return (
    <ConfirmDialog
      open
      title="¿Borrar este plan?"
      confirmLabel="Borrarlo"
      // Funciones nuevas en cada render, como las escribe cualquiera que use
      // esto. Es justo lo que rompía.
      onCancel={() => undefined}
      onConfirm={() => undefined}
      confirmDisabled={typed !== 'Potencia'}
    >
      <input aria-label="nombre" value={typed} onChange={(e) => setTyped(e.target.value)} />
    </ConfirmDialog>
  );
}

describe('ConfirmDialog', () => {
  it('no le roba el foco a un campo mientras se escribe', () => {
    render(<ConNombre />);
    const input = screen.getByLabelText('nombre') as HTMLInputElement;

    input.focus();
    expect(document.activeElement).toBe(input);

    // `fireEvent.change` y no tocar `.value` a mano: React sigue el valor con
    // su propio setter, así que escribir en la propiedad no dispara `onChange`
    // y el padre nunca re-renderiza — el test pasaría sin probar nada.
    let escrito = '';
    for (const letra of 'Potencia') {
      escrito += letra;
      fireEvent.change(input, { target: { value: escrito } });
      expect(input.value).toBe(escrito);
      expect(document.activeElement).toBe(input);
    }
  });

  it('el botón de confirmar se habilita cuando lo escrito coincide', () => {
    render(<ConNombre />);
    const input = screen.getByLabelText('nombre') as HTMLInputElement;
    const confirmar = screen.getByRole('button', { name: 'Borrarlo' }) as HTMLButtonElement;

    expect(confirmar.disabled).toBe(true);

    fireEvent.change(input, { target: { value: 'Potencia' } });

    expect(confirmar.disabled).toBe(false);
  });

  it('cerrado no renderiza nada', () => {
    render(
      <ConfirmDialog
        open={false}
        title="No debería verse"
        confirmLabel="Dale"
        onCancel={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(screen.queryByText('No debería verse')).toBeNull();
  });
});
