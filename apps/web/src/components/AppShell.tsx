import { Dumbbell, LogOut, SlidersHorizontal, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { tappable } from '../lib/motion.ts';
import { useProfileRole } from '../lib/panel.ts';
import { BrandMark, Wordmark } from './ui/index.ts';

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

const NAV_BASE =
  'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-150';

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const role = useProfileRole();
  const isStaff = role.data?.role === 'staff' || role.data?.role === 'admin';

  /**
   * Si quedan series sin mandar al servidor, `signOut` frena en vez de
   * cerrar la sesión igual: esa cola se queda atada a una cuenta que ya no
   * tiene sesión, y `flush()` nunca la reintenta. Se le pregunta antes de
   * perderla en silencio; si confirma, se cierra sesión igual con `force`.
   */
  async function handleSignOut() {
    const result = await signOut();
    if (!result.blocked) return;

    const plural = result.pendingCount === 1 ? '' : 's';
    const confirmed = window.confirm(
      `Tenés ${result.pendingCount} serie${plural} sin sincronizar todavía. Si salís ahora, quedan pendientes hasta que vuelvas a entrar con esta cuenta desde este mismo teléfono. ¿Salir igual?`,
    );
    if (confirmed) await signOut({ force: true });
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
            onClick={() => void handleSignOut()}
            aria-label="Cerrar sesión"
            className="ml-auto grid size-10 place-items-center rounded-full border border-line text-slate transition-colors hover:border-orange/50 hover:text-orange"
          >
            <LogOut size={15} aria-hidden="true" />
          </motion.button>
        </div>
      </header>

      {/* El `pb` deja el aire de la barra de abajo (72 px) más el área segura:
          sin eso la última tarjeta de Progreso queda tapada por la navegación. */}
      <main className="mx-auto flex max-w-md flex-col gap-6 px-5 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-navy/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-md gap-1 px-4 py-2">
          <NavItem to="/" icon={<Dumbbell size={18} aria-hidden="true" />} label="Hoy" />
          <NavItem
            to="/progreso"
            icon={<TrendingUp size={18} aria-hidden="true" />}
            label="Progreso"
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
