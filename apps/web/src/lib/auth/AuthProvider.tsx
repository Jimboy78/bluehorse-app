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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
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

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

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
