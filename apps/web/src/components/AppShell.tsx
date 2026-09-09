import {
  CloudOff,
  Dumbbell,
  Layers,
  LogOut,
  RefreshCw,
  SlidersHorizontal,
  TrendingUp,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useInstallInvite } from '../lib/install-invite.ts';
import { duration, ease, screen, tappable } from '../lib/motion.ts';
import { useProfileRole } from '../lib/panel.ts';
import { useServiceWorkerUpdate } from '../lib/use-sw-update.ts';
import { InstallSheet } from './InstallSheet.tsx';
import { BrandMark, Button, ConfirmDialog, Notice, Wordmark } from './ui/index.ts';

/**
 * El marco de las pantallas de socio: barra de marca arriba, contenido en el
 * medio, navegación fija abajo.
 *
 * Antes cada pantalla se dibujaba su propio encabezado y "Progreso" era un
 * botón chiquito adentro de "Hoy": ir y volver era un viaje de ida, con un
 * botón "atrás" distinto en cada lado. Con dos secciones que se usan en
 * momentos opuestos (una antes de entrenar, la otra después), la barra de
 * abajo es la forma correcta — y es donde llega el pulgar sin reacomodar el
 * teléfono, que es el único lugar que importa acá.
 *
 * `pb-[env(safe-area-inset-bottom)]` no es opcional: instalada como PWA en un
 * iPhone, la barra de gestos se come los últimos 34 px y "Progreso" queda
 * abajo del borde.
 */

// Con cinco destinos (Hoy, Planes, Progreso, Perfil, y Panel para staff) el
// tracking ancho de antes hacía que "Progreso" partiera en dos líneas en un
// iPhone SE. `whitespace-nowrap` fuerza una sola línea y el tracking bajó de
// 0.14em a 0.06em para que entre.
const NAV_BASE =
  'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[0.6rem] font-semibold uppercase tracking-[0.06em] whitespace-nowrap transition-colors duration-150';

/** Qué está preguntando el cuadro de salida, o `null` si no hay ninguno abierto. */
type SignOutPrompt =
  | { readonly kind: 'confirmar' }
  | { readonly kind: 'pendientes'; readonly count: number };

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const role = useProfileRole();
  const location = useLocation();
  const isStaff = role.data?.role === 'staff' || role.data?.role === 'admin';

  const [prompt, setPrompt] = useState<SignOutPrompt | null>(null);
  const [leaving, setLeaving] = useState(false);
  const invite = useInstallInvite();

  /**
   * Salir pasa por dos preguntas posibles, no por ninguna.
   *
   * La primera es que salir es una decisión y el botón está a un dedo del
   * ícono de la marca: antes se tocaba sin querer y la app te escupía a la
   * pantalla de login sin decir nada.
   *
   * La segunda solo aparece si quedan series sin mandar al servidor. Esa cola
   * queda atada a una cuenta que ya no tiene sesión y `flush()` nunca la
   * reintenta, así que se avisa antes de perderla en silencio; si igual
   * confirma, se sale con `force`.
   */
  async function handleSignOut(force: boolean) {
    setLeaving(true);
    try {
      const result = await signOut(force ? { force: true } : undefined);
      if (result.blocked) {
        setPrompt({ kind: 'pendientes', count: result.pendingCount });
        return;
      }
      setPrompt(null);
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="min-h-dvh">
      {/* `backdrop-blur` y no un fondo opaco: al hacer scroll, las tarjetas se
          ven pasar por debajo y la barra se lee como una capa de vidrio, no
          como un recorte. */}
      <header className="sticky top-0 z-30 border-b border-line/70 bg-navy/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2.5 px-5 py-3">
          <BrandMark size={24} />
          <Wordmark />
          <motion.button
            type="button"
            {...tappable}
            onClick={() => setPrompt({ kind: 'confirmar' })}
            aria-label="Cerrar sesión"
            className="ml-auto grid size-10 place-items-center rounded-full border border-line text-slate transition-colors hover:border-orange/50 hover:text-orange"
          >
            <LogOut size={15} aria-hidden="true" />
          </motion.button>
        </div>
      </header>

      {/* El `pb` deja el aire de la barra de abajo (72 px) más el área segura:
          sin eso la última tarjeta de Progreso queda tapada por la navegación.

          La `key` por ruta hace que cambiar de sección sea una transición y no
          un corte seco: sin eso, "Hoy" y "Progreso" se reemplazaban en el
          mismo frame y no quedaba ninguna señal de que la pantalla cambió. */}
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        {/* El aviso de versión nueva vive acá y no en "Hoy": el service worker
            se instala cuando se instala, y hasta ahora el aviso solo existía
            en una de las cinco pantallas — quien estaba en Perfil o en Planes
            no se enteraba de que había una versión lista. */}
        <ServiceWorkerUpdate />

        <motion.div key={location.pathname} {...screen} className="flex flex-col gap-6">
          {children}
        </motion.div>
      </main>

      <ConfirmDialog
        open={prompt?.kind === 'confirmar'}
        icon={<LogOut size={18} aria-hidden="true" />}
        title="¿Cerrar sesión?"
        confirmLabel="Cerrar sesión"
        confirmVariant="danger"
        cancelLabel="Quedarme"
        busy={leaving}
        onCancel={() => setPrompt(null)}
        onConfirm={() => void handleSignOut(false)}
      >
        Vas a volver a la pantalla de inicio. Tu plan y tus series quedan guardadas: al volver a
        entrar está todo donde lo dejaste.
      </ConfirmDialog>

      <ConfirmDialog
        open={prompt?.kind === 'pendientes'}
        icon={<CloudOff size={18} aria-hidden="true" />}
        title="Queda algo sin sincronizar"
        confirmLabel="Salir igual"
        confirmVariant="danger"
        cancelLabel="Esperar"
        busy={leaving}
        onCancel={() => setPrompt(null)}
        onConfirm={() => void handleSignOut(true)}
      >
        {prompt?.kind === 'pendientes' && (
          <>
            Tenés {prompt.count} {prompt.count === 1 ? 'serie' : 'series'} sin mandar al servidor.
            Si salís ahora, quedan pendientes hasta que vuelvas a entrar con esta cuenta desde este
            mismo teléfono.
          </>
        )}
      </ConfirmDialog>

      <AnimatePresence>
        {invite.phase === 'sheet' && <InstallSheet key="sheet" onDismiss={invite.dismiss} />}
      </AnimatePresence>

      {/* La pista queda justo arriba de la barra, apuntando a la pestaña que
          se enciende: el mensaje y el destino se leen de una sola mirada. */}
      <AnimatePresence>
        {invite.phase === 'hint' && (
          <motion.p
            key="hint"
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: duration.quick, ease: ease.out }}
            className="fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md px-5"
          >
            <span className="block rounded-card border border-brand/30 bg-navy/95 px-4 py-3 text-center text-sm leading-snug text-slate shadow-brand backdrop-blur-xl">
              Cuando quieras instalarla, la tenés en <strong className="text-brand">Perfil</strong>.
            </span>
          </motion.p>
        )}
      </AnimatePresence>

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-navy/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-md gap-1 px-3 py-2">
          <NavItem to="/" icon={<Dumbbell size={18} aria-hidden="true" />} label="Hoy" />
          <NavItem to="/planes" icon={<Layers size={18} aria-hidden="true" />} label="Planes" />
          <NavItem
            to="/progreso"
            icon={<TrendingUp size={18} aria-hidden="true" />}
            label="Progreso"
          />
          <NavItem
            to="/perfil"
            icon={<User size={18} aria-hidden="true" />}
            label="Perfil"
            highlight={invite.phase === 'hint'}
          />
          {isStaff && (
            <NavItem
              to="/panel"
              icon={<SlidersHorizontal size={18} aria-hidden="true" />}
              label="Panel"
            />
          )}
        </div>
      </nav>
    </div>
  );
}

/**
 * Aviso de versión nueva. Discreto y arriba de todo, pero sin recargar solo:
 * hacerlo en medio de una serie borraría lo que la persona estaba cargando
 * (por eso el service worker está en `prompt` y no en `autoUpdate`).
 */
function ServiceWorkerUpdate() {
  const { needsRefresh, applyUpdate } = useServiceWorkerUpdate();
  if (!needsRefresh) return null;

  return (
    <Notice
      tone="info"
      role="status"
      icon={<RefreshCw size={16} aria-hidden="true" />}
      className="items-center"
    >
      <span className="flex flex-wrap items-center justify-between gap-3">
        Hay una versión nueva de la app.
        <Button variant="primary" size="sm" onClick={() => void applyUpdate()}>
          Actualizar
        </Button>
      </span>
    </Notice>
  );
}

/**
 * Un destino de la barra. El activo no solo cambia de color: se enciende con
 * el fondo de la marca. Mirando la pantalla de reojo entre series, un ícono
 * azul y uno gris a 18 px son el mismo ícono.
 *
 * `highlight` es aparte de `isActive`: señala un destino al que todavía no
 * fuiste (hoy, "acá quedó lo de instalar la app" al cerrar la invitación).
 * Por eso pinta el borde y no el fondo — el fondo encendido significa "estás
 * acá", y usar la misma señal para dos cosas distintas las rompe a las dos.
 */
function NavItem({
  to,
  icon,
  label,
  highlight = false,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `${NAV_BASE} ${
          isActive
            ? 'bg-brand/10 text-brand shadow-[inset_0_1px_0_0_rgb(111_180_239_/_0.2)]'
            : highlight
              ? 'text-brand ring-1 ring-brand/60'
              : 'text-slate hover:text-ink'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
