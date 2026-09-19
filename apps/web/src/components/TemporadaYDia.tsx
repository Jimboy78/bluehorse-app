import type { SeasonPhase } from '@bh/domain';
import { DIAS_DE_PARTIDO, ETAPAS, pideDiaDePartido } from '../lib/partido.ts';
import { Field, fieldClass } from './ui/index.ts';

/**
 * El momento de la temporada y, en temporada con un deporte de partidos, el
 * día fijo de partido (`docs/research/65`). Lo usan el onboarding y Perfil.
 *
 * La temporada cambia el volumen del plan; el día de partido, la sesión de
 * cada día cerca del partido. "Varía" guarda `null`: esa semana se declara el
 * partido desde Hoy.
 */
export function TemporadaYDia({
  sport,
  seasonPhase,
  matchWeekday,
  onSeasonPhase,
  onMatchWeekday,
}: {
  readonly sport: string;
  readonly seasonPhase: SeasonPhase;
  readonly matchWeekday: number | null;
  readonly onSeasonPhase: (v: SeasonPhase) => void;
  readonly onMatchWeekday: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Field label="¿En qué momento de la temporada estás?" htmlFor="season-phase">
        <select
          id="season-phase"
          value={seasonPhase}
          onChange={(e) => onSeasonPhase(e.target.value as SeasonPhase)}
          className={fieldClass}
        >
          {ETAPAS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </Field>

      {pideDiaDePartido(sport, seasonPhase) && (
        <Field
          label="¿Qué día jugás?"
          htmlFor="match-weekday"
          hint="Los días cerca del partido la sesión se ajusta sola. Si una semana cambia, lo corregís desde Hoy."
        >
          <select
            id="match-weekday"
            value={matchWeekday ?? ''}
            onChange={(e) => onMatchWeekday(e.target.value === '' ? null : Number(e.target.value))}
            className={fieldClass}
          >
            <option value="">Varía</option>
            {DIAS_DE_PARTIDO.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}
