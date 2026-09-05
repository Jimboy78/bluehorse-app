import type { LoadReading } from '@bh/domain';
import { formatLoad } from '@bh/domain';
import { AlertCircle, Flame, Loader2, TrendingUp, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import type { PersonalRecord, SetRecord, WeeklyVolumePoint } from '../lib/mappers/progress.ts';
import { fadeUp, listContainer, listItem, tappable } from '../lib/motion.ts';
import { useProgress } from '../lib/progress.ts';

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
      <p className="rounded-xl border border-line bg-navy-soft px-4 py-6 text-center text-sm text-slate">
        Iniciá sesión para ver tu progreso.
      </p>
    );
  }

  if (progress.isPending) {
    return (
      <div role="status" className="grid place-items-center py-16">
        <Loader2 size={20} className="animate-spin text-slate" aria-hidden="true" />
        <span className="sr-only">Cargando tu progreso…</span>
      </div>
    );
  }

  if (progress.isError) {
    return (
      <p className="flex items-center gap-1.5 rounded-xl border border-line bg-navy-soft px-4 py-6 text-sm text-slate">
        <AlertCircle size={14} aria-hidden="true" />
        No se pudo leer tu progreso. Probá de nuevo en un momento.
      </p>
    );
  }

  const data = progress.data;
  if (!data || data.adherence.totalSessions === 0) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-2 rounded-xl border border-line bg-navy-soft px-6 py-10 text-center"
      >
        <TrendingUp size={26} className="text-teal" aria-hidden="true" />
        <p className="font-semibold">Todavía no registraste ninguna serie.</p>
        <p className="text-sm text-slate">
          Marcá series en "Hoy" y acá vas a ver tu adherencia, tu volumen y tus récords.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3 rounded-xl border border-line bg-navy-soft p-4"
    >
      <div className="grid grid-cols-3 gap-2.5">
        {/* "sesiones (90 días)" partía en dos líneas y dejaba las tres
            columnas desparejas. La ventana es la misma para las tres, así que
            se dice una sola vez, abajo. */}
        <Stat value={totalSessions} label="sesiones" />
        <Stat value={currentStreakDays} label="racha de días" icon={<Flame size={14} />} />
        <div className="flex flex-col items-center gap-0.5 text-center">
          <span className="text-lg font-bold tabular-nums">
            {lastSessionAt ? formatDate(lastSessionAt) : '—'}
          </span>
          <span className="text-[0.65rem] uppercase tracking-wider text-slate">última sesión</span>
        </div>
      </div>
      <p className="text-center text-[0.65rem] text-slate">últimos 90 días</p>
    </motion.section>
  );
}

function Stat({ value, label, icon }: { value: number; label: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 text-center">
      <span className="flex items-center gap-1 text-lg font-bold tabular-nums text-teal">
        {icon}
        {value}
      </span>
      <span className="text-[0.65rem] uppercase tracking-wider text-slate">{label}</span>
    </div>
  );
}

function WeeklyVolumeChart({ points }: { points: readonly WeeklyVolumePoint[] }) {
  const maxKg = Math.max(1, ...points.map((p) => p.volumeKg));
  const recent = points.slice(-8);

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3 rounded-xl border border-line bg-navy-soft p-4"
    >
      <h3 className="text-sm font-semibold">Volumen semanal</h3>
      {recent.length === 0 ? (
        <p className="text-xs text-slate">
          Sin series con carga convertible a kg todavía (peso corporal, bandas y pines sin tabla no
          entran en esta cuenta).
        </p>
      ) : (
        <div className="flex h-28 items-end gap-2">
          {recent.map((point) => (
            <div key={point.weekStart} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t bg-teal/70"
                style={{ height: `${Math.max(4, (point.volumeKg / maxKg) * 100)}%` }}
                title={`${point.volumeKg} kg`}
              />
              <span className="font-mono text-[0.6rem] text-slate">
                {formatDate(point.weekStart)}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function RecordsList({ records }: { records: readonly PersonalRecord[] }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3 rounded-xl border border-line bg-navy-soft p-4"
    >
      <h3 className="flex items-center gap-1.5 text-sm font-semibold">
        <Trophy size={15} className="text-orange" aria-hidden="true" />
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
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-navy px-3.5 py-2.5"
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{record.exerciseName}</span>
                <span className="text-[0.65rem] text-slate">
                  {formatDate(record.achievedAt)}
                  {!record.isRanked && ' · sin comparar entre estaciones'}
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm text-teal">
                {formatLoadOrDash(record.load)}
                {record.reps !== null && <span className="text-slate"> × {record.reps}</span>}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </motion.section>
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
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3 rounded-xl border border-line bg-navy-soft p-4"
    >
      <h3 className="text-sm font-semibold">Evolución por ejercicio</h3>
      <div className="flex flex-wrap gap-1.5">
        {exercises.map((exercise) => (
          <motion.button
            key={exercise.id}
            type="button"
            {...tappable}
            aria-pressed={selectedId === exercise.id}
            onClick={() => setSelectedId(exercise.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              selectedId === exercise.id
                ? 'border-teal bg-teal/10 text-teal'
                : 'border-line text-slate'
            }`}
          >
            {exercise.name}
          </motion.button>
        ))}
      </div>
      {recentSets.length === 0 ? (
        <p className="text-xs text-slate">Sin series registradas todavía para este ejercicio.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {recentSets.map((set) => (
            <li key={set.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="text-xs text-slate">{formatDate(set.completedAt)}</span>
              <span className="font-mono text-teal">
                {formatLoadOrDash(set.load)}
                {set.reps !== null && <span className="text-slate"> × {set.reps}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
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
