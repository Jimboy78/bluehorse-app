import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { env } from './env.ts';

/**
 * Cliente de Supabase. `null` si falta configuración: la app arranca igual y
 * muestra qué falta, en vez de romper en el primer render.
 *
 * La clave anon es pública a propósito. Quien controla el acceso es RLS.
 * La service_role nunca entra acá: va en Edge Functions.
 */
export const supabase: SupabaseClient | null = env
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase no está configurado. Copiá .env.example a .env y completá las variables.',
    );
  }
  return supabase;
}

/** Chequeo real contra el servidor, para la pantalla de estado. */
export async function checkConnection(): Promise<{ ok: boolean; detail: string }> {
  if (!env) return { ok: false, detail: 'sin configurar' };
  try {
    const response = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY },
    });
    return response.ok
      ? { ok: true, detail: `${response.status} OK` }
      : { ok: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : 'no responde' };
  }
}
