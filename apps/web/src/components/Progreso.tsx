import type { LoadReading } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import { AlertCircle, CalendarDays, Flame, TrendingUp, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import type { PersonalRecord, SetRecord, WeeklyVolumePoint } from '../lib/mappers/progress.ts';
import { listContainer, listItem } from '../lib/motion.ts';
import { useProgress } from '../lib/progress.ts';
import { Card, Chip, EmptyState, Notice, Skeleton } from './ui/index.ts';

const GYM_TZ = 'America/Argentina/Buenos_Aires';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

/**
 * Progreso real: lo que la persona hizo (`set_logs`/`workout_logs`), nunca lo
 * planificado. Todo lo que se muestra sale de series registradas — sin
 * historial, no hay nada que inventar para llenar la pantalla.
 */
export function Progreso() {
  const { status } = useAuth();
  const progress = useProgress();

  if (status !== 'signed-in') {
    return (
      <EmptyState icon={<TrendingUp size={24} aria-hidden="true" />} title="Sin sesión">
        Iniciá sesión para ver tu progreso.
      </EmptyState>
    );
  }

  if (progress.isPending) {
    return (
      <div role="status" className="flex flex-col gap-5">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-36 w-full" />
        <span className="sr-only">Cargando tu progreso…</span>
      </div>
    );
  }

  if (progress.isError) {
    return (
      <Notice tone="error" role="alert" icon={<AlertCircle size={16} aria-hidden="true" />}>
        No se pudo leer tu progreso. Probá de nuevo en un momento.
      </Notice>
    );
  }

  const data = progress.data;
  if (!data || data.adherence.totalSessions === 0) {
    return (
      <EmptyState
        icon={<TrendingUp size={24} aria-hidden="true" />}
        title="Todavía no registraste nada"
      >
        Marcá series en "Hoy" y acá vas a ver tu adherencia, tu volumen y tus récords.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AdherenceCard
        totalSessions={data.adherence.totalSessions}
        currentStreakDays={data.adherence.currentStreakDays}
        lastSessionAt={data.adherence.lastSessionAt}
      />
      <WeeklyVolumeChart points={data.weeklyVolume} />
      <RecordsList records={data.records} />
      <ExerciseEvolution setsByExercise={data.setsByExercise} />
    </div>
  );
}

function AdherenceCard({
  totalSessions,
  currentStreakDays,
  lastSessionAt,
}: {
  totalSessions: number;
  currentStreakDays: number;
  lastSessionAt: string | null;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      {/* "sesiones (90 días)" partía en dos líneas y dejaba las tres columnas
          desparejas. La ventana es la misma para las tres, así que se dice una
          sola vez, abajo. */}
      <div className="grid grid-cols-3 divide-x divide-line/70">
        <Stat value={totalSessions} label="sesiones" />
        <Stat value={currentStreakDays} label="racha" icon={<Flame size={15} />} />
        <Stat
          value={lastSessionAt ? formatDate(lastSessionAt) : '—'}
          label="última"
          icon={<CalendarDays size={15} />}
          muted
        />
      </div>
      <p className="text-center font-display text-[0.6rem] uppercase tracking-[0.2em] text-slate-dim">
        últimos 90 días
      </p>
    </Card>
  );
}

function Stat({
  value,
  label,
  icon,
  muted = false,
}: {
  value: ReactNode;
  label: string;
  icon?: ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-1 text-center">
      <span
        className={`flex items-center gap-1.5 font-display text-2xl font-semibold leading-none tabular-nums ${
          muted ? 'text-ink' : 'text-brand'
        }`}
      >
        {icon && <span className={muted ? 'text-slate-dim' : 'text-brand/70'}>{icon}</span>}
        {value}
      </span>
      <span className="font-display text-[0.6rem] uppercase tracking-[0.18em] text-slate">
        {label}
      </span>
    </div>
  );
}

/**
 * Volumen de las últimas ocho semanas.
 *
 * Las barras van con degradé hacia arriba y no en un azul plano: en un gráfico
 * de ocho columnas sobre negro, el color sólido hace que la más alta y la más
 * baja se lean casi igual de "llenas". El degradé le da dirección a la altura.
 */
function WeeklyVolumeChart({ points }: { points: readonly WeeklyVolumePoint[] }) {
  const recent = points.slice(-8);
  const maxKg = Math.max(1, ...recent.map((p) => p.volumeKg));

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em]">
          Volumen semanal
        </h3>
        {recent.length > 0 && (
          <span className="font-mono text-[0.65rem] text-slate-dim">
            máx {Math.round(maxKg).toLocaleString('es-AR')} kg
          </span>
        )}
      </div>
      {recent.length === 0 ? (
        <p className="text-xs leading-relaxed text-slate">
          Sin series con carga convertible a kg todavía (peso corporal, bandas y pines sin tabla no
          entran en esta cuenta).
        </p>
      ) : (
        <div className="flex h-32 items-end gap-1.5">
          {recent.map((point, i) => (
            <div key={point.weekStart} className="flex flex-1 flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(3, (point.volumeKg / maxKg) * 100)}%` }}
                transition={{ delay: 0.04 * i, type: 'spring', stiffness: 180, damping: 24 }}
                className="w-full rounded-t-md bg-gradient-to-t from-brand-deep/40 to-brand"
                title={`${point.volumeKg} kg`}
              />
              <span className="font-mono text-[0.55rem] leading-none text-slate-dim">
                {formatDate(point.weekStart)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function RecordsList({ records }: { records: readonly PersonalRecord[] }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="flex items-center gap-2 font-display text-sm font-medium uppercase tracking-[0.16em]">
        <Trophy size={15} className="text-amber" aria-hidden="true" />
        Récords
      </h3>
      {records.length === 0 ? (
        <p className="text-xs text-slate">Todavía no hay series suficientes para marcar récords.</p>
      ) : (
        <motion.ul
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-1.5"
        >
          {records.map((record) => (
            <motion.li
              key={record.exerciseId}
              variants={listItem}
              className="flex items-center justify-between gap-3 rounded-xl border border-line/70 bg-navy px-3.5 py-3"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
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
            </motion.li>
          ))}
        </motion.ul>
      )}
    </Card>
  );
}

function ExerciseEvolution({
  setsByExercise,
}: {
  setsByExercise: ReadonlyMap<string, readonly SetRecord[]>;
}) {
  const exercises = useMemo(
    () =>
      [...setsByExercise.entries()]
        .map(([id, sets]) => ({ id, name: sets[0]?.exerciseName ?? 'Ejercicio' }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [setsByExercise],
  );
  const [selectedId, setSelectedId] = useState<string | null>(exercises[0]?.id ?? null);
  const sets = (selectedId ? setsByExercise.get(selectedId) : undefined) ?? [];
  const recentSets = sets
    .filter((s) => !s.isWarmup)
    .slice(-8)
    .reverse();

  if (exercises.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3.5 p-4">
      <h3 className="font-display text-sm font-medium uppercase tracking-[0.16em]">
        Evolución por ejercicio
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {exercises.map((exercise) => (
          <Chip
            key={exercise.id}
            selected={selectedId === exercise.id}
            onClick={() => setSelectedId(exercise.id)}
          >
            {exercise.name}
          </Chip>
        ))}
      </div>
      {recentSets.length === 0 ? (
        <p className="text-xs text-slate">Sin series registradas todavía para este ejercicio.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line/70">
          {recentSets.map((set) => (
            <li key={set.id} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs text-slate">{formatDate(set.completedAt)}</span>
              <span className="flex items-baseline gap-2">
                <span className="font-display text-base font-semibold tabular-nums text-ink">
                  {formatLoadOrDash(set.load)}
                  {set.reps !== null && (
                    <span className="text-sm font-normal text-slate"> × {set.reps}</span>
                  )}
                </span>
                {/* RIR: cuánto le quedaba en reserva. Es el mismo dato que ya
                    usa el motor para proponer subir o bajar carga — hasta acá
                    nunca se le mostraba al socio su propia tendencia. */}
                {set.rir !== null && <RirBadge value={set.rir} />}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * RIR: cuántas repeticiones más podría haber hecho, declaradas al cerrar la
 * serie. 0-1 se resalta en naranja (el mismo semántico de "esfuerzo" que usa
 * el resto de la app, `styles.css`): es la zona que el motor mira para
 * proponer una suba de carga, y a la persona le sirve verla venir antes de
 * que llegue la propuesta.
 */
function RirBadge({ value }: { value: number }) {
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

/**
 * Una serie puede no tener carga registrada: la primera sesión de alguien que
 * pidió que la app le calcule los pesos, en una estación que todavía no está
 * en el catálogo. Ahí no hay unidad ni valor que mostrar, y decir "0 kg"
 * sería inventar un dato que la persona nunca vio en la máquina.
 *
 * Dice "sin registrar", no "sin carga": esa última frase ya significa otra
 * cosa en `formatLoad` (la estación no lleva peso, como una colchoneta).
 */
function formatLoadOrDash(load: LoadReading | null): string {
  return load === null ? 'sin registrar' : formatLoad(load);
}
