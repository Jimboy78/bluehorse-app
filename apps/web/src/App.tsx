import type { Goal } from '@bh/domain';
import { useQuery } from '@tanstack/react-query';
import { Info, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { AppShell } from './components/AppShell.tsx';
import { Hoy } from './components/Hoy.tsx';
import { Proposals } from './components/Proposals.tsx';
import { Card, Notice, SectionLabel } from './components/ui/index.ts';
import { useAuth } from './lib/auth/AuthProvider.tsx';
import { activeRuleset, showsPlaceholderContent } from './lib/engine.ts';
import { envError, isConfigured } from './lib/env.ts';
import { useActiveGoal } from './lib/goal.ts';
import { fadeUp } from './lib/motion.ts';
import { type OutboxHealth, outboxHealth } from './lib/outbox.ts';
import { useActivePlan } from './lib/plan.ts';
import { checkConnection } from './lib/supabase.ts';
import { useTodaySession } from './lib/use-today-session.ts';

/**
 * Pantalla "Hoy": el plan real leído de la base. El encabezado y la
 * navegación viven en `AppShell`; acá quedan los avisos que valen para toda
 * la sesión (versión nueva, contenido provisorio), las propuestas del motor y
 * el entrenamiento.
 *
 * El panel "Estado del esqueleto" (errores de configuración, estado de
 * Supabase) solo se muestra en desarrollo (`import.meta.env.DEV`) — a un socio
 * real no se le muestra un mensaje de zod sin traducir si algo está mal
 * configurado.
 */
export function App() {
  const { user } = useAuth();
  const activeGoal = useActiveGoal();
  // Solo alimentan el panel "Estado del esqueleto", que es dev-only: no tiene
  // sentido pedirle esto a Supabase en cada carga de la app de un socio real.
  const connection = useQuery({
    queryKey: ['health', 'supabase'],
    queryFn: checkConnection,
    enabled: import.meta.env.DEV,
    retry: false,
  });

  const outbox = useQuery({
    queryKey: ['health', 'outbox', user?.id],
    // Sin usuario no hay de quién mirar la cola: sería contar lo de nadie, o
    // peor, lo de la cuenta anterior si alguien cerró sesión hace un segundo.
    queryFn: () => outboxHealth(user?.id as string),
    enabled: import.meta.env.DEV && !!user,
    retry: false,
    // La cola cambia mientras se entrena, no al montar la pantalla. Sin esto
    // el contador era una foto del arranque: quedándose en 0 justo cuando se
    // corta la señal y empiezan a apilarse las series, que es el único
    // momento en que este panel sirve para algo.
    refetchInterval: 2000,
  });

  return (
    <AppShell>
      <PlaceholderNotice />

      <EvidenceNotice goal={activeGoal.data ?? null} />

      <PlanWarningsNotice />

      <Proposals />

      <Hoy />

      {import.meta.env.DEV && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-auto flex flex-col gap-2.5 pt-4"
        >
          <SectionLabel icon={<Sparkles size={12} aria-hidden="true" />}>
            Estado del esqueleto (solo en desarrollo)
          </SectionLabel>
          <Card animate={false} className="overflow-hidden">
            <dl className="flex flex-col divide-y divide-line/70">
              <Row
                label="Configuración"
                value={isConfigured ? 'variables cargadas' : (envError ?? 'sin .env')}
                ok={isConfigured}
              />
              <Row
                label="Supabase"
                value={
                  connection.isPending
                    ? 'consultando…'
                    : (connection.data?.detail ?? 'sin respuesta')
                }
                ok={connection.data?.ok ?? false}
              />
              <Row
                label="Motor"
                value={`${activeRuleset.templates.length} plantillas · ${activeRuleset.source}`}
                ok
              />
              <Row
                label="Cola offline"
                value={outbox.isPending ? 'leyendo…' : describeQueue(outbox.data)}
                // Pendientes esperando señal es normal; que alguno falle, no.
                ok={(outbox.data?.failing ?? 0) === 0}
              />
            </dl>
          </Card>
        </motion.section>
      )}
    </AppShell>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="flex items-center gap-2 text-right text-xs text-slate">
        <span>{value}</span>
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${ok ? 'bg-lime' : 'bg-amber'}`}
        />
        <span className="sr-only">{ok ? 'correcto' : 'requiere atención'}</span>
      </dd>
    </div>
  );
}

/**
 * Qué decir de la cola en el panel de desarrollo. "3 pendientes" no distingue
 * entre tres series esperando señal y tres trabadas por un bug — y esa
 * diferencia es justo la que hace falta ver.
 */
function describeQueue(health: OutboxHealth | undefined): string {
  if (!health) return 'sin respuesta';
  if (health.pending === 0) return 'vacía';
  if (health.failing === 0) return `${health.pending} esperando señal`;
  return `${health.failing} de ${health.pending} fallando · ${health.worstError ?? 'sin detalle'}`;
}

/**
 * Aviso de versión nueva. Discreto y arriba de todo, pero sin recargar solo:
 * hacerlo en medio de una serie borraría lo que la persona estaba cargando.
 */
/**
 * "Esto que estás viendo es de ejemplo": ruleset provisorio o catálogo sin
 * cargar.
 *
 * La parte del catálogo solo se afirma cuando SE SABE que falta. Mientras la
 * consulta viaja, `isPlaceholder` dice `true` porque hay que mostrar algo — y
 * eso hacía aparecer el cartel medio segundo en cada entrada a la app, para
 * después desaparecer solo. Un aviso que va y viene se lee como que algo se
 * rompió, que es exactamente lo contrario de lo que este aviso quiere decir.
 */
function PlaceholderNotice() {
  const todaySession = useTodaySession();
  const sinCatalogo = (todaySession?.catalogKnown ?? false) && todaySession?.isPlaceholder === true;

  if (!showsPlaceholderContent && !sinCatalogo) return null;

  return (
    <Notice tone="warn" icon={<Info size={16} aria-hidden="true" />}>
      <strong className="font-semibold">Vista previa con datos de ejemplo.</strong>
      {showsPlaceholderContent && (
        <>
          {' '}
          El ruleset activo es{' '}
          <code className="rounded bg-amber/15 px-1 font-mono text-xs text-amber">
            {activeRuleset.version}
          </code>
          .
        </>
      )}
      {sinCatalogo && ' El catálogo de Blue Horse todavía no está cargado.'}
    </Notice>
  );
}

/**
 * Aviso cuando el objetivo del socio se apoya en evidencia floja.
 *
 * La investigación no es pareja: fuerza e hipertrofia tienen metaanálisis
 * detrás; potencia y resistencia muscular en sala tienen consenso y poco más.
 * Mostrar las dos cosas con la misma cara sería mentir por omisión, así que
 * cuando el bloque está marcado como confianza baja se dice, con el motivo que
 * el propio ruleset trae.
 */
function EvidenceNotice({ goal }: { readonly goal: Goal | null }) {
  if (!goal) return null;
  const block = activeRuleset.prescription[goal];
  if (block?.confidence !== 'low' || !block.confidenceNote) return null;

  return (
    <Notice tone="warn" icon={<Info size={16} aria-hidden="true" />}>
      <strong className="font-semibold">Sobre este objetivo:</strong> {block.confidenceNote}
    </Notice>
  );
}

/**
 * Lo que el motor avisó al armar el plan que estás entrenando ahora — patrones
 * sin cubrir, volumen semanal corto con la frecuencia elegida.
 *
 * Hasta acá esto se veía una sola vez, en la vista previa del onboarding, y
 * después se perdía: nadie iba a recordar semanas después que su plan tenía
 * un hueco conocido en isquiotibiales. Ahora queda guardado con el plan
 * (`plans.warnings`) y se muestra acá, en la pantalla donde de verdad se
 * entrena — mismo criterio que `EvidenceNotice`: la evidencia se muestra como
 * es, no solo en el momento de armarla.
 */
function PlanWarningsNotice() {
  const plan = useActivePlan();
  if (plan.data?.kind !== 'active' || plan.data.planWarnings.length === 0) return null;

  return (
    <Notice tone="warn" icon={<Info size={16} aria-hidden="true" />}>
      <span className="flex flex-col gap-1">
        {plan.data.planWarnings.map((warning) => (
          <span key={warning}>{warning}</span>
        ))}
      </span>
    </Notice>
  );
}
