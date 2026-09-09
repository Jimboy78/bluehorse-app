import type { Exercise, MuscleGroup } from '@bh/domain';
import type { SubstituteOption } from '@bh/engine';
import { AlertCircle, ChevronDown, Compass, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import {
  Card,
  Chip,
  EmptyState,
  MUSCLE_LABELS,
  muscleSummary,
  Notice,
  PATTERN_LABELS,
  PatternIcon,
  SectionLabel,
  Skeleton,
} from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { useGymCatalog } from '../lib/catalog.ts';
import { activeRuleset, engine, engineContext } from '../lib/engine.ts';
import { fadeUp, listContainer, listItem, spring, tappable } from '../lib/motion.ts';
import { useProfileStatus } from '../lib/onboarding.ts';

/**
 * EXPLORAR EJERCICIOS
 *
 * Hasta acá, `engine.findSubstitutes()` — que ya recorre TODO el catálogo por
 * patrón de movimiento y músculos compartidos, no solo dentro del mismo tipo
 * de equipamiento — solo se podía disparar desde "Cambiar ejercicio" en Hoy,
 * y eso requiere estar parado frente al ejercicio en medio de una sesión.
 *
 * Quedó anotado en `docs/ESTADO.md` como análisis sin tocar, a pedido
 * explícito: "no quiero que lo agregues de una ahora, pero quiero que
 * revises si está contemplado". Estaba contemplado a medias — el MECANISMO
 * ya existía completo, faltaba la pantalla. Esto es esa pantalla, sin tocar
 * el catálogo: no inventa ningún ejercicio nuevo (eso sí requeriría
 * relevamiento real, foto por foto — ver CLAUDE.md), solo expone lo que ya
 * está cargado, con un segundo punto de entrada que no depende de estar
 * entrenando.
 *
 * Elegís un músculo, ves qué hay en el catálogo real de Blue Horse para
 * trabajarlo, y por cada ejercicio, con qué más se puede hacer lo mismo.
 */
export function Explorar() {
  const { status, user } = useAuth();
  const profile = useProfileStatus();
  const catalog = useGymCatalog(profile.data?.gymId ?? null);

  return (
    <AppShell>
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1"
      >
        <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand">
          El catálogo real
        </p>
        <h1 className="font-display text-[2.6rem] font-semibold uppercase leading-[0.95] tracking-tight">
          Explorar
        </h1>
        <p className="text-sm leading-relaxed text-slate">
          Elegí un músculo y mirá qué hay para trabajarlo — con qué se puede hacer cada ejercicio de
          otra forma.
        </p>
      </motion.header>

      <ExplorarBody authStatus={status} catalog={catalog} userId={user?.id} />
    </AppShell>
  );
}

function ExplorarBody({
  authStatus,
  catalog,
  userId,
}: {
  readonly authStatus: ReturnType<typeof useAuth>['status'];
  readonly catalog: ReturnType<typeof useGymCatalog>;
  readonly userId: string | undefined;
}) {
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const exercises = useMemo(() => {
    if (!catalog.data || !muscle) return [];
    return catalog.data.gym.exercises
      .filter((ex) => ex.primaryMuscles.includes(muscle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [catalog.data, muscle]);

  if (authStatus !== 'signed-in') {
    return (
      <EmptyState icon={<Compass size={24} aria-hidden="true" />} title="Sin sesión">
        {authStatus === 'unconfigured'
          ? 'Supabase no está configurado: no se puede leer el catálogo todavía.'
          : 'Iniciá sesión para explorar el catálogo.'}
      </EmptyState>
    );
  }

  if (catalog.isPending) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <span className="sr-only">Cargando el catálogo…</span>
      </div>
    );
  }

  if (catalog.isError || !catalog.data) {
    return (
      <Notice tone="error" role="alert" icon={<AlertCircle size={16} aria-hidden="true" />}>
        No se pudo leer el catálogo. Revisá tu conexión y probá de nuevo.
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2.5">
        <SectionLabel>Músculo</SectionLabel>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((m) => (
            <Chip
              key={m}
              selected={muscle === m}
              onClick={() => setMuscle(muscle === m ? null : m)}
            >
              {MUSCLE_LABELS[m]}
            </Chip>
          ))}
        </div>
      </section>

      {muscle && exercises.length === 0 && (
        <EmptyState icon={<Compass size={20} aria-hidden="true" />} title="Nada cargado todavía">
          El catálogo de Blue Horse todavía no tiene ningún ejercicio marcado como principal para{' '}
          {MUSCLE_LABELS[muscle].toLowerCase()}.
        </EmptyState>
      )}

      {muscle && exercises.length > 0 && (
        <motion.ul
          variants={listContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2.5"
        >
          {exercises.map((exercise) => (
            <motion.li key={exercise.id} variants={listItem}>
              <ExploreCard
                exercise={exercise}
                open={openId === exercise.id}
                onToggle={() => setOpenId(openId === exercise.id ? null : exercise.id)}
                catalog={catalog.data}
                userId={userId}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}

/** Un ejercicio del catálogo. Cerrado muestra lo básico; abierto, otras formas de hacer lo mismo. */
function ExploreCard({
  exercise,
  open,
  onToggle,
  catalog,
  userId,
}: {
  readonly exercise: Exercise;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly catalog: NonNullable<ReturnType<typeof useGymCatalog>['data']>;
  readonly userId: string | undefined;
}) {
  const equipmentById = new Map(catalog.gym.equipment.map((e) => [e.id, e]));
  const sector = exercise.equipmentIds
    .map((id) => equipmentById.get(id)?.locationNote)
    .find((note): note is string => !!note);

  return (
    <Card animate={false} className="overflow-hidden">
      <motion.button
        type="button"
        {...tappable}
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-navy text-slate">
          <PatternIcon pattern={exercise.pattern} size={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold">{exercise.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate">
            <span>{PATTERN_LABELS[exercise.pattern]}</span>
            {sector && (
              <span className="flex items-center gap-1">
                <MapPin size={10} aria-hidden="true" />
                {sector}
              </span>
            )}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={spring.settle}>
          <ChevronDown size={16} className="text-slate-dim" aria-hidden="true" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.settle}
            className="overflow-hidden"
          >
            <AlternativesPanel exercise={exercise} catalog={catalog} userId={userId} />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/**
 * Otras formas de trabajar el mismo patrón y músculos, calculadas por el
 * mismo motor que resuelve "Cambiar ejercicio" en Hoy — de solo lectura acá,
 * no hay ningún plan que tocar.
 */
function AlternativesPanel({
  exercise,
  catalog,
  userId,
}: {
  readonly exercise: Exercise;
  readonly catalog: NonNullable<ReturnType<typeof useGymCatalog>['data']>;
  readonly userId: string | undefined;
}) {
  const options = useMemo<readonly SubstituteOption[]>(
    () =>
      engine.findSubstitutes({
        context: engineContext(userId ?? 'explorando-sin-sesion'),
        item: { exerciseId: exercise.id, equipmentId: exercise.equipmentIds[0] ?? null },
        gym: catalog.gym,
        constraints: [],
        unavailableEquipmentIds: [],
        ruleset: activeRuleset,
      }),
    [exercise, catalog, userId],
  );

  const exerciseById = new Map(catalog.gym.exercises.map((e) => [e.id, e]));
  const equipmentById = new Map(catalog.gym.equipment.map((e) => [e.id, e]));
  const others = options.filter((o) => o.exerciseId !== exercise.id);

  return (
    <div className="flex flex-col gap-2.5 border-t border-line/60 bg-surface-2 px-4 py-3.5">
      {exercise.cues && <p className="text-xs leading-relaxed text-slate">{exercise.cues}</p>}

      <p className="font-display text-[0.65rem] uppercase tracking-[0.16em] text-slate-dim">
        {others.length === 0 ? 'Sin otras formas equivalentes' : 'También podés hacerlo con'}
      </p>

      {others.length === 0 ? (
        <p className="text-xs leading-relaxed text-slate">
          Con lo que hay cargado en el catálogo, este es el único ejercicio para este patrón y estos
          músculos.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {others.slice(0, 6).map((option) => {
            const alt = exerciseById.get(option.exerciseId);
            const equipment = option.equipmentId
              ? equipmentById.get(option.equipmentId)
              : undefined;
            return (
              <div
                key={option.exerciseId}
                className="flex items-center gap-3 rounded-xl border border-line/70 bg-navy px-3 py-2.5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-slate">
                  <PatternIcon pattern={alt?.pattern ?? exercise.pattern} size={15} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">{alt?.name ?? 'Ejercicio'}</span>
                  <span className="truncate text-[0.65rem] text-slate-dim">
                    {equipment?.locationNote ?? muscleSummary(alt?.primaryMuscles ?? [])}
                  </span>
                </span>
                <span className="shrink-0 font-display text-xs font-semibold tabular-nums text-brand">
                  {Math.round(option.equivalence * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
