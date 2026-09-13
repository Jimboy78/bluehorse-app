import type { Equipment, Exercise } from '@bh/domain';
import { loadUnitLabel } from '@bh/domain';
import { Loader2, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { buscarEjercicios, type MotivoCoincidencia } from '../lib/buscar-ejercicios.ts';
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

/**
 * Lo que se le dice al socio cuando el resultado no coincide con lo que escribió.
 *
 * Las tres primeras capas de `buscarEjercicios` matchean contra el nombre, así
 * que explicarlas sería repetir el chip que está al lado. Las otras cinco sí
 * necesitan una línea: sin ella, alguien que escribe "patada de burro" y recibe
 * "Patada de glúteo en máquina" no sabe si la app entendió o le cambió el pedido.
 *
 * No son números de entrenamiento, así que no van al ruleset (regla dura 3): es
 * cómo se le explica al socio una coincidencia de texto.
 */
const EXPLICACION: Partial<Record<MotivoCoincidencia, string>> = {
  palabras: 'Estas tienen todas las palabras que escribiste.',
  sinonimo: 'Por cómo se llama acá: lo de arriba es lo mismo que pediste.',
  musculo: 'No hay un ejercicio con ese nombre; estos son los de ese músculo.',
  patron: 'No hay un ejercicio con ese nombre; estos son los de ese movimiento.',
  parecido: 'Ninguno se llama así exactamente. Estos se escriben parecido.',
  regex: 'Lo tomamos como una expresión regular.',
};

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

  /**
   * BUSCAR POR COMO LA GENTE LO LLAMA, NO POR COMO LO ESCRIBIMOS NOSOTROS
   *
   * Era `e.name.toLowerCase().includes(q)`. Medido contra el catálogo real, de
   * 15 consultas que un socio escribe en el celular **14 devolvían cero**: basta
   * una tilde. El gimnasio tiene "Curl de bíceps" y quien escribe "biceps" veía
   * "Ninguno con ese nombre", o sea que la app le decía que acá no hay nada de
   * bíceps. Y fallaban también "cuadriceps", "triceps", "maquina", "gluteo",
   * "salto al cajon" — 19 de los 58 nombres llevan tilde o ñ.
   *
   * `buscarEjercicios` ya existía, con 8 capas, la tabla de sinónimos y 78
   * tests, y no estaba conectado a ninguna pantalla: su propio docblock describe
   * este bug —"un `includes()` encuentra el primero y ninguno de los otros
   * cuatro, y quien busca concluye que el gimnasio no lo tiene"— mientras el
   * único buscador de la app era ese `includes()`.
   */
  const candidatos = useMemo(() => {
    const q = busqueda.trim();
    // Se muestra un puñado: la lista completa son decenas de estaciones y el
    // formulario quedaría abajo del pliegue en un teléfono.
    if (!q) return exercises.slice(0, 12).map((exercise) => ({ exercise, motivo: null }));
    return buscarEjercicios(q, exercises)
      .slice(0, 12)
      .map((c) => ({ exercise: c.exercise, motivo: c.motivo }));
  }, [exercises, busqueda]);

  /**
   * Por qué le ofrecemos esto, cuando no es obvio.
   *
   * Las tres primeras capas coinciden con el nombre, así que decirlo sería
   * repetir lo que ya se lee en el chip. Las otras no: alguien que escribió
   * "patada de burro" y ve "Patada de glúteo en máquina" merece saber que
   * entró por un sinónimo y no que la app le cambió el pedido. El dato ya
   * venía en `Coincidencia.detalle`, declarado "para poder decirlo en
   * pantalla", y nadie lo decía.
   */
  const porQue = useMemo(() => {
    const motivo = candidatos[0]?.motivo;
    if (motivo === null || motivo === undefined) return null;
    return EXPLICACION[motivo] ?? null;
  }, [candidatos]);

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
          {candidatos.map(({ exercise: ex }) => (
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
            <span className="py-1 text-xs text-slate">
              No encontramos nada así en el gimnasio. Probá con el músculo: "pecho", "pierna".
            </span>
          )}
        </div>
      </div>

      {porQue && <p className="text-xs leading-snug text-slate">{porQue}</p>}

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
