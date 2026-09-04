import type { AuthError } from '@supabase/supabase-js';

/**
 * Traduce los errores de Supabase Auth a algo que un socio del gimnasio pueda
 * leer. Los mensajes de la librería vienen en inglés y hablan de "JWT" y
 * "grant type" — nada de eso ayuda a alguien que quiere entrar a ver su rutina.
 *
 * Función pura y testeable: no toca la red, solo mapea texto.
 */
export function describeAuthError(error: AuthError | Error | null): string {
  if (!error) return '';

  const message = error.message.toLowerCase();

  if (message.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (message.includes('email not confirmed')) {
    return 'Todavía no confirmaste tu email. Revisá tu bandeja de entrada.';
  }
  if (message.includes('user already registered')) {
    return 'Ya existe una cuenta con ese email. Probá iniciar sesión.';
  }
  if (message.includes('password') && message.includes('at least')) {
    return 'La contraseña necesita al menos 8 caracteres.';
  }
  if (message.includes('rate limit')) {
    return 'Demasiados intentos. Esperá un minuto y probá de nuevo.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'No hay conexión con el servidor. Revisá tu internet.';
  }

  return 'Algo salió mal. Probá de nuevo en un momento.';
}
