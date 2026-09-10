import { formatLoad } from '@bh/domain';
import { History } from 'lucide-react';
import { claveComoTexto, diaDelGimnasio } from '../lib/gym-time.ts';
import { useUltimaVez } from '../lib/last-session.ts';

/**
 * QUÉ HICISTE LA ÚLTIMA VEZ EN ESTE EJERCICIO
 *
 * Va al lado del objetivo, no encima: son dos cosas distintas y la pantalla lo
 * dice. Arriba está lo que el plan propone; acá, lo que pasó. Ver
 * `lib/last-session.ts`.
 *
 * No aparece si no hay historial. La primera vez que alguien hace un
 * ejercicio no tiene "vez pasada", y rellenar ese hueco con un cartel de
 * "todavía no hay datos" es ocupar la mitad de un teléfono para no decir nada.
 */
export function UltimaVez({
  exerciseId,
  workoutLogId,
}: {
  exerciseId: string;
  workoutLogId: string | null;
}) {
  const ultima = useUltimaVez(exerciseId, workoutLogId);

  // Si falla, no se muestra: es información de apoyo, nunca puede tapar la
  // pantalla con la que se está entrenando.
  if (!ultima.data || ultima.data.series.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5 rounded-card border border-line bg-surface/60 px-3.5 py-3">
      <h3 className="flex items-center gap-1.5 font-display text-[0.6rem] uppercase tracking-[0.16em] text-slate">
        <History size={11} aria-hidden="true" />
        La vez pasada · {claveComoTexto(diaDelGimnasio(ultima.data.cuando))}
      </h3>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {ultima.data.series.map((serie) => (
          <li
            key={serie.setIndex}
            className="font-mono text-[0.7rem] leading-relaxed text-slate-dim"
          >
            <span className="text-ink">{serie.load ? formatLoad(serie.load) : '—'}</span>
            {serie.reps !== null && <span> × {serie.reps}</span>}
            {/* El RIR se muestra solo si se anotó: un "RIR 0" inventado
                cambiaría por completo lo que esa serie significa. */}
            {serie.rir !== null && <span className="text-slate-dim/70"> · RIR {serie.rir}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
