import { MOVEMENT_LIMITS, type MovementLimit } from '@bh/domain';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { MOVEMENT_LIMIT_LABELS } from '../lib/labels.ts';
import { useDeclareMovements } from '../lib/profile.ts';
import { Button, Card, Chip, Notice } from './ui/index.ts';

/**
 * Los movimientos que el socio no puede hacer (`docs/research/58`): va después de
 * la puerta de lesiones en /salud, y en el perfil para sumar uno.
 *
 * Con `conPuerta`, primero un sí o no; con un sí, los chips. Los que ya están
 * anotados no se ofrecen: volver a mandarlos lo rechaza la base.
 */
export function MovimientosQueNoPuede({
  conPuerta,
  yaDeclarados,
  textoBoton,
  onGuardado,
}: {
  readonly conPuerta: boolean;
  readonly yaDeclarados: readonly MovementLimit[];
  readonly textoBoton: string;
  readonly onGuardado?: () => void;
}) {
  const declarar = useDeclareMovements();
  const [puerta, setPuerta] = useState<boolean | null>(conPuerta ? null : true);
  const [elegidos, setElegidos] = useState<readonly MovementLimit[]>([]);
  const ofrecidos = MOVEMENT_LIMITS.filter((m) => !yaDeclarados.includes(m));
  // Con un "sí" y ninguno marcado no se sabe qué quiso decir.
  const listo = puerta === false || (puerta === true && elegidos.length > 0);

  function alternar(m: MovementLimit) {
    setElegidos((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  async function onGuardar() {
    await declarar.mutateAsync(puerta ? elegidos : []);
    onGuardado?.();
  }

  return (
    <div className="flex flex-col gap-4">
      {conPuerta && (
        <Card>
          <p className="mb-3 text-sm font-medium text-ice">
            ¿Hay algún movimiento que no puedas hacer?
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
      )}

      {puerta === true && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-display text-xs font-semibold uppercase tracking-[0.12em] text-slate">
            ¿Cuáles? Podés marcar más de uno
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {ofrecidos.map((m) => (
              <Chip
                key={m}
                tone="orange"
                selected={elegidos.includes(m)}
                onClick={() => alternar(m)}
              >
                {MOVEMENT_LIMIT_LABELS[m]}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {declarar.isError && (
        <Notice tone="error" role="alert">
          No se pudo guardar. Probá de nuevo.
        </Notice>
      )}

      <Button disabled={!listo || declarar.isPending} onClick={() => void onGuardar()}>
        {declarar.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {textoBoton}
      </Button>
    </div>
  );
}
