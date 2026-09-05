import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../lib/auth/AuthProvider.tsx';

/**
 * Cierra el paso a rutas que necesitan sesión. Mientras se resuelve la
 * consulta inicial a Supabase (`status === 'loading'`) no redirige a nadie:
 * evita el parpadeo de "te mando al login" en cada F5.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div role="status" className="grid min-h-dvh place-items-center">
        <div
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-2 border-line border-t-teal"
        />
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  if (status === 'signed-out') {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
