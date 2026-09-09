import type { BodyRegion } from '@bh/domain';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { type FormEvent, useState } from 'react';
import { BODY_REGION_LABELS } from '../lib/labels.ts';
import type { SessionFeel } from '../lib/mappers/session-close.ts';
import { fadeUp } from '../lib/motion.ts';
import { useCloseSession } from '../lib/session-log.ts';
import { Button, Chip, Field, fieldClass, Notice } from './ui/index.ts';

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

  // Sin ninguna serie marcada no hay `workout_log`, y la sensación y las
  // notas viven ahí: preguntarlas para después tirarlas es peor que no
  // preguntarlas. La molestia sí se guarda igual, sola, así que esa se sigue
  // ofreciendo.
  const registroVacio = workoutLogId === null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!feel && !registroVacio) {
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
      className="flex flex-col gap-6"
    >
      <h2 className="font-display text-3xl font-semibold uppercase leading-none tracking-tight">
        {registroVacio ? 'Cerrar la sesión' : '¿Cómo te sentiste?'}
      </h2>

      {registroVacio && (
        <Notice tone="info">
          No marcaste ninguna serie, así que no hay entrenamiento que guardar. Podés cerrarla igual
          y pasar a la siguiente.
        </Notice>
      )}

      {/* Tres botones grandes y del mismo ancho: se contesta sin leer, por
          posición, con el teléfono todavía en la mano transpirada. */}
      <div className={`flex gap-2 ${registroVacio ? 'hidden' : ''}`}>
        {(Object.keys(FEEL_LABELS) as SessionFeel[]).map((f) => (
          <motion.button
            key={f}
            type="button"
            aria-pressed={feel === f}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFeel(f)}
            className={`flex-1 rounded-card border px-3 py-4 font-display text-base font-medium uppercase tracking-[0.1em] transition-colors ${
              feel === f
                ? 'border-brand bg-brand/12 text-brand shadow-brand'
                : 'border-line bg-surface text-slate shadow-card hover:border-line-bright'
            }`}
          >
            {FEEL_LABELS[f]}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
          ¿Alguna molestia? (opcional)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(BODY_REGION_LABELS) as BodyRegion[]).map((region) => (
            <Chip
              key={region}
              tone="orange"
              selected={painRegion === region}
              onClick={() => setPainRegion((prev) => (prev === region ? null : region))}
            >
              {BODY_REGION_LABELS[region]}
            </Chip>
          ))}
        </div>

        {painRegion && (
          <label className="mt-1 flex flex-col gap-1 text-sm" htmlFor="severity">
            {/* Con el valor a la vista, igual que los sliders del onboarding:
                sin esto no se sabe si lo que se está reportando es un 2 o un
                4, que es justamente el dato. */}
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
              Qué tan fuerte, del 1 al 5:{' '}
              <strong className="font-display text-base text-orange">{severity}</strong>
            </span>
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

      <Field
        label="Notas (opcional)"
        htmlFor="close-notes"
        className={registroVacio ? 'hidden' : ''}
      >
        <textarea
          id="close-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Algo para recordar la próxima vez…"
          className={fieldClass}
        />
      </Field>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-orange">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" size="lg" disabled={closeSession.isPending}>
        {closeSession.isPending ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Check size={16} aria-hidden="true" />
        )}
        Terminar sesión
      </Button>
    </motion.form>
  );
}
