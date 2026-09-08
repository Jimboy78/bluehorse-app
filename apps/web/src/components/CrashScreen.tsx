import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './ui/index.ts';

/**
 * Pantalla compartida entre `ErrorBoundary.tsx` (errores fuera del router) y
 * `RouteError.tsx` (`errorElement` de cada ruta, que gana por encima del
 * primero — ver el comentario ahí). Un solo lugar para el mensaje que ve el
 * socio cuando algo se rompe de verdad.
 *
 * Sin marca ni azul de la app a propósito: es la única pantalla donde lo que
 * importa es que algo salió mal, no dónde está parada la persona.
 */
export function CrashScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <span className="grid size-16 place-items-center rounded-full border border-orange/30 bg-orange/10 text-orange">
        <AlertTriangle size={28} aria-hidden="true" />
      </span>
      <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">
        Algo se rompió
      </h1>
      <p className="text-sm leading-relaxed text-slate">
        No era un error tuyo. Recargá la página — si marcaste series antes de que esto pasara, ya
        están guardadas y no se pierden.
      </p>
      <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
        <RotateCw size={16} aria-hidden="true" />
        Recargar
      </Button>
    </main>
  );
}
