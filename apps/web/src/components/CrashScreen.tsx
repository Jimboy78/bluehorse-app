import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Pantalla compartida entre `ErrorBoundary.tsx` (errores fuera del router) y
 * `RouteError.tsx` (`errorElement` de cada ruta, que gana por encima del
 * primero — ver el comentario ahí). Un solo lugar para el mensaje que ve el
 * socio cuando algo se rompe de verdad.
 */
export function CrashScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-orange/10 text-orange">
        <AlertTriangle size={26} aria-hidden="true" />
      </span>
      <h1 className="text-xl font-bold tracking-tight">Algo se rompió</h1>
      <p className="text-sm text-slate">
        No era un error tuyo. Recargá la página — si marcaste series antes de que esto pasara, ya
        están guardadas y no se pierden.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-navy"
      >
        <RotateCw size={16} aria-hidden="true" />
        Recargar
      </button>
    </main>
  );
}
