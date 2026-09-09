import { Check, X } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Button, Field, fieldClass } from './ui/index.ts';

/**
 * PESO Y ALTURA, EN UN SOLO FORMULARIO
 *
 * Antes esto vivía adentro de `MisDatos` y solo pedía peso: `heightCm` se
 * mandaba fijo en `null`. O sea que la altura se podía cargar exactamente una
 * vez, en el onboarding, y si quedaba mal (o no se cargaba) no había ninguna
 * pantalla en toda la app para corregirla.
 *
 * Los dos campos son opcionales por separado pero hace falta al menos uno: una
 * fila con las dos columnas en `null` no dice nada, y quedaría igual en el
 * historial como una medición que nunca se tomó.
 *
 * La altura viene precargada con la vigente y el peso no, a propósito: la
 * altura se corrige (es la misma de siempre), el peso se vuelve a medir (es
 * otro). Precargar el peso invita a confirmar el de la vez pasada sin subirse
 * a la balanza.
 */

/** Los mismos límites que los `check` de `body_metrics`: si el formulario deja
 *  pasar algo que el insert rechaza, el socio ve un error de Postgres. */
const WEIGHT_MIN = 25;
const WEIGHT_MAX = 350;
const HEIGHT_MIN = 100;
const HEIGHT_MAX = 250;

export function BodyMetricsForm({
  currentHeightCm,
  busy,
  onCancel,
  onSubmit,
}: {
  readonly currentHeightCm: number | null;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (input: { weightKg: number | null; heightCm: number | null }) => void;
}) {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState(
    currentHeightCm === null ? '' : String(Math.round(currentHeightCm)),
  );
  const [error, setError] = useState<string | null>(null);
  const weightRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // El foco va al peso apenas aparece: el formulario se abrió porque alguien
    // lo pidió, así que ya decidió escribir acá. Por `ref` y no por
    // `autoFocus` — el atributo también roba el foco al rehidratar.
    weightRef.current?.focus();
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const weightKg = weight.trim() === '' ? null : Number(weight);
    const heightCm = height.trim() === '' ? null : Number(height);

    if (weightKg === null && heightCm === null) {
      setError('Cargá al menos uno de los dos.');
      return;
    }
    if (
      weightKg !== null &&
      (!Number.isFinite(weightKg) || weightKg < WEIGHT_MIN || weightKg > WEIGHT_MAX)
    ) {
      setError(`Ingresá un peso entre ${WEIGHT_MIN} y ${WEIGHT_MAX} kg.`);
      return;
    }
    if (
      heightCm !== null &&
      (!Number.isFinite(heightCm) || heightCm < HEIGHT_MIN || heightCm > HEIGHT_MAX)
    ) {
      setError(`Ingresá una altura entre ${HEIGHT_MIN} y ${HEIGHT_MAX} cm.`);
      return;
    }

    setError(null);
    onSubmit({ weightKg, heightCm });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 border-t border-line pt-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="¿Cuánto pesás hoy?" htmlFor="metric-peso">
          <div className="relative">
            <input
              ref={weightRef}
              id="metric-peso"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={WEIGHT_MIN}
              max={WEIGHT_MAX}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="78"
              className={`${fieldClass} pr-9`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-medium text-slate-dim">
              kg
            </span>
          </div>
        </Field>

        <Field label="Altura" htmlFor="metric-altura">
          <div className="relative">
            <input
              id="metric-altura"
              type="number"
              inputMode="numeric"
              step="1"
              min={HEIGHT_MIN}
              max={HEIGHT_MAX}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="175"
              className={`${fieldClass} pr-9`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-medium text-slate-dim">
              cm
            </span>
          </div>
        </Field>
      </div>

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
