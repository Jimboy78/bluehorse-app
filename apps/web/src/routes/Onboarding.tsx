import type { ExperienceLevel, Goal, Sex } from '@bh/domain';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import type { z } from 'zod';
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
import { fadeUp, screen } from '../lib/motion.ts';
import {
  onboardingUnavailable,
  useCompleteOnboarding,
  useProfileStatus,
} from '../lib/onboarding.ts';
import { useGeneratePlan } from '../lib/plan.ts';
import {
  calibrationStepSchema,
  frequencyStepSchema,
  goalStepSchema,
  type OnboardingInput,
  onboardingSchema,
  personalStepSchema,
} from './onboarding/schemas.ts';

/**
 * Onboarding en 4 pasos. No pide carga por ejercicio a propósito: nadie mide su
 * fuerza en las 58 estaciones antes de la primera sesión, y preguntarlo sería
 * pedirle a alguien que invente números. "declared" guarda la intención; la
 * calibración real sale de lo que registre entrenando.
 */

const GOAL_LABELS: Record<Goal, string> = {
  strength: 'Fuerza',
  hypertrophy: 'Hipertrofia',
  power: 'Potencia / explosividad',
  cardio: 'Cardio',
  endurance: 'Resistencia',
  recomposition: 'Recomposición corporal',
};

const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Principiante',
  novice: 'Novato',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const SEX_LABELS: Record<Sex, string> = {
  female: 'Femenino',
  male: 'Masculino',
  other: 'Otro',
  undisclosed: 'Prefiero no decir',
};

type Draft = Partial<OnboardingInput>;

const STEPS = ['objetivo', 'personal', 'frecuencia', 'calibracion'] as const;

/** Nombre en castellano de cada campo del wizard, para poder decir qué falta. */
const FIELD_LABELS: Record<string, string> = {
  goal: 'el objetivo',
  birthDate: 'la fecha de nacimiento',
  sex: 'el sexo',
  experienceLevel: 'el nivel de experiencia',
  sessionsPerWeekTarget: 'las sesiones por semana',
  sessionMinutesTarget: 'los minutos por sesión',
  baselineMode: 'si ya sabés cuánto levantás',
};

function missingFields(error: z.ZodError): string[] {
  const names = error.issues.map((issue) => {
    const field = String(issue.path[0] ?? '');
    return FIELD_LABELS[field] ?? field;
  });
  return [...new Set(names)];
}

export function Onboarding() {
  const navigate = useNavigate();
  const profile = useProfileStatus();
  const complete = useCompleteOnboarding();
  const generatePlan = useGeneratePlan();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [error, setError] = useState<string | null>(null);

  // Ya lo completó (llegó acá por error o volvió atrás): no tiene sentido repetirlo.
  if (profile.data?.onboarded) {
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

  async function handleFinish(patch: Draft) {
    const full = { ...draft, ...patch };
    const parsed = onboardingSchema.safeParse(full);
    if (!parsed.success) {
      // Decir QUÉ falta, no solo que falta algo: "volvé a los pasos anteriores"
      // deja a alguien que cree haber completado todo sin ninguna salida.
      setError(`Falta completar: ${missingFields(parsed.error).join(', ')}.`);
      return;
    }
    try {
      await complete.mutateAsync(parsed.data);
    } catch {
      setError('No se pudo guardar. Revisá tu conexión y probá de nuevo.');
      return;
    }

    // El perfil y el objetivo ya se guardaron: si esto falla, no hacemos
    // volver al socio a repetir el onboarding. La regeneración manual llega
    // con la pantalla "Hoy" real (Fase 2); por ahora solo se loguea.
    try {
      await generatePlan.mutateAsync();
    } catch (planErr) {
      console.error('No se pudo generar el plan inicial:', planErr);
    }

    navigate('/', { replace: true });
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
            Paso {stepIndex + 1} de {STEPS.length}
          </span>
        </div>
        {/* Cuatro segmentos y no una barra continua: los pasos son discretos y
            se puede volver atrás, así que la persona tiene que poder contar
            cuántos le faltan, no estimar un porcentaje. */}
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-line">
              <motion.span
                initial={false}
                animate={{ opacity: i <= stepIndex ? 1 : 0 }}
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

      <AnimatePresence mode="wait">
        {step === 'objetivo' && <GoalStep key="objetivo" initial={draft} onNext={goNext} />}
        {step === 'personal' && (
          <PersonalStep key="personal" initial={draft} onNext={goNext} onBack={goBack} />
        )}
        {step === 'frecuencia' && (
          <FrequencyStep key="frecuencia" initial={draft} onNext={goNext} onBack={goBack} />
        )}
        {step === 'calibracion' && (
          <CalibrationStep
            key="calibracion"
            initial={draft}
            onBack={goBack}
            onFinish={handleFinish}
            busy={complete.isPending}
          />
        )}
      </AnimatePresence>

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
        {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
          <OptionCard
            key={g}
            selected={goal === g}
            onClick={() => setGoal(g)}
            title={GOAL_LABELS[g]}
          />
        ))}
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
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(
    initial.experienceLevel ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = personalStepSchema.safeParse({ birthDate, sex, experienceLevel });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
      return;
    }
    onNext(parsed.data);
  }

  return (
    <motion.form {...screen} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <StepTitle>Contanos de vos</StepTitle>

      <Field label="Fecha de nacimiento" htmlFor="birthDate">
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className={fieldClass}
        />
      </Field>

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

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate">
          Nivel de experiencia entrenando
        </span>
        <div className="flex flex-col gap-2">
          {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((lvl) => (
            <OptionCard
              key={lvl}
              selected={experienceLevel === lvl}
              onClick={() => setExperienceLevel(lvl)}
              title={EXPERIENCE_LABELS[lvl]}
            />
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-orange">
          {error}
        </p>
      )}

      <StepNav onBack={onBack} />
    </motion.form>
  );
}

// ---------------------------------------------------------------- paso 3

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
        <span className="font-display text-2xl font-semibold tabular-nums text-brand">{value}</span>
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

// ---------------------------------------------------------------- paso 4

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

      <StepNav onBack={onBack} busy={busy} disabled={onboardingUnavailable} label="Empezar" />
    </motion.form>
  );
}
