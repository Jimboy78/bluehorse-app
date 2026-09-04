import type { Transition, Variants } from 'motion/react';

/**
 * SISTEMA DE MOVIMIENTO
 *
 * Mismo criterio que el ruleset: ninguna duración ni curva suelta en un
 * componente. Todo sale de acá, así el movimiento de la app se siente como una
 * sola cosa y se puede afinar en un solo lugar.
 *
 * Contexto de uso: alguien parado entre series, con el teléfono en una mano,
 * mirando la pantalla de reojo. Eso manda tres reglas:
 *
 * 1. Rápido. Nadie espera una animación en el gimnasio. El feedback de un toque
 *    vive en 120 ms; una transición de pantalla no pasa de 320 ms.
 * 2. Física, no decorativa. Los resortes comunican peso y confirman que el toque
 *    entró. Las animaciones que solo adornan cansan a la tercera sesión.
 * 3. La celebración es escasa. Si todo festeja, nada festeja: solo los récords.
 */

// ---------------------------------------------------------------- duraciones

export const duration = {
  /** Respuesta a un toque. Por debajo de esto se percibe como instantáneo. */
  instant: 0.12,
  /** Aparición y salida de elementos dentro de una pantalla. */
  quick: 0.2,
  /** Transición entre pantallas. */
  base: 0.32,
  /** Solo para celebrar un récord. */
  celebrate: 0.7,
} as const;

// ---------------------------------------------------------------- curvas

export const ease = {
  /** Exponencial de salida: arranca rápido y frena suave. El default. */
  out: [0.16, 1, 0.3, 1],
  /** Para cosas que entran y salen, como una hoja inferior. */
  inOut: [0.65, 0, 0.35, 1],
} as const;

// ---------------------------------------------------------------- resortes

export const spring = {
  /** Hundido de un botón al tocarlo. Rígido y sin rebote. */
  press: { type: 'spring', stiffness: 600, damping: 30 } satisfies Transition,
  /** Algo que aparece con carácter: un check, un récord. */
  pop: { type: 'spring', stiffness: 400, damping: 22 } satisfies Transition,
  /** Reacomodar la lista cuando una serie se completa. */
  settle: { type: 'spring', stiffness: 260, damping: 26 } satisfies Transition,
} as const;

// ---------------------------------------------------------------- variantes

/** Entrada estándar: sube un poco y aparece. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.quick, ease: ease.out } },
  exit: { opacity: 0, y: -8, transition: { duration: duration.instant } },
};

/**
 * Lista de ejercicios de la sesión. El escalonado es corto a propósito:
 * con 5 ejercicios y 40 ms de separación, la lista termina de entrar en 200 ms.
 */
export const listContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

export const listItem: Variants = fadeUp;

/**
 * Transición entre pantallas, como props directas y no como variantes con
 * nombre. Si la pantalla usara las etiquetas `hidden`/`visible`, pisaría la
 * propagación de las listas escalonadas que viven adentro y los ítems quedarían
 * invisibles. Las etiquetas con nombre se reservan para un solo nivel: la lista.
 */
export const screen = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
  exit: { opacity: 0, y: -12, transition: { duration: duration.quick, ease: ease.out } },
} as const;

/** El check de una serie completada. */
export const checkPop: Variants = {
  hidden: { scale: 0.4, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: spring.pop },
};

// ---------------------------------------------------------------- táctil

/** Props de toque para cualquier control. El hundido confirma que el dedo entró. */
export const tappable = {
  whileTap: { scale: 0.97 },
  transition: spring.press,
} as const;

/**
 * Vibración corta. En el gimnasio, con música fuerte y sin mirar la pantalla,
 * es el único feedback que se percibe seguro.
 *
 * Silenciosa si el dispositivo no la soporta (todos los iPhone, entre otros).
 */
export function haptic(pattern: number | readonly number[] = 12): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(typeof pattern === 'number' ? pattern : [...pattern]);
  }
}

export const hapticPattern = {
  setDone: 12,
  timerFinished: [80, 60, 80],
  personalRecord: [40, 40, 40, 40, 120],
} as const;
