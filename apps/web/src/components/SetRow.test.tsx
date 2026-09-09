import type { EquipmentLoadSpec, LoadReading } from '@bh/domain';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { SetRow } from './SetRow.tsx';

/**
 * La fila de una serie, con el campo de carga adentro.
 *
 * Se prueba con un padre que guarda la carga en su propio estado, como hace
 * `Hoy` de verdad: escribir en el campo de una serie actualiza el estado del
 * ABUELO y vuelve a renderizar la lista entera. Ese es justo el escenario que
 * rompió el foco en el cuadro de borrar un plan, y este es el campo que más se
 * usa en toda la app — se toca en cada serie de cada sesión.
 *
 * La estación de prueba no tiene `increment`: es el caso real del catálogo de
 * Blue Horse (`load_increment` en null en las 58 estaciones), donde antes el
 * campo directamente no aparecía.
 */

afterEach(cleanup);

const SIN_ESCALON: EquipmentLoadSpec = { unit: 'kg' };

function ConEstado({ spec = SIN_ESCALON }: { spec?: EquipmentLoadSpec | null }) {
  const [load, setLoad] = useState<LoadReading | null>(null);
  const [done, setDone] = useState(false);
  return (
    <SetRow
      index={0}
      load={load}
      loadSpec={spec}
      onLoad={setLoad}
      targetReps="8-12"
      done={done}
      onToggle={() => setDone((d) => !d)}
    />
  );
}

describe('SetRow', () => {
  it('deja escribir la carga sin perder el foco', () => {
    render(<ConEstado />);
    const input = screen.getByLabelText('Carga de la serie 1') as HTMLInputElement;

    input.focus();
    for (const valor of ['6', '60']) {
      fireEvent.change(input, { target: { value: valor } });
      expect(input.value).toBe(valor);
      expect(document.activeElement).toBe(input);
    }
  });

  it('una estación sin escalón igual deja anotar: el campo está', () => {
    // El bug original: el campo vivía detrás de `canStep`, que necesita
    // `increment`. Sin él no había forma de anotar el peso en discos ni en
    // peso libre.
    render(<ConEstado />);
    expect(screen.getByLabelText('Carga de la serie 1')).toBeTruthy();
  });

  it('peso corporal no pide un número: no hay nada que anotar ahí', () => {
    render(<ConEstado spec={{ unit: 'bodyweight' }} />);
    expect(screen.queryByLabelText('Carga de la serie 1')).toBeNull();
    expect(screen.getByText('peso corporal')).toBeTruthy();
  });

  it('una serie hecha muestra la carga como texto, no editable', () => {
    render(<ConEstado />);
    const input = screen.getByLabelText('Carga de la serie 1') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '60' } });

    fireEvent.click(screen.getByRole('button', { name: /marcar como hecha/ }));

    // Ya registrada: se corrige destildándola, no editando el número en el
    // lugar — ese registro es el que alimenta la adaptación.
    expect(screen.queryByLabelText('Carga de la serie 1')).toBeNull();
    expect(screen.getByText('60 kg')).toBeTruthy();
  });
});
