import { motion } from 'motion/react';
import { AppShell } from '../components/AppShell.tsx';
import { MisPlanes } from '../components/MisPlanes.tsx';
import { Progreso as ProgresoBody } from '../components/Progreso.tsx';
import { fadeUp } from '../lib/motion.ts';

/**
 * Pantalla "Progreso": la contracara de "Hoy" — lo que ya se hizo, no lo que
 * falta hacer. El contenido real vive en `components/Progreso.tsx`.
 *
 * Ya no lleva botón de "volver": las dos secciones son pares y se cambia
 * entre ellas por la barra de abajo del `AppShell`, no entrando y saliendo.
 */
export function Progreso() {
  return (
    <AppShell>
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1"
      >
        <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand">
          Tu progreso
        </p>
        <h1 className="font-display text-[2.6rem] font-semibold uppercase leading-[0.95] tracking-tight">
          Lo que ya hiciste
        </h1>
      </motion.header>

      <MisPlanes />
      <ProgresoBody />
    </AppShell>
  );
}
