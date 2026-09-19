import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { activeRuleset } from '../lib/engine.ts';
import { DiaDePartido } from './DiaDePartido.tsx';

afterEach(cleanup);

const reglas = activeRuleset.sports?.matchDay;

function dibujar(estado: Parameters<typeof DiaDePartido>[0]['estado'], nota: string | null = null) {
  const onCambiar = vi.fn();
  const r = render(
    <DiaDePartido
      estado={estado}
      nota={nota}
      cambiando={false}
      error={false}
      onCambiar={onCambiar}
    />,
  );
  return { onCambiar, ...r };
}

describe('DiaDePartido (`docs/research/65`)', () => {
  it('sin partidos no dibuja nada', () => {
    const { container } = dibujar(null);
    expect(container.innerHTML).toBe('');
  });

  it('el día normal lo dice sin explicar nada', () => {
    dibujar('normal');
    expect(screen.getByText('Sin partido cerca')).toBeTruthy();
  });

  it('cerca del partido: el nombre del estado y lo que ajustó el motor', () => {
    dibujar('day_before', 'Hoy se sacan: Salto al cajón.');
    expect(screen.getByText(reglas?.day_before.label ?? '')).toBeTruthy();
    expect(screen.getByText('Hoy se sacan: Salto al cajón.')).toBeTruthy();
  });

  it('corregirlo manda el estado elegido, y elegir el mismo no manda nada', () => {
    const { onCambiar } = dibujar('normal');
    fireEvent.click(screen.getByRole('button', { name: '¿Cambió el partido?' }));
    fireEvent.click(screen.getByRole('button', { name: 'No juego estos días' }));
    expect(onCambiar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '¿Cambió el partido?' }));
    fireEvent.click(screen.getByRole('button', { name: reglas?.day_before.label ?? '' }));
    expect(onCambiar).toHaveBeenCalledWith('day_before');
  });
});
