import { Loader2 } from 'lucide-react';
import { lazy, type ReactNode, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouteError } from './components/RouteError.tsx';
import { NoEncontrada } from './routes/NoEncontrada.tsx';
import { RedirectIfSignedIn } from './routes/RedirectIfSignedIn.tsx';
import { RequireAdmin } from './routes/RequireAdmin.tsx';
import { RequireAuth } from './routes/RequireAuth.tsx';
import { RequireOnboarding } from './routes/RequireOnboarding.tsx';

/**
 * Árbol de rutas de la app. Crece por fase del roadmap:
 * fase 1 agrega /auth, /onboarding, /panel y protege "/"; fase 2 suma /hoy, /sesion;
 * fase 3 suma /progreso e /instalar (destino del QR del gimnasio, pública).
 *
 * Cada pantalla es un `lazy()`: el motor (`@bh/engine` + el ruleset) y el panel
 * de catálogo son pesados, y nadie que entra a `/instalar` desde el QR necesita
 * bajarlos todavía. Los guards (`RequireX`) se quedan eager: son livianos y hacen
 * falta antes de saber qué pantalla se va a pedir.
 *
 * Cada ruta tiene su propio `errorElement` (`RouteError`): sin eso, un error de
 * render dentro de una pantalla deja al socio con la pantalla de error genérica
 * de React Router en inglés, en vez del mensaje en castellano de `CrashScreen`.
 */
const App = lazy(() => import('./App.tsx').then((m) => ({ default: m.App })));
const Instalar = lazy(() => import('./routes/Instalar.tsx').then((m) => ({ default: m.Instalar })));
const Onboarding = lazy(() =>
  import('./routes/Onboarding.tsx').then((m) => ({ default: m.Onboarding })),
);
const Panel = lazy(() => import('./routes/Panel.tsx').then((m) => ({ default: m.Panel })));
const Progreso = lazy(() => import('./routes/Progreso.tsx').then((m) => ({ default: m.Progreso })));
const SignIn = lazy(() => import('./routes/SignIn.tsx').then((m) => ({ default: m.SignIn })));

function PageFallback() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center">
      <Loader2 size={22} className="animate-spin text-slate" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

function lazyPage(node: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/instalar',
    element: lazyPage(<Instalar />),
    errorElement: <RouteError />,
  },
  {
    path: '/auth',
    element: lazyPage(
      <RedirectIfSignedIn>
        <SignIn />
      </RedirectIfSignedIn>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/onboarding',
    element: lazyPage(
      <RequireAuth>
        <Onboarding />
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/panel',
    element: lazyPage(
      <RequireAuth>
        <RequireAdmin>
          <Panel />
        </RequireAdmin>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/progreso',
    element: lazyPage(
      <RequireAuth>
        <RequireOnboarding>
          <Progreso />
        </RequireOnboarding>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/',
    element: lazyPage(
      <RequireAuth>
        <RequireOnboarding>
          <App />
        </RequireOnboarding>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    // Cualquier otra dirección. Sin esto, una URL mal tipeada caía en el
    // `errorElement` y mostraba la pantalla de "algo se rompió", que asusta
    // sin motivo y no lleva a ningún lado.
    path: '*',
    element: <NoEncontrada />,
    errorElement: <RouteError />,
  },
]);
