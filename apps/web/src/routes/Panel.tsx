import type {
  EquipmentCategory,
  ExperienceLevel,
  LoadUnit,
  Modality,
  MovementPattern,
  MuscleGroup,
} from '@bh/domain';
import { AlertCircle, Loader2, MapPin, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { type FormEvent, useRef, useState } from 'react';
import { fadeUp, tappable } from '../lib/motion.ts';
import { onboardingUnavailable } from '../lib/onboarding.ts';
import {
  useCreateEquipment,
  useCreateExercise,
  useEquipmentList,
  useExerciseList,
  useProfileRole,
} from '../lib/panel.ts';
import { type ExerciseFormInput, exerciseFormSchema } from './panel/exercise-schemas.ts';
import { type EquipmentFormInput, equipmentFormSchema } from './panel/schemas.ts';

/**
 * Alta de catálogo: equipamiento y ejercicios, con el mapeo entre ambos. Es
 * también la demo de venta del proyecto — acá se ve el catálogo real de Blue
 * Horse tomando forma, foto por foto.
 *
 * Todavía no tiene edición ni baja — solo alta y listado. Alcanza para
 * cargar el relevamiento cuando llegue; edición se suma si hace falta.
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Panel admin</p>
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Blue Horse</h1>
      </motion.header>

      {onboardingUnavailable && (
        <p className="flex items-start gap-2 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber" aria-hidden="true" />
          Supabase no está configurado: el panel no puede leer ni guardar todavía.
        </p>
      )}

      <EquipmentSection gymId={gymId} />
      <ExerciseSection gymId={gymId} />
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

function EquipmentSection({ gymId }: { gymId: string | null }) {
  const equipmentList = useEquipmentList(gymId);
  const createEquipment = useCreateEquipment(gymId);

  const [form, setForm] = useState(emptyEquipmentForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const parsed = equipmentFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos del formulario.');
      return;
    }

    try {
      await createEquipment.mutateAsync({ input: parsed.data as EquipmentFormInput, photo });
      setForm(emptyEquipmentForm);
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setError('No se pudo guardar. Revisá tu conexión y probá de nuevo.');
    }
  }

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
      <h2 className="text-lg font-bold tracking-tight">Equipamiento</h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-line bg-navy-soft p-5"
      >
        <h3 className="text-sm font-semibold text-slate">Agregar estación</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2" htmlFor="eq-name">
            Nombre
            <input
              id="eq-name"
              type="text"
              {...field('name')}
              placeholder="Prensa 45°"
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm" htmlFor="eq-category">
            Categoría
            <select
              id="eq-category"
              {...field('category')}
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            >
              <option value="">Elegir…</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm" htmlFor="eq-unit">
            Cómo carga
            <select
              id="eq-unit"
              {...field('loadUnit')}
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            >
              <option value="">Elegir…</option>
              {Object.entries(LOAD_UNIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {showRange && (
            <>
              <label className="flex flex-col gap-1.5 text-sm" htmlFor="eq-min">
                Carga mínima
                <input
                  id="eq-min"
                  type="number"
                  inputMode="decimal"
                  {...field('loadMin')}
                  className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm" htmlFor="eq-max">
                Carga máxima
                <input
                  id="eq-max"
                  type="number"
                  inputMode="decimal"
                  {...field('loadMax')}
                  className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm" htmlFor="eq-increment">
                Escalón real
                <input
                  id="eq-increment"
                  type="number"
                  inputMode="decimal"
                  {...field('loadIncrement')}
                  placeholder="2.5"
                  className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
                />
              </label>
            </>
          )}

          {showBaseWeight && (
            <label className="flex flex-col gap-1.5 text-sm" htmlFor="eq-base">
              Peso de la barra/carro (kg)
              <input
                id="eq-base"
                type="number"
                inputMode="decimal"
                {...field('baseWeightKg')}
                placeholder="20"
                className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
              />
            </label>
          )}

          {showStack && (
            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2" htmlFor="eq-stack">
              Kilos de cada nivel (separados por coma, del 1 en adelante)
              <input
                id="eq-stack"
                type="text"
                {...field('stackKgRaw')}
                placeholder="5,10,15,20,25,30"
                className="rounded-lg border border-line bg-navy px-3.5 py-2.5 font-mono outline-none focus:border-teal"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm" htmlFor="eq-quantity">
            Cantidad de unidades
            <input
              id="eq-quantity"
              type="number"
              min={1}
              {...field('quantity')}
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm" htmlFor="eq-location">
            Ubicación en el gimnasio
            <input
              id="eq-location"
              type="text"
              {...field('locationNote')}
              placeholder="fondo a la derecha"
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2" htmlFor="eq-setup">
            Notas de ajuste
            <textarea
              id="eq-setup"
              {...field('setupNotes')}
              rows={2}
              placeholder="asiento con 5 posiciones"
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2" htmlFor="eq-photo">
            Foto
            <input
              id="eq-photo"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-teal file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-navy"
            />
          </label>
        </div>

        {error && <p className="text-sm text-orange">{error}</p>}

        <motion.button
          type="submit"
          {...tappable}
          disabled={createEquipment.isPending || onboardingUnavailable}
          className="flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-navy disabled:opacity-50"
        >
          {createEquipment.isPending ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus size={16} aria-hidden="true" />
          )}
          Agregar al catálogo
        </motion.button>
      </form>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate">
        {equipmentList.data
          ? `${equipmentList.data.length} estaciones cargadas`
          : onboardingUnavailable
            ? 'sin datos: falta configurar Supabase'
            : 'Cargando…'}
      </h3>

      <div className="flex flex-col gap-2">
        {equipmentList.data?.map((eq) => (
          <div
            key={eq.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-navy-soft px-4 py-3"
          >
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
            <div className="flex flex-1 flex-col">
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
            <span className="text-xs uppercase tracking-wide text-slate">
              {CATEGORY_LABELS[eq.category]}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
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

function ExerciseSection({ gymId }: { gymId: string | null }) {
  const equipmentList = useEquipmentList(gymId);
  const exerciseList = useExerciseList(gymId);
  const createExercise = useCreateExercise(gymId);

  const [form, setForm] = useState(emptyExerciseForm);
  const [error, setError] = useState<string | null>(null);

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

    const parsed = exerciseFormSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos del formulario.');
      return;
    }

    try {
      await createExercise.mutateAsync(parsed.data as ExerciseFormInput);
      setForm(emptyExerciseForm);
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
      <h2 className="text-lg font-bold tracking-tight">Ejercicios</h2>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-line bg-navy-soft p-5"
      >
        <h3 className="text-sm font-semibold text-slate">Agregar ejercicio</h3>

        <label className="flex flex-col gap-1.5 text-sm" htmlFor="ex-name">
          Nombre
          <input
            id="ex-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Curl de bíceps"
            className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm" htmlFor="ex-pattern">
            Patrón de movimiento
            <select
              id="ex-pattern"
              value={form.pattern}
              onChange={(e) =>
                setForm((f) => ({ ...f, pattern: e.target.value as MovementPattern }))
              }
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            >
              <option value="">Elegir…</option>
              {Object.entries(PATTERN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm" htmlFor="ex-modality">
            Cómo se registra
            <select
              id="ex-modality"
              value={form.modality}
              onChange={(e) => setForm((f) => ({ ...f, modality: e.target.value as Modality }))}
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            >
              <option value="">Elegir…</option>
              {Object.entries(MODALITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm" htmlFor="ex-level">
            Nivel mínimo
            <select
              id="ex-level"
              value={form.skillLevel}
              onChange={(e) =>
                setForm((f) => ({ ...f, skillLevel: e.target.value as ExperienceLevel }))
              }
              className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
            >
              <option value="">Elegir…</option>
              {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

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

        <label className="flex flex-col gap-1.5 text-sm" htmlFor="ex-cues">
          Indicaciones de ejecución (opcional)
          <textarea
            id="ex-cues"
            value={form.cues}
            onChange={(e) => setForm((f) => ({ ...f, cues: e.target.value }))}
            rows={2}
            placeholder="Codos pegados al cuerpo, sin balanceo."
            className="rounded-lg border border-line bg-navy px-3.5 py-2.5 outline-none focus:border-teal"
          />
        </label>

        {error && <p className="text-sm text-orange">{error}</p>}

        <motion.button
          type="submit"
          {...tappable}
          disabled={createExercise.isPending || onboardingUnavailable}
          className="flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-navy disabled:opacity-50"
        >
          {createExercise.isPending ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Plus size={16} aria-hidden="true" />
          )}
          Agregar ejercicio
        </motion.button>
      </form>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate">
        {exerciseList.data
          ? `${exerciseList.data.length} ejercicios disponibles`
          : onboardingUnavailable
            ? 'sin datos: falta configurar Supabase'
            : 'Cargando…'}
      </h3>

      <div className="flex flex-col gap-2">
        {exerciseList.data?.map((ex) => (
          <div
            key={ex.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-navy-soft px-4 py-3"
          >
            <div className="flex flex-1 flex-col">
              <span className="font-semibold">{ex.name}</span>
              <span className="text-xs text-slate">
                {ex.equipmentIds.length > 0
                  ? `${ex.equipmentIds.length} estación(es) asociada(s)`
                  : ex.modality === 'reps_bodyweight'
                    ? 'peso corporal, sin equipamiento'
                    : 'sin equipamiento mapeado'}
              </span>
            </div>
            <span className="text-xs uppercase tracking-wide text-slate">
              {PATTERN_LABELS[ex.pattern]}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
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
            <motion.button
              key={value}
              type="button"
              {...tappable}
              onClick={() => onToggle(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                selected.includes(value)
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-line bg-navy'
              }`}
            >
              {text}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
