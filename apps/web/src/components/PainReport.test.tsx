import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activeRuleset } from '../lib/engine.ts';
import { PainReport } from './PainReport.tsx';

/**
 * LA APP RECOMIENDA, NO PROHÍBE
 *
 * Lo que se fija acá no es el diseño del panel sino la regla de producto que
 * hay detrás: **por fuerte que sea el dolor, siempre hay un botón que dice
 * seguir.** Una app que le corta el día a alguien que se tomó el trabajo de
 * venir al gimnasio deja de usarse, y entonces tampoco se entera de la próxima
 * molestia. Lo que sí cambia arriba del umbral es lo que se le recomienda y que
 * aparezca la opción de cortar — no que las otras desaparezcan.
 *
 * El umbral y los textos salen del ruleset, así que el test los lee de ahí: si
 * mañana el 4 pasa a ser 3, esto sigue midiendo lo mismo.
 */

afterEach(cleanup);

const reportar = vi.fn();

vi.mock('../lib/session-log.ts', () => ({
  useReportPain: () => ({ mutateAsync: reportar, isPending: false }),
}));

const REGLAS = activeRuleset.safety?.inSessionPain;
const ESCALA = activeRuleset.safety?.severityScale ?? [];

function montar(props: Partial<Parameters<typeof PainReport>[0]> = {}) {
  return render(
    <PainReport
      exerciseName="Sentadilla en Smith"
      workoutLogId="log-1"
      onSwap={vi.fn()}
      onSkip={vi.fn()}
      onKeepGoing={vi.fn()}
      onEndSession={vi.fn()}
      onCancel={vi.fn()}
      {...props}
    />,
  );
}

/** Elige zona y después el escalón de severidad pedido, como haría una persona. */
async function reportarDolor(severity: number) {
  fireEvent.click(screen.getByText('Rodilla'));
  const escalon = ESCALA.find((e) => e.severity === severity);
  if (!escalon) throw new Error(`el ruleset no tiene el escalón ${severity}`);
  fireEvent.click(screen.getByText(escalon.label));
  await waitFor(() => expect(screen.getByText(/Anotado para el próximo plan/)).toBeTruthy());
}

beforeEach(() => {
  reportar.mockReset();
  reportar.mockResolvedValue(undefined);
});

describe('PainReport', () => {
  it('el ruleset trae el umbral y los dos textos', () => {
    // Sin esto el resto del archivo mide un panel que no se dibuja.
    expect(REGLAS, 'falta safety.inSessionPain en el ruleset').toBeDefined();
    expect(ESCALA.length, 'falta safety.severityScale').toBeGreaterThan(0);
  });

  it('con el dolor más fuerte igual deja seguir', async () => {
    if (!REGLAS) return;
    montar();
    await reportarDolor(ESCALA[ESCALA.length - 1]?.severity ?? 5);

    // Lo que aparece de más: cortar y la recomendación de preguntar.
    expect(screen.getByText('Terminar la sesión acá')).toBeTruthy();
    expect(screen.getByText(REGLAS.limitedText)).toBeTruthy();
    // Y lo que NO desaparece: las tres salidas que dejan entrenar.
    expect(screen.getByText('Hacerlo igual')).toBeTruthy();
    expect(screen.getByText('Cambiar este ejercicio')).toBeTruthy();
    expect(screen.getByText('Saltearlo y seguir con el resto')).toBeTruthy();
  });

  it('por debajo del umbral no ofrece cortar la sesión', async () => {
    if (!REGLAS) return;
    montar();
    await reportarDolor(REGLAS.limitsMovementFrom - 1);

    expect(screen.getByText(REGLAS.text)).toBeTruthy();
    expect(screen.queryByText('Terminar la sesión acá')).toBeNull();
    expect(screen.getByText('Hacerlo igual')).toBeTruthy();
  });

  it('justo en el umbral ya recomienda lo del dolor que limita', async () => {
    if (!REGLAS) return;
    montar();
    await reportarDolor(REGLAS.limitsMovementFrom);

    expect(screen.getByText(REGLAS.limitedText)).toBeTruthy();
    expect(screen.getByText('Terminar la sesión acá')).toBeTruthy();
  });

  it('guarda la zona, la severidad y con qué ejercicio apareció', async () => {
    if (!REGLAS) return;
    montar();
    await reportarDolor(REGLAS.limitsMovementFrom);

    expect(reportar).toHaveBeenCalledWith({
      workoutLogId: 'log-1',
      region: 'knee',
      severity: REGLAS.limitsMovementFrom,
      exerciseName: 'Sentadilla en Smith',
    });
  });

  it('si no se pudo guardar, el consejo sale igual', async () => {
    if (!REGLAS) return;
    reportar.mockRejectedValue(new Error('sin señal'));
    montar();

    fireEvent.click(screen.getByText('Rodilla'));
    const escalon = ESCALA.find((e) => e.severity === REGLAS.limitsMovementFrom);
    fireEvent.click(screen.getByText(escalon?.label ?? ''));

    // Perder el registro es malo; trabarle la sesión por un problema de red
    // sería castigarlo por avisar.
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText(REGLAS.limitedText)).toBeTruthy();
    expect(screen.getByText('Hacerlo igual')).toBeTruthy();
    expect(screen.queryByText(/Anotado para el próximo plan/)).toBeNull();
  });
});
