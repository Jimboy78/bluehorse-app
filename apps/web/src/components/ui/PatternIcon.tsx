import type { MovementPattern, MuscleGroup } from '@bh/domain';
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightFromLine,
  ArrowUpFromLine,
  ChevronsDown,
  Footprints,
  HeartPulse,
  type LucideIcon,
  Shield,
  Target,
  Weight,
} from 'lucide-react';

/**
 * UN ÍCONO POR PATRÓN DE MOVIMIENTO
 *
 * Antes las cinco filas de la sesión llevaban la misma mancuerna. Un ícono que
 * es igual en todas las filas no informa nada: ocupa 44 px y solo sirve de
 * ancla visual. Peor todavía en el gimnasio, donde la lista se mira de reojo
 * para encontrar "el de piernas" sin leer.
 *
 * El criterio es la dirección de la carga, no el músculo: en un empuje la
 * carga se aleja del cuerpo, en un tirón viene hacia vos. Es lo único que se
 * lee a 18 px, y es lo mismo que distingue los patrones entre sí. Las piernas
 * y el cardio se van del esquema porque son categorías, no direcciones — y
 * son justo las dos que la gente busca primero.
 *
 * No es decoración: el ícono sale de `exercises.movement_pattern`, que es un
 * dato del catálogo. Si un ejercicio no lo trae, cae en el genérico.
 */

const PATTERN_ICONS: Record<MovementPattern, LucideIcon> = {
  squat: ChevronsDown,
  hinge: Footprints,
  lunge: Footprints,
  horizontal_push: ArrowRightFromLine,
  horizontal_pull: ArrowLeftToLine,
  vertical_push: ArrowUpFromLine,
  vertical_pull: ArrowDownToLine,
  carry: Weight,
  core: Shield,
  isolation: Target,
  cardio: HeartPulse,
};

export const PATTERN_LABELS: Record<MovementPattern, string> = {
  squat: 'Sentadilla',
  hinge: 'Bisagra de cadera',
  lunge: 'Zancada',
  horizontal_push: 'Empuje horizontal',
  horizontal_pull: 'Tirón horizontal',
  vertical_push: 'Empuje vertical',
  vertical_pull: 'Tirón vertical',
  carry: 'Traslado',
  core: 'Zona media',
  isolation: 'Aislamiento',
  cardio: 'Cardio',
};

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  quads: 'cuádriceps',
  hamstrings: 'isquios',
  glutes: 'glúteos',
  calves: 'gemelos',
  chest: 'pecho',
  back: 'espalda',
  lats: 'dorsales',
  traps: 'trapecios',
  front_delts: 'hombro frontal',
  side_delts: 'hombro lateral',
  rear_delts: 'hombro posterior',
  biceps: 'bíceps',
  triceps: 'tríceps',
  forearms: 'antebrazos',
  abs: 'abdominales',
  obliques: 'oblicuos',
  lower_back: 'lumbares',
  full_body: 'cuerpo completo',
};

export function PatternIcon({
  pattern,
  size = 19,
  className = '',
}: {
  readonly pattern: MovementPattern;
  readonly size?: number;
  readonly className?: string;
}) {
  const Icon = PATTERN_ICONS[pattern] ?? Target;
  return <Icon size={size} className={className} aria-hidden="true" />;
}

/** "pecho y tríceps", "cuádriceps". Para la línea de abajo de una fila. */
export function muscleSummary(muscles: readonly MuscleGroup[], max = 2): string {
  const names = muscles.slice(0, max).map((m) => MUSCLE_LABELS[m] ?? m);
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`;
}
