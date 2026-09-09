import type {
  Equipment,
  EquipmentCategory,
  Exercise,
  ExperienceLevel,
  LoadUnit,
  Modality,
  MovementPattern,
  MuscleGroup,
} from '@bh/domain';
import { AlertCircle, Check, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { type FormEvent, useRef, useState } from 'react';
import {
  Button,
  Card,
  Chip,
  cardClass,
  Field,
  fieldClass,
  Notice,
  SectionLabel,
} from '../components/ui/index.ts';
import { activeRuleset } from '../lib/engine.ts';
import { fadeUp } from '../lib/motion.ts';
import { onboardingUnavailable } from '../lib/onboarding.ts';
import {
  useCreateEquipment,
  useCreateExercise,
  useCreateSubstitution,
  useDeleteEquipment,
  useDeleteExercise,
  useDeleteSubstitution,
  useEquipmentList,
  useEquipmentUsage,
  useExerciseList,
  useProfileRole,
  useSubstitutionList,
  useUpdateEquipment,
  useUpdateExercise,
} from '../lib/panel.ts';
import { type ExerciseFormInput, exerciseFormSchema } from './panel/exercise-schemas.ts';
import { type EquipmentFormInput, equipmentFormSchema } from './panel/schemas.ts';

/**
 * Alta y corrección de catálogo: equipamiento y ejercicios, con el mapeo
 * entre ambos. Es también la demo de venta del proyecto — acá se ve el
 * catálogo real de Blue Horse tomando forma, foto por foto.
 *
 * Equipamiento y ejercicios tienen la misma paridad (alta, edición, baja),
 * pero borrar un ejercicio es más restrictivo: en cuanto entró en algún plan
 * o alguien registró una serie con él, Postgres rechaza el borrado
 * (`on delete restrict`, ver `useDeleteExercise`) — equipamiento no tiene esa
 * traba, así que ahí sí se puede borrar siempre.
 */
export function Panel() {
  const role = useProfileRole();
  const gymId = role.data?.gymId ?? null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-10 px-6 py-10">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1"
      >
        <SectionLabel className="text-brand">Panel admin</SectionLabel>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Catálogo de Blue Horse
        </h1>
      </motion.header>

      {onboardingUnavailable && (
        <Notice tone="warn" icon={<AlertCircle size={16} aria-hidden="true" />}>
          Supabase no está configurado: el panel no puede leer ni guardar todavía.
        </Notice>
      )}

      <EquipmentSection gymId={gymId} />
      <ExerciseSection gymId={gymId} />
      <SubstitutionSection gymId={gymId} />
    </main>
  );
}

// ==================================================================== equipamiento

const CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  selectorized: 'Selectorizada (pin)',
  plate_loaded: 'A discos',
  free_weight: 'Peso libre',
  rack: 'Rack / soporte',
  cardio: 'Cardio',
  bodyweight: 'Peso corporal',
  accessory: 'Accesorio',
};

const LOAD_UNIT_LABELS: Record<LoadUnit, string> = {
  kg: 'Kilogramos',
  lb: 'Libras',
  stack_level: 'Nivel de pin',
  plates_kg: 'Discos (kg)',
  plates_lb: 'Discos (lb)',
  band: 'Banda elástica',
  bodyweight: 'Peso corporal',
  none: 'Sin carga',
};

const NEEDS_RANGE: readonly LoadUnit[] = ['kg', 'lb', 'stack_level', 'plates_kg', 'plates_lb'];
const NEEDS_BASE_WEIGHT: readonly LoadUnit[] = ['plates_kg', 'plates_lb'];

const emptyEquipmentForm = {
  name: '',
  category: '' as EquipmentCategory | '',
  loadUnit: '' as LoadUnit | '',
  loadMin: '',
  loadMax: '',
  loadIncrement: '',
  stackKgRaw: '',
  baseWeightKg: '',
  quantity: '1',
  locationNote: '',
  setupNotes: '',
};

/** Domain -> formulario, para poder corregir una estación ya cargada. */
function equipmentToForm(eq: Equipment): typeof emptyEquipmentForm {
  const n = (v: number | undefined) => (v === undefined ? '' : String(v));
  return {
    name: eq.name,
    category: eq.category,
    loadUnit: eq.load.unit,
    loadMin: n(eq.load.min),
    loadMax: n(eq.load.max),
    loadIncrement: n(eq.load.increment),
    stackKgRaw: eq.load.stackKg?.join(',') ?? '',
    baseWeightKg: n(eq.load.baseWeightKg),
    quantity: String(eq.quantity),
    locationNote: eq.locationNote ?? '',
    setupNotes: eq.setupNotes ?? '',
  };
}

function EquipmentSection({ gymId }: { gymId: string | null }) {
  const equipmentList = useEquipmentList(gymId);
  const equipmentUsage = useEquipmentUsage(gymId);
  const createEquipment = useCreateEquipment(gymId);
  const updateEquipment = useUpdateEquipment(gymId);
  const deleteEquipment = useDeleteEquipment(gymId);

  const [form, setForm] = useState(emptyEquipmentForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Qué se guardó recién. El formulario se vacía al guardar, y sin esto lo
  // único que cambia es el contador de estaciones, que queda lejos del botón:
  // cargando el gimnasio entero, una fila tras otra, no se ve si entró.
  const [saved, setSaved] = useState<{ name: string; updated: boolean } | null>(null);
  /** Estación que se está corrigiendo, o `null` si el formulario es un alta. */
  const [editing, setEditing] = useState<Equipment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /** Deja el formulario en un estado conocido: alta vacía, o corrección de `eq`. */
  function resetForm(eq: Equipment | null) {
    setEditing(eq);
    setForm(eq ? equipmentToForm(eq) : emptyEquipmentForm);
    setPhoto(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function startEditing(eq: Equipment) {
    resetForm(eq);
    setSaved(null);
    // El formulario está arriba de la lista: sin esto, tocar "Editar" en la
    // estación número 40 no muestra ningún cambio en pantalla.
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function persist(input: EquipmentFormInput) {
    if (editing) {
      await updateEquipment.mutateAsync({
        id: editing.id,
        input,
        photo,
        currentPhotoUrl: editing.photoUrl,
      });
      return;
    }
    await createEquipment.mutateAsync({ input, photo });
  }

  function field<K extends keyof typeof emptyEquipmentForm>(key: K) {
    return {
      value: form[key],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
      ) => setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);

    const parsed = equipmentFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos del formulario.');
      return;
    }

    try {
      const wasEditing = editing !== null;
      await persist(parsed.data as EquipmentFormInput);
      setSaved({ name: parsed.data.name, updated: wasEditing });
      resetForm(null);
    } catch {
      setError('No se pudo guardar. Revisá tu conexión y probá de nuevo.');
    }
  }

  const busy = createEquipment.isPending || updateEquipment.isPending;
  const showRange = NEEDS_RANGE.includes(form.loadUnit as LoadUnit);
  const showStack = form.loadUnit === 'stack_level';
  const showBaseWeight = NEEDS_BASE_WEIGHT.includes(form.loadUnit as LoadUnit);

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      <SectionLabel>Equipamiento</SectionLabel>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={cardClass(editing ? 'brand' : 'default', 'flex flex-col gap-4 p-5')}
      >
        <SectionLabel className={editing ? 'text-brand' : ''}>
          {editing ? `Corrigiendo: ${editing.name}` : 'Agregar estación'}
        </SectionLabel>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="eq-name" className="sm:col-span-2">
            <input
              id="eq-name"
              type="text"
              {...field('name')}
              placeholder="Prensa 45°"
              className={fieldClass}
            />
          </Field>

          <Field label="Categoría" htmlFor="eq-category">
            <select id="eq-category" {...field('category')} className={fieldClass}>
              <option value="">Elegir…</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Cómo carga" htmlFor="eq-unit">
            <select id="eq-unit" {...field('loadUnit')} className={fieldClass}>
              <option value="">Elegir…</option>
              {Object.entries(LOAD_UNIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          {showRange && (
            <>
              <Field label="Carga mínima" htmlFor="eq-min">
                <input
                  id="eq-min"
                  type="number"
                  inputMode="decimal"
                  {...field('loadMin')}
                  className={fieldClass}
                />
              </Field>
              <Field label="Carga máxima" htmlFor="eq-max">
                <input
                  id="eq-max"
                  type="number"
                  inputMode="decimal"
                  {...field('loadMax')}
                  className={fieldClass}
                />
              </Field>
              <Field label="Escalón real" htmlFor="eq-increment">
                <input
                  id="eq-increment"
                  type="number"
                  inputMode="decimal"
                  {...field('loadIncrement')}
                  placeholder="2.5"
                  className={fieldClass}
                />
              </Field>
            </>
          )}

          {showBaseWeight && (
            <Field label="Peso de la barra/carro (kg)" htmlFor="eq-base">
              <input
                id="eq-base"
                type="number"
                inputMode="decimal"
                {...field('baseWeightKg')}
                placeholder="20"
                className={fieldClass}
              />
            </Field>
          )}

          {showStack && (
            <Field
              label="Kilos de cada nivel (separados por coma, del 1 en adelante)"
              htmlFor="eq-stack"
              className="sm:col-span-2"
            >
              <input
                id="eq-stack"
                type="text"
                {...field('stackKgRaw')}
                placeholder="5,10,15,20,25,30"
                className={`${fieldClass} font-mono`}
              />
            </Field>
          )}

          <Field label="Cantidad de unidades" htmlFor="eq-quantity">
            <input
              id="eq-quantity"
              type="number"
              min={1}
              {...field('quantity')}
              className={fieldClass}
            />
          </Field>

          <Field label="Ubicación en el gimnasio" htmlFor="eq-location">
            <input
              id="eq-location"
              type="text"
              {...field('locationNote')}
              placeholder="fondo a la derecha"
              className={fieldClass}
            />
          </Field>

          <Field label="Notas de ajuste" htmlFor="eq-setup" className="sm:col-span-2">
            <textarea
              id="eq-setup"
              {...field('setupNotes')}
              rows={2}
              placeholder="asiento con 5 posiciones"
              className={fieldClass}
            />
          </Field>

          <Field label="Foto" htmlFor="eq-photo" className="sm:col-span-2">
            <input
              id="eq-photo"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className={`${fieldClass} py-2.5 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy`}
            />
          </Field>
        </div>

        {error && (
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        )}

        <SavedNotice saved={saved} />

        <EquipmentFormActions
          isEditing={editing !== null}
          busy={busy}
          onCancel={() => resetForm(null)}
        />
      </form>

      <SectionLabel>
        {equipmentList.data
          ? `${equipmentList.data.length} estaciones cargadas`
          : onboardingUnavailable
            ? 'sin datos: falta configurar Supabase'
            : 'Cargando…'}
      </SectionLabel>

      <div className="flex flex-col gap-2">
        {equipmentList.data?.map((eq) => (
          <EquipmentRow
            key={eq.id}
            equipment={eq}
            mappedExercises={equipmentUsage.data?.get(eq.id) ?? 0}
            isEditing={editing?.id === eq.id}
            onEdit={() => startEditing(eq)}
            onDelete={() => deleteEquipment.mutateAsync({ id: eq.id, photoUrl: eq.photoUrl })}
          />
        ))}
      </div>
    </motion.section>
  );
}

/**
 * Con cuántas estaciones quedó mapeado un ejercicio.
 *
 * "Sin equipamiento mapeado" no es un detalle: el motor no puede proponer un
 * ejercicio que no se puede hacer en ninguna estación, así que esa fila es
 * trabajo a medio hacer. Va en ámbar para que se vea al recorrer la lista,
 * en vez de gris como todo lo demás.
 */
function ExerciseMappingNote({ stations, bodyweight }: { stations: number; bodyweight: boolean }) {
  if (stations > 0) {
    return (
      <span className="text-xs text-slate">
        {stations === 1 ? '1 estación asociada' : `${stations} estaciones asociadas`}
      </span>
    );
  }

  // Peso corporal es un caso legítimo, no un olvido: no necesita estación.
  if (bodyweight) {
    return <span className="text-xs text-slate">peso corporal, sin equipamiento</span>;
  }

  return (
    <span className="flex items-center gap-1 text-xs text-amber">
      <AlertCircle size={11} aria-hidden="true" />
      sin equipamiento mapeado
    </span>
  );
}

/** Botonera del formulario de estaciones: cambia según si es alta o corrección. */
function EquipmentFormActions({
  isEditing,
  busy,
  onCancel,
}: {
  isEditing: boolean;
  busy: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-2">
      {isEditing && (
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      )}
      <Button
        type="submit"
        variant="primary"
        disabled={busy || onboardingUnavailable}
        className="flex-1"
      >
        {busy ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : isEditing ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Plus size={16} aria-hidden="true" />
        )}
        {isEditing ? 'Guardar cambios' : 'Agregar al catálogo'}
      </Button>
    </div>
  );
}

/**
 * Una estación del catálogo, con las dos acciones que hacían falta para poder
 * relevar el gimnasio de verdad: corregirla y borrarla.
 *
 * El borrado es de dos toques y dice qué se lleva puesto. Los `set_logs` de
 * quien ya la usó sobreviven (su `equipment_id` queda en null), pero los
 * mapeos a ejercicios cascadean: borrar una estación mapeada deja al motor
 * sin poder proponer esos ejercicios, y eso no se puede deshacer.
 */
function EquipmentRow({
  equipment: eq,
  mappedExercises,
  isEditing,
  onEdit,
  onDelete,
}: {
  equipment: Equipment;
  mappedExercises: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setFailed(false);
    try {
      await onDelete();
    } catch {
      setFailed(true);
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <Card tone={isEditing ? 'brand' : 'default'} className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        {eq.photoUrl ? (
          <img
            src={eq.photoUrl}
            alt={eq.name}
            className="size-11 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-navy text-xs text-slate">
            sin foto
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{eq.name}</span>
          <span className="flex items-center gap-1 text-xs text-slate">
            {eq.locationNote && (
              <>
                <MapPin size={11} aria-hidden="true" />
                {eq.locationNote}
              </>
            )}
          </span>
        </div>
        <span className="shrink-0 text-xs uppercase tracking-wide text-slate">
          {CATEGORY_LABELS[eq.category]}
        </span>
      </div>

      {confirming ? (
        <div className="flex flex-col gap-2 rounded-lg bg-navy px-3 py-2.5">
          <p className="text-xs text-slate">
            {mappedExercises > 0 ? (
              <>
                Borrar <strong className="font-semibold text-ink">{eq.name}</strong> también borra{' '}
                {mappedExercises === 1
                  ? 'el ejercicio que tiene mapeado'
                  : `los ${mappedExercises} ejercicios que tiene mapeados`}
                . Lo que ya entrenó alguien no se pierde.
              </>
            ) : (
              <>
                Borrar <strong className="font-semibold text-ink">{eq.name}</strong>. Lo que ya
                entrenó alguien no se pierde.
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              className="flex-1"
            >
              No, dejala
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1"
            >
              {deleting && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
              Sí, borrala
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={12} aria-hidden="true" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 size={12} aria-hidden="true" />
            Borrar
          </Button>
          {failed && (
            <span role="alert" className="self-center text-xs text-orange">
              No se pudo borrar. Probá de nuevo.
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

// ==================================================================== ejercicios

const PATTERN_LABELS: Record<MovementPattern, string> = {
  squat: 'Sentadilla',
  hinge: 'Bisagra de cadera',
  lunge: 'Zancada',
  horizontal_push: 'Empuje horizontal',
  horizontal_pull: 'Tracción horizontal',
  vertical_push: 'Empuje vertical',
  vertical_pull: 'Tracción vertical',
  carry: 'Carga / acarreo',
  core: 'Core',
  isolation: 'Aislamiento',
  cardio: 'Cardio',
};

const MODALITY_LABELS: Record<Modality, string> = {
  reps_weight: 'Repeticiones con carga',
  reps_bodyweight: 'Repeticiones, peso corporal',
  time: 'Tiempo',
  distance: 'Distancia',
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Principiante',
  novice: 'Novato',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  quads: 'Cuádriceps',
  hamstrings: 'Isquiotibiales',
  glutes: 'Glúteos',
  calves: 'Gemelos',
  chest: 'Pecho',
  back: 'Espalda',
  lats: 'Dorsales',
  traps: 'Trapecios',
  front_delts: 'Deltoides anterior',
  side_delts: 'Deltoides lateral',
  rear_delts: 'Deltoides posterior',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebrazos',
  abs: 'Abdominales',
  obliques: 'Oblicuos',
  lower_back: 'Lumbares',
  full_body: 'Cuerpo completo',
};

const emptyExerciseForm = {
  name: '',
  pattern: '' as MovementPattern | '',
  primaryMuscles: [] as MuscleGroup[],
  secondaryMuscles: [] as MuscleGroup[],
  modality: '' as Modality | '',
  isCompound: false,
  isUnilateral: false,
  skillLevel: '' as ExperienceLevel | '',
  cues: '',
  equipmentIds: [] as string[],
};

/** Domain -> formulario, para poder corregir un ejercicio ya cargado. */
function exerciseToForm(ex: Exercise): typeof emptyExerciseForm {
  return {
    name: ex.name,
    pattern: ex.pattern,
    primaryMuscles: [...ex.primaryMuscles],
    secondaryMuscles: [...ex.secondaryMuscles],
    modality: ex.modality,
    isCompound: ex.isCompound,
    isUnilateral: ex.isUnilateral,
    skillLevel: ex.skillLevel,
    cues: ex.cues ?? '',
    equipmentIds: [...ex.equipmentIds],
  };
}

function ExerciseSection({ gymId }: { gymId: string | null }) {
  const equipmentList = useEquipmentList(gymId);
  const exerciseList = useExerciseList(gymId);
  const createExercise = useCreateExercise(gymId);
  const updateExercise = useUpdateExercise(gymId);
  const deleteExercise = useDeleteExercise(gymId);

  const [form, setForm] = useState(emptyExerciseForm);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ name: string; updated: boolean } | null>(null);
  /** Ejercicio que se está corrigiendo, o `null` si el formulario es un alta. */
  const [editing, setEditing] = useState<Exercise | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function resetForm(ex: Exercise | null) {
    setEditing(ex);
    setForm(ex ? exerciseToForm(ex) : emptyExerciseForm);
    setError(null);
  }

  function startEditing(ex: Exercise) {
    resetForm(ex);
    setSaved(null);
    // El formulario está arriba de la lista: sin esto, tocar "Editar" en el
    // ejercicio número 40 no muestra ningún cambio en pantalla.
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggle<K extends 'primaryMuscles' | 'secondaryMuscles' | 'equipmentIds'>(
    key: K,
    value: string,
  ) {
    setForm((f) => {
      const list = f[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(null);

    const parsed = exerciseFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos del formulario.');
      return;
    }

    try {
      const wasEditing = editing !== null;
      if (editing) {
        await updateExercise.mutateAsync({
          id: editing.id,
          input: parsed.data as ExerciseFormInput,
        });
      } else {
        await createExercise.mutateAsync(parsed.data as ExerciseFormInput);
      }
      setSaved({ name: parsed.data.name, updated: wasEditing });
      resetForm(null);
    } catch {
      setError('No se pudo guardar. Revisá tu conexión y probá de nuevo.');
    }
  }

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      <SectionLabel>Ejercicios</SectionLabel>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={cardClass(editing ? 'brand' : 'default', 'flex flex-col gap-4 p-5')}
      >
        <SectionLabel className={editing ? 'text-brand' : ''}>
          {editing ? `Corrigiendo: ${editing.name}` : 'Agregar ejercicio'}
        </SectionLabel>

        <Field label="Nombre" htmlFor="ex-name">
          <input
            id="ex-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Curl de bíceps"
            className={fieldClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Patrón de movimiento" htmlFor="ex-pattern">
            <select
              id="ex-pattern"
              value={form.pattern}
              onChange={(e) =>
                setForm((f) => ({ ...f, pattern: e.target.value as MovementPattern }))
              }
              className={fieldClass}
            >
              <option value="">Elegir…</option>
              {Object.entries(PATTERN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Cómo se registra" htmlFor="ex-modality">
            <select
              id="ex-modality"
              value={form.modality}
              onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value as Modality }))}
              className={fieldClass}
            >
              <option value="">Elegir…</option>
              {Object.entries(MODALITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nivel mínimo" htmlFor="ex-level">
            <select
              id="ex-level"
              value={form.skillLevel}
              onChange={(e) =>
                setForm((f) => ({ ...f, skillLevel: e.target.value as ExperienceLevel }))
              }
              className={fieldClass}
            >
              <option value="">Elegir…</option>
              {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-end gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isCompound}
                onChange={(e) => setForm((f) => ({ ...f, isCompound: e.target.checked }))}
              />
              Compuesto
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isUnilateral}
                onChange={(e) => setForm((f) => ({ ...f, isUnilateral: e.target.checked }))}
              />
              Unilateral
            </label>
          </div>
        </div>

        <ChipPicker
          label="Músculos principales"
          options={MUSCLE_LABELS}
          selected={form.primaryMuscles}
          onToggle={(v) => toggle('primaryMuscles', v)}
        />
        <ChipPicker
          label="Músculos secundarios (opcional)"
          options={MUSCLE_LABELS}
          selected={form.secondaryMuscles}
          onToggle={(v) => toggle('secondaryMuscles', v)}
        />

        {form.modality !== 'reps_bodyweight' && (
          <ChipPicker
            label="En qué estaciones se puede hacer"
            options={Object.fromEntries((equipmentList.data ?? []).map((e) => [e.id, e.name]))}
            selected={form.equipmentIds}
            onToggle={(v) => toggle('equipmentIds', v)}
            empty="Cargá equipamiento primero para poder mapear este ejercicio."
          />
        )}

        <Field label="Indicaciones de ejecución (opcional)" htmlFor="ex-cues">
          <textarea
            id="ex-cues"
            value={form.cues}
            onChange={(e) => setForm((f) => ({ ...f, cues: e.target.value }))}
            rows={2}
            placeholder="Codos pegados al cuerpo, sin balanceo."
            className={fieldClass}
          />
        </Field>

        {error && (
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        )}

        <SavedNotice saved={saved} />

        <EquipmentFormActions
          isEditing={editing !== null}
          busy={createExercise.isPending || updateExercise.isPending}
          onCancel={() => resetForm(null)}
        />
      </form>

      <SectionLabel>
        {exerciseList.data
          ? `${exerciseList.data.length} ejercicios disponibles`
          : onboardingUnavailable
            ? 'sin datos: falta configurar Supabase'
            : 'Cargando…'}
      </SectionLabel>

      <div className="flex flex-col gap-2">
        {exerciseList.data?.map((ex) => (
          <ExerciseRow
            key={ex.id}
            exercise={ex}
            isEditing={editing?.id === ex.id}
            onEdit={() => startEditing(ex)}
            onDelete={() => deleteExercise.mutateAsync(ex.id)}
          />
        ))}
      </div>
    </motion.section>
  );
}

/**
 * Un ejercicio del catálogo, con corregir y borrar. El borrado es de dos
 * toques como el de equipamiento, pero acá puede fallar de verdad: si ya
 * entró en algún plan o alguien registró una serie con él, Postgres lo
 * rechaza (`useDeleteExercise`) — el motivo real se muestra en vez de un
 * genérico "probá de nuevo", porque acá el reintento no va a cambiar nada.
 */
function ExerciseRow({
  exercise: ex,
  isEditing,
  onEdit,
  onDelete,
}: {
  exercise: Exercise;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failMessage, setFailMessage] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setFailMessage(null);
    try {
      await onDelete();
    } catch (err) {
      setFailMessage(err instanceof Error ? err.message : 'No se pudo borrar. Probá de nuevo.');
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <Card tone={isEditing ? 'brand' : 'default'} className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold">{ex.name}</span>
          <ExerciseMappingNote
            stations={ex.equipmentIds.length}
            bodyweight={ex.modality === 'reps_bodyweight'}
          />
        </div>
        <span className="shrink-0 text-xs uppercase tracking-wide text-slate">
          {PATTERN_LABELS[ex.pattern]}
        </span>
      </div>

      {confirming ? (
        <div className="flex flex-col gap-2 rounded-lg bg-navy px-3 py-2.5">
          <p className="text-xs text-slate">
            Borrar <strong className="font-semibold text-ink">{ex.name}</strong>. Si ya se usó en
            algún plan o tiene series registradas, Postgres va a rechazar el borrado en vez de
            perder ese historial.
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              className="flex-1"
            >
              No, dejalo
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1"
            >
              {deleting && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
              Sí, borralo
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil size={12} aria-hidden="true" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 size={12} aria-hidden="true" />
            Borrar
          </Button>
          {failMessage && (
            <span role="alert" className="text-xs text-orange">
              {failMessage}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

function ChipPicker({
  label,
  options,
  selected,
  onToggle,
  empty,
}: {
  label: string;
  options: Record<string, string>;
  selected: readonly string[];
  onToggle: (value: string) => void;
  empty?: string;
}) {
  const entries = Object.entries(options);

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span>{label}</span>
      {entries.length === 0 ? (
        <p className="text-xs text-slate">{empty ?? 'Nada disponible todavía.'}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {entries.map(([value, text]) => (
            <Chip key={value} selected={selected.includes(value)} onClick={() => onToggle(value)}>
              {text}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Confirma qué se acaba de guardar, nombrándolo. Relevar el gimnasio es cargar
 * decenas de filas seguidas: sin esto, la única señal de que una entró es un
 * contador que queda fuera de la vista.
 */
function SavedNotice({ saved }: { saved: { name: string; updated: boolean } | null }) {
  if (saved === null) return null;
  return (
    <motion.p
      key={saved.name}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="flex items-center gap-2 text-sm text-brand"
    >
      <Check size={15} aria-hidden="true" />
      <span>
        {saved.updated ? 'Se guardaron los cambios de' : 'Se agregó'}{' '}
        <strong className="font-semibold">{saved.name}</strong>.
      </span>
    </motion.p>
  );
}

// ==================================================================== sustituciones

/**
 * Equivalencias cargadas a mano entre dos ejercicios ya existentes. Sirven
 * para dos cosas: forzar una equivalencia que el cálculo automático por
 * patrón y músculos no ve (dos máquinas distintas que en Blue Horse trabajan
 * igual), o bajar una que el cálculo automático sobreestima. El motor las
 * prioriza sobre el cálculo propio en las tres pantallas de "cambiar
 * ejercicio" (Hoy, la vista previa del plan, Explorar).
 */
function SubstitutionSection({ gymId }: { gymId: string | null }) {
  const exerciseList = useExerciseList(gymId);
  const substitutionList = useSubstitutionList(gymId);
  const createSubstitution = useCreateSubstitution(gymId);
  const deleteSubstitution = useDeleteSubstitution(gymId);

  const [exerciseId, setExerciseId] = useState('');
  const [substituteId, setSubstituteId] = useState('');
  const [equivalence, setEquivalence] = useState('0.8');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const exerciseById = new Map((exerciseList.data ?? []).map((e) => [e.id, e]));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!exerciseId || !substituteId) {
      setError('Elegí los dos ejercicios.');
      return;
    }
    if (exerciseId === substituteId) {
      setError('Un ejercicio no puede ser reemplazo de sí mismo.');
      return;
    }
    const value = Number(equivalence);
    if (Number.isNaN(value) || value < 0 || value > 1) {
      setError('La equivalencia va de 0 a 1.');
      return;
    }

    try {
      await createSubstitution.mutateAsync({
        exerciseId,
        substituteId,
        equivalence: value,
        note: note.trim() || null,
      });
      setSaved(true);
      setExerciseId('');
      setSubstituteId('');
      setEquivalence('0.8');
      setNote('');
    } catch {
      setError('No se pudo guardar. Puede que ya exista esta pareja, o revisá tu conexión.');
    }
  }

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      <SectionLabel>Sustituciones curadas</SectionLabel>

      <form onSubmit={handleSubmit} className={cardClass('default', 'flex flex-col gap-4 p-5')}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Ejercicio" htmlFor="sub-exercise">
            <select
              id="sub-exercise"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Elegir…</option>
              {(exerciseList.data ?? []).map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Reemplazo" htmlFor="sub-substitute">
            <select
              id="sub-substitute"
              value={substituteId}
              onChange={(e) => setSubstituteId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Elegir…</option>
              {(exerciseList.data ?? []).map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Equivalencia (0 a 1)"
            htmlFor="sub-equivalence"
            hint={`El cálculo automático usa un piso de ${Math.round(activeRuleset.substitution.minEquivalence * 100)}%: por debajo, un ejercicio no aparece como reemplazo salvo que lo cargues acá vos.`}
          >
            <input
              id="sub-equivalence"
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={equivalence}
              onChange={(e) => setEquivalence(e.target.value)}
              className={fieldClass}
            />
          </Field>

          <Field label="Nota (opcional)" htmlFor="sub-note">
            <input
              id="sub-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misma demanda en cuádriceps y glúteo"
              className={fieldClass}
            />
          </Field>
        </div>

        {error && (
          <Notice tone="error" role="alert">
            {error}
          </Notice>
        )}
        {saved && (
          <p role="status" className="flex items-center gap-2 text-sm text-brand">
            <Check size={15} aria-hidden="true" />
            Se guardó la equivalencia.
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={createSubstitution.isPending || onboardingUnavailable}
        >
          {createSubstitution.isPending ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus size={16} aria-hidden="true" />
          )}
          Cargar equivalencia
        </Button>
      </form>

      <SectionLabel>
        {substitutionList.data
          ? `${substitutionList.data.length} equivalencias cargadas`
          : onboardingUnavailable
            ? 'sin datos: falta configurar Supabase'
            : 'Cargando…'}
      </SectionLabel>

      <div className="flex flex-col gap-2">
        {substitutionList.data?.length === 0 && (
          <p className="text-sm text-slate">
            Ninguna todavía: sin equivalencias cargadas a mano, el motor sigue calculando por patrón
            de movimiento y músculos compartidos, como siempre.
          </p>
        )}
        {substitutionList.data?.map((sub) => (
          <SubstitutionRow
            key={`${sub.exerciseId}-${sub.substituteId}`}
            exerciseName={exerciseById.get(sub.exerciseId)?.name ?? 'Ejercicio borrado'}
            substituteName={exerciseById.get(sub.substituteId)?.name ?? 'Ejercicio borrado'}
            note={sub.note}
            equivalence={sub.equivalence}
            onDelete={() =>
              deleteSubstitution.mutateAsync({
                exerciseId: sub.exerciseId,
                substituteId: sub.substituteId,
              })
            }
          />
        ))}
      </div>
    </motion.section>
  );
}

/**
 * Una equivalencia curada, con borrado de dos toques como el de equipamiento
 * y ejercicios (`EquipmentRow`, `ExerciseRow`) — antes borraba directo al
 * primer clic, la única fila del panel sin ese resguardo, y el botón era un
 * ícono solo con `aria-hidden`, sin nombre accesible para lector de pantalla.
 */
function SubstitutionRow({
  exerciseName,
  substituteName,
  note,
  equivalence,
  onDelete,
}: {
  exerciseName: string;
  substituteName: string;
  note: string | null;
  equivalence: number;
  onDelete: () => Promise<unknown>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <Card className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm">
            <strong className="font-semibold">{exerciseName}</strong> ↔{' '}
            <strong className="font-semibold">{substituteName}</strong>
          </span>
          {note && <span className="truncate text-xs text-slate">{note}</span>}
        </div>
        <span className="shrink-0 font-display text-xs font-semibold tabular-nums text-brand">
          {Math.round(equivalence * 100)}%
        </span>
      </div>

      {confirming ? (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} className="flex-1">
            No, dejala
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
            className="flex-1"
          >
            {deleting && <Loader2 size={13} className="animate-spin" aria-hidden="true" />}
            Sí, borrala
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(true)}
          aria-label={`Borrar equivalencia entre ${exerciseName} y ${substituteName}`}
          className="self-start"
        >
          <Trash2 size={12} aria-hidden="true" />
          Borrar
        </Button>
      )}
    </Card>
  );
}
