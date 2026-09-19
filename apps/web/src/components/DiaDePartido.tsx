import type { MatchDayState } from '@bh/domain';
import { AlertCircle, Loader2, Trophy } from 'lucide-react';
import { useState } from 'react';
import { activeRuleset } from '../lib/engine.ts';
import { ESTADOS_DEL_PARTIDO } from '../lib/partido.ts';
import { Button, Card, Notice } from './ui/index.ts';

/**
 * El partido en Hoy (`docs/research/65`). Dice en qué momento del partido está
 * el día, qué se ajustó y por qué, y deja corregirlo cuando esa semana el
 * partido no es el de siempre. Solo lo ve quien juega un deporte de partidos
 * y está en temporada: con `estado` en `null` no dibuja nada.
 */
export function DiaDePartido({
  estado,
  nota,
  cambiando,
  error,
  onCambiar,
}: {
  readonly estado: MatchDayState | null;
  /** Lo que ajustó el motor hoy, o `null` si no tocó nada. */
  readonly nota: string | null;
  readonly cambiando: boolean;
  readonly error: boolean;
  readonly onCambiar: (estado: MatchDayState) => void;
}) {
  const [eligiendo, setEligiendo] = useState(false);
  if (estado === null) return null;
  const regla = activeRuleset.sports?.matchDay?.[estado];
  const normal = estado === 'normal';

  return (
    <Card tone="nested" className="flex flex-col gap-3 px-4 py-3.5">
      <div className="flex items-start gap-3">
        <Trophy size={16} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-ink">
            {normal ? 'Sin partido cerca' : (regla?.label ?? estado)}
          </p>
          {!normal && <p className="text-xs leading-relaxed text-slate">{nota ?? regla?.note}</p>}
        </div>
      </div>

      {eligiendo ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs text-slate">¿Cuándo jugás?</legend>
          {ESTADOS_DEL_PARTIDO.map((e) => (
            <Button
              key={e.id}
              variant={e.id === estado ? 'secondary' : 'ghost'}
              disabled={cambiando}
              aria-pressed={e.id === estado}
              onClick={() => {
                setEligiendo(false);
                if (e.id !== estado) onCambiar(e.id);
              }}
            >
              {e.id === 'normal' ? 'No juego estos días' : e.label}
            </Button>
          ))}
        </fieldset>
      ) : (
        <Button variant="ghost" disabled={cambiando} onClick={() => setEligiendo(true)}>
          {cambiando && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
          ¿Cambió el partido?
        </Button>
      )}

      {error && (
        <Notice tone="error" role="alert" icon={<AlertCircle size={15} aria-hidden="true" />}>
          No se pudo guardar el cambio. Probá de nuevo.
        </Notice>
      )}
    </Card>
  );
}
