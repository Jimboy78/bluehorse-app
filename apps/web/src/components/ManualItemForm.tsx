import type { Equipment, Exercise, LoadUnit } from '@bh/domain';
import { loadUnitLabel } from '@bh/domain';
import { Loader2, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { buscarEjercicios, type MotivoCoincidencia } from '../lib/buscar-ejercicios.ts';
import { activeRuleset } from '../lib/engine.ts';
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
 *
 * Tres formas de escribir un ejercicio, las tres de la rutina de un socio
 * real: series y repeticiones, "al fallo técnico" y cardio por minutos y zona.
 * La carga, en la unidad de la máquina o como porcentaje del máximo.
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

export interface Numeros {
  readonly sets: string;
  readonly repsMin: string;
  readonly repsMax: string;
  readonly rest: string;
  readonly load: string;
  readonly rir: string;
  readonly pctMin: string;
  readonly pctMax: string;
  readonly minutes: string;
  readonly zone: string;
  readonly intervalRest: string;
}

export const VACIO: Numeros = {
  sets: '',
  repsMin: '',
  repsMax: '',
  rest: '',
  load: '',
  rir: '',
  pctMin: '',
  pctMax: '',
  minutes: '',
  zone: '',
  intervalRest: '',
};

export interface Modo {
  readonly cardio: boolean;
  readonly alFallo: boolean;
  readonly porcentaje: boolean;
}

/**
 * Lo escrito, convertido en un ítem, o `null` si falta algo.
 *
 * Ningún campo vacío se completa con un número inventado: un bloque de cardio
 * sin vueltas es UN bloque, que es lo que escribió quien no puso vueltas; todo
 * lo demás, si falta, deja el botón apagado.
 */
export function armarItem(
  exerciseId: string | null,
  equipmentId: string | null,
  n: Numeros,
  modo: Modo,
  unidadDeCarga: LoadUnit | null,
): ManualItemDraft | null {
  if (!exerciseId) return null;
  return modo.cardio
    ? armarCardio(exerciseId, equipmentId, n)
    : armarSala(exerciseId, equipmentId, n, modo, unidadDeCarga);
}

function armarCardio(
  exerciseId: string,
  equipmentId: string | null,
  n: Numeros,
): ManualItemDraft | null {
  const minutes = parseNum(n.minutes);
  if (minutes === null) return null;
  return {
    exerciseId,
    equipmentId,
    targetSets: parseNum(n.sets) ?? 1,
    targetRepsMin: 1,
    targetRepsMax: 1,
    targetLoad: null,
    targetRir: null,
    restSeconds: 0,
    toFailure: false,
    pct1rm: null,
    cardio: { minutes, zone: parseNum(n.zone), intervalRestMinutes: parseNum(n.intervalRest) },
  };
}

function armarSala(
  exerciseId: string,
  equipmentId: string | null,
  n: Numeros,
  modo: Modo,
  unidadDeCarga: LoadUnit | null,
): ManualItemDraft | null {
  const sets = parseNum(n.sets);
  const rest = parseNum(n.rest);
  const repsMin = modo.alFallo ? 1 : parseNum(n.repsMin);
  const repsMax = modo.alFallo ? 1 : parseNum(n.repsMax);
  if (sets === null || rest === null || repsMin === null || repsMax === null) return null;

  const pct1rm = modo.porcentaje ? rangoDePorcentaje(n) : null;
  if (modo.porcentaje && !pct1rm) return null;

  const valorCarga = parseNum(n.load);
  return {
    exerciseId,
    equipmentId,
    targetSets: sets,
    targetRepsMin: repsMin,
    targetRepsMax: repsMax,
    // Sin estación no hay unidad en la que leer el número, así que no se
    // guarda carga: un valor sin unidad no se puede mostrar ni convertir.
    targetLoad:
      !pct1rm && unidadDeCarga && valorCarga !== null
        ? { value: valorCarga, unit: unidadDeCarga }
        : null,
    targetRir: parseNum(n.rir),
    restSeconds: rest,
    toFailure: modo.alFallo,
    pct1rm,
    cardio: null,
  };
}

/** "80" solo es 80-80; "80" y "85" es el rango. */
function rangoDePorcentaje(n: Numeros): { min: number; max: number } | null {
  const min = parseNum(n.pctMin);
  if (min === null) return null;
  return { min, max: parseNum(n.pctMax) ?? min };
}

function unidadEscribible(estacion: Equipment | null): LoadUnit | null {
  if (!estacion) return null;
  const { unit } = estacion.load;
  return unit === 'bodyweight' || unit === 'none' ? null : unit;
}

function vaPorMinutos(ejercicio: Exercise | null): boolean {
  return ejercicio?.pattern === 'cardio' || ejercicio?.pattern === 'mobility';
}

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
  const [alFallo, setAlFallo] = useState(false);
  const [porcentaje, setPorcentaje] = useState(false);

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
  const unidad = unidadEscribible(estacion);

  // Cardio y movilidad van por minutos; solo el cardio tiene zona.
  const porMinutos = vaPorMinutos(elegido);
  const item = armarItem(
    exerciseId,
    equipmentId,
    n,
    { cardio: porMinutos, alFallo, porcentaje },
    unidad,
  );

  function agregar() {
    if (!item) return;
    onAdd(item);
    setN(VACIO);
    setAlFallo(false);
    setPorcentaje(false);
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

      {elegido?.isUnilateral && (
        <p className="text-xs leading-snug text-slate">
          Se hace de a un lado: las repeticiones que pongas son por lado.
        </p>
      )}

      {porMinutos ? (
        <CamposCardio baseId={baseId} n={n} setN={setN} conZona={elegido?.pattern === 'cardio'} />
      ) : (
        <CamposSala
          baseId={baseId}
          n={n}
          setN={setN}
          alFallo={alFallo}
          setAlFallo={setAlFallo}
          porcentaje={porcentaje}
          setPorcentaje={setPorcentaje}
          unidad={unidad ? loadUnitLabel(unidad) : null}
        />
      )}

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
          disabled={!item || pending}
          onClick={agregar}
        >
          {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          Agregar
        </Button>
      </div>
    </div>
  );
}

function CampoNumero({
  id,
  label,
  hint,
  value,
  onChange,
  decimal = false,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  decimal?: boolean;
}) {
  return (
    <Field label={label} htmlFor={id} {...(hint ? { hint } : {})}>
      <input
        id={id}
        type="number"
        inputMode={decimal ? 'decimal' : 'numeric'}
        step={decimal ? 'any' : undefined}
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </Field>
  );
}

type SetN = (n: Numeros) => void;

function CamposSala({
  baseId,
  n,
  setN,
  alFallo,
  setAlFallo,
  porcentaje,
  setPorcentaje,
  unidad,
}: {
  baseId: string;
  n: Numeros;
  setN: SetN;
  alFallo: boolean;
  setAlFallo: (v: boolean) => void;
  porcentaje: boolean;
  setPorcentaje: (v: boolean) => void;
  /** La unidad de la estación, o `null` si no hay número de carga que escribir. */
  unidad: string | null;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <Chip selected={alFallo} onClick={() => setAlFallo(!alFallo)}>
          Al fallo técnico
        </Chip>
        <Chip selected={porcentaje} onClick={() => setPorcentaje(!porcentaje)}>
          Carga en % de 1RM
        </Chip>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CampoNumero
          id={`${baseId}-sets`}
          label="Series"
          value={n.sets}
          onChange={(v) => setN({ ...n, sets: v })}
        />
        <CampoNumero
          id={`${baseId}-rest`}
          label="Descanso (seg)"
          value={n.rest}
          onChange={(v) => setN({ ...n, rest: v })}
        />
        {!alFallo && (
          <>
            <CampoNumero
              id={`${baseId}-rmin`}
              label="Reps desde"
              value={n.repsMin}
              onChange={(v) => setN({ ...n, repsMin: v })}
            />
            <CampoNumero
              id={`${baseId}-rmax`}
              label="Reps hasta"
              value={n.repsMax}
              onChange={(v) => setN({ ...n, repsMax: v })}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {porcentaje && (
          <>
            <CampoNumero
              id={`${baseId}-pmin`}
              label="% 1RM desde"
              value={n.pctMin}
              onChange={(v) => setN({ ...n, pctMin: v })}
            />
            <CampoNumero
              id={`${baseId}-pmax`}
              label="% 1RM hasta"
              hint="Opcional."
              value={n.pctMax}
              onChange={(v) => setN({ ...n, pctMax: v })}
            />
          </>
        )}
        {!porcentaje && unidad && (
          <CampoNumero
            id={`${baseId}-load`}
            label={`Carga (${unidad})`}
            hint="Opcional. Se guarda como lo dice la máquina."
            value={n.load}
            onChange={(v) => setN({ ...n, load: v })}
            decimal
          />
        )}
        <CampoNumero
          id={`${baseId}-rir`}
          label="RIR"
          hint="Opcional."
          value={n.rir}
          onChange={(v) => setN({ ...n, rir: v })}
        />
      </div>
    </>
  );
}

function CamposCardio({
  baseId,
  n,
  setN,
  conZona,
}: {
  baseId: string;
  n: Numeros;
  setN: SetN;
  conZona: boolean;
}) {
  const zonas = activeRuleset.cardio?.zones ?? [];
  const zona = zonas.find((z) => String(z.zone) === n.zone) ?? null;
  const vueltas = parseNum(n.sets) ?? 1;
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <CampoNumero
          id={`${baseId}-min`}
          label={vueltas > 1 ? 'Minutos por vuelta' : 'Minutos'}
          value={n.minutes}
          onChange={(v) => setN({ ...n, minutes: v })}
        />
        <CampoNumero
          id={`${baseId}-vueltas`}
          label="Vueltas"
          hint="Opcional. Sin vueltas es un bloque seguido."
          value={n.sets}
          onChange={(v) => setN({ ...n, sets: v })}
        />
      </div>
      {vueltas > 1 && (
        <CampoNumero
          id={`${baseId}-suave`}
          label="Suave entre vueltas (min)"
          value={n.intervalRest}
          onChange={(v) => setN({ ...n, intervalRest: v })}
          decimal
        />
      )}
      {conZona && (
        <Field label="Zona" htmlFor={`${baseId}-zona`} hint={zona?.feels ?? 'Opcional.'}>
          <select
            id={`${baseId}-zona`}
            value={n.zone}
            onChange={(e) => setN({ ...n, zone: e.target.value })}
            className={fieldClass}
          >
            <option value="">Sin zona</option>
            {zonas.map((z) => (
              <option key={z.zone} value={String(z.zone)}>
                Zona {z.zone} · {z.label}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );
}
