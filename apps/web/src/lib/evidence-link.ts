import type { Goal } from '@bh/domain';
import { GOALS } from '@bh/domain';

/**
 * LLEGAR A LA EVIDENCIA CON UN OBJETIVO PUESTO
 *
 * El aviso que "Hoy" muestra arriba del plan trae la nota de confianza del
 * objetivo, y va plegado porque abierto se come casi la mitad de la pantalla
 * de un teléfono. El lugar donde esa nota respira, con los papers debajo, es
 * `/evidencia?objetivo=<goal>`.
 *
 * Estas dos funciones son lo único de esa pantalla que se puede probar solo:
 * la ruta arrastra `AppShell`, y con él el registro del service worker, que en
 * los tests no existe.
 */

/**
 * El objetivo al que apunta la dirección, si es uno que el ruleset conoce.
 *
 * Se valida contra el enum en vez de confiar en el parámetro: la dirección la
 * puede escribir cualquiera, y `?objetivo=fuerza-bruta` no puede terminar
 * buscando un bloque de prescripción que no existe.
 */
export function objetivoDeLaUrl(crudo: string | null): Goal | null {
  return crudo && (GOALS as readonly string[]).includes(crudo) ? (crudo as Goal) : null;
}

/**
 * En qué orden se listan los objetivos. El que vino en la dirección va
 * primero; el resto conserva el orden del enum, que es el mismo que ve el
 * socio en el onboarding.
 *
 * **Reordenar y no desplazar la pantalla.** El primer intento fue un
 * `scrollIntoView` en un efecto, y no funcionó: medido, la página quedaba en
 * `scrollY` 0 con la tarjeta de cardio a 718 px del borde —abajo del pliegue
 * de cualquier teléfono—, porque el desplazamiento compite con la restauración
 * de scroll de la navegación. La misma llamada desde la consola, con la
 * pantalla ya quieta, sí funciona: o sea que es una carrera, y ganarla
 * dependería de adivinar cuándo. Esto no depende de cuándo corra.
 */
export function ordenDeObjetivos(destacado: Goal | null): readonly Goal[] {
  return destacado ? [destacado, ...GOALS.filter((g) => g !== destacado)] : GOALS;
}
