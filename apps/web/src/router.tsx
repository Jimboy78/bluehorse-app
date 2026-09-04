import { createBrowserRouter } from 'react-router';
import { App } from './App.tsx';
import { RequireAuth } from './routes/RequireAuth.tsx';
import { SignIn } from './routes/SignIn.tsx';

/**
 * Árbol de rutas de la app. Crece por fase del roadmap:
 * fase 1 agrega /auth y protege "/"; fase 2 suma /onboarding, /hoy, /sesion.
 */
export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <SignIn />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <App />
      </RequireAuth>
    ),
  },
]);
