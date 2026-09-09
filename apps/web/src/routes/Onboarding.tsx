import type { ExperienceLevel, Goal, Sex } from '@bh/domain';
import {
  Activity,
  AlertCircle,
  Dumbbell,
  Flame,
  HeartPulse,
  Loader2,
  type LucideIcon,
  Ruler,
  Scale,
  Target,
  Timer,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import type { z } from 'zod';
import { PlanPreview } from '../components/PlanPreview.tsx';
import {
  BrandMark,
  Button,
  Chip,
  Field,
  fieldClass,
  Notice,
  OptionCard,
  Wordmark,
} from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { fadeUp, screen, spring } from '../lib/motion.ts';
import {
  onboardingUnavailable,
  useCompleteOnboarding,
  useProfileStatus,
} from '../lib/onboarding.ts';
import type { PlanPreview as Preview } from '../lib/plan-preview.ts';
import { useAvoidExercise, useBuildPlanPreview, useConfirmPlan } from '../lib/plan-preview.ts';
import {
  calibrationStepSchema,
  experienceStepSchema,
  frequencyStepSchema,
  goalStepSchema,
  type OnboardingInput,
  onboardingSchema,
  personalStepSchema,
} from './onboarding/schemas.ts';

/**
 * Onboarding en 5 pasos y una vista previa.
 *
 * No pide carga por ejercicio a propósito: nadie mide su fuerza en las 58
 * estaciones antes de la primera sesión, y preguntarlo sería pedirle a alguien
 * que invente números. "declared" guarda la intención; la calibración real
 * sale de lo que registre entrenando.
 *
 * Sí pide peso y altura, que antes no se preguntaban en ningún lado: es lo
 * que hace que un ejercicio a peso corporal deje de decir "sin carga previa"
 * y que la recomposición corporal tenga contra qué medirse.
 *
 * El último paso ya no guarda el plan a ciegas: lo arma, lo muestra y recién
 * lo guarda cuando la persona lo confirma. Ver `components/PlanPreview.tsx`.
 */

const GOAL_LABELS: Record<Goal, string> = {
  strength: 'Fuerza',
  hypertrophy: 'Hipertrofia',
  power: 'Potencia / explosividad',
  cardio: 'Cardio',
  endurance: 'Resistencia',
  recomposition: 'Recomposición corporal',
};

/**
 * Un ícono por objetivo. No es adorno: son seis opciones apiladas y todas
 * empiezan igual de grises. El ícono es lo que deja encontrar la propia sin
 * leer las seis.
 */
const GOAL_ICONS: Record<Goal, LucideIcon> = {
  strength: Dumbbell,
  hypertrophy: Target,
  power: Zap,
  cardio: HeartPulse,
  endurance: Timer,
  recomposition: Flame,
};

const GOAL_HINTS: Record<Goal, string> = {
  strength: 'Levantar más peso, aunque el cuerpo cambie poco.',
  hypertrophy: 'Ganar masa muscular.',
  power: 'Moverte más rápido y más explosivo.',
  cardio: 'Aguantar más corriendo, en bici o en la escaladora.',
  endurance: 'Aguantar más repeticiones sin fundirte.',
  recomposition: 'Bajar grasa y ganar músculo a la vez.',
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Principiante',
  novice: 'Novato',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

/**
 * Sin esto, las cuatro opciones eran cuatro palabras sueltas y nadie sabía si
 * era "novato" o "intermedio" — y ese dato decide qué ejercicios entran al
 * plan. Las pistas son cualitativas a propósito: poner "menos de 6 meses"
 * sería inventar un umbral que no está en la investigación.
 */
const EXPERIENCE_HINTS: Record<ExperienceLevel, string> = {
  beginner: 'Es tu primera vez, o volvés después de mucho tiempo parado.',
  novice: 'Ya entrenaste algunas veces, pero todavía estás aprendiendo la técnica.',
  intermediate: 'Entrenás seguido desde hace tiempo y la técnica ya te sale sola.',
  advanced: 'Llevás años entrenando, conocés tus cargas y cómo recuperás.',
};

const SEX_LABELS: Record<Sex, string> = {
  female: 'Femenino',
  male: 'Masculino',
  other: 'Otro',
  undisclosed: 'Prefiero no decir',
};

type Draft = Partial<OnboardingInput>;

const STEPS = ['objetivo', 'personal', 'experiencia', 'frecuencia', 'calibracion'] as const;

/**
 * Cada campo del wizard: cómo se llama en castellano y en qué paso se
 * contesta. Lo segundo no es un adorno — sin eso, "Falta completar las
 * sesiones por semana" es un cartel que dice qué falta y deja a la persona
 * buscando el paso a mano, tocando "Atrás" hasta encontrarlo.
 */
const FIELDS: Record<string, { readonly label: string; readonly step: number }> = {
  goal: { label: 'el objetivo', step: 0 },
  birthDate: { label: 'la fecha de nacimiento', step: 1 },
  sex: { label: 'el sexo', step: 1 },
  weightKg: { label: 'el peso', step: 1 },
  heightCm: { label: 'la altura', step: 1 },
  experienceLevel: { label: 'el nivel de experiencia', step: 2 },
  sessionsPerWeekTarget: { label: 'las sesiones por semana', step: 3 },
  sessionMinutesTarget: { label: 'los minutos por sesión', step: 3 },
  baselineMode: { label: 'si ya sabés cuánto levantás', step: 4 },
};

function missingFields(error: z.ZodError): string[] {
  const names = error.issues.map((issue) => {
    const field = String(issue.path[0] ?? '');
    return FIELDS[field]?.label ?? field;
  });
  return [...new Set(names)];
}

/** El primer paso del wizard donde falta algo, para poder llevar a la persona ahí. */
function firstMissingStep(error: z.ZodError): number {
  const steps = error.issues.map((issue) => FIELDS[String(issue.path[0] ?? '')]?.step ?? 0);
  return Math.min(...steps);
}

/**
 * En qué está el wizard: contestando (`stepIndex`), armando el plan, o
 * mirando la previa. Es un estado y no tres banderas sueltas porque las tres
 * situaciones son excluyentes y con banderas se puede llegar a "armando y
 * mirando" a la vez.
 */
type Stage =
  | { readonly kind: 'preguntas' }
  | { readonly kind: 'armando' }
  | { readonly kind: 'previa'; readonly preview: Preview };

export function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useProfileStatus();
  const complete = useCompleteOnboarding();
  const buildPreview = useBuildPlanPreview();
  const confirmPlan = useConfirmPlan();
  const avoidExercise = useAvoidExercise();

  const [stepIndex, setStepIndex] = useState(0);
  const [stage, setStage] = useState<Stage>({ kind: 'preguntas' });
  const [draft, setDraft] = useState<Draft>({});
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Ya lo completó (llegó acá por error o volvió atrás): no tiene sentido repetirlo.
  if (profile.data?.onboarded && stage.kind === 'preguntas') {
    navigate('/', { replace: true });
    return null;
  }

  const step = STEPS[stepIndex];

  function goNext(patch: Draft) {
    setError(null);
    setDraft((prev) => ({ ...prev, ...patch }));
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function buildAndShow(variant: number) {
    const preview = await buildPreview.mutateAsync(variant);
    setStage({ kind: 'previa', preview });
  }

  async function handleFinish(patch: Draft) {
    const full = { ...draft, ...patch };
    const parsed = onboardingSchema.safeParse(full);
    if (!parsed.success) {
      // Decir QUÉ falta y además LLEVAR ahí: nombrar el campo sin moverse deja
      // a alguien que cree haber completado todo tocando "Atrás" a ciegas.
      setError(`Falta completar: ${missingFields(parsed.error).join(', ')}.`);
      setStepIndex(firstMissingStep(parsed.error));
      return;
    }

    setError(null);
    try {
      await complete.mutateAsync(parsed.data);
    } catch {
      setError('No se pudo guardar. Revisá tu conexión y probá de nuevo.');
      return;
    }

    // El perfil y el objetivo ya están guardados. Si armar la previa falla, el
    // socio NO queda trabado: entra a la app y "Hoy" le ofrece generar el plan.
    setStage({ kind: 'armando' });
    try {
      await buildAndShow(0);
    } catch {
      navigate('/', { replace: true });
    }
  }

  async function handleRegenerate() {
    if (stage.kind !== 'previa') return;
    setRegenerating(true);
    setError(null);
    try {
      await buildAndShow(stage.preview.variant + 1);
    } catch {
      setError('No se pudo armar otra combinación. Probá de nuevo.');
    } finally {
      setRegenerating(false);
    }
  }

  async function handleAvoid(exerciseId: string) {
    if (stage.kind !== 'previa') return;
    const variant = stage.preview.variant;
    setError(null);
    try {
      await avoidExercise.mutateAsync(exerciseId);
      await buildAndShow(variant);
    } catch {
      setError('No se pudo descartar el ejercicio. Probá de nuevo.');
    }
  }

  async function handleConfirm() {
    if (stage.kind !== 'previa') return;
    setError(null);
    try {
      await confirmPlan.mutateAsync(stage.preview);
      navigate('/', { replace: true });
    } catch {
      setError('No se pudo guardar el plan. Revisá tu conexión y probá de nuevo.');
    }
  }

  const showingPreview = stage.kind !== 'preguntas';

  /** La única pantalla que corresponde ahora mismo. Ver el comentario del `AnimatePresence`. */
  function renderStage() {
    if (stage.kind === 'armando') return <BuildingPlan key="armando" />;

    if (stage.kind === 'previa') {
      if (!user) return null;
      return (
        <PlanPreview
          key="previa"
          preview={stage.preview}
          userId={user.id}
          busy={confirmPlan.isPending || avoidExercise.isPending}
          regenerating={regenerating}
          onChange={(next) => setStage({ kind: 'previa', preview: next })}
          onRegenerate={() => void handleRegenerate()}
          onConfirm={() => void handleConfirm()}
          onAvoid={(id) => void handleAvoid(id)}
        />
      );
    }

    switch (step) {
      case 'objetivo':
        return <GoalStep key="objetivo" initial={draft} onNext={goNext} />;
      case 'personal':
        return <PersonalStep key="personal" initial={draft} onNext={goNext} onBack={goBack} />;
      case 'experiencia':
        return <ExperienceStep key="experiencia" initial={draft} onNext={goNext} onBack={goBack} />;
      case 'frecuencia':
        return <FrequencyStep key="frecuencia" initial={draft} onNext={goNext} onBack={goBack} />;
      default:
        return (
          <CalibrationStep
            key="calibracion"
            initial={draft}
            onBack={goBack}
            onFinish={(patch) => void handleFinish(patch)}
            busy={complete.isPending}
          />
        );
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-7 px-6 py-10">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3"
      >
        <div className="flex items-center gap-2.5">
          <BrandMark size={22} />
          <Wordmark />
          <span className="ml-auto font-display text-[0.65rem] uppercase tracking-[0.18em] text-slate">
            {showingPreview ? 'Tu plan' : `Paso ${stepIndex + 1} de ${STEPS.length}`}
          </span>
        </div>
        {/* Segmentos y no una barra continua: los pasos son discretos y se
            puede volver atrás, así que la persona tiene que poder contar
            cuántos le faltan, no estimar un porcentaje. */}
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <motion.span
                initial={false}
                animate={{ scaleX: showingPreview || i <= stepIndex ? 1 : 0 }}
                style={{ originX: 0 }}
                transition={spring.settle}
                className="block h-full rounded-full bg-gradient-to-r from-brand-deep to-brand-bright"
              />
            </span>
          ))}
        </div>
      </motion.div>

      {onboardingUnavailable && (
        <Notice tone="warn" icon={<AlertCircle size={16} aria-hidden="true" />}>
          Supabase no está configurado: no se puede guardar el onboarding todavía.
        </Notice>
      )}

      {/* Un SOLO hijo, no una lista de condicionales.
          `mode="wait"` espera a que el que sale termine su animación antes de
          montar el que entra, y con siete ramas (seis en `false` y una
          verdadera) se queda esperando una salida que no resuelve: el paso 5
          nunca aparecía, la cabecera decía "Paso 5 de 5" y abajo seguía el 4.
          Con un solo hijo por vez el modo hace lo que promete. */}
      <AnimatePresence mode="wait">{renderStage()}</AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 overflow-hidden text-sm text-orange"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </main>
  );
}

/**
 * El rato en que el motor arma el plan. Antes esto era invisible: la persona
 * apretaba "Empezar" y la pantalla se quedaba quieta hasta que aparecía "Hoy".
 * Son dos consultas a la base y una corrida del motor — corto, pero no
 * instantáneo, y el silencio se lee como que la app se colgó.
 */
function BuildingPlan() {
  const pasos = [
    'Leyendo lo que nos contaste',
    'Mirando qué hay libre en el gimnasio',
    'Armando la cola de sesiones',
  ];

  return (
    <motion.div
      key="armando"
      {...screen}
      className="flex flex-col items-center gap-6 py-14 text-center"
    >
      {/* La marca girando, no un anillo genérico: es el único momento de la
          app donde se espera algo, y dura lo suficiente para mirarlo. */}
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        className="grid size-16 place-items-center rounded-full border border-brand/25 bg-brand/10 text-brand shadow-brand"
      >
        <Activity size={26} aria-hidden="true" />
      </motion.span>

      <div className="flex flex-col gap-1">
        <p className="font-display text-xl font-semibold uppercase tracking-tight">
          Armando tu plan
        </p>
        <p className="text-sm text-slate">Con el equipamiento real de Blue Horse.</p>
      </div>

      <ul className="flex flex-col gap-2">
        {pasos.map((paso, i) => (
          <motion.li
            key={paso}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.35 }}
            className="text-xs text-slate-dim"
          >
            {paso}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

/** El título de cada paso, siempre con la misma voz y el mismo peso. */
function StepTitle({ children }: { children: string }) {
  return (
    <h1 className="font-display text-[2rem] font-semibold uppercase leading-[1.05] tracking-tight">
      {children}
    </h1>
  );
}

/** Atrás + seguir, siempre en el mismo lugar y con la misma jerarquía. */
function StepNav({
  onBack,
  busy,
  disabled,
  label = 'Seguir',
}: {
  onBack?: () => void;
  busy?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className="mt-2 flex gap-3">
      {onBack && (
        <Button variant="ghost" size="lg" onClick={onBack} disabled={busy}>
          Atrás
        </Button>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="flex-1"
        disabled={busy || disabled}
      >
        {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {label}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- paso 1

function GoalStep({ initial, onNext }: { initial: Draft; onNext: (patch: Draft) => void }) {
  const [goal, setGoal] = useState<Goal | null>(initial.goal ?? null);
  const [sport, setSport] = useState(initial.sport ?? '');
  const [touched, setTouched] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    const parsed = goalStepSchema.safeParse({ goal, sport });
    if (!parsed.success) return;
    onNext(parsed.data);
  }

  return (
    <motion.form {...screen} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <StepTitle>¿Cuál es tu objetivo?</StepTitle>

      <div className="flex flex-col gap-2">
        {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => {
          const Icon = GOAL_ICONS[g];
          return (
            <OptionCard
              key={g}
              selected={goal === g}
              onClick={() => setGoal(g)}
              icon={<Icon size={18} aria-hidden="true" />}
              title={GOAL_LABELS[g]}
              hint={GOAL_HINTS[g]}
            />
          );
        })}
      </div>
      {touched && !goal && (
        <p role="alert" className="text-sm text-orange">
          Elegí un objetivo.
        </p>
      )}

      <Field label="Deporte que practicás (opcional)" htmlFor="sport">
        <input
          id="sport"
          type="text"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Fútbol, running, ninguno…"
          className={fieldClass}
        />
      </Field>

      <StepNav />
    </motion.form>
  );
}

// ---------------------------------------------------------------- paso 2

function PersonalStep({
  initial,
  onNext,
  onBack,
}: {
  initial: Draft;
  onNext: (patch: Draft) => void;
  onBack: () => void;
}) {
  const [birthDate, setBirthDate] = useState(initial.birthDate ?? '');
  const [sex, setSex] = useState<Sex>(initial.sex ?? 'undisclosed');
  const [weight, setWeight] = useState(initial.weightKg ? String(initial.weightKg) : '');
  const [height, setHeight] = useState(initial.heightCm ? String(initial.heightCm) : '');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = personalStepSchema.safeParse({
      birthDate,
      sex,
      weightKg: weight,
      heightCm: height,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
      return;
    }
    onNext(parsed.data);
  }

  return (
    <motion.form {...screen} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <StepTitle>Contanos de vos</StepTitle>
      <p className="-mt-2 text-sm leading-relaxed text-slate">
        La edad ajusta el descanso entre series. El peso y la altura quedan como punto de partida:
        se registran cada vez que quieras y son contra lo que se mide el progreso.
      </p>

      <Field label="Fecha de nacimiento" htmlFor="birthDate">
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className={fieldClass}
        />
      </Field>

      {/* Los dos en la misma fila: son dos números cortos y separarlos en dos
          filas empuja el botón "Seguir" abajo del pliegue en un teléfono. */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Peso" htmlFor="weight" icon={<Scale size={13} aria-hidden="true" />}>
          <div className="relative">
            <input
              id="weight"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={25}
              max={350}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="78"
              className={`${fieldClass} pr-10`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-medium text-slate-dim">
              kg
            </span>
          </div>
        </Field>

        <Field label="Altura" htmlFor="height" icon={<Ruler size={13} aria-hidden="true" />}>
          <div className="relative">
            <input
              id="height"
              type="number"
              inputMode="numeric"
              step="1"
              min={100}
              max={250}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="175"
              className={`${fieldClass} pr-10`}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-xs font-medium text-slate-dim">
              cm
            </span>
          </div>
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">Sexo</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SEX_LABELS) as Sex[]).map((s) => (
            <Chip key={s} selected={sex === s} onClick={() => setSex(s)}>
              {SEX_LABELS[s]}
            </Chip>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-orange">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <StepNav onBack={onBack} />
    </motion.form>
  );
}

// ---------------------------------------------------------------- paso 3

function ExperienceStep({
  initial,
  onNext,
  onBack,
}: {
  initial: Draft;
  onNext: (patch: Draft) => void;
  onBack: () => void;
}) {
  const [experienceLevel, setLevel] = useState<ExperienceLevel | null>(
    initial.experienceLevel ?? null,
  );
  const [touched, setTouched] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    const parsed = experienceStepSchema.safeParse({ experienceLevel });
    if (!parsed.success) return;
    onNext(parsed.data);
  }

  return (
    <motion.form {...screen} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <StepTitle>¿Cuánto hace que entrenás?</StepTitle>
      <p className="-mt-2 text-sm leading-relaxed text-slate">
        Decide qué ejercicios entran al plan: los que piden técnica fina no aparecen hasta que
        tengan sentido.
      </p>

      <div className="flex flex-col gap-2">
        {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((lvl) => (
          <OptionCard
            key={lvl}
            selected={experienceLevel === lvl}
            onClick={() => setLevel(lvl)}
            title={EXPERIENCE_LABELS[lvl]}
            hint={EXPERIENCE_HINTS[lvl]}
          />
        ))}
      </div>

      {touched && !experienceLevel && (
        <p role="alert" className="text-sm text-orange">
          Elegí tu nivel.
        </p>
      )}

      <StepNav onBack={onBack} />
    </motion.form>
  );
}

// ---------------------------------------------------------------- paso 4

function FrequencyStep({
  initial,
  onNext,
  onBack,
}: {
  initial: Draft;
  onNext: (patch: Draft) => void;
  onBack: () => void;
}) {
  const [sessionsPerWeekTarget, setSessions] = useState(initial.sessionsPerWeekTarget ?? 3);
  const [sessionMinutesTarget, setMinutes] = useState(initial.sessionMinutesTarget ?? 60);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = frequencyStepSchema.safeParse({ sessionsPerWeekTarget, sessionMinutesTarget });
    if (!parsed.success) return;
    onNext(parsed.data);
  }

  return (
    <motion.form {...screen} onSubmit={handleSubmit} className="flex flex-col gap-7">
      <StepTitle>¿Con qué frecuencia?</StepTitle>

      <Slider
        id="sessions"
        label="Sesiones por semana"
        value={sessionsPerWeekTarget}
        min={1}
        max={7}
        onChange={setSessions}
      />

      <Slider
        id="minutes"
        label="Minutos por sesión"
        value={sessionMinutesTarget}
        min={15}
        max={120}
        step={5}
        onChange={setMinutes}
      />

      <StepNav onBack={onBack} />
    </motion.form>
  );
}

/**
 * Slider con el valor grande al lado de la etiqueta. Arrastrando con el
 * pulgar, el dedo tapa el pulgar del control: el número tiene que estar
 * arriba, fuera de donde está la mano.
 */
function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="flex items-baseline justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate"
      >
        {label}
        {/* `key` en el número para que cada valor entre con su propio pop: sin
            eso el contador cambia sin que se note que cambió. */}
        <motion.span
          key={value}
          initial={{ scale: 0.85, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={spring.pop}
          className="font-display text-2xl font-semibold tabular-nums text-brand"
        >
          {value}
        </motion.span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// ---------------------------------------------------------------- paso 5

function CalibrationStep({
  initial,
  onBack,
  onFinish,
  busy,
}: {
  initial: Draft;
  onBack: () => void;
  onFinish: (patch: Draft) => void;
  busy: boolean;
}) {
  const [baselineMode, setMode] = useState<'declared' | 'calibrate'>(
    initial.baselineMode ?? 'calibrate',
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = calibrationStepSchema.safeParse({ baselineMode });
    if (!parsed.success) return;
    onFinish(parsed.data);
  }

  return (
    <motion.form {...screen} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <StepTitle>¿Ya sabés cuánto levantás?</StepTitle>
      <p className="text-sm leading-relaxed text-slate">
        Nadie mide su fuerza en cada máquina antes de empezar. Elegí lo que te quede cómodo: la
        carga de cada ejercicio se ajusta sola con lo que registres en las primeras sesiones.
      </p>

      <div className="flex flex-col gap-2">
        <OptionCard
          selected={baselineMode === 'declared'}
          onClick={() => setMode('declared')}
          title="Ya sé con cuánto entreno"
          hint="Te voy a pedir tus pesos cuando cargues el primer ejercicio."
        />
        <OptionCard
          selected={baselineMode === 'calibrate'}
          onClick={() => setMode('calibrate')}
          title="Prefiero que lo calculen por mí"
          hint="Las primeras sesiones arrancan livianas y se ajustan según cómo te sientas."
        />
      </div>

      <StepNav onBack={onBack} busy={busy} disabled={onboardingUnavailable} label="Ver mi plan" />
    </motion.form>
  );
}
