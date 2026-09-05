import { useRouteError } from 'react-router';
import { CrashScreen } from './CrashScreen.tsx';

/**
 * `errorElement` de cada ruta. `createBrowserRouter` envuelve cada ruta en su
 * propio límite de error que gana por encima de cualquier `ErrorBoundary` de
 * React puesto afuera del router (ver `ErrorBoundary.tsx`) — sin esto, un
 * error de render deja al socio con la pantalla de "Unexpected Application
 * Error" de React Router en vez de un mensaje en castellano.
 */
export function RouteError() {
  const error = useRouteError();
  console.error('Error de ruta sin capturar:', error);

  return <CrashScreen />;
}
