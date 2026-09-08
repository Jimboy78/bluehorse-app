import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { PageLoader } from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useScreeningState } from '../lib/health-screening.ts';

/**
 * Nadie entrena sin haber pasado el cribado de salud.
 *
 * Va ANTES que `RequireOnboarding`: preguntar el objetivo de entrenamiento a
 * alguien que quizá no debería entrenar sin ver a un médico es al revés.
 *
 * Si el ruleset activo no define cribado (`required: false`), este guard no
 * hace nada: no hay preguntas que hacer, y fabricarlas sería peor que no
 * tenerlas.
 *
 * Mismo criterio que los otros guards: sin sesión no se puede saber el estado
 * real, así que se deja pasar en vez de bloquear.
 */
export function RequireScreening({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const screening = useScreeningState();

  if (status !== 'signed-in') return children;

  if (screening.isPending) {
    return <PageLoader />;
  }

  if (!screening.data?.required) return children;

  // Sin responder, o frenado por una respuesta de riesgo: las dos van a la
  // misma pantalla, que sabe cuál de los dos casos mostrar.
  if (!screening.data.answered || !screening.data.cleared) {
    return <Navigate to="/salud" replace />;
  }

  return children;
}
