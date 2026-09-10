import { useQueryClient } from '@tanstack/react-query';
import { CloudOff, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { flush } from '../lib/outbox.ts';
import { sendOutboxItem } from '../lib/session-log.ts';
import { loQueEspera, useSyncState } from '../lib/sync-state.ts';
import { Button, Notice } from './ui/index.ts';

/**
 * LO QUE TODAVÍA NO LLEGÓ AL SERVIDOR
 *
 * Va arriba de cualquier pantalla cuyos números se leen de la base. Sin esto,
 * lo que quedó en la cola offline simplemente no aparecía y la pantalla se
 * mostraba igual de segura que si estuviera completa. Ver `lib/sync-state.ts`.
 *
 * No aparece cuando no hay nada pendiente: un cartel permanente diciendo
 * "todo sincronizado" entrena a la gente a no leerlo, y entonces tampoco lee
 * el que importa.
 */
export function SyncNotice() {
  const estado = useSyncState();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reintentando, setReintentando] = useState(false);

  if (estado.kind === 'al-dia') return null;

  if (estado.kind === 'esperando') {
    return (
      <Notice tone="info" role="status" icon={<CloudOff size={16} aria-hidden="true" />}>
        {loQueEspera(estado.series, estado.pendientes)} esperando señal. Está guardado en este
        teléfono, así que no se pierde — pero los números de abajo todavía no lo cuentan.
      </Notice>
    );
  }

  async function reintentar() {
    if (!user) return;
    setReintentando(true);
    try {
      await flush(sendOutboxItem, user.id);
    } finally {
      setReintentando(false);
      // La cola cambió: que el aviso se rearme con lo que quedó, sin esperar
      // los 3 segundos del intervalo.
      void queryClient.invalidateQueries({ queryKey: ['outbox-health'] });
      void queryClient.invalidateQueries({ queryKey: ['progress'] });
    }
  }

  return (
    <Notice tone="warn" role="alert" icon={<TriangleAlert size={16} aria-hidden="true" />}>
      <span className="flex flex-col gap-2">
        <span>
          {estado.pendientes === 1 ? '1 registro' : `${estado.pendientes} registros`} sin guardar, y{' '}
          {estado.fallando} ya falló al intentarlo. Eso no es falta de señal: hay algo que no se
          puede guardar. Los números de abajo no lo cuentan.
        </span>
        {/* El error crudo, no una traducción tranquilizadora: es lo único que
            sirve para saber por qué está trabado. */}
        {estado.error && (
          <span className="break-words font-mono text-[0.65rem] leading-relaxed text-slate">
            {estado.error}
          </span>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void reintentar()}
          disabled={reintentando || !user}
          className="self-start"
        >
          {reintentando ? 'Reintentando…' : 'Reintentar ahora'}
        </Button>
      </span>
    </Notice>
  );
}
