import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { AuthProvider, getCurrentUserId } from './lib/auth/AuthProvider.tsx';
import { queryClient } from './lib/query-client.ts';
import { startSessionOutbox } from './lib/session-log.ts';
// Registra el service worker apenas arranca la app, no al montar una pantalla:
// si no, `/auth` e `/instalar` —el destino del QR— se quedaban sin registrarlo.
import './lib/use-sw-update.ts';
import { router } from './router.tsx';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Falta el div #root en index.html');

// Reintenta la cola de series/sesiones sin enviar apenas vuelve la señal.
// Arranca una sola vez, acá, no por pantalla: la cola es de toda la app.
// `getCurrentUserId` se evalúa en cada evento `online`, no acá: al arrancar
// todavía no se resolvió qué sesión hay, y además la persona puede cerrar
// sesión y otra entrar antes de que vuelva la conexión.
startSessionOutbox(getCurrentUserId);

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
