import type { BodyRegion } from '@bh/domain';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { type FormEvent, useState } from 'react';
import type { SessionFeel } from '../lib/mappers/session-close.ts';
import { fadeUp, tappable } from '../lib/motion.ts';
import { useCloseSession } from '../lib/session-log.ts';

/**
 * Cierre de sesión: 30 segundos, no un formulario largo. Sensación, una
 * molestia como mucho, notas opcionales. Marca la sesión como completada —
 * es lo único que hace avanzar la cola a la siguiente.
 */

const FEEL_LABELS: Record<SessionFeel, string> = {
  easy: 'Fácil',
  right: 'Justo',
  hard: 'Durísima',
};

const REGION_LABELS: Record<BodyRegion, string> = {
  neck: 'Cuello',
  shoulder: 'Hombro',
  elbow: 'Codo',
  wrist: 'Muñeca',
  upper_back: 'Espalda alta',
  lower_back: 'Zona lumbar',
  hip: 'Cadera',
  knee: 'Rodilla',
  ankle: 'Tobillo',
  other: 'Otra',
};

export function SessionClose({
  planSessionId,
  workoutLogId,
  onClosed,
}: {
  planSessionId: string;
  workoutLogId: string | null;
  onClosed: () => void;
}) {
  const closeSession = useCloseSession();
  const [feel, setFeel] = useState<SessionFeel | null>(null);
  const [painRegion, setPainRegion] = useState<BodyRegion | null>(null);
  const [severity, setSeverity] = useState(3);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!feel) {
      setError('Elegí cómo te sentiste.');
      return;
    }
    setError(null);
    try {
      await closeSession.mutateAsync({
        planSessionId,
        workoutLogId,
        feel,
        notes,
        pain: painRegion ? { region: painRegion, severity } : null,
      });
      onClosed();
    } catch {
      setError('No se pudo cerrar la sesión. Revisá tu conexión y probá de nuevo.');
    }
  }

  return (
    <motion.form
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
    >
      <h2 className="text-2xl font-bold tracking-tight">¿Cómo te sentiste?</h2>

      <div className="flex gap-2">
        {(Object.keys(FEEL_LABELS) as SessionFeel[]).map((f) => (
          <motion.button
            key={f}
            type="button"
            {...tappable}
            onClick={() => setFeel(f)}
            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold ${
              feel === f ? 'border-teal bg-teal/10 text-teal' : 'border-line bg-navy-soft'
            }`}
          >
            {FEEL_LABELS[f]}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm">¿Alguna molestia? (opcional)</span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(REGION_LABELS) as BodyRegion[]).map((region) => (
            <motion.button
              key={region}
              type="button"
              {...tappable}
              onClick={() => setPainRegion((prev) => (prev === region ? null : region))}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                painRegion === region
                  ? 'border-orange bg-orange/10 text-orange'
                  : 'border-line bg-navy-soft'
              }`}
            >
              {REGION_LABELS[region]}
            </motion.button>
          ))}
        </div>

        {painRegion && (
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="severity">
            Qué tan fuerte, del 1 al 5
            <input
              id="severity"
              type="range"
              min={1}
              max={5}
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="accent-orange"
            />
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1.5 text-sm" htmlFor="close-notes">
        Notas (opcional)
        <textarea
          id="close-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Algo para recordar la próxima vez…"
          className="rounded-lg border border-line bg-navy-soft px-3.5 py-2.5 outline-none focus:border-teal"
        />
      </label>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-orange">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}

      <motion.button
        type="submit"
        {...tappable}
        disabled={closeSession.isPending}
        className="flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3.5 text-sm font-semibold text-navy disabled:opacity-50"
      >
        {closeSession.isPending ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Check size={16} aria-hidden="true" />
        )}
        Terminar sesión
      </motion.button>
    </motion.form>
  );
}
