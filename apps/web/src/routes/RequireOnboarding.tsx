import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
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
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="size-6 animate-spin rounded-full border-2 border-line border-t-teal" />
      </div>
    );
  }

  if (profile.data && !profile.data.onboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
