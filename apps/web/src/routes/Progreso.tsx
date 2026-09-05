import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Progreso as ProgresoBody } from '../components/Progreso.tsx';
import { fadeUp, tappable } from '../lib/motion.ts';

/**
 * Pantalla "Progreso": la contracara de "Hoy" — lo que ya se hizo, no lo que
 * falta hacer. El contenido real vive en `components/Progreso.tsx`.
 */
export function Progreso() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-8">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-3"
      >
        <motion.div {...tappable}>
          <Link
            to="/"
            className="flex size-10 items-center justify-center rounded-full border border-line text-slate"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </motion.div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Tu progreso</p>
          <h1 className="text-2xl font-bold tracking-tight">Lo que ya hiciste</h1>
        </div>
      </motion.header>

      <ProgresoBody />
    </main>
  );
}
