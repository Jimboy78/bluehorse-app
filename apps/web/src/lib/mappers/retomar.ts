/**
 * RETOMAR EL PLAN DESDE OTRO DÍA
 *
 * El plan es una cola sin fechas: hoy toca la primera sesión pendiente. Eso
 * evita las "sesiones vencidas" (CLAUDE.md), pero deja a quien vuelve después
 * de unos días sin poder decir "hoy hago piernas" — la cola le ofrece lo que
 * quedó primero, aunque su semana haya seguido.
 *
 * Retomar desde una sesión ROTA la cola: la elegida pasa adelante y las que
 * estaban antes van al final, en el mismo orden. Elegir el jueves de
 * lunes-a-viernes deja jueves, viernes, lunes, martes, miércoles: la semana
 * sigue siendo la misma, empezada en otro punto. Nada se borra.
 *
 * Un plan armado a mano es un ciclo que se repite sin fecha de fin, así que al
 * retomar se REINICIA: todas sus sesiones vuelven a pendientes. Uno del motor
 * es un bloque con progresión: solo se rotan las pendientes, y lo hecho queda
 * hecho.
 */

export type EstadoDeSesion = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface SesionDeCola {
  readonly id: string;
  readonly sequenceIndex: number;
  readonly status: EstadoDeSesion;
}

export interface CambioDeSesion {
  readonly id: string;
  readonly sequenceIndex: number;
  readonly status: EstadoDeSesion;
}

/** Qué sesiones se pueden elegir para retomar. */
export function elegibles(
  sesiones: readonly SesionDeCola[],
  reiniciar: boolean,
): readonly SesionDeCola[] {
  const ordenadas = [...sesiones].sort((a, b) => a.sequenceIndex - b.sequenceIndex);
  return reiniciar ? ordenadas : ordenadas.filter((s) => s.status === 'pending');
}

/**
 * El orden nuevo de la cola, o `null` si la elegida no se puede elegir.
 *
 * Las posiciones que se reparten son las que ya ocupaban las sesiones que se
 * rotan: sin reiniciar, lo hecho conserva su lugar y la cola pendiente sigue
 * detrás.
 */
export function retomarDesde(
  sesiones: readonly SesionDeCola[],
  elegidaId: string,
  reiniciar: boolean,
): readonly CambioDeSesion[] | null {
  const rotan = elegibles(sesiones, reiniciar);
  const k = rotan.findIndex((s) => s.id === elegidaId);
  if (k === -1) return null;

  const nuevoOrden = [...rotan.slice(k), ...rotan.slice(0, k)];
  const lugares = rotan.map((s) => s.sequenceIndex);
  return nuevoOrden.map((s, i) => ({
    id: s.id,
    sequenceIndex: lugares[i] as number,
    status: reiniciar ? 'pending' : s.status,
  }));
}

/**
 * Las dos tandas de escritura.
 *
 * `unique (plan_id, sequence_index)` no deja intercambiar dos posiciones de a
 * una fila: la primera escritura choca con la otra. Primero todas van a
 * posiciones libres (arriba de la más alta que existe), en el orden nuevo;
 * después bajan a su lugar final, que para entonces ya está libre.
 *
 * Si la segunda tanda falla a mitad de camino, la cola ya quedó en el orden
 * correcto: la primera tanda ordena, la segunda solo compacta.
 */
export function tandasDeEscritura(
  cambios: readonly CambioDeSesion[],
  sesiones: readonly SesionDeCola[],
): readonly [readonly CambioDeSesion[], readonly CambioDeSesion[]] {
  const arriba = Math.max(-1, ...sesiones.map((s) => s.sequenceIndex)) + 1;
  const primera = cambios.map((c, i) => ({ ...c, sequenceIndex: arriba + i }));
  return [primera, cambios];
}
