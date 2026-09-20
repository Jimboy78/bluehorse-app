import type { SecondaryGoal } from '@bh/domain';
import { Check, Plus } from 'lucide-react';
import { alternarSecundario, SECUNDARIOS } from '../lib/objetivos.ts';
import { OptionCard } from './ui/index.ts';

/**
 * "Además, ¿querés…?" (`docs/research/68`). Lo usan el onboarding y Perfil.
 *
 * Se eligen en orden: el primero es el que más importa, y cuando hay más de
 * uno se ve el número. Nada de esto le saca al objetivo principal: se suma
 * con el tiempo que sobra.
 */
export function ObjetivosSecundarios({
  value,
  onChange,
}: {
  readonly value: readonly SecondaryGoal[];
  readonly onChange: (v: SecondaryGoal[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold text-ink">Además, ¿querés…? (opcional)</legend>
      {SECUNDARIOS.map((s) => {
        const orden = value.indexOf(s.id);
        const marcado = orden >= 0;
        return (
          <OptionCard
            key={s.id}
            selected={marcado}
            onClick={() => onChange(alternarSecundario(value, s.id))}
            icon={
              marcado ? (
                value.length > 1 ? (
                  <span className="text-sm font-semibold tabular-nums">{orden + 1}</span>
                ) : (
                  <Check size={18} aria-hidden="true" />
                )
              ) : (
                <Plus size={18} aria-hidden="true" />
              )
            }
            title={s.label}
            hint={s.hint}
          />
        );
      })}
    </fieldset>
  );
}
