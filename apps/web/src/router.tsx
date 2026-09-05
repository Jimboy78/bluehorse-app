import { createBrowserRouter } from 'react-router';
import { App } from './App.tsx';
import { Onboarding } from './routes/Onboarding.tsx';
import { Panel } from './routes/Panel.tsx';
import { RequireAdmin } from './routes/RequireAdmin.tsx';
import { RequireAuth } from './routes/RequireAuth.tsx';
import { RequireOnboarding } from './routes/RequireOnboarding.tsx';
import { SignIn } from './routes/SignIn.tsx';

/**
 * Árbol de rutas de la app. Crece por fase del roadmap:
 * fase 1 agrega /auth, /onboarding, /panel y protege "/"; fase 2 suma /hoy, /sesion.
 */
export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <SignIn />,
  },
  {
    path: '/onboarding',
    element: (
      <RequireAuth>
        <Onboarding />
      </RequireAuth>
    ),
  },
  {
    path: '/panel',
    element: (
      <RequireAuth>
        <RequireAdmin>
          <Panel />
        </RequireAdmin>
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <RequireOnboarding>
          <App />
        </RequireOnboarding>
      </RequireAuth>
    ),
  },
]);
