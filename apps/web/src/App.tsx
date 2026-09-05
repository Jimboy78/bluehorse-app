import { useQuery } from '@tanstack/react-query';
import { LogOut, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Hoy } from './components/Hoy.tsx';
import { Proposals } from './components/Proposals.tsx';
import { useAuth } from './lib/auth/AuthProvider.tsx';
import { activeRuleset, showsPlaceholderContent } from './lib/engine.ts';
import { envError, isConfigured } from './lib/env.ts';
import { fadeUp, tappable } from './lib/motion.ts';
import { pendingCount } from './lib/outbox.ts';
import { checkConnection } from './lib/supabase.ts';
import { useTodaySession } from './lib/use-today-session.ts';

/**
 * Pantalla "Hoy": el plan real leído de la base. El panel "Estado del
 * esqueleto" (errores de configuración, estado de Supabase) solo se muestra
 * en desarrollo (`import.meta.env.DEV`) — a un socio real no se le muestra un
 * mensaje de zod sin traducir si algo está mal configurado.
 */
export function App() {
  const { user, signOut } = useAuth();
  const todaySession = useTodaySession();
  const showsPlaceholderCatalog = todaySession?.isPlaceholder ?? true;
  // Solo alimentan el panel "Estado del esqueleto", que es dev-only: no tiene
  // sentido pedirle esto a Supabase en cada carga de la app de un socio real.
  const connection = useQuery({
    queryKey: ['health', 'supabase'],
    queryFn: checkConnection,
    enabled: import.meta.env.DEV,
    retry: false,
  });

  const outbox = useQuery({
    queryKey: ['health', 'outbox'],
    queryFn: pendingCount,
    enabled: import.meta.env.DEV,
    retry: false,
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-5 py-8">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-start justify-between gap-4"
      >
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
            Blue Horse Gym · Arroyo Seco
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Push your limits</h1>
          {user?.email && <p className="text-xs text-slate">{user.email}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <motion.button
            type="button"
            {...tappable}
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-semibold text-slate"
          >
            <LogOut size={13} aria-hidden="true" />
            Salir
          </motion.button>
          <motion.div {...tappable}>
            <Link
              to="/progreso"
              className="flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-semibold text-teal"
            >
              <TrendingUp size={13} aria-hidden="true" />
              Progreso
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {(showsPlaceholderContent || showsPlaceholderCatalog) && (
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm"
        >
          <strong className="font-semibold">Vista previa con datos de ejemplo.</strong>
          {showsPlaceholderContent && (
            <>
              {' '}
              El ruleset activo es{' '}
              <code className="font-mono text-xs">{activeRuleset.version}</code>.
            </>
          )}
          {showsPlaceholderCatalog && ' El catálogo de Blue Horse todavía no está cargado.'}
        </motion.p>
      )}

      <Proposals />

      <Hoy />

      {import.meta.env.DEV && (
        <motion.section
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-auto pt-4"
        >
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate">
            Estado del esqueleto (solo en desarrollo)
          </h2>
          <dl className="flex flex-col divide-y divide-line rounded-lg border border-line">
            <Row
              label="Configuración"
              value={isConfigured ? 'variables cargadas' : (envError ?? 'sin .env')}
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
              value={`${activeRuleset.templates.length} plantillas · ${activeRuleset.source}`}
              ok
            />
            <Row
              label="Cola offline"
              value={outbox.isPending ? 'leyendo…' : `${outbox.data ?? 0} pendientes`}
              ok={(outbox.data ?? 0) === 0}
            />
          </dl>
        </motion.section>
      )}
    </main>
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
          className={`size-2 shrink-0 rounded-full ${ok ? 'bg-teal' : 'bg-amber'}`}
        />
        <span className="sr-only">{ok ? 'correcto' : 'requiere atención'}</span>
      </dd>
    </div>
  );
}
