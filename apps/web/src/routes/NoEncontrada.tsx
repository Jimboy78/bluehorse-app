import { Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
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
      <Compass size={28} className="text-teal" aria-hidden="true" />
      <h1 className="text-2xl font-bold tracking-tight">Esta página no existe</h1>
      <p className="max-w-[34ch] text-sm text-slate">
        Puede que el enlace esté viejo o que la dirección tenga un error de tipeo.
      </p>
      <motion.div {...tappable} variants={fadeUp} initial="hidden" animate="visible">
        <Link to="/" className="rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-navy">
          Ir a tu entrenamiento
        </Link>
      </motion.div>
    </main>
  );
}
