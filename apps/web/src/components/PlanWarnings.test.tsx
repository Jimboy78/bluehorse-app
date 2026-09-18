import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AVISOS_VISIBLES, PlanWarnings } from './PlanWarnings.tsx';

afterEach(cleanup);

const avisos = ['primero', 'segundo', 'tercero', 'cuarto'];

describe('PlanWarnings', () => {
  it('muestra los primeros y guarda el resto, sin perder ninguno', () => {
    render(<PlanWarnings warnings={avisos} />);
    for (const a of avisos.slice(0, AVISOS_VISIBLES)) expect(screen.getByText(a)).toBeTruthy();
    expect(screen.queryByText('cuarto')).toBeNull();

    fireEvent.click(
      screen.getByRole('button', { name: `Ver ${avisos.length - AVISOS_VISIBLES} avisos más` }),
    );
    for (const a of avisos) expect(screen.getByText(a)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Ver menos' }));
    expect(screen.queryByText('cuarto')).toBeNull();
  });

  it('con pocos avisos no hay botón', () => {
    render(<PlanWarnings warnings={avisos.slice(0, AVISOS_VISIBLES)} />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
