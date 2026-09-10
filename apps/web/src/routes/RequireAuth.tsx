import { WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, Navigate } from 'react-router';
import { Button, Notice, PageLoader } from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { haySesionGuardada } from '../lib/auth/estado.ts';

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

  if (status === 'signed-in') {
    return children;
  }

  /**
   * El almacenamiento se mira ACÁ, además de en `AuthProvider`, y no es
   * redundante: `<Navigate>` cambia la URL y eso no se deshace. La sesión se
   * pierde en dos pasos —`getSession()` devuelve la guardada y la renovación
   * falla después, por atrás— y en el instante entre los dos el estado dice
   * "signed-out". Un solo render con ese valor alcanzaba para mandar al socio
   * al login; que el estado se corrigiera un momento más tarde ya no servía de
   * nada. Preguntarle al almacenamiento no depende de ningún orden.
   *
   * Va DESPUÉS de `signed-in`: con sesión válida la clave también existe, y
   * mirarla antes tapaba la app entera con el aviso aunque no pasara nada.
   */
  if (status === 'sin-confirmar' || haySesionGuardada(localStorage)) {
    return <SesionSinConfirmar />;
  }

  return <Navigate to="/auth" replace />;
}

/**
 * Hay una sesión guardada pero no se pudo validar contra el servidor.
 *
 * Mandar a esta persona al formulario de login sería dos veces equivocado: le
 * dice "no sos vos" cuando sí es, y le ofrece una acción que necesita
 * exactamente el servidor que no está contestando. Lo único honesto es decir
 * qué pasó, aclarar que lo que hizo sigue guardado en el teléfono, y ofrecer
 * reintentar.
 */
function SesionSinConfirmar() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-5 py-10">
      <Notice tone="warn" role="alert" icon={<WifiOff size={16} aria-hidden="true" />}>
        <span className="flex flex-col gap-2">
          <span className="font-semibold text-ink">No pudimos confirmar tu sesión</span>
          <span>
            No es que hayas cerrado sesión: no se pudo hablar con el servidor. Si estás sin señal,
            probá de nuevo cuando vuelva.
          </span>
          <span className="text-xs text-slate">
            Lo que marcaste sigue guardado en este teléfono y se manda solo cuando haya conexión.
          </span>
        </span>
      </Notice>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" onClick={() => window.location.reload()}>
          Probar de nuevo
        </Button>
        {/* La salida para el caso que no es falta de señal: la sesión caducó
            de verdad y hay que volver a entrar. */}
        <Link to="/auth" className="text-xs text-slate underline-offset-4 hover:underline">
          Entrar con otra cuenta
        </Link>
      </div>
    </main>
  );
}
