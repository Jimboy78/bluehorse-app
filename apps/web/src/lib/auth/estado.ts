/**
 * QUÉ SIGNIFICA QUE NO HAYA SESIÓN
 *
 * `supabase.auth.getSession()` devuelve `session: null` en dos situaciones que
 * no se parecen en nada:
 *
 * 1. No hay nadie con sesión iniciada en este teléfono.
 * 2. Hay una sesión guardada, el token venció, y no se pudo renovar porque el
 *    servidor no contesta.
 *
 * Medido con Supabase apagado: `getSession()` vuelve **en 0 ms** con
 * `session: null` mientras el token sigue guardado en el navegador, con su
 * usuario adentro y vencido. A veces trae `error: "Failed to fetch"` y a veces
 * no —depende de si ya intentó renovar en esta carga—, así que el `error` solo
 * no alcanza para distinguir los dos casos: lo que los separa de verdad es si
 * quedó una sesión guardada. Si la persona cerró sesión, supabase-js borra esa
 * clave; si el token venció y no se pudo renovar, sigue ahí.
 *
 * Leer solo `session` mezcla las dos: la app mandaba al socio a la pantalla de
 * login como si hubiera cerrado sesión. En el gimnasio, sin señal, eso es
 * decirle "no sos vos" justo cuando tiene series sin sincronizar en el
 * teléfono. Y ofrecerle un formulario de login tampoco sirve: iniciar sesión
 * necesita exactamente el servidor que no contesta.
 *
 * `'sin-confirmar'` es lo que de verdad pasó, y es lo que la pantalla dice.
 */

export type AuthStatus =
  | 'loading'
  | 'unconfigured'
  | 'signed-out'
  | 'signed-in'
  /** Hay una sesión guardada pero no se pudo validar contra el servidor. */
  | 'sin-confirmar';

export interface EntradaDeEstado {
  readonly configurado: boolean;
  readonly cargando: boolean;
  readonly haySesion: boolean;
  /**
   * `true` si quedó una sesión guardada que no se pudo validar: o la consulta
   * falló, o el almacenamiento todavía tiene una y `getSession()` devolvió
   * `null` igual.
   */
  readonly falloAlConsultar: boolean;
}

export function estadoDeSesion(e: EntradaDeEstado): AuthStatus {
  if (!e.configurado) return 'unconfigured';
  if (e.cargando) return 'loading';
  if (e.haySesion) return 'signed-in';
  return e.falloAlConsultar ? 'sin-confirmar' : 'signed-out';
}

/** El formato de clave con el que supabase-js guarda la sesión. */
const CLAVE_DE_SESION = /^sb-.+-auth-token$/;

/**
 * ¿Quedó una sesión guardada en este navegador?
 *
 * Lee el almacenamiento de supabase-js directamente porque no hay otra forma
 * de preguntarlo: su API responde lo mismo ("no hay sesión") cuando la persona
 * cerró sesión y cuando el token venció sin poder renovarse. Si algún día
 * cambia el formato de la clave, esto devuelve `false` y la app vuelve a
 * comportarse como antes — se pierde el aviso, no se rompe nada.
 */
export function haySesionGuardada(almacen: Pick<Storage, 'length' | 'key' | 'getItem'>): boolean {
  for (let i = 0; i < almacen.length; i++) {
    const clave = almacen.key(i);
    if (!clave || !CLAVE_DE_SESION.test(clave)) continue;
    const crudo = almacen.getItem(clave);
    if (!crudo) continue;
    try {
      const valor = JSON.parse(crudo) as { user?: unknown } | null;
      if (valor && typeof valor === 'object' && valor.user) return true;
    } catch {
      // Una clave ilegible no es una sesión.
    }
  }
  return false;
}
