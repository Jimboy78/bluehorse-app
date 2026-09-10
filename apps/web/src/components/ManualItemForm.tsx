import type { Equipment, Exercise } from '@bh/domain';
import { loadUnitLabel } from '@bh/domain';
import { Loader2, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import type { ManualItemDraft } from '../lib/mappers/manual-plan.ts';
import { Button, Chip, Field, fieldClass, Notice } from './ui/index.ts';

/**
 * CARGAR UN EJERCICIO A MANO
 *
 * Todos los campos arrancan **vacíos**. Es deliberado y es la decisión más
 * importante de esta pantalla: cualquier valor sugerido acá —"4 series", "90
 * segundos"— sería un número de entrenamiento naciendo en el código, sin fila
 * de investigación detrás (regla dura 3). Si la persona quiere que la app
 * decida los números, el camino es el motor, que está a un botón de acá.
 *
 * La unidad de la carga **no se elige**: sale de la estación. Cada máquina de
 * Blue Horse se lee en lo suyo —kg, libras, nivel de pin— y dejar elegir la
 * unidad permitiría escribir "60 kg" en una máquina que muestra libras (regla
 * dura 6). Sin estación elegida no hay unidad, así que no hay campo de carga.
 */

/** Un campo numérico vacío es `null`, no cero: "no lo puse" y "puse cero" no son lo mismo. */
function parseNum(raw: string): number | null {
  const limpio = raw.trim();
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

interface Numeros {
  readonly sets: string;
  readonly repsMin: string;
  readonly repsMax: string;
  readonly rest: string;
  readonly load: string;
  readonly rir: string;
}

const VACIO: Numeros = { sets: '', repsMin: '', repsMax: '', rest: '', load: '', rir: '' };

export function ManualItemForm({
  exercises,
  equipment,
  onAdd,
  onCancel,
  pending,
  error,
}: {
  readonly exercises: readonly Exercise[];
  readonly equipment: readonly Equipment[];
  readonly onAdd: (draft: ManualItemDraft) => void;
  readonly onCancel: () => void;
  readonly pending: boolean;
  readonly error: boolean;
}) {
  const baseId = useId();
  const [busqueda, setBusqueda] = useState('');
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [equipmentId, setEquipmentId] = useState<string | null>(null);
  const [n, setN] = useState<Numeros>(VACIO);

  const elegido = exercises.find((e) => e.id === exerciseId) ?? null;

  const candidatos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrados = q ? exercises.filter((e) => e.name.toLowerCase().includes(q)) : exercises;
    // Se muestra un puñado: la lista completa son decenas de estaciones y el
    // formulario quedaría abajo del pliegue en un teléfono.
    return filtrados.slice(0, 12);
  }, [exercises, busqueda]);

  /** Las estaciones donde se puede hacer el ejercicio elegido, y ninguna más. */
  const estaciones = useMemo(() => {
    if (!elegido) return [];
    const ids = new Set(elegido.equipmentIds);
    return equipment.filter((e) => ids.has(e.id));
  }, [elegido, equipment]);

  const estacion = estaciones.find((e) => e.id === equipmentId) ?? null;
  /**
   * Hay estaciones donde no hay número que escribir: el peso corporal y las
   * que no llevan carga (colchoneta, TRX). Ahí el campo no se muestra — un
   * input vacío que no se puede completar es peor que no tenerlo.
   */
  const cargaEditable =
    estacion !== null && estacion.load.unit !== 'bodyweight' && estacion.load.unit !== 'none';

  const sets = parseNum(n.sets);
  const repsMin = parseNum(n.repsMin);
  const repsMax = parseNum(n.repsMax);
  const rest = parseNum(n.rest);
  const completo =
    !!exerciseId && sets !== null && repsMin !== null && repsMax !== null && rest !== null;

  function agregar() {
    if (!completo || !exerciseId) return;
    const valorCarga = parseNum(n.load);
    onAdd({
      exerciseId,
      equipmentId,
      targetSets: sets,
      targetRepsMin: repsMin,
      targetRepsMax: repsMax,
      restSeconds: rest,
      // Sin estación no hay unidad en la que leer el número, así que no se
      // guarda carga: un valor sin unidad no se puede mostrar ni convertir.
      targetLoad:
        cargaEditable && estacion && valorCarga !== null
          ? { value: valorCarga, unit: estacion.load.unit }
          : null,
      targetRir: parseNum(n.rir),
    });
    setN(VACIO);
    setExerciseId(null);
    setEquipmentId(null);
    setBusqueda('');
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-line/70 bg-navy p-3.5">
      <Field label="Ejercicio" htmlFor={`${baseId}-buscar`} icon={<Search size={12} />}>
        <input
          id={`${baseId}-buscar`}
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar en el gimnasio"
          className={fieldClass}
        />
      </Field>

      <div className="-mx-3.5 overflow-x-auto px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5 pb-1">
          {candidatos.map((ex) => (
            <Chip
              key={ex.id}
              selected={exerciseId === ex.id}
              onClick={() => {
                setExerciseId(ex.id);
                // La estación anterior puede no existir en el ejercicio nuevo:
                // dejarla puesta guardaría un press en una bicicleta.
                setEquipmentId(null);
              }}
            >
              {ex.name}
            </Chip>
          ))}
          {candidatos.length === 0 && (
            <span className="py-1 text-xs text-slate">Ninguno con ese nombre.</span>
          )}
        </div>
      </div>

      {elegido && estaciones.length > 0 && (
        <Field
          label="Estación"
          htmlFor={`${baseId}-eq`}
          hint="De acá sale la unidad en la que se lee la carga."
        >
          <select
            id={`${baseId}-eq`}
            value={equipmentId ?? ''}
            onChange={(e) => setEquipmentId(e.target.value || null)}
            className={fieldClass}
          >
            <option value="">Sin estación fija</option>
            {estaciones.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Series" htmlFor={`${baseId}-sets`}>
          <input
            id={`${baseId}-sets`}
            type="number"
            inputMode="numeric"
            min={1}
            value={n.sets}
            onChange={(e) => setN({ ...n, sets: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Descanso (seg)" htmlFor={`${baseId}-rest`}>
          <input
            id={`${baseId}-rest`}
            type="number"
            inputMode="numeric"
            min={0}
            value={n.rest}
            onChange={(e) => setN({ ...n, rest: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Reps desde" htmlFor={`${baseId}-rmin`}>
          <input
            id={`${baseId}-rmin`}
            type="number"
            inputMode="numeric"
            min={1}
            value={n.repsMin}
            onChange={(e) => setN({ ...n, repsMin: e.target.value })}
            className={fieldClass}
          />
        </Field>
        <Field label="Reps hasta" htmlFor={`${baseId}-rmax`}>
          <input
            id={`${baseId}-rmax`}
            type="number"
            inputMode="numeric"
            min={1}
            value={n.repsMax}
            onChange={(e) => setN({ ...n, repsMax: e.target.value })}
            className={fieldClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cargaEditable && estacion && (
          <Field
            label={`Carga (${loadUnitLabel(estacion.load.unit)})`}
            htmlFor={`${baseId}-load`}
            hint="Opcional. Se guarda como lo dice la máquina."
          >
            <input
              id={`${baseId}-load`}
              type="number"
              inputMode="decimal"
              step="any"
              value={n.load}
              onChange={(e) => setN({ ...n, load: e.target.value })}
              className={fieldClass}
            />
          </Field>
        )}
        <Field label="RIR" htmlFor={`${baseId}-rir`} hint="Opcional.">
          <input
            id={`${baseId}-rir`}
            type="number"
            inputMode="numeric"
            min={0}
            max={10}
            value={n.rir}
            onChange={(e) => setN({ ...n, rir: e.target.value })}
            className={fieldClass}
          />
        </Field>
      </div>

      {error && (
        <Notice tone="error" role="alert">
          No se pudo agregar el ejercicio. Probá de nuevo.
        </Notice>
      )}

      <div className="flex gap-2">
        <Button variant="quiet" size="md" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          disabled={!completo || pending}
          onClick={agregar}
        >
          {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          Agregar
        </Button>
      </div>
    </div>
  );
}
