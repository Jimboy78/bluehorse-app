import { ChevronRight, Layers } from 'lucide-react';
import { Link } from 'react-router';
import { GOAL_LABELS } from '../lib/labels.ts';
import { usePlans } from '../lib/plan.ts';
import { Card, Skeleton } from './ui/index.ts';

const TEMPLATE_LABELS: Record<string, string> = {
  full_body_ab: 'Cuerpo completo A/B',
  upper_lower: 'Torso / pierna',
  cardio_base: 'Base aeróbica',
};

/**
 * Entrada a la pantalla de planes desde Progreso.
 *
 * Antes esto ERA la pantalla de planes: la lista entera, con activar y
 * confirmar, vivía acá adentro. Ahora que `/planes` existe como pantalla
 * propia (accesible también desde la barra de navegación), tener la misma
 * interacción en dos lugares es tener dos lugares para romperla — acá solo
 * queda el resumen de una línea con el plan activo, y un toque lleva al resto.
 *
 * No aparece si nunca generó ningún plan: no hay nada que resumir, y el
 * llamado a la acción de "Hoy" ya cubre ese caso.
 */
export function MisPlanes() {
  const plans = usePlans();

  if (plans.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (plans.isError || !plans.data || plans.data.length === 0) return null;

  const activo = plans.data.find((p) => p.status === 'active');
  const guardados = plans.data.length - (activo ? 1 : 0);

  return (
    <Link to="/planes" className="block">
      <Card
        className="flex items-center gap-3 transition-colors hover:border-brand/40"
        animate={false}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
          <Layers size={18} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold text-ink">
            {activo ? templateLabel(activo.templateId) : 'Tus planes'}
          </p>
          <p className="truncate text-xs text-slate">
            {activo?.goal && `${GOAL_LABELS[activo.goal]} · `}
            {guardados > 0
              ? `${guardados} guardado${guardados === 1 ? '' : 's'} más`
              : 'Ver todos tus planes'}
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-slate-dim" aria-hidden="true" />
      </Card>
    </Link>
  );
}

function templateLabel(templateId: string): string {
  return TEMPLATE_LABELS[templateId] ?? templateId;
}
