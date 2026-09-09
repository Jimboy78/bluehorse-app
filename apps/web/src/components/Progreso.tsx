import { AlertCircle, CalendarDays, Flame, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import type { WeeklyVolumePoint } from '../lib/mappers/progress.ts';
import { useProgress } from '../lib/progress.ts';
import { ExerciseEvolution } from './ExerciseEvolution.tsx';
import { RecordsList } from './RecordsList.tsx';
import { Card, EmptyState, Notice, Skeleton } from './ui/index.ts';

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
 *
 * **Las barras y las fechas van en dos filas, no una columna por semana.**
 * Antes cada semana era un `flex-col` con su barra y su fecha adentro de un
 * padre con `items-end` — y ese `items-end` apaga el `stretch`, así que la
 * columna medía lo que medía la fecha y el `height: 100%` de la barra se
 * calculaba contra una altura indefinida. Medido en el navegador: contenedor
 * de 128 px, barra renderizada en 0 px. El gráfico no dibujaba **ninguna**
 * barra, en ninguna semana, desde que existe.
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
        <div className="flex flex-col gap-2">
          <div className="flex h-32 items-end gap-1.5">
            {recent.map((point, i) => (
              <div key={point.weekStart} className="flex h-full flex-1 items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(3, (point.volumeKg / maxKg) * 100)}%` }}
                  transition={{ delay: 0.04 * i, type: 'spring', stiffness: 180, damping: 24 }}
                  className="w-full rounded-t-md bg-gradient-to-t from-brand-deep/40 to-brand"
                  title={`${Math.round(point.volumeKg).toLocaleString('es-AR')} kg`}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            {recent.map((point) => (
              <span
                key={point.weekStart}
                className="flex-1 text-center font-mono text-[0.55rem] leading-none text-slate-dim"
              >
                {formatDate(point.weekStart)}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
