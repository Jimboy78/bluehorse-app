import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { PageLoader } from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';

/**
 * Espejo de RequireAuth para `/auth`: si ya hay sesión, no tiene sentido
 * mostrar el formulario de login.
 *
 * Sin esto, entrar con email y contraseña dejaba al socio mirando el mismo
 * formulario: `signInWithPassword` resolvía bien, la sesión quedaba guardada,
 * pero nadie lo sacaba de `/auth` (RequireAuth solo protege las otras rutas,
 * no expulsa de esta). Se veía como "el botón Entrar no hace nada".
 *
 * Manda siempre a `/`; de ahí RequireOnboarding decide si todavía falta el
 * onboarding.
 */
export function RedirectIfSignedIn({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <PageLoader />;
  }

  if (status === 'signed-in') {
    return <Navigate to="/" replace />;
  }

  return children;
}
