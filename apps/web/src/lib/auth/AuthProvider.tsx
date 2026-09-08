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

/**
 * Sesión de autenticación de toda la app. Un solo lugar que sabe hablarle a
 * Supabase Auth; el resto de la app solo lee `user` y llama a estas acciones.
 *
 * Si Supabase no está configurado (`.env` incompleto), `status` queda en
 * `'unconfigured'` y la app lo muestra en pantalla en vez de romperse — mismo
 * criterio que el resto del proyecto.
 */

type AuthStatus = 'loading' | 'unconfigured' | 'signed-out' | 'signed-in';

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

export function getCurrentUserId(): string | null {
  return currentUserId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      currentUserId = data.session?.user.id ?? null;
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      currentUserId = next?.user.id ?? null;
      setSession(next);
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

  const status: AuthStatus = !supabase
    ? 'unconfigured'
    : loading
      ? 'loading'
      : session
        ? 'signed-in'
        : 'signed-out';

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
