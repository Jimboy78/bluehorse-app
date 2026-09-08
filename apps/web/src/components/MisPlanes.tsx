import { CheckCircle2, ChevronRight, Loader2, PlayCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { listContainer, listItem } from '../lib/motion.ts';
import { type PlanSummary, useActivatePlan, usePlans } from '../lib/plan.ts';
import { Button, Card, Notice, SectionLabel, Skeleton } from './ui/index.ts';

const TEMPLATE_LABELS: Record<string, string> = {
  full_body_ab: 'Cuerpo completo A/B',
  upper_lower: 'Torso / pierna',
  cardio_base: 'Base aeróbica',
};

const GYM_TZ = 'America/Argentina/Buenos_Aires';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: GYM_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/**
 * MIS PLANES
 *
 * Un plan `active` a la vez (regla dura: hay un índice único en la base que
 * lo garantiza), pero los que dejaron de estarlo no se pierden: quedan
 * `archived`, listos para retomar. Esto los muestra y deja volver a
 * cualquiera de un toque.
 *
 * No aparece si hay uno solo: cambiar entre planes no tiene sentido cuando
 * no hay entre qué elegir, y mostrar la sección vacía sería ruido.
 */
export function MisPlanes() {
  const plans = usePlans();
  const activate = useActivatePlan();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (plans.isPending) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (plans.isError || !plans.data || plans.data.length < 2) return null;

  async function handleActivate(planId: string) {
    setPendingId(planId);
    try {
      await activate.mutateAsync(planId);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <SectionLabel>Mis planes</SectionLabel>

      {activate.isError && (
        <Notice tone="error" role="alert">
          No se pudo cambiar de plan. Probá de nuevo.
        </Notice>
      )}

      <motion.ul
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2"
      >
        {plans.data.map((plan) => (
          <motion.li key={plan.id} variants={listItem}>
            <PlanRow
              plan={plan}
              busy={pendingId === plan.id}
              onActivate={() => void handleActivate(plan.id)}
            />
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

function PlanRow({
  plan,
  busy,
  onActivate,
}: {
  readonly plan: PlanSummary;
  readonly busy: boolean;
  readonly onActivate: () => void;
}) {
  const label = TEMPLATE_LABELS[plan.templateId] ?? plan.templateId;
  const isActive = plan.status === 'active';

  return (
    <Card tone={isActive ? 'brand' : 'default'} className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold text-ice">{label}</p>
        <p className="text-xs text-slate">
          {isActive ? 'Activo' : 'Guardado'} · desde {formatDate(plan.generatedAt)} ·{' '}
          {plan.completedSessions}/{plan.totalSessions} sesiones
        </p>
      </div>

      {isActive ? (
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand">
          <CheckCircle2 size={16} aria-hidden="true" />
          Es el de hoy
        </span>
      ) : (
        <Button variant="ghost" size="sm" disabled={busy} onClick={onActivate}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <PlayCircle size={16} aria-hidden="true" />
          )}
          Retomar
          <ChevronRight size={14} aria-hidden="true" />
        </Button>
      )}
    </Card>
  );
}
