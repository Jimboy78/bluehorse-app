import { motion } from 'motion/react';
import type { ComponentProps, ReactNode } from 'react';
import { tappable } from '../../lib/motion.ts';

/**
 * El botón de la app.
 *
 * Antes cada pantalla escribía su propia cadena de clases: había cinco radios
 * distintos, tres alturas para el mismo "Seguir" y dos maneras de mostrar un
 * botón deshabilitado. Nada de eso era una decisión — era copiar y pegar.
 *
 * `primary` lleva el degradé de la marca y un halo: es el único que brilla, y
 * hay como mucho uno por pantalla. El resto se apoya en el borde y en el
 * contraste del texto, que es lo que deja que el primario se lea de reojo.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-b from-brand-bright via-brand to-brand-deep text-navy shadow-brand hover:shadow-brand-lg font-semibold',
  secondary:
    'bg-surface-2 text-ink border border-line-bright shadow-card hover:border-brand/50 font-semibold',
  ghost: 'border border-line text-slate hover:border-brand/50 hover:text-brand font-semibold',
  quiet: 'text-slate hover:text-ink font-medium',
  danger: 'border border-orange/40 bg-orange/10 text-orange hover:border-orange/70 font-semibold',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'gap-1.5 rounded-full px-3.5 py-2 text-xs',
  md: 'gap-2 rounded-xl px-4 py-3 text-sm',
  lg: 'gap-2 rounded-xl px-5 py-3.5 text-[0.95rem]',
};

const BASE =
  'inline-flex items-center justify-center text-center transition-[box-shadow,border-color,color,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none';

export function buttonClass(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  extra = '',
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${extra}`.trim();
}

interface ButtonProps extends Omit<ComponentProps<typeof motion.button>, 'children'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly children: ReactNode;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      {...tappable}
      {...rest}
      className={buttonClass(variant, size, className)}
    >
      {children}
    </motion.button>
  );
}
