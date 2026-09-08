import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { PageLoader } from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useProfileStatus } from '../lib/onboarding.ts';

/**
 * Manda al onboarding a quien todavía no lo completó. Mismo criterio que
 * RequireAuth: si Supabase no está configurado, no se puede saber el estado
 * real, así que se deja pasar en vez de bloquear.
 */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const profile = useProfileStatus();

  if (status !== 'signed-in') return children;

  if (profile.isPending) {
    return <PageLoader />;
  }

  if (profile.data && !profile.data.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
