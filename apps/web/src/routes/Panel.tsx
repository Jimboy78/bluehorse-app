import type { EquipmentCategory, LoadUnit } from '@bh/domain';
import { AlertCircle, Loader2, MapPin, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { type FormEvent, useRef, useState } from 'react';
import { fadeUp, tappable } from '../lib/motion.ts';
import { onboardingUnavailable } from '../lib/onboarding.ts';
import { useCreateEquipment, useEquipmentList, useProfileRole } from '../lib/panel.ts';
import { type EquipmentFormInput, equipmentFormSchema } from './panel/schemas.ts';

/**
 * Alta de equipamiento. Es también la demo de venta del proyecto: acá se ve
 * el catálogo real de Blue Horse tomando forma, foto por foto.
 *
 * Todavía no tiene edición ni baja — solo alta y listado. Alcanza para
 * cargar el relevamiento cuando llegue; edición se suma si hace falta.
 */

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
const NEEDS_STACK = 'stack_level';
const NEEDS_BASE_WEIGHT: readonly LoadUnit[] = ['plates_kg', 'plates_lb'];

const emptyForm = {
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

export function Panel() {
  const role = useProfileRole();
  const gymId = role.data?.gymId ?? null;
  const equipmentList = useEquipmentList(gymId);
  const createEquipment = useCreateEquipment(gymId);

  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function field<K extends keyof typeof emptyForm>(key: K) {
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
      setForm(emptyForm);
      setPhoto(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setError('No se pudo guardar. Revisá tu conexión y probá de nuevo.');
    }
  }

  const showRange = NEEDS_RANGE.includes(form.loadUnit as LoadUnit);
  const showStack = form.loadUnit === NEEDS_STACK;
  const showBaseWeight = NEEDS_BASE_WEIGHT.includes(form.loadUnit as LoadUnit);

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-6 py-10">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">Panel admin</p>
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de equipamiento</h1>
      </motion.header>

      {onboardingUnavailable && (
        <p className="flex items-start gap-2 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber" aria-hidden="true" />
          Supabase no está configurado: el panel no puede leer ni guardar todavía.
        </p>
      )}

      <motion.form
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-line bg-navy-soft p-5"
      >
        <h2 className="text-sm font-semibold">Agregar estación</h2>

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
      </motion.form>

      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3"
      >
        <h2 className="text-sm font-semibold text-slate">
          {equipmentList.data
            ? `${equipmentList.data.length} estaciones cargadas`
            : onboardingUnavailable
              ? 'sin datos: falta configurar Supabase'
              : 'Cargando…'}
        </h2>

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
    </main>
  );
}
