import confetti from 'canvas-confetti';
import { haptic, hapticPattern } from './motion.ts';

/**
 * Celebración de récord personal.
 *
 * Se usa SOLO cuando el motor detecta un récord real. Si celebra cualquier cosa,
 * deja de significar algo y molesta a la tercera sesión.
 *
 * Los colores son los del degradé de la marca (`styles.css`), copiados a mano
 * porque `canvas-confetti` pinta en un `<canvas>` y no puede leer una
 * variable CSS. Antes eran cuatro colores inventados que no salían de ningún
 * lado del sistema — incluían un turquesa que no aparece en ninguna otra
 * parte de la app — y el comentario decía "son los del logo" sin que fuera
 * cierto. El ámbar y el naranja quedan afuera a propósito: son semánticos
 * (provisorio, esfuerzo, error), no decorativos, y festejar con el color que
 * en el resto de la app significa "ojo con esto" sería confuso.
 */

const BLUE_HORSE_COLORS = ['#abe6f8', '#6fb4ef', '#82a9ec', '#3f7fc4', '#eef3fb'];

export function celebratePersonalRecord(): void {
  haptic(hapticPattern.personalRecord);

  // Respetar a quien pidió menos movimiento: la vibración y el cartel alcanzan.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const defaults = {
    colors: BLUE_HORSE_COLORS,
    disableForReducedMotion: true,
    scalar: 0.9,
  };

  // Dos ráfagas desde abajo: el récord "sube", no cae sobre el usuario.
  confetti({
    ...defaults,
    particleCount: 45,
    spread: 60,
    startVelocity: 45,
    origin: { x: 0.25, y: 1 },
    angle: 65,
  });

  confetti({
    ...defaults,
    particleCount: 45,
    spread: 60,
    startVelocity: 45,
    origin: { x: 0.75, y: 1 },
    angle: 115,
  });
}
