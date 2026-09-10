import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { pendingCount } from '../outbox.ts';
import { queryClient } from '../query-client.ts';
import { supabase } from '../supabase.ts';
import { describeAuthError } from './errors.ts';
import { type AuthStatus, estadoDeSesion, haySesionGuardada } from './estado.ts';

/**
 * Sesión de autenticación de toda la app. Un solo lugar que sabe hablarle a
 * Supabase Auth; el resto de la app solo lee `user` y llama a estas acciones.
 *
 * Si Supabase no está configurado (`.env` incompleto), `status` queda en
 * `'unconfigured'` y la app lo muestra en pantalla en vez de romperse — mismo
 * criterio que el resto del proyecto.
 */

export type { AuthStatus } from './estado.ts';

interface AuthContextValue {
  readonly status: AuthStatus;
  readonly user: User | null;
  readonly session: Session | null;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  /**
   * `blocked: true` significa que no cerró sesión: quedaban series sin
   * mandar al servidor y el llamado no vino con `force`. Quien lo llama
   * decide si avisa y reintenta con `force: true`, o espera señal.
   */
  signOut: (opts?: { force?: boolean }) => Promise<{ blocked: boolean; pendingCount: number }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * A quién pertenece la sesión ahora mismo, fuera de React. `startSessionOutbox`
 * arranca en `main.tsx` antes de que exista ningún componente, y necesita
 * saber a nombre de quién mandar la cola cuando vuelve la señal — un valor
 * capturado una sola vez al arrancar quedaría pegado a quien haya iniciado
 * sesión primero, aunque después cierre sesión y entre otra persona.
 */
let currentUserId: string | null = null;

/**
 * Cuánto se espera a que Supabase confirme la sesión antes de dejar de
 * bloquear la app. No es un número de entrenamiento (regla dura 3): es cuánto
 * tolera mirar un spinner alguien parado al lado de una máquina.
 */
const ESPERA_MAXIMA_DE_SESION_MS = 6000;

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  /**
   * Que la consulta de sesión haya fallado, no que no hubiera sesión. Es la
   * diferencia entre "cerraste sesión" y "no te puedo confirmar": ver
   * `auth/estado.ts`.
   */
  const [falloAlConsultar, setFalloAlConsultar] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    /**
     * NADA BLOQUEA LA APP ENTERA MÁS QUE ESTO
     *
     * `loading` acá es el único interruptor de la app: mientras esté en
     * `true`, `RequireAuth` muestra el spinner y no hay ninguna pantalla. Y lo
     * apaga una promesa de red, que puede tardar o —peor— no resolver ni
     * rechazar nunca; `getSession()` sale a renovar el token contra el
     * servidor cuando el guardado venció.
     *
     * Esto es precaución, no la cura de un cuelgue medido: el que sí medí
     * estaba en los guards de ruta y se arregla en `lib/con-plazo.ts`. Pero un
     * `await` sin techo sobre el único interruptor de la app es un cuelgue
     * esperando a pasar, y ponerle plazo no cuesta nada.
     *
     * El corte NO se cancela en el cleanup. Así fue el primer intento y no
     * servía: en desarrollo React monta, desmonta y vuelve a montar, el
     * cleanup cancelaba el timer y el techo desaparecía. Un
     * `setLoading(false)` de más no rompe nada —ya está en `false`, y desde
     * React 18 avisarle a un componente desmontado es un no-op—; uno de menos
     * deja la app trabada.
     */
    const destrabar = () => setLoading(false);
    const corte = setTimeout(destrabar, ESPERA_MAXIMA_DE_SESION_MS);

    /**
     * Los tres cambios de estado van en el MISMO callback, no repartidos entre
     * `.then` y `.finally`. Repartidos, React hace dos renders, y en el primero
     * `loading` ya es `false` mientras `falloAlConsultar` todavía es `false`:
     * ese render de un solo cuadro dice "signed-out", `RequireAuth` dispara un
     * `<Navigate to="/auth">` y la URL ya cambió. El estado quedaba bien un
     * instante después —lo verifiqué leyendo los hooks del componente— pero la
     * persona ya estaba en la pantalla de login.
     */
    const resolver = (sesion: Session | null, fallo: boolean) => {
      clearTimeout(corte);
      setSession(sesion);
      currentUserId = sesion?.user.id ?? null;
      setFalloAlConsultar(fallo);
      setLoading(false);
    };

    supabase.auth.getSession().then(
      // `error` con `session: null` no es "no hay nadie": es "no se pudo
      // averiguar". Distinguirlos es todo el punto de `auth/estado.ts`.
      ({ data, error }) =>
        resolver(data.session, !data.session && (!!error || haySesionGuardada(localStorage))),
      () => resolver(null, true),
    );

    /**
     * El otro camino por el que se pierde la sesión, y el que de verdad pasaba.
     *
     * `getSession()` devuelve la sesión guardada enseguida; la renovación sale
     * DESPUÉS, por atrás, y cuando falla este listener avisa con `next: null`.
     * Sin mirar el almacenamiento acá, ese `null` se leía como "cerró sesión" y
     * al socio lo mandaba al login estando sin señal. Es el mismo criterio de
     * `getSession()`: si quedó una sesión guardada, no se pudo confirmar.
     */
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      currentUserId = next?.user.id ?? null;
      setSession(next);
      setFalloAlConsultar(!next && haySesionGuardada(localStorage));
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? describeAuthError(error) : null };
  }, []);

  const signUpWithPassword = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!supabase) return { error: 'Supabase no está configurado.' };
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      return { error: error ? describeAuthError(error) : null };
    },
    [],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return { error: 'Supabase no está configurado.' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error ? describeAuthError(error) : null };
  }, []);

  const signOut = useCallback(
    async (opts?: { force?: boolean }) => {
      if (!supabase) return { blocked: false, pendingCount: 0 };

      // Si quedan series o sesiones sin mandar al servidor y alguien cierra
      // sesión igual, esa cola queda atada a un `ownerId` que ya no tiene
      // sesión activa: `flush()` nunca la va a volver a intentar (no hay
      // evento `online` con esta cuenta logueada para dispararlo), así que se
      // pierde en silencio. Se frena por default; `force: true` es la salida
      // explícita para cuando de verdad hace falta salir igual.
      const userId = session?.user.id;
      const pending = userId ? await pendingCount(userId) : 0;
      if (pending > 0 && !opts?.force) {
        return { blocked: true, pendingCount: pending };
      }

      // `scope: 'local'` a propósito: borra la sesión de ESTE navegador
      // (localStorage) sin tocar otros dispositivos donde la misma persona
      // pueda tener sesión abierta. El default de supabase-js es `'global'`,
      // que revoca el refresh token en todos lados — cerrar sesión en el
      // teléfono prestado del gimnasio no puede desloguear a nadie de su
      // propio celular en su casa.
      await supabase.auth.signOut({ scope: 'local' });

      // Sin esto, la caché de TanStack Query sigue en memoria: si alguien
      // más inicia sesión en el mismo dispositivo antes de que cada query se
      // vuelva a pedir, hay una ventana donde vería en pantalla — aunque sea
      // un instante — datos cacheados de la cuenta anterior mientras las
      // consultas nuevas todavía no resolvieron.
      queryClient.clear();

      return { blocked: false, pendingCount: 0 };
    },
    [session],
  );

  const status: AuthStatus = estadoDeSesion({
    configurado: !!supabase,
    cargando: loading,
    haySesion: !!session,
    falloAlConsultar,
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: session?.user ?? null,
      session,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [status, session, signInWithPassword, signUpWithPassword, signInWithGoogle, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth se llamó fuera de <AuthProvider>.');
  return ctx;
}
