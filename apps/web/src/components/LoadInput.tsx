import type { EquipmentLoadSpec, LoadReading } from '@bh/domain';
import { loadUnitLabel, snapToEquipment, stepLoad } from '@bh/domain';
import { Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { tappable } from '../lib/motion.ts';

/**
 * ANOTAR LA CARGA QUE DICE LA MÁQUINA
 *
 * Un solo control para los dos momentos en que se toca la carga: antes de la
 * serie (dejar anotado con cuánto se va a trabajar) y durante el descanso
 * (corregir lo que salió de verdad).
 *
 * Antes esto vivía suelto adentro del cronómetro y estaba escondido detrás de
 * `canStep`: si la estación no tiene `load_increment` cargado en el catálogo,
 * `stepLoad()` devuelve `null` y el bloque entero no se renderizaba. Como en
 * las 58 estaciones reales de Blue Horse ese campo está en `null` (falta
 * medirlo in situ, ver docs/ESTADO.md), en la práctica el socio no tenía
 * ninguna forma de anotar el peso en nada que no fuera una selectorizada — y
 * todas las series le quedaban en "sin carga previa" para siempre.
 *
 * Escalonar y escribir son dos capacidades distintas: los botones +/- SÍ
 * necesitan saber de cuánto es el escalón, escribir un número no. Así que las
 * flechas se muestran solo si hay escalón, y el campo siempre.
 *
 * No aplica a lo que no lleva peso: peso corporal y estaciones sin carga
 * (una colchoneta) no tienen nada que anotar, y pedir un número ahí sería
 * inventarlo.
 */

/** `true` si en esta estación hay una carga real para anotar. */
export function carriesLoad(spec: EquipmentLoadSpec | null): boolean {
  if (!spec) return false;
  return spec.unit !== 'none' && spec.unit !== 'bodyweight';
}

export function LoadInput({
  load,
  loadSpec,
  onLoad,
  ariaLabel,
}: {
  readonly load: LoadReading | null;
  readonly loadSpec: EquipmentLoadSpec | null;
  readonly onLoad: (load: LoadReading | null) => void;
  readonly ariaLabel: string;
}) {
  if (!carriesLoad(loadSpec) || !loadSpec) return null;

  // Escalonar necesita el escalón de esta estación. Sin catálogo medido no se
  // puede, y no se inventa un paso — pero el campo de texto sigue estando.
  const canStep = stepLoad(load?.value ?? null, loadSpec, 1) !== null;

  function step(direction: 1 | -1) {
    if (!loadSpec) return;
    const value = stepLoad(load?.value ?? null, loadSpec, direction);
    if (value === null) return;
    onLoad({ value, unit: loadSpec.unit });
  }

  return (
    <div className="flex items-center gap-1.5">
      {canStep && (
        <Stepper label="Bajar un escalón" onClick={() => step(-1)}>
          <Minus size={15} aria-hidden="true" />
        </Stepper>
      )}
      {/* Editable, no solo escalonable: en la primera sesión no hay baseline y
          llegar a 60 kg de a 2,5 son veinticuatro toques. */}
      <input
        type="number"
        inputMode="decimal"
        aria-label={ariaLabel}
        placeholder="—"
        value={load?.value ?? ''}
        step={loadSpec.increment ?? undefined}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') return onLoad(null);
          const value = Number(raw);
          if (Number.isNaN(value)) return;
          onLoad({ value, unit: loadSpec.unit });
        }}
        onBlur={() => {
          // Recién al salir se ajusta al escalón real: mientras tipea,
          // corregirle el número debajo del dedo es peor que dejarlo.
          if (load?.value == null) return;
          onLoad({ value: snapToEquipment(load.value, loadSpec), unit: loadSpec.unit });
        }}
        className="w-16 rounded-lg border border-line bg-surface-2 py-1.5 text-center font-display text-lg font-semibold tabular-nums outline-none transition-colors focus:border-brand"
      />
      <span className="min-w-7 font-mono text-xs text-slate-dim">
        {loadUnitLabel(loadSpec.unit)}
      </span>
      {canStep && (
        <Stepper label="Subir un escalón" onClick={() => step(1)}>
          <Plus size={15} aria-hidden="true" />
        </Stepper>
      )}
    </div>
  );
}

function Stepper({
  label,
  onClick,
  children,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      {...tappable}
      aria-label={label}
      onClick={onClick}
      className="grid size-10 place-items-center rounded-xl border border-line bg-surface-2 text-slate transition-colors hover:border-brand hover:text-brand"
    >
      {children}
    </motion.button>
  );
}
