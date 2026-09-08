import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { PageLoader } from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useProfileRole } from '../lib/panel.ts';

/**
 * Solo staff/admin pasan. `member` (el default de todo socio nuevo) rebota a
 * "/" en silencio: el panel admin no debería ni insinuarse en la navegación
 * de un socio común.
 *
 * Mismo cuidado que RequireAuth/RequireOnboarding: si Supabase no está
 * configurado, la consulta de rol queda deshabilitada y `isPending` se queda
 * en `true` para siempre — sin este chequeo, el panel se cuelga en el
 * spinner en vez de mostrar algo.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const role = useProfileRole();

  if (status !== 'signed-in') return children;

  if (role.isPending) {
    return <PageLoader />;
  }

  if (role.data?.role === 'member' || role.isError) {
    return <Navigate to="/" replace />;
  }

  return children;
}
