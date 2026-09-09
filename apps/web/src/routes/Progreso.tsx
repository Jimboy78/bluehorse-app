import { ChevronRight, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { AppShell } from '../components/AppShell.tsx';
import { MisDatos } from '../components/MisDatos.tsx';
import { MisPlanes } from '../components/MisPlanes.tsx';
import { Progreso as ProgresoBody } from '../components/Progreso.tsx';
import { Card } from '../components/ui/index.ts';
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

      {/* Los datos del cuerpo antes que el historial: son lo único de esta
          pantalla que se puede actualizar hoy mismo, sin haber entrenado. */}
      <MisDatos />
      <MisPlanes />
      <ExplorarLink />
      <ProgresoBody />
    </AppShell>
  );
}

/**
 * Entrada a `/explorar`. `engine.findSubstitutes()` recorre todo el catálogo
 * por patrón y músculos compartidos, y hasta hace poco solo se podía activar
 * desde "Cambiar ejercicio" en Hoy — que exige estar en medio de un
 * entrenamiento. Esto lo deja a mano para cuando la curiosidad no coincide
 * con estar parado frente a una máquina.
 */
function ExplorarLink() {
  return (
    <Link to="/explorar" className="block">
      <Card
        className="flex items-center gap-3 transition-colors hover:border-brand/40"
        animate={false}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
          <Compass size={18} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold text-ink">Explorar el catálogo</p>
          <p className="truncate text-xs text-slate">
            Qué hay para cada músculo, y de qué otra forma se puede hacer
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-slate-dim" aria-hidden="true" />
      </Card>
    </Link>
  );
}
