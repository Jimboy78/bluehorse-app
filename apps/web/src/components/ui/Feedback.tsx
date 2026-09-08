import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { fadeUp } from '../../lib/motion.ts';
import { Card } from './Card.tsx';

/**
 * Cargando, vacío y avisos. Los tres estados que toda pantalla que lee datos
 * tiene que resolver, y que hasta acá cada una resolvía a su manera: había
 * tres spinners distintos y cuatro maneras de decir "todavía no hay nada".
 */

/** Anillo de carga en el color de la marca. */
export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`inline-block animate-spin rounded-full border-2 border-line border-t-brand ${className}`}
    />
  );
}

/** Carga a pantalla completa: cambio de ruta, guard resolviendo la sesión. */
export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="grid min-h-dvh place-items-center">
      <Spinner size={26} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/**
 * Bloque gris que ocupa el lugar exacto de lo que se está por mostrar.
 *
 * Vale la pena por encima de un spinner cuando ya se sabe la forma de lo que
 * viene: la pantalla no salta cuando llegan los datos, y el salto es lo que
 * hace que una app se sienta lenta aunque tarde lo mismo.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-surface-2 ${className}`}
    />
  );
}

/** Todavía no hay datos, y no es un error: es el principio de todo. */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon && (
        <span className="grid size-14 place-items-center rounded-full border border-brand/25 bg-brand/10 text-brand shadow-brand">
          {icon}
        </span>
      )}
      <p className="font-display text-lg font-medium tracking-wide">{title}</p>
      {children && <p className="max-w-[34ch] text-sm leading-relaxed text-slate">{children}</p>}
      {action}
    </Card>
  );
}

export type NoticeTone = 'warn' | 'error' | 'info';

const NOTICE_TONES: Record<NoticeTone, string> = {
  warn: 'border-amber/40 bg-amber/10 text-amber',
  error: 'border-orange/40 bg-orange/10 text-orange',
  info: 'border-brand/40 bg-brand/10 text-brand',
};

/**
 * Aviso en línea. El color pinta el ícono y el borde, no el texto del cuerpo:
 * un párrafo entero en ámbar sobre negro se lee peor que uno en blanco, y el
 * ámbar es justamente lo que tiene que llamar la atención primero.
 */
export function Notice({
  tone = 'warn',
  icon,
  children,
  className = '',
  role,
}: {
  tone?: NoticeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      role={role}
      className={`flex items-start gap-2.5 rounded-card border px-4 py-3 text-sm leading-relaxed ${NOTICE_TONES[tone]} ${className}`}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span className="min-w-0 flex-1 text-ink">{children}</span>
    </motion.div>
  );
}
