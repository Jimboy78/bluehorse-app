import { ChevronDown, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { SetRecord } from '../lib/mappers/progress.ts';
import { usePinnedExercises } from '../lib/pinned.ts';
import { formatLoadOrDash } from './RecordsList.tsx';
import { Card, Chip } from './ui/index.ts';

/**
 * EVOLUCIÓN POR EJERCICIO
 *
 * Antes era una tabla de ocho filas con fecha, carga y RIR. La tabla dice el
 * dato exacto pero esconde lo único que se viene a mirar acá, que es la forma:
 * si viene subiendo o está planchado. Ahora hay una curva arriba y el detalle
 * queda debajo, plegado — el número exacto sigue disponible, deja de ser lo
 * primero.
 */

const GYM_TZ = 'America/Argentina/Buenos_Aires';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

/** Cuántas series entran en la curva. Diez cabe en un teléfono sin apretarse. */
const VENTANA = 10;

export function ExerciseEvolution({
  setsByExercise,
}: {
  readonly setsByExercise: ReadonlyMap<string, readonly SetRecord[]>;
}) {
  const { toggle, isPinned } = usePinnedExercises();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verDetalle, setVerDetalle] = useState(false);

  const exercises = useMemo(
    () =>
      [...setsByExercise.entries()]
        .map(([id, sets]) => ({ id, name: sets[0]?.exerciseName ?? 'Ejercicio' }))
        .sort((a, b) => {
          // Los fijados primero: mismo criterio que en Récords, y evita que el
          // ejercicio que seguís de cerca quede al final del alfabeto.
          const pa = isPinned(a.id) ? 0 : 1;
          const pb = isPinned(b.id) ? 0 : 1;
          return pa - pb || a.name.localeCompare(b.name);
        }),
    [setsByExercise, isPinned],
  );

  const activeId = selectedId ?? exercises[0]?.id ?? null;
  const sets = (activeId ? setsByExercise.get(activeId) : undefined) ?? [];
  const recentSets = sets.filter((s) => !s.isWarmup).slice(-VENTANA);

  if (exercises.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3.5 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em]">
          Evolución por ejercicio
        </h3>
        {activeId && (
          <button
            type="button"
            onClick={() => toggle(activeId)}
            aria-pressed={isPinned(activeId)}
            aria-label={isPinned(activeId) ? 'Dejar de fijar' : 'Fijar este ejercicio'}
            title={isPinned(activeId) ? 'Dejar de fijar' : 'Fijar este ejercicio'}
            className={`shrink-0 transition-colors ${
              isPinned(activeId) ? 'text-amber' : 'text-slate-dim hover:text-amber'
            }`}
          >
            <Star
              size={14}
              aria-hidden="true"
              fill={isPinned(activeId) ? 'currentColor' : 'none'}
            />
          </button>
        )}
      </div>

      {/* Una fila que corre en horizontal: con el catálogo real son decenas de
          ejercicios, y envueltos empujaban el gráfico abajo del pliegue. */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5 pb-1">
          {exercises.map((exercise) => (
            <Chip
              key={exercise.id}
              selected={activeId === exercise.id}
              onClick={() => setSelectedId(exercise.id)}
            >
              {isPinned(exercise.id) && (
                <Star size={11} aria-hidden="true" fill="currentColor" className="text-amber" />
              )}
              {exercise.name}
            </Chip>
          ))}
        </div>
      </div>

      {recentSets.length === 0 ? (
        <p className="text-xs text-slate">Sin series registradas todavía para este ejercicio.</p>
      ) : (
        <>
          <LoadSparkline sets={recentSets} />

          <button
            type="button"
            onClick={() => setVerDetalle((v) => !v)}
            aria-expanded={verDetalle}
            className="flex items-center gap-1.5 self-start text-xs text-slate transition-colors hover:text-brand"
          >
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`transition-transform ${verDetalle ? 'rotate-180' : ''}`}
            />
            {verDetalle ? 'Ocultar el detalle' : 'Ver serie por serie'}
          </button>

          {verDetalle && (
            <ul className="flex flex-col divide-y divide-line/70">
              {[...recentSets].reverse().map((set) => (
                <li key={set.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-xs text-slate">{formatDate(set.completedAt)}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-display text-base font-semibold tabular-nums text-ink">
                      {formatLoadOrDash(set.load)}
                      {set.reps !== null && (
                        <span className="text-sm font-normal text-slate"> × {set.reps}</span>
                      )}
                    </span>
                    {set.rir !== null && <RirBadge value={set.rir} />}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}

/**
 * La curva de carga de las últimas series.
 *
 * SVG inline y no una librería de gráficos: son diez puntos y una línea, y
 * bajar un paquete de charts a una PWA que se usa en el gimnasio con datos
 * móviles no se paga con esto.
 *
 * **El eje vertical no arranca en cero.** Con cargas de 60 a 70 kg, un eje
 * desde cero deja toda la variación en una franja de dos píxeles y la curva
 * parece plana cuando no lo es. La contrapartida es que la altura ya no se
 * puede leer como proporción, así que la pantalla lo dice.
 *
 * Solo entran las series con kg normalizado: una banda o el peso corporal no
 * tienen altura que comparar, y ponerlas en cero dibujaría una caída que no
 * existió (regla dura 6).
 */
function LoadSparkline({ sets }: { readonly sets: readonly SetRecord[] }) {
  const valores = sets.map((s) => s.loadKgNormalized).filter((v): v is number => v !== null);

  if (valores.length < 2) {
    return (
      <p className="text-xs leading-relaxed text-slate">
        Hacen falta al menos dos series con carga en kg para dibujar la curva. Las bandas, el peso
        corporal y los pines sin tabla no se pueden comparar entre sí.
      </p>
    );
  }

  const min = Math.min(...valores);
  const max = Math.max(...valores);
  // Con todas las series en la misma carga el rango es cero: se dibuja plana
  // al medio en vez de dividir por cero.
  const rango = max - min || 1;
  const ANCHO = 300;
  const ALTO = 64;

  const coords = valores.map((v, i) => ({
    x: (i / (valores.length - 1)) * ANCHO,
    y: min === max ? ALTO / 2 : ALTO - ((v - min) / rango) * ALTO,
  }));

  const linea = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');
  const area = `${linea} L ${ANCHO} ${ALTO} L 0 ${ALTO} Z`;
  const ultimo = coords.at(-1);
  const delta = Math.round(((valores.at(-1) as number) - (valores[0] as number)) * 10) / 10;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 font-mono text-[0.65rem] text-slate-dim">
        <span>{min === max ? `${min} kg` : `${min} – ${max} kg`}</span>
        <span className={delta > 0 ? 'text-brand' : delta < 0 ? 'text-orange' : undefined}>
          {delta === 0 ? 'sin cambio' : `${delta > 0 ? '+' : ''}${delta} kg`} · {valores.length}{' '}
          series
        </span>
      </div>
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        preserveAspectRatio="none"
        className="h-16 w-full overflow-visible text-brand"
        role="img"
        aria-label={`Carga de las últimas ${valores.length} series, entre ${min} y ${max} kilos`}
      >
        <defs>
          <linearGradient id="bh-spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#bh-spark)" />
        <path
          d={linea}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {ultimo && <circle cx={ultimo.x} cy={ultimo.y} r="3.5" fill="currentColor" />}
      </svg>
      <p className="text-[0.6rem] leading-snug text-slate-dim">
        La altura compara entre estas series, no contra cero.
      </p>
    </div>
  );
}

/**
 * RIR: cuántas repeticiones más podría haber hecho, declaradas al cerrar la
 * serie. 0-1 se resalta en naranja: es la zona que el motor mira para proponer
 * una suba de carga, y a la persona le sirve verla venir antes de que llegue
 * la propuesta.
 */
function RirBadge({ value }: { readonly value: number }) {
  const alto = value <= 1;
  return (
    <span
      className={`font-mono text-[0.65rem] font-medium ${alto ? 'text-orange' : 'text-slate-dim'}`}
      title="Repeticiones en reserva declaradas"
    >
      RIR {value}
    </span>
  );
}
