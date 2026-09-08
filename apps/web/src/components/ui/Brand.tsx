/**
 * La marca dentro de la app.
 *
 * Son dos piezas distintas y no una, porque el ícono real de Blue Horse (el
 * mascota dentro de la insignia, con "BLUE HORSE" curvado arriba) tiene
 * demasiado detalle para 20 px: a ese tamaño el texto circular se convierte en
 * una mancha. Ver `docs/07-marca-blue-horse.md`.
 *
 * - `BrandMark` es la reducción geométrica — anillo y barra con discos, los
 *   dos elementos del logo que sobreviven a cualquier tamaño. Va en la barra
 *   superior y en el pie.
 * - `Mascota` es el asset real, y solo se usa grande (acceso, instalación),
 *   que es donde se lee de verdad.
 */

export function BrandMark({ size = 26, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Blue Horse Gym"
      className={className}
    >
      <defs>
        <linearGradient id="bh-mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#abe6f8" />
          <stop offset="0.55" stopColor="#6fb4ef" />
          <stop offset="1" stopColor="#3f7fc4" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="13" fill="none" stroke="url(#bh-mark-grad)" strokeWidth="2.2" />
      <rect x="9" y="14.7" width="14" height="2.6" rx="1.3" fill="#eef3fb" />
      <rect x="6.4" y="11.4" width="3.1" height="9.2" rx="1.5" fill="url(#bh-mark-grad)" />
      <rect x="22.5" y="11.4" width="3.1" height="9.2" rx="1.5" fill="url(#bh-mark-grad)" />
    </svg>
  );
}

/**
 * "BLUE HORSE" en la condensada del logo. `aria-hidden` porque siempre va al
 * lado de un `BrandMark`, que ya lleva el nombre accesible: sin esto un lector
 * de pantalla dice "Blue Horse Gym Blue Horse" en cada pantalla.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`font-display text-[0.95rem] font-semibold uppercase leading-none tracking-[0.2em] text-ink ${className}`}
    >
      Blue Horse
    </span>
  );
}

/**
 * El mascota real, grande.
 *
 * El PNG trae el fondo negro horneado (no tiene alfa), así que se compone con
 * `screen`: sobre el negro de la app el fondo del archivo desaparece y queda
 * solo el caballo. Sacarle el fondo con una herramienta y guardar un PNG con
 * transparencia daría lo mismo y pesaría más.
 */
export function Mascota({ size = 176, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center ${className}`}
      style={{ width: size, height: size }}
    >
      <span aria-hidden="true" className="absolute inset-[12%] rounded-full bg-brand/20 blur-3xl" />
      <img
        src="/brand/mascota.webp"
        alt="Blue Horse Gym"
        width={size}
        height={size}
        className="relative mix-blend-screen"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
