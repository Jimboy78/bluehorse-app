import { Loader2 } from 'lucide-react';
import { lazy, type ReactNode, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
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
    <div className="grid min-h-dvh place-items-center">
      <Loader2 size={22} className="animate-spin text-slate" aria-hidden="true" />
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
  },
  {
    path: '/auth',
    element: lazyPage(<SignIn />),
  },
  {
    path: '/onboarding',
    element: lazyPage(
      <RequireAuth>
        <Onboarding />
      </RequireAuth>,
    ),
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
  },
]);
