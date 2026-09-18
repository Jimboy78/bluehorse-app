/**
 * SUPERSERIE: DOS EJERCICIOS QUE SE ALTERNAN SIN PAUSA
 *
 * `plan_session_items.superset_group` junta los ítems de una misma vuelta: una
 * serie de cada uno, y el descanso recién al cerrar la vuelta. El descanso del
 * primero es 0 a propósito, y mostrarlo como "0s de descanso" se lee como un
 * error de carga, no como "seguí con el otro".
 *
 * Los ítems llegan en orden (`order_index`); la vuelta es el tramo de ítems
 * consecutivos con el mismo grupo.
 */

export interface ItemDeVuelta {
  readonly name: string;
  readonly supersetGroup: number | null;
}

function mismoGrupo(a: ItemDeVuelta | undefined, b: ItemDeVuelta | undefined): boolean {
  return (
    a !== undefined &&
    b !== undefined &&
    a.supersetGroup !== null &&
    a.supersetGroup === b.supersetGroup
  );
}

/** Los otros ejercicios de la vuelta, en orden. Vacío si no va en superserie. */
export function companerosDeVuelta(items: readonly ItemDeVuelta[], index: number): string[] {
  const propio = items[index];
  if (!propio || propio.supersetGroup === null) return [];
  return items.filter((it, i) => i !== index && mismoGrupo(propio, it)).map((it) => it.name);
}

/** El ejercicio que sigue sin pausa, o `null` si con este se cierra la vuelta. */
export function siguienteDeLaVuelta(items: readonly ItemDeVuelta[], index: number): string | null {
  const siguiente = items[index + 1];
  return mismoGrupo(items[index], siguiente) ? (siguiente?.name ?? null) : null;
}

/** El primero de la vuelta, al que se vuelve después del descanso. */
function inicioDeLaVuelta(items: readonly ItemDeVuelta[], index: number): string | null {
  let i = index;
  while (i > 0 && mismoGrupo(items[i], items[i - 1])) i--;
  return i === index ? null : (items[i]?.name ?? null);
}

/**
 * A qué ítem se pasa después de una serie de este: el que sigue en la vuelta,
 * o el primero si con este se cierra. `null` fuera de una superserie.
 */
export function proximoDeLaVuelta(items: readonly ItemDeVuelta[], index: number): number | null {
  if (siguienteDeLaVuelta(items, index) !== null) return index + 1;
  let i = index;
  while (i > 0 && mismoGrupo(items[i], items[i - 1])) i--;
  return i === index ? null : i;
}

/** Lo que la pantalla de un ejercicio necesita saber de su vuelta, o `null`. */
export function superserieDe(
  items: readonly ItemDeVuelta[],
  index: number,
  restSeconds: number,
): {
  readonly companeros: readonly string[];
  readonly siguiente: string | null;
  readonly descanso: string;
} | null {
  const companeros = companerosDeVuelta(items, index);
  if (companeros.length === 0) return null;
  return {
    companeros,
    siguiente: siguienteDeLaVuelta(items, index),
    descanso: textoDelDescanso(items, index, restSeconds),
  };
}

/** "sin descanso, seguí con X", "180s de descanso y volvés a Y", o "90s de descanso". */
export function textoDelDescanso(
  items: readonly ItemDeVuelta[],
  index: number,
  restSeconds: number,
): string {
  const siguiente = siguienteDeLaVuelta(items, index);
  if (siguiente !== null && restSeconds === 0) return `sin descanso, seguí con ${siguiente}`;
  if (siguiente !== null) return `${restSeconds}s y seguí con ${siguiente}`;
  const vuelta = inicioDeLaVuelta(items, index);
  if (restSeconds === 0) return vuelta ? `sin descanso, volvés a ${vuelta}` : 'sin descanso';
  return vuelta
    ? `${restSeconds}s de descanso y volvés a ${vuelta}`
    : `${restSeconds}s de descanso`;
}
