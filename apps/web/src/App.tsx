import { useQuery } from '@tanstack/react-query';
import { activeRuleset, showsPlaceholderContent } from './lib/engine.ts';
import { envError, isConfigured } from './lib/env.ts';
import { pendingCount } from './lib/outbox.ts';
import { checkConnection } from './lib/supabase.ts';

/**
 * Pantalla de estado del esqueleto. No es una pantalla del producto: existe
 * para verificar que las piezas están conectadas. Se reemplaza por la pantalla
 * "Hoy" en la fase 2 del roadmap (docs/07-roadmap.md).
 */
export function App() {
  const connection = useQuery({
    queryKey: ['health', 'supabase'],
    queryFn: checkConnection,
    retry: false,
  });

  const outbox = useQuery({
    queryKey: ['health', 'outbox'],
    queryFn: pendingCount,
    retry: false,
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-10">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Blue Horse Gym · Arroyo Seco
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Esqueleto del proyecto</h1>
        <p className="text-slate">
          Fase 1 del roadmap. Todavía no hay producto: esto verifica que el motor, la base y la cola
          offline están conectados.
        </p>
      </header>

      {showsPlaceholderContent && (
        <p className="rounded border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          <strong className="font-semibold">Contenido provisorio.</strong> El ruleset activo es{' '}
          <code className="font-mono text-xs">{activeRuleset.version}</code>. Los números de
          entrenamiento no salen todavía de la investigación y no sirven como consejo real.
        </p>
      )}

      <dl className="flex flex-col divide-y divide-line rounded border border-line">
        <Row
          label="Configuración"
          value={isConfigured ? 'variables de entorno cargadas' : (envError ?? 'sin .env')}
          ok={isConfigured}
        />
        <Row
          label="Supabase"
          value={
            connection.isPending ? 'consultando…' : (connection.data?.detail ?? 'sin respuesta')
          }
          ok={connection.data?.ok ?? false}
        />
        <Row
          label="Motor"
          value={`${activeRuleset.templates.length} plantillas · fuente: ${activeRuleset.source}`}
          ok
        />
        <Row
          label="Cola offline"
          value={
            outbox.isPending ? 'leyendo…' : `${outbox.data ?? 0} escrituras pendientes de enviar`
          }
          ok={(outbox.data ?? 0) === 0}
        />
      </dl>
    </main>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="flex items-center gap-2 text-right text-sm text-slate">
        <span>{value}</span>
        <span
          aria-hidden="true"
          className={`size-2 shrink-0 rounded-full ${ok ? 'bg-teal' : 'bg-amber'}`}
        />
        <span className="sr-only">{ok ? 'correcto' : 'requiere atención'}</span>
      </dd>
    </div>
  );
}
