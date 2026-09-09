import { motion } from 'motion/react';
import type { ComponentProps, ReactNode } from 'react';
import { tappable } from '../../lib/motion.ts';

/**
 * Elegir una opción entre varias, que es casi todo lo que se hace en el
 * onboarding y en el cierre de sesión.
 *
 * Lo elegido no cambia solo de color: cambia de material — se llena con el
 * azul de la marca y gana el halo. Con manos sudadas, a un metro de la
 * pantalla, un borde de 1px cambiando de gris a azul no se ve.
 *
 * Siempre `aria-pressed`: son botones de estado, no navegación.
 */

type ToggleProps = Omit<ComponentProps<typeof motion.button>, 'children'> & {
  readonly selected: boolean;
  readonly tone?: 'brand' | 'orange';
  readonly children: ReactNode;
};

const PILL_TONES = {
  brand: 'border-brand bg-brand/15 text-brand shadow-brand',
  orange: 'border-orange bg-orange/15 text-orange',
} as const;

/** Pastilla corta: sexo, zona de una molestia, filtro de ejercicio, RIR. */
export function Chip({ selected, tone = 'brand', className = '', children, ...rest }: ToggleProps) {
  return (
    <motion.button
      type="button"
      {...tappable}
      aria-pressed={selected}
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors duration-150 ${
        selected ? PILL_TONES[tone] : 'border-line bg-surface-2 text-slate hover:border-line-bright'
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

/**
 * Opción de ancho completo, con título y una línea de explicación abajo.
 * Es la forma de las preguntas del onboarding, donde la diferencia entre dos
 * opciones no cabe en dos palabras.
 */
export function OptionCard({
  selected,
  title,
  hint,
  icon,
  className = '',
  ...rest
}: Omit<ToggleProps, 'children' | 'tone'> & {
  readonly title: ReactNode;
  readonly hint?: ReactNode;
  /**
   * Ícono a la izquierda. Con seis opciones apiladas, es lo que deja encontrar
   * la propia sin leer las seis: seis títulos en el mismo cuerpo y el mismo
   * color se leen como un bloque de texto, no como opciones.
   */
  readonly icon?: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      {...tappable}
      aria-pressed={selected}
      {...rest}
      className={`flex w-full items-center gap-3.5 rounded-card border px-4 py-3.5 text-left transition-colors duration-150 ${
        selected
          ? 'border-brand bg-brand/10 shadow-brand'
          : 'border-line bg-surface shadow-card hover:border-line-bright'
      } ${className}`}
    >
      {icon && (
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl border transition-colors duration-150 ${
            selected
              ? 'border-brand/40 bg-brand/15 text-brand'
              : 'border-line bg-navy text-slate-dim'
          }`}
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className={`text-sm font-semibold ${selected ? 'text-brand' : 'text-ink'}`}>
          {title}
        </span>
        {hint && <span className="text-xs leading-snug text-slate">{hint}</span>}
      </span>
    </motion.button>
  );
}
