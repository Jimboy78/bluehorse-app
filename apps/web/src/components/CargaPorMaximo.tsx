import { formatLoad, type SinMaximo } from '@bh/domain';
import { Percent } from 'lucide-react';
import { bloqueoDelPorcentaje, useCargaDelPorcentaje } from '../lib/maximo.ts';
import type { ActiveSessionItem } from '../lib/plan.ts';
import { Card } from './ui/index.ts';

/**
 * El "80-85 % 1RM" de un plan a mano, en lo que dice la estación.
 *
 * Cuando no se puede calcular, dice qué falta en términos de qué hacer — no
 * cuán firme es la estimación (regla dura 4).
 */
const QUE_FALTA: Record<SinMaximo, string> = {
  barra:
    'Para pasar el porcentaje a kilos falta saber cuánto pesa la barra de esta estación. Pedile al gimnasio que la cargue.',
  unidad:
    'Esta estación no se lee en kilos, así que el porcentaje no se puede pasar a su escala. Elegí la carga por cuántas te quedan en reserva.',
  'sin-series':
    'Todavía no hay de dónde estimar tu máximo acá. Anotá la carga y cuántas te quedaron en reserva (3 o menos) y la próxima vez te calcula los kilos.',
};

export function CargaPorMaximo({ item }: { item: ActiveSessionItem }) {
  const consulta = useCargaDelPorcentaje({
    exerciseId: item.exerciseId,
    equipmentId: item.equipmentId,
    spec: item.equipmentLoadSpec,
    pct: item.pct1rm,
  });
  if (!item.pct1rm) return null;

  const bloqueo = bloqueoDelPorcentaje(item.equipmentId, item.equipmentLoadSpec);
  const { min, max } = item.pct1rm;
  const rango = min === max ? `${min} %` : `${min}-${max} %`;
  const unidad = item.equipmentLoadSpec?.unit;

  let cuerpo: string | null = null;
  let detalle: string | null = null;
  if (bloqueo) cuerpo = QUE_FALTA[bloqueo];
  else if (consulta.data?.kind === 'sin') cuerpo = QUE_FALTA[consulta.data.motivo];
  else if (consulta.data?.kind === 'carga' && unidad) {
    const { maximo } = consulta.data;
    const a = formatLoad({ value: consulta.data.min, unit: unidad });
    const b = formatLoad({ value: consulta.data.max, unit: unidad });
    cuerpo = a === b ? `Cargá ${a}.` : `Cargá entre ${a} y ${b}.`;
    const serie = maximo.desde;
    detalle = `Tu máximo estimado ronda los ${Math.round(maximo.total)} ${unidad.endsWith('lb') ? 'lb' : 'kg'} en total, de tu serie de ${serie.load.value !== null ? formatLoad(serie.load) : '—'} × ${serie.reps} con ${serie.rir} en reserva.`;
  }
  if (!cuerpo) return null;

  return (
    <Card animate={false} className="flex flex-col gap-1.5 px-4 py-3">
      <p className="flex items-center gap-1.5 font-display text-sm font-semibold uppercase tracking-[0.12em] text-brand">
        <Percent size={14} aria-hidden="true" />
        {rango} de tu máximo
      </p>
      <p className="text-sm leading-relaxed text-ink">{cuerpo}</p>
      {detalle && <p className="text-xs text-slate">{detalle}</p>}
    </Card>
  );
}
