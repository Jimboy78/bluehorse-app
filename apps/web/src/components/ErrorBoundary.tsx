import { Component, type ReactNode } from 'react';
import { CrashScreen } from './CrashScreen.tsx';

/**
 * Red de contención para lo que pasa AFUERA de las rutas (`AuthProvider`,
 * `QueryClientProvider`): un error de render ahí no lo agarra ningún
 * `errorElement` de ruta (ver `RouteError.tsx`, que cubre adentro del
 * router). Sin ninguno de los dos, un error deja al socio con una pantalla
 * en blanco, parado en el gimnasio, sin ninguna pista de qué pasó.
 *
 * Tiene que ser una clase: no hay equivalente en hooks para
 * `getDerivedStateFromError`/`componentDidCatch` todavía.
 */
interface ErrorBoundaryState {
  readonly error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // No hay un servicio de reporte de errores todavía: al menos queda en la
    // consola para quien esté mirando durante una prueba o una demo.
    console.error('Error sin capturar en la app:', error, info.componentStack);
  }

  override render() {
    return this.state.error ? <CrashScreen /> : this.props.children;
  }
}
