import type { LoadReading } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import { ChevronDown, Star, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { GYM_TZ } from '../lib/gym-time.ts';
import type { MuscleRegion } from '../lib/labels.ts';
import { MUSCLE_REGIONS, REGION_LABELS, regionOf } from '../lib/labels.ts';
import type { PersonalRecord } from '../lib/mappers/progress.ts';
import { listContainer, listItem } from '../lib/motion.ts';
import { MAX_PINNED, usePinnedExercises } from '../lib/pinned.ts';
import { Card } from './ui/index.ts';

/**
 * RÉCORDS, COMPACTADOS
 *
 * Antes era una sola columna alfabética con todos los ejercicios: crece con el
 * catálogo (58 estaciones reales) y no se recorre con el pulgar. Ahora tiene
 * dos niveles — lo anclado arriba, siempre visible, y el resto agrupado por
 * región del cuerpo detrás de un botón.
 *
 * Las regiones son de presentación, no de entrenamiento (ver `lib/labels.ts`):
 * ningún número del plan sale de acá, y por eso agruparlas no toca la regla
 * dura 3.
 */

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

/**
 * Una serie puede no tener carga registrada. Dice "sin registrar", no "sin
 * carga": esa última frase ya significa otra cosa en `formatLoad` (la estación
 * no lleva peso, como una colchoneta).
 */
export function formatLoadOrDash(load: LoadReading | null): string {
  return load === null ? 'sin registrar' : formatLoad(load);
}

export function RecordsList({ records }: { readonly records: readonly PersonalRecord[] }) {
  const { toggle, isPinned, isFull } = usePinnedExercises();
  const [abierto, setAbierto] = useState(false);

  const anclados = records.filter((r) => isPinned(r.exerciseId));
  const resto = records.filter((r) => !isPinned(r.exerciseId));

  const porRegion = useMemo(() => {
    const mapa = new Map<MuscleRegion, PersonalRecord[]>();
    for (const record of resto) {
      const region = regionOf(record.primaryMuscles);
      const lista = mapa.get(region) ?? [];
      lista.push(record);
      mapa.set(region, lista);
    }
    // Se recorre `MUSCLE_REGIONS` y no las claves del mapa para que el orden
    // sea siempre el mismo: de abajo hacia arriba del cuerpo, no el azar del
    // orden de inserción.
    return MUSCLE_REGIONS.filter((r) => mapa.has(r)).map((r) => ({
      region: r,
      records: mapa.get(r) ?? [],
    }));
  }, [resto]);

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.16em]">
          <Trophy size={15} className="text-amber" aria-hidden="true" />
          Récords
        </h3>
        {records.length > 0 && (
          <span className="font-mono text-[0.65rem] text-slate-dim">{records.length}</span>
        )}
      </div>

      {records.length === 0 && (
        <p className="text-xs text-slate">Todavía no hay series suficientes para marcar récords.</p>
      )}

      {records.length > 0 && anclados.length === 0 && (
        <p className="text-xs leading-relaxed text-slate">
          Tocá la estrella de un ejercicio para fijarlo acá arriba y no tener que buscarlo.
        </p>
      )}

      {anclados.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {anclados.map((record) => (
            <li key={record.exerciseId}>
              <RecordRow record={record} pinned onTogglePin={() => toggle(record.exerciseId)} />
            </li>
          ))}
        </ul>
      )}

      {porRegion.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            className="flex items-center gap-1.5 self-start text-xs text-slate transition-colors hover:text-brand"
          >
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform ${abierto ? 'rotate-180' : ''}`}
            />
            {abierto ? 'Ocultar el resto' : `Ver los otros ${resto.length}`}
          </button>

          {abierto && (
            <motion.div
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-3"
            >
              {porRegion.map(({ region, records: delGrupo }) => (
                <motion.section key={region} variants={listItem} className="flex flex-col gap-1.5">
                  <h4 className="font-display text-[0.6rem] uppercase tracking-[0.18em] text-slate-dim">
                    {REGION_LABELS[region]} · {delGrupo.length}
                  </h4>
                  <ul className="flex flex-col gap-1.5">
                    {delGrupo.map((record) => (
                      <li key={record.exerciseId}>
                        <RecordRow
                          record={record}
                          pinned={false}
                          pinDisabled={isFull}
                          onTogglePin={() => toggle(record.exerciseId)}
                        />
                      </li>
                    ))}
                  </ul>
                </motion.section>
              ))}
            </motion.div>
          )}
        </>
      )}
    </Card>
  );
}

function RecordRow({
  record,
  pinned,
  pinDisabled = false,
  onTogglePin,
}: {
  readonly record: PersonalRecord;
  readonly pinned: boolean;
  readonly pinDisabled?: boolean;
  readonly onTogglePin: () => void;
}) {
  const bloqueado = !pinned && pinDisabled;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-3 ${
        pinned ? 'border-brand/40 bg-brand/5' : 'border-line/70 bg-navy'
      }`}
    >
      <button
        type="button"
        onClick={onTogglePin}
        disabled={bloqueado}
        aria-pressed={pinned}
        aria-label={
          pinned ? `Dejar de fijar ${record.exerciseName}` : `Fijar ${record.exerciseName}`
        }
        title={
          bloqueado
            ? `Ya tenés ${MAX_PINNED} fijados: soltá uno para fijar este`
            : pinned
              ? 'Dejar de fijar'
              : 'Fijar arriba'
        }
        className={`shrink-0 transition-colors disabled:opacity-30 ${
          pinned ? 'text-amber' : 'text-slate-dim hover:text-amber'
        }`}
      >
        <Star size={15} aria-hidden="true" fill={pinned ? 'currentColor' : 'none'} />
      </button>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">{record.exerciseName}</span>
        <span className="text-[0.65rem] text-slate-dim">
          {formatDate(record.achievedAt)}
          {!record.isRanked && ' · sin comparar entre estaciones'}
        </span>
      </span>
      <span className="shrink-0 font-display text-base font-semibold tabular-nums text-brand">
        {formatLoadOrDash(record.load)}
        {record.reps !== null && (
          <span className="text-sm font-normal text-slate"> × {record.reps}</span>
        )}
      </span>
    </div>
  );
}
