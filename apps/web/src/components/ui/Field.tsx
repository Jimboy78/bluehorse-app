import type { ReactNode } from 'react';

/**
 * Campos de formulario.
 *
 * Un solo aspecto para input, textarea y select: hundido respecto de la
 * tarjeta que los contiene (más oscuro, no más claro — un campo es un hueco
 * donde se escribe, no un botón), y el foco enciende el borde de la marca más
 * un halo suave, que es la señal de "acá estás escribiendo".
 */

export const fieldClass =
  'w-full rounded-xl border border-line bg-navy px-3.5 py-3 text-ink placeholder:text-slate-dim outline-none transition-[border-color,box-shadow] duration-150 focus:border-brand focus:shadow-[0_0_0_3px_rgb(111_180_239_/_0.15)]';

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className = '',
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-[0.12em] text-slate"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-snug text-slate-dim">{hint}</p>}
    </div>
  );
}
