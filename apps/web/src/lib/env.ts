import { z } from 'zod';

/**
 * Validación de las variables de entorno en el arranque.
 * Falla claro y temprano en vez de tirar "undefined is not a URL" en runtime.
 */
const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(import.meta.env);

/** `null` cuando falta configuración: la app lo muestra en pantalla, no explota. */
export const env: Env | null = parsed.success ? parsed.data : null;

export const envError: string | null = parsed.success
  ? null
  : parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(' · ');

export const isConfigured = env !== null;
