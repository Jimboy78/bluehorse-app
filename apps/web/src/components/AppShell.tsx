import {
  CloudOff,
  Dumbbell,
  Layers,
  LogOut,
  SlidersHorizontal,
  TrendingUp,
  User,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { screen, tappable } from '../lib/motion.ts';
import { useProfileRole } from '../lib/panel.ts';
import { BrandMark, ConfirmDialog, Wordmark } from './ui/index.ts';

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
          <NavItem to="/perfil" icon={<User size={18} aria-hidden="true" />} label="Perfil" />
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
 * Un destino de la barra. El activo no solo cambia de color: se enciende con
 * el fondo de la marca. Mirando la pantalla de reojo entre series, un ícono
 * azul y uno gris a 18 px son el mismo ícono.
 */
function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `${NAV_BASE} ${
          isActive
            ? 'bg-brand/10 text-brand shadow-[inset_0_1px_0_0_rgb(111_180_239_/_0.2)]'
            : 'text-slate hover:text-ink'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
