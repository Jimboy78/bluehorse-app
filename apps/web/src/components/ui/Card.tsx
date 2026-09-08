import { motion } from 'motion/react';
import type { ComponentProps, ReactNode } from 'react';
import { fadeUp } from '../../lib/motion.ts';

/**
 * La superficie de la app.
 *
 * En una interfaz oscura una sombra negra no separa nada: lo que levanta una
 * tarjeta del fondo es el filo de luz de arriba (`shadow-card`, un `inset`
 * blanco al 4%) más un fondo apenas más claro. Por eso hay tres tonos y no
 * uno: una tarjeta adentro de otra tiene que subir un escalón, si no el borde
 * es lo único que las distingue y se leen como una sola cosa.
 */

export type CardTone = 'default' | 'nested' | 'brand' | 'warn' | 'bare';

const TONES: Record<CardTone, string> = {
  default: 'border border-line bg-surface shadow-card',
  nested: 'border border-line/70 bg-surface-2 shadow-card',
  brand: 'border border-brand/30 bg-brand/[0.07] shadow-brand',
  warn: 'border border-amber/35 bg-amber/[0.08]',
  bare: 'border border-line/60 bg-transparent',
};

export function cardClass(tone: CardTone = 'default', extra = ''): string {
  return `rounded-card ${TONES[tone]} ${extra}`.trim();
}

interface CardProps extends ComponentProps<typeof motion.div> {
  readonly tone?: CardTone;
  /** Entra con el `fadeUp` estándar. Apagalo si el padre ya escalona la lista. */
  readonly animate?: boolean;
  readonly children: ReactNode;
}

export function Card({
  tone = 'default',
  animate = true,
  className = '',
  children,
  ...rest
}: CardProps) {
  const entrance = animate
    ? ({ variants: fadeUp, initial: 'hidden', animate: 'visible' } as const)
    : {};

  return (
    <motion.div {...entrance} {...rest} className={cardClass(tone, className)}>
      {children}
    </motion.div>
  );
}

/**
 * Encabezado de sección: la versalita chiquita en azul que ordena la pantalla
 * sin gastar el peso visual de un `<h2>` grande.
 */
export function SectionLabel({
  children,
  icon,
  className = '',
}: {
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`flex items-center gap-1.5 font-display text-xs font-medium uppercase tracking-[0.22em] text-slate ${className}`}
    >
      {icon}
      {children}
    </h2>
  );
}
