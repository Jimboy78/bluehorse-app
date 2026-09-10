import { Plus, Ruler, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useBodyMetrics, useRecordBodyMetric, weightChange } from '../lib/body-metrics.ts';
import { GYM_TZ } from '../lib/gym-time.ts';
import { spring } from '../lib/motion.ts';
import { BodyMetricsForm } from './BodyMetricsForm.tsx';
import { Button, Card, Notice, SectionLabel, Skeleton } from './ui/index.ts';

/**
 * TUS DATOS
 *
 * Peso y altura, y la forma de volver a pesarse sin salir de la app.
 *
 * Existe porque el onboarding ahora los pide: un dato que se pide una vez y
 * no se muestra nunca más es un dato que la persona no sabe si quedó bien
 * cargado — y en recomposición corporal el peso no es un dato de alta, es la
 * medida del objetivo.
 *
 * Lo que NO hace es calcular un IMC ni decir si el peso "está bien". Eso sería
 * una afirmación de salud sin nada del research atrás.
 */

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TZ,
    day: 'numeric',
    month: 'short',
  }).format(new Date(iso));
}

export function MisDatos() {
  const { status } = useAuth();
  const metrics = useBodyMetrics();
  const record = useRecordBodyMetric();
  const [adding, setAdding] = useState(false);

  // Mismo criterio que el resto: el estado de sesión se chequea ANTES que
  // `isPending`, porque sin sesión la query queda deshabilitada y `isPending`
  // se queda en `true` para siempre (ver CLAUDE.md, trampas conocidas).
  if (status !== 'signed-in') return null;

  if (metrics.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  if (metrics.isError || !metrics.data) return null;

  const { latest, history } = metrics.data;
  const cambio = weightChange(history);

  async function handleSubmit(input: { weightKg: number | null; heightCm: number | null }) {
    await record.mutateAsync(input);
    setAdding(false);
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>Tus datos</SectionLabel>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-4">
          <Metric
            icon={<Scale size={14} aria-hidden="true" />}
            label="Peso"
            value={latest?.weightKg == null ? '—' : `${latest.weightKg}`}
            unit="kg"
          />
          <span className="h-8 w-px bg-line" aria-hidden="true" />
          <Metric
            icon={<Ruler size={14} aria-hidden="true" />}
            label="Altura"
            value={latest?.heightCm == null ? '—' : `${Math.round(latest.heightCm)}`}
            unit="cm"
          />

          {!adding && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto shrink-0"
              onClick={() => setAdding(true)}
            >
              <Plus size={14} aria-hidden="true" />
              {latest ? 'Pesarme' : 'Cargar'}
            </Button>
          )}
        </div>

        {/* La flecha dice para dónde se movió, no si está bien: quien busca
            recomposición quiere que baje y quien busca hipertrofia quiere que
            suba, así que va en el color neutro de la marca en los dos casos. */}
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate">
          <span>
            {latest
              ? `Última medición: ${formatDate(latest.recordedAt)}`
              : 'Todavía no cargaste tu peso ni tu altura.'}
          </span>
          {cambio && (
            <span className="flex items-center gap-1 text-brand">
              ·
              {cambio.delta > 0 ? (
                <TrendingUp size={12} aria-hidden="true" />
              ) : (
                <TrendingDown size={12} aria-hidden="true" />
              )}
              {cambio.delta > 0 ? '+' : ''}
              {cambio.delta.toFixed(1)} kg desde {formatDate(cambio.since)}
            </span>
          )}
        </p>

        <AnimatePresence initial={false}>
          {adding && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={spring.settle}
              className="overflow-hidden"
            >
              <BodyMetricsForm
                currentHeightCm={latest?.heightCm ?? null}
                busy={record.isPending}
                onCancel={() => setAdding(false)}
                onSubmit={(input) => void handleSubmit(input)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {record.isError && (
          <Notice tone="error" role="alert">
            No se pudo guardar la medición. Probá de nuevo.
          </Notice>
        )}
      </Card>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  unit,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 font-display text-[0.6rem] uppercase tracking-[0.16em] text-slate">
        {icon}
        {label}
      </span>
      <span className="font-display text-2xl font-semibold tabular-nums leading-none text-ink">
        {value}
        <span className="ml-0.5 text-sm font-medium text-slate-dim">{unit}</span>
      </span>
    </div>
  );
}
