import { CalendarDays, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { elegibles } from '../lib/mappers/retomar.ts';
import { usePlanSessions } from '../lib/plan.ts';
import { useRetomarDesde } from '../lib/retomar.ts';
import { Button } from './ui/index.ts';

/**
 * "Hoy hago otro día". Rota la cola para que la elegida quede primera: ver
 * `lib/mappers/retomar.ts`. En un plan a mano se puede elegir cualquier día
 * (el ciclo se reinicia); en uno del motor, solo lo que falta hacer.
 */
export function ElegirDia({
  planId,
  actualId,
  reiniciar,
  abierto: abiertoInicial = false,
}: {
  planId: string;
  /** La sesión que toca hoy, para marcarla. `null` si la cola se terminó. */
  actualId: string | null;
  reiniciar: boolean;
  /** Arranca con la lista a la vista (al terminar la semana no hay otra cosa que hacer). */
  abierto?: boolean;
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  const sesiones = usePlanSessions(abierto ? planId : null);
  const retomar = useRetomarDesde();

  if (!abierto) {
    return (
      <Button variant="quiet" size="md" onClick={() => setAbierto(true)}>
        <CalendarDays size={15} aria-hidden="true" />
        Cambiar de día
      </Button>
    );
  }

  const opciones = sesiones.data ? elegibles(sesiones.data, reiniciar) : [];

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs leading-relaxed text-slate">
        {reiniciar
          ? 'Elegí por qué día seguís. Los que estaban antes pasan al final de la semana.'
          : 'Elegí qué sesión hacés. Las que estaban antes quedan para después.'}
      </p>
      {sesiones.isPending && (
        <p className="flex items-center gap-2 px-1 text-xs text-slate">
          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
          Cargando los días…
        </p>
      )}
      {sesiones.isError && (
        <p role="alert" className="px-1 text-xs text-orange">
          No se pudieron leer los días del plan. Probá de nuevo en un momento.
        </p>
      )}
      <ul className="flex flex-col gap-1.5">
        {opciones.map((s) => {
          const esHoy = s.id === actualId;
          const sesion = sesiones.data?.find((x) => x.id === s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={esHoy || retomar.isPending}
                onClick={() =>
                  retomar.mutate({
                    sesiones: sesiones.data ?? [],
                    elegidaId: s.id,
                    reiniciar,
                  })
                }
                className="flex w-full items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-brand disabled:opacity-60 disabled:hover:border-line"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-display text-[0.65rem] uppercase tracking-[0.16em] text-slate">
                    {sesion?.label}
                  </span>
                  <span className="font-semibold leading-tight">{sesion?.focus}</span>
                </span>
                {esHoy && <span className="shrink-0 text-xs text-brand">hoy</span>}
                {!esHoy && s.status === 'completed' && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-slate-dim">
                    <Check size={12} aria-hidden="true" />
                    hecho
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {retomar.isError && (
        <p role="alert" className="px-1 text-xs text-orange">
          No se pudo cambiar el día. Probá de nuevo en un momento.
        </p>
      )}
      {!abiertoInicial && (
        <Button variant="quiet" size="md" onClick={() => setAbierto(false)}>
          Seguir con este
        </Button>
      )}
    </div>
  );
}
