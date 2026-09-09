import { Check, Plus, Ruler, Scale, TrendingDown, TrendingUp, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useBodyMetrics, useRecordBodyMetric, weightChange } from '../lib/body-metrics.ts';
import { spring } from '../lib/motion.ts';
import { Button, Card, Field, fieldClass, Notice, SectionLabel, Skeleton } from './ui/index.ts';

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

const GYM_TZ = 'America/Argentina/Buenos_Aires';

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

  if (metrics.isError || !metrics.data?.latest) return null;

  const { latest, history } = metrics.data;
  const cambio = weightChange(history);

  async function handleSubmit(weightKg: number) {
    await record.mutateAsync({ weightKg, heightCm: null });
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
            value={latest.weightKg === null ? '—' : `${latest.weightKg}`}
            unit="kg"
          />
          <span className="h-8 w-px bg-line" aria-hidden="true" />
          <Metric
            icon={<Ruler size={14} aria-hidden="true" />}
            label="Altura"
            value={latest.heightCm === null ? '—' : `${Math.round(latest.heightCm)}`}
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
              Pesarme
            </Button>
          )}
        </div>

        {/* La flecha dice para dónde se movió, no si está bien: quien busca
            recomposición quiere que baje y quien busca hipertrofia quiere que
            suba, así que va en el color neutro de la marca en los dos casos. */}
        <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate">
          <span>Última medición: {formatDate(latest.recordedAt)}</span>
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
              <WeightForm
                busy={record.isPending}
                onCancel={() => setAdding(false)}
                onSubmit={(kg) => void handleSubmit(kg)}
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

/** Un campo y dos botones. Registrar un peso no merece una pantalla propia. */
function WeightForm({
  busy,
  onCancel,
  onSubmit,
}: {
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (weightKg: number) => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const kg = Number(value);
    // Los mismos límites que el `check` de la tabla: si el formulario deja
    // pasar algo que el insert rechaza, el socio ve un error de Postgres.
    if (!Number.isFinite(kg) || kg < 25 || kg > 350) {
      setError('Ingresá un peso entre 25 y 350 kg.');
      return;
    }
    setError(null);
    onSubmit(kg);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 border-t border-line pt-3">
      <Field label="¿Cuánto pesás hoy?" htmlFor="nuevo-peso">
        <div className="relative">
          {/* El foco va al campo apenas aparece: el campo aparece porque la
              persona tocó "Pesarme", así que ya pidió escribir acá. Por `ref`
              y no por `autoFocus` — el atributo también roba el foco cuando el
              formulario se rehidrata, que no es lo mismo. */}
          <input
            ref={inputRef}
            id="nuevo-peso"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={25}
            max={350}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="78"
            className={`${fieldClass} pr-10`}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-medium text-slate-dim">
            kg
          </span>
        </div>
      </Field>

      {error && (
        <p role="alert" className="text-xs text-orange">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="quiet" size="sm" onClick={onCancel} disabled={busy}>
          <X size={14} aria-hidden="true" />
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" className="flex-1" disabled={busy}>
          <Check size={14} aria-hidden="true" />
          Guardar
        </Button>
      </div>
    </form>
  );
}
