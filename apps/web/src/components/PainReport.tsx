import type { BodyRegion } from '@bh/domain';
import { AlertCircle, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { activeRuleset } from '../lib/engine.ts';
import { BODY_REGION_LABELS } from '../lib/labels.ts';
import { useReportPain } from '../lib/session-log.ts';
import { Button, Card, Chip } from './ui/index.ts';

/**
 * "ME DUELE", EN EL MEDIO DE LA SESIÓN
 *
 * La app solo preguntaba por molestias al cerrar la sesión. Para cuando
 * preguntaba, las tres series que dolieron ya estaban hechas, y lo único que
 * quedaba por hacer con el dato era el plan de la semana siguiente.
 *
 * Acá se pregunta cuando pasa y se ofrece algo que sirve ahora: cambiar el
 * ejercicio por otra forma de hacerlo, saltearlo y seguir con el resto, o
 * hacerlo igual. Y para un dolor que no deja moverse con libertad, además,
 * cortar el día o preguntarle a un instructor.
 *
 * **Ninguna de las dos pantallas bloquea nada.** Siempre hay una salida que
 * dice "seguir". Quien decide es la persona: una app que le prohíbe entrenar a
 * alguien que se tomó el trabajo de venir deja de usarse, y entonces tampoco se
 * entera de la próxima molestia.
 *
 * Los textos y el umbral salen del ruleset (`safety.inSessionPain` y
 * `safety.severityScale`), no de acá. La escala con sus etiquetas ya estaba
 * escrita y nadie la mostraba: "del 1 al 5" sin anclas hace que cada persona
 * reporte en una escala distinta, y ese número es el que después saca patrones
 * enteros del plan.
 */

export function PainReport({
  exerciseName,
  workoutLogId,
  onSwap,
  onSkip,
  onKeepGoing,
  onEndSession,
  onCancel,
}: {
  readonly exerciseName: string;
  readonly workoutLogId: string | null;
  readonly onSwap: () => void;
  readonly onSkip: () => void;
  readonly onKeepGoing: () => void;
  readonly onEndSession: () => void;
  readonly onCancel: () => void;
}) {
  const reportar = useReportPain();
  const [region, setRegion] = useState<BodyRegion | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState(false);

  const reglas = activeRuleset.safety?.inSessionPain;
  const escala = activeRuleset.safety?.severityScale ?? [];

  // Sin el bloque en el ruleset no hay nada que ofrecer, y no se inventa acá.
  if (!reglas || escala.length === 0) return null;

  const limita = severity !== null && severity >= reglas.limitsMovementFrom;

  async function elegirSeveridad(valor: number) {
    setSeverity(valor);
    if (!region) return;
    setError(false);
    try {
      await reportar.mutateAsync({ workoutLogId, region, severity: valor, exerciseName });
      setGuardado(true);
    } catch {
      setError(true);
    }
  }

  return (
    // Sin animación de entrada propia: `ExerciseDetail` ya anima la
    // transición de pantalla que trae este panel, y una segunda encima se
    // cancela a mitad de camino. En los tests eso salía como siete
    // `AbortError: The animation was canceled` sin manejar — que hoy no
    // rompen la corrida, que es justo lo que los vuelve peligrosos.
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex w-fit items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-semibold text-slate transition-colors hover:border-line-bright hover:text-ink"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Volver al ejercicio
      </button>

      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
          ¿Dónde te molesta?
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(BODY_REGION_LABELS) as BodyRegion[]).map((r) => (
            <Chip
              key={r}
              tone="orange"
              selected={region === r}
              onClick={() => {
                setRegion((prev) => (prev === r ? null : r));
                setSeverity(null);
                setGuardado(false);
              }}
            >
              {BODY_REGION_LABELS[r]}
            </Chip>
          ))}
        </div>
      </div>

      {/* La escala del ruleset, con las etiquetas a la vista. Un botón por
          escalón y no un slider: se contesta leyendo la frase que le pasa a uno,
          no calibrando un número contra una escala que nadie explicó. */}
      {region && (
        <div className="flex flex-col gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
            ¿Cuánto?
          </span>
          <div className="flex flex-col gap-1.5">
            {escala.map((escalon) => (
              <button
                key={escalon.severity}
                type="button"
                aria-pressed={severity === escalon.severity}
                onClick={() => void elegirSeveridad(escalon.severity)}
                className={`rounded-card border px-3.5 py-3 text-left text-sm transition-colors ${
                  severity === escalon.severity
                    ? 'border-orange bg-orange/12 text-ink'
                    : 'border-line bg-surface text-slate hover:border-line-bright'
                }`}
              >
                {escalon.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {reportar.isPending && (
        <p className="flex items-center gap-1.5 text-sm text-slate">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          Anotando…
        </p>
      )}

      {/* Que no se haya podido guardar no cambia lo que se le ofrece: el
          consejo es el mismo, y trabar la sesión por un problema de red sería
          castigarlo por avisar. */}
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-orange">
          <AlertCircle size={14} aria-hidden="true" />
          No se pudo anotar la molestia, pero podés seguir igual. Contásela a un instructor.
        </p>
      )}

      {/* El tono de la tarjeta es lo que marca la diferencia entre los dos
          casos. Un `Notice` adentro haría lo mismo con un borde más, y además
          anima su entrada sin forma de apagarla: eso dejaba un `AbortError`
          sin manejar en cada corrida de los tests, del tipo que no rompe nada
          hasta el día que rompe todo. */}
      {severity !== null && (guardado || error) && (
        <Card animate={false} tone={limita ? 'warn' : 'brand'} className="flex flex-col gap-3 p-4">
          {guardado && (
            <p className="flex items-center gap-1.5 text-xs text-slate-dim">
              <Check size={12} aria-hidden="true" />
              Anotado para el próximo plan.
            </p>
          )}
          <p className="flex items-start gap-2 text-sm leading-relaxed text-ink">
            {limita && (
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
            )}
            {limita ? reglas.limitedText : reglas.text}
          </p>

          <div className="flex flex-col gap-2">
            <Button variant="primary" size="md" onClick={onSwap}>
              Cambiar este ejercicio
            </Button>
            <Button variant="ghost" size="md" onClick={onSkip}>
              Saltearlo y seguir con el resto
            </Button>
            {/* "Seguir igual" siempre está, incluso arriba del umbral: la app
                recomienda, no prohíbe. */}
            <Button variant="ghost" size="md" onClick={onKeepGoing}>
              Hacerlo igual
            </Button>
            {limita && (
              <Button variant="ghost" size="md" onClick={onEndSession}>
                Terminar la sesión acá
              </Button>
            )}
          </div>
        </Card>
      )}
    </section>
  );
}
