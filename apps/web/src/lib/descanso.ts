import { loadUnitSchema } from '@bh/domain';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import type { SetActual } from './mappers/session-log.ts';
import type { ActiveSessionItem } from './plan.ts';

/**
 * EL DESCANSO EN CURSO, FUERA DE LA PANTALLA DEL EJERCICIO
 *
 * Una serie se registra recién cuando termina su descanso: ahí se sabe cuánto
 * se descansó y se anotaron repeticiones, reserva y carga. Hasta ahora ese
 * descanso vivía adentro de la pantalla del ejercicio, y "Volver a la sesión"
 * lo cancelaba: la serie quedaba tildada en pantalla y **no se registraba
 * nunca**. Justo en la última serie de un ejercicio, que es cuando uno vuelve
 * a la lista a ver qué máquina sigue.
 *
 * Ahora el descanso es de la sesión, no de la pantalla: sigue corriendo al
 * volver a la lista o al abrir otro ejercicio, y se guarda en `localStorage`
 * para sobrevivir a cambiar de pestaña o a que el teléfono mate la app. Es
 * estado de la pantalla en curso, no un dato del socio: lo que llega a la base
 * sigue siendo el `set_log`, cuando el descanso termina.
 */
export interface DescansoEnCurso {
  readonly planSessionId: string;
  /** El ítem ya con la sustitución aplicada: es con lo que se registra la serie. */
  readonly item: ActiveSessionItem;
  readonly setIndex: number;
  /** Cuándo se tocó "listo", en milisegundos desde epoch. */
  readonly startedAt: number;
  readonly prescribedSeconds: number;
  /** Lo que se lleva anotado de la serie: arranca en lo del plan. */
  readonly actual: SetActual;
}

const loadSchema = z.object({ value: z.number().nullable(), unit: loadUnitSchema }).nullable();

// El ítem no se revalida campo por campo: lo escribió esta misma app en este
// mismo teléfono. Se chequea lo que el registro usa para identificar la serie.
const descansoSchema = z.object({
  planSessionId: z.string(),
  item: z
    .object({
      id: z.string(),
      exerciseId: z.string(),
      sets: z.number(),
      restSeconds: z.number(),
    })
    .passthrough(),
  setIndex: z.number().int().nonnegative(),
  startedAt: z.number(),
  prescribedSeconds: z.number().nonnegative(),
  actual: z.object({
    reps: z.number(),
    rir: z.number().nullable(),
    load: loadSchema,
    durationSeconds: z.number().nullable(),
  }),
});

function clave(userId: string): string {
  return `bh.descanso.${userId}`;
}

/** El descanso guardado de esta sesión, o `null`. Uno de otra sesión se descarta. */
export function leerDescanso(userId: string, planSessionId: string): DescansoEnCurso | null {
  try {
    const crudo = localStorage.getItem(clave(userId));
    if (!crudo) return null;
    const parsed = descansoSchema.safeParse(JSON.parse(crudo));
    if (!parsed.success || parsed.data.planSessionId !== planSessionId) return null;
    return parsed.data as unknown as DescansoEnCurso;
  } catch {
    return null;
  }
}

export function guardarDescanso(userId: string, descanso: DescansoEnCurso | null): void {
  try {
    if (descanso) localStorage.setItem(clave(userId), JSON.stringify(descanso));
    else localStorage.removeItem(clave(userId));
  } catch {
    // Sin almacenamiento el descanso dura lo que dura la pantalla: igual que antes.
  }
}

/** Cuándo termina, en milisegundos desde epoch. */
export function finDelDescanso(
  d: Pick<DescansoEnCurso, 'startedAt' | 'prescribedSeconds'>,
): number {
  return d.startedAt + d.prescribedSeconds * 1000;
}

/**
 * Cuánto se descansó de verdad, hasta `ahora`. Nunca más que lo prescripto:
 * pasado el cero la serie se registra sola, así que lo que sobre es tiempo en
 * que el socio ya estaba en otra cosa, no descanso.
 */
export function segundosDescansados(
  d: Pick<DescansoEnCurso, 'startedAt' | 'prescribedSeconds'>,
  ahora: number,
): number {
  const pasados = Math.max(0, Math.round((ahora - d.startedAt) / 1000));
  return Math.min(d.prescribedSeconds, pasados);
}

/**
 * Los segundos que faltan hasta `finAt`, contra el reloj y no contra los ticks
 * del intervalo: el navegador frena los timers de una pestaña oculta, y con la
 * pantalla bloqueada un rato el contador por ticks se atrasa.
 */
export function useCuentaRegresiva(finAt: number): number {
  const calcular = () => Math.max(0, Math.ceil((finAt - Date.now()) / 1000));
  const [restante, setRestante] = useState(calcular);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `calcular` solo depende de `finAt`.
  useEffect(() => {
    function tick() {
      setRestante(calcular());
    }
    tick();
    function onVisible() {
      if (document.visibilityState === 'visible') tick();
    }
    document.addEventListener('visibilitychange', onVisible);
    const id = setInterval(tick, 1000);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [finAt]);

  return restante;
}

/**
 * El primer ejercicio de la sesión al que le faltan series, sin contar
 * `excluirId`. Es el mismo criterio que "empezá por acá" en la lista.
 */
export function proximoPendiente<T extends { readonly id: string; readonly sets: number }>(
  items: readonly T[],
  hechasPorItem: Readonly<Record<string, readonly number[]>>,
  excluirId: string,
): T | null {
  return (
    items.find((i) => i.id !== excluirId && (hechasPorItem[i.id] ?? []).length < i.sets) ?? null
  );
}

/**
 * El descanso de la sesión: en pantalla y en el almacenamiento, siempre juntos.
 *
 * `registrar` escribe la serie (la carga en pantalla y el `set_log`). Se llama
 * una vez por descanso aunque la cuenta llegue a cero en dos lugares —el
 * cronómetro y la barra de la lista— o se corte al arrancar otra serie.
 */
export function useDescansoDeLaSesion(
  userId: string | undefined,
  registrar: (d: DescansoEnCurso, actualSeconds: number, actual: SetActual) => Promise<void>,
) {
  const [descanso, setEnPantalla] = useState<DescansoEnCurso | null>(null);
  const terminadoRef = useRef<number | null>(null);

  function poner(proximo: DescansoEnCurso | null) {
    setEnPantalla(proximo);
    if (userId) guardarDescanso(userId, proximo);
  }

  /** Registra la serie con lo que se anotó, o con `actual` si viene del cronómetro. */
  async function terminar(actualSeconds: number, actual?: SetActual): Promise<void> {
    const d = descanso;
    if (!d || terminadoRef.current === d.startedAt) return;
    terminadoRef.current = d.startedAt;
    poner(null);
    await registrar(d, actualSeconds, actual ?? d.actual);
  }

  return {
    descanso,
    arrancar: poner,
    terminar,
    /** Lo que quedó corriendo al salir de "Hoy", para esta sesión. */
    restaurar(planSessionId: string): DescansoEnCurso | null {
      const pendiente = userId ? leerDescanso(userId, planSessionId) : null;
      setEnPantalla(pendiente);
      return pendiente;
    },
    /** Cortarlo antes (otra serie, cerrar la sesión): cuenta lo que duró de verdad. */
    async cortar(): Promise<void> {
      if (descanso) await terminar(segundosDescansados(descanso, Date.now()));
    },
    anotar(actual: SetActual) {
      if (descanso) poner({ ...descanso, actual });
    },
    /** Destildar la serie que está descansando: se descarta sin registrar. */
    descartarSiEs(itemId: string, setIndex: number) {
      if (descanso?.item.id === itemId && descanso.setIndex === setIndex) poner(null);
    },
  };
}
