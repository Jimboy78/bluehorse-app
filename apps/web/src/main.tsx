import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './lib/auth/AuthProvider.tsx';
import { queryClient } from './lib/query-client.ts';
import { router } from './router.tsx';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Falta el div #root en index.html');

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
