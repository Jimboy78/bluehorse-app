import { lazy, type ReactNode, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouteError } from './components/RouteError.tsx';
import { PageLoader } from './components/ui/index.ts';
import { NoEncontrada } from './routes/NoEncontrada.tsx';
import { RedirectIfSignedIn } from './routes/RedirectIfSignedIn.tsx';
import { RequireAdmin } from './routes/RequireAdmin.tsx';
import { RequireAuth } from './routes/RequireAuth.tsx';
import { RequireOnboarding } from './routes/RequireOnboarding.tsx';
import { RequireScreening } from './routes/RequireScreening.tsx';

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
const ArmarPlan = lazy(() =>
  import('./routes/ArmarPlan.tsx').then((m) => ({ default: m.ArmarPlan })),
);
const Documentacion = lazy(() =>
  import('./routes/Documentacion.tsx').then((m) => ({ default: m.Documentacion })),
);
const Documento = lazy(() =>
  import('./routes/Documento.tsx').then((m) => ({ default: m.Documento })),
);
const Evidencia = lazy(() =>
  import('./routes/Evidencia.tsx').then((m) => ({ default: m.Evidencia })),
);
const Explorar = lazy(() => import('./routes/Explorar.tsx').then((m) => ({ default: m.Explorar })));
const Instalar = lazy(() => import('./routes/Instalar.tsx').then((m) => ({ default: m.Instalar })));
const Onboarding = lazy(() =>
  import('./routes/Onboarding.tsx').then((m) => ({ default: m.Onboarding })),
);
const Panel = lazy(() => import('./routes/Panel.tsx').then((m) => ({ default: m.Panel })));
const Perfil = lazy(() => import('./routes/Perfil.tsx').then((m) => ({ default: m.Perfil })));
const Planes = lazy(() => import('./routes/Planes.tsx').then((m) => ({ default: m.Planes })));
const Progreso = lazy(() => import('./routes/Progreso.tsx').then((m) => ({ default: m.Progreso })));
const Salud = lazy(() => import('./routes/Salud.tsx').then((m) => ({ default: m.Salud })));
const SignIn = lazy(() => import('./routes/SignIn.tsx').then((m) => ({ default: m.SignIn })));

function lazyPage(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
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
    // El cribado de salud. No lleva `RequireScreening` (sería un bucle) ni
    // `RequireOnboarding`: se responde antes que nada.
    path: '/salud',
    element: lazyPage(
      <RequireAuth>
        <Salud />
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/onboarding',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <Onboarding />
        </RequireScreening>
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
        <RequireScreening>
          <RequireOnboarding>
            <Progreso />
          </RequireOnboarding>
        </RequireScreening>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/planes',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <RequireOnboarding>
            <Planes />
          </RequireOnboarding>
        </RequireScreening>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    // El constructor de un plan a mano. Cuelga de `/planes` y no es una
    // pestaña: se entra desde un plan concreto y se vuelve a la lista.
    path: '/planes/:planId/armar',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <RequireOnboarding>
            <ArmarPlan />
          </RequireOnboarding>
        </RequireScreening>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/explorar',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <RequireOnboarding>
            <Explorar />
          </RequireOnboarding>
        </RequireScreening>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    // La documentación de investigación, publicada entera. Cuelga aparte de
    // `/evidencia` porque responden preguntas distintas: aquélla muestra los
    // papers, ésta muestra qué leímos en ellos.
    path: '/documentacion',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <RequireOnboarding>
            <Documentacion />
          </RequireOnboarding>
        </RequireScreening>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/documentacion/:docId',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <RequireOnboarding>
            <Documento />
          </RequireOnboarding>
        </RequireScreening>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/evidencia',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <RequireOnboarding>
            <Evidencia />
          </RequireOnboarding>
        </RequireScreening>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/perfil',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <RequireOnboarding>
            <Perfil />
          </RequireOnboarding>
        </RequireScreening>
      </RequireAuth>,
    ),
    errorElement: <RouteError />,
  },
  {
    path: '/',
    element: lazyPage(
      <RequireAuth>
        <RequireScreening>
          <RequireOnboarding>
            <App />
          </RequireOnboarding>
        </RequireScreening>
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
