import { Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { buttonClass } from '../components/ui/index.ts';
import { fadeUp, tappable } from '../lib/motion.ts';

/**
 * Una dirección que no existe.
 *
 * Antes esto caía en el `errorElement` y mostraba "Algo se rompió — no era un
 * error tuyo… si marcaste series, ya están guardadas": alarmante y falso para
 * una URL mal tipeada, y encima el único botón era "Recargar", que vuelve a
 * la misma pantalla. Un callejón.
 */
export function NoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full border border-brand/25 bg-brand/10 text-brand shadow-brand">
        <Compass size={28} aria-hidden="true" />
      </span>
      <h1 className="font-display text-3xl font-semibold uppercase tracking-tight">
        Esta página no existe
      </h1>
      <p className="max-w-[34ch] text-sm leading-relaxed text-slate">
        Puede que el enlace esté viejo o que la dirección tenga un error de tipeo.
      </p>
      <motion.div {...tappable} variants={fadeUp} initial="hidden" animate="visible">
        <Link to="/" className={buttonClass('primary', 'lg')}>
          Ir a tu entrenamiento
        </Link>
      </motion.div>
    </main>
  );
}
