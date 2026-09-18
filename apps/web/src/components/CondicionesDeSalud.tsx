import type { HealthCondition, Sex } from '@bh/domain';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { gruposPara, useSaveHealthConditions } from '../lib/health-conditions.ts';
import { Button, Card, Chip, Notice } from './ui/index.ts';

/**
 * La puerta de salud y la lista que abre (`docs/research/43`).
 *
 * Primero una sola pregunta de sí o no: la mayoría contesta que no y sigue, sin
 * leer veinte opciones que no le tocan. Recién con un sí aparece la lista, por
 * grupos. Lo marcado cambia cómo entrena, no si puede: eso ya lo decidió el
 * cribado.
 */
export function CondicionesDeSalud({
  inicial,
  sex,
  textoBoton,
  onGuardado,
}: {
  readonly inicial: readonly HealthCondition[];
  readonly sex: Sex | null;
  readonly textoBoton: string;
  readonly onGuardado?: (guardadas: readonly HealthCondition[]) => void;
}) {
  const guardar = useSaveHealthConditions();
  const [puerta, setPuerta] = useState<boolean | null>(inicial.length > 0 ? true : null);
  const [elegidas, setElegidas] = useState<readonly HealthCondition[]>(inicial);

  const alternar = (id: HealthCondition) =>
    setElegidas((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  // Con un "sí" y nada marcado no se sabe qué quiso decir: se pide que marque o
  // que conteste que no.
  const listo = puerta === false || (puerta === true && elegidas.length > 0);

  async function onGuardar() {
    const guardadas = await guardar.mutateAsync(puerta ? elegidas : []);
    onGuardado?.(guardadas);
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="mb-3 text-sm font-medium text-ice">
          ¿Tenés algún problema de salud o tomás alguna medicación?
        </p>
        <div className="flex gap-2">
          <Chip className="flex-1" selected={puerta === false} onClick={() => setPuerta(false)}>
            No
          </Chip>
          <Chip className="flex-1" selected={puerta === true} onClick={() => setPuerta(true)}>
            Sí
          </Chip>
        </div>
      </Card>

      {puerta === true && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate">
            Marcá lo que tengas. Con esto el plan cambia cómo entrenás: qué evitar, cómo respirar,
            cómo terminar la sesión.
          </p>
          {gruposPara(sex).map((grupo) => (
            <fieldset key={grupo.titulo} className="flex flex-col gap-2">
              <legend className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate">
                {grupo.titulo}
              </legend>
              <div className="flex flex-wrap gap-2">
                {grupo.opciones.map((o) => (
                  <Chip
                    key={o.id}
                    selected={elegidas.includes(o.id)}
                    onClick={() => alternar(o.id)}
                  >
                    {o.texto}
                  </Chip>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}

      {guardar.isError && (
        <Notice tone="error" role="alert">
          No se pudo guardar. Probá de nuevo.
        </Notice>
      )}

      <Button disabled={!listo || guardar.isPending} onClick={() => void onGuardar()}>
        {guardar.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {textoBoton}
      </Button>
    </div>
  );
}
