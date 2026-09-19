import type { SeasonPhase } from '@bh/domain';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { TemporadaYDia } from './TemporadaYDia.tsx';

afterEach(cleanup);

function ConEstado({ sport }: { readonly sport: string }) {
  const [fase, setFase] = useState<SeasonPhase>('none');
  const [dia, setDia] = useState<number | null>(null);
  return (
    <>
      <TemporadaYDia
        sport={sport}
        seasonPhase={fase}
        matchWeekday={dia}
        onSeasonPhase={setFase}
        onMatchWeekday={setDia}
      />
      <output data-testid="dia">{String(dia)}</output>
    </>
  );
}

const temporada = () => screen.getByLabelText('¿En qué momento de la temporada estás?');
const dia = () => screen.queryByLabelText('¿Qué día jugás?');

describe('TemporadaYDia (`docs/research/65`)', () => {
  it('el día de partido aparece recién en temporada, con un deporte de partidos', () => {
    render(<ConEstado sport="futbol" />);
    expect(dia()).toBeNull();
    fireEvent.change(temporada(), { target: { value: 'preseason' } });
    expect(dia()).toBeNull();
    fireEvent.change(temporada(), { target: { value: 'in_season' } });
    const select = dia();
    expect(select).not.toBeNull();
    if (!select) return;
    fireEvent.change(select, { target: { value: '6' } });
    expect(screen.getByTestId('dia').textContent).toBe('6');
    // "Varía" guarda null.
    fireEvent.change(select, { target: { value: '' } });
    expect(screen.getByTestId('dia').textContent).toBe('null');
  });

  it('un deporte sin partidos no pregunta el día', () => {
    render(<ConEstado sport="running" />);
    fireEvent.change(temporada(), { target: { value: 'in_season' } });
    expect(dia()).toBeNull();
  });
});
