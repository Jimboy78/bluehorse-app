import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { PageLoader } from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';

/**
 * Cierra el paso a rutas que necesitan sesión. Mientras se resuelve la
 * consulta inicial a Supabase (`status === 'loading'`) no redirige a nadie:
 * evita el parpadeo de "te mando al login" en cada F5.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <PageLoader />;
  }

  if (status === 'signed-out') {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
