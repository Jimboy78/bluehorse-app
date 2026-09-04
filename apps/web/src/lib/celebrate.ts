import confetti from 'canvas-confetti';
import { haptic, hapticPattern } from './motion.ts';

/**
 * Celebración de récord personal.
 *
 * Se usa SOLO cuando el motor detecta un récord real. Si celebra cualquier cosa,
 * deja de significar algo y molesta a la tercera sesión.
 *
 * Los colores son los del logo de Blue Horse, no los genéricos de la librería.
 */

const BLUE_HORSE_COLORS = ['#2ec4b6', '#f2622e', '#f0a03c', '#eaf0f8'];

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
