import type { ExperienceLevel, Goal, Sex } from '@bh/domain';
import { AlertCircle, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { fadeUp, screen, tappable } from '../lib/motion.ts';
import {
  onboardingUnavailable,
  useCompleteOnboarding,
  useProfileStatus,
} from '../lib/onboarding.ts';
import {
  calibrationStepSchema,
  frequencyStepSchema,
  goalStepSchema,
  type OnboardingInput,
  onboardingSchema,
  personalStepSchema,
} from './onboarding/schemas.ts';

/**
 * Onboarding en 4 pasos. No pide carga por ejercicio: el catálogo de Blue
 * Horse todavía no está cargado (Fase 0 del roadmap), así que "declared" solo
 * guarda la intención — la calibración real ocurre en la primera sesión,
 * contra equipamiento real.
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

export function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useProfileStatus();
  const complete = useCompleteOnboarding();

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
      setError('Faltan datos. Volvé a los pasos anteriores y completalos.');
      return;
    }
    try {
      await complete.mutateAsync(parsed.data);
      navigate('/', { replace: true });
    } catch {
      setError('No se pudo guardar. Revisá tu conexión y probá de nuevo.');
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col gap-8 px-6 py-10">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          {user?.email ?? 'Blue Horse Gym'}
        </p>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-teal' : 'bg-line'
              }`}
            />
          ))}
        </div>
      </motion.div>

      {onboardingUnavailable && (
        <p className="flex items-start gap-2 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber" aria-hidden="true" />
          Supabase no está configurado: no se puede guardar el onboarding todavía.
        </p>
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
      <h1 className="text-2xl font-bold tracking-tight">¿Cuál es tu objetivo?</h1>

      <div className="flex flex-col gap-2">
        {(Object.keys(GOAL_LABELS) as Goal[]).map((g) => (
          <motion.button
            key={g}
            type="button"
            {...tappable}
            onClick={() => setGoal(g)}
            className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
              goal === g ? 'border-teal bg-teal/10 text-teal' : 'border-line bg-navy-soft'
            }`}
          >
            {GOAL_LABELS[g]}
          </motion.button>
        ))}
      </div>
      {touched && !goal && <p className="text-sm text-orange">Elegí un objetivo.</p>}

      <label className="flex flex-col gap-1.5 text-sm" htmlFor="sport">
        Deporte que practicás (opcional)
        <input
          id="sport"
          type="text"
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Fútbol, running, ninguno…"
          className="rounded-lg border border-line bg-navy-soft px-3.5 py-2.5 text-ink outline-none focus:border-teal"
        />
      </label>

      <motion.button
        type="submit"
        {...tappable}
        className="mt-2 rounded-xl bg-teal px-4 py-3.5 text-sm font-semibold text-navy"
      >
        Seguir
      </motion.button>
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
      <h1 className="text-2xl font-bold tracking-tight">Contanos de vos</h1>

      <label className="flex flex-col gap-1.5 text-sm" htmlFor="birthDate">
        Fecha de nacimiento
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className="rounded-lg border border-line bg-navy-soft px-3.5 py-2.5 text-ink outline-none focus:border-teal"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm">Sexo</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SEX_LABELS) as Sex[]).map((s) => (
            <motion.button
              key={s}
              type="button"
              {...tappable}
              onClick={() => setSex(s)}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold ${
                sex === s ? 'border-teal bg-teal/10 text-teal' : 'border-line bg-navy-soft'
              }`}
            >
              {SEX_LABELS[s]}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm">Nivel de experiencia entrenando</span>
        <div className="flex flex-col gap-2">
          {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((lvl) => (
            <motion.button
              key={lvl}
              type="button"
              {...tappable}
              onClick={() => setExperienceLevel(lvl)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${
                experienceLevel === lvl
                  ? 'border-teal bg-teal/10 text-teal'
                  : 'border-line bg-navy-soft'
              }`}
            >
              {EXPERIENCE_LABELS[lvl]}
            </motion.button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-orange">{error}</p>}

      <div className="mt-2 flex gap-3">
        <motion.button
          type="button"
          {...tappable}
          onClick={onBack}
          className="rounded-xl border border-line px-4 py-3.5 text-sm font-semibold text-slate"
        >
          Atrás
        </motion.button>
        <motion.button
          type="submit"
          {...tappable}
          className="flex-1 rounded-xl bg-teal px-4 py-3.5 text-sm font-semibold text-navy"
        >
          Seguir
        </motion.button>
      </div>
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
    <motion.form {...screen} onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">¿Con qué frecuencia?</h1>

      <div className="flex flex-col gap-2">
        <span className="text-sm">
          Sesiones por semana: <strong className="text-teal">{sessionsPerWeekTarget}</strong>
        </span>
        <input
          type="range"
          min={1}
          max={7}
          value={sessionsPerWeekTarget}
          onChange={(e) => setSessions(Number(e.target.value))}
          className="accent-teal"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm">
          Minutos por sesión: <strong className="text-teal">{sessionMinutesTarget}</strong>
        </span>
        <input
          type="range"
          min={15}
          max={120}
          step={5}
          value={sessionMinutesTarget}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="accent-teal"
        />
      </div>

      <div className="mt-2 flex gap-3">
        <motion.button
          type="button"
          {...tappable}
          onClick={onBack}
          className="rounded-xl border border-line px-4 py-3.5 text-sm font-semibold text-slate"
        >
          Atrás
        </motion.button>
        <motion.button
          type="submit"
          {...tappable}
          className="flex-1 rounded-xl bg-teal px-4 py-3.5 text-sm font-semibold text-navy"
        >
          Seguir
        </motion.button>
      </div>
    </motion.form>
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
      <h1 className="text-2xl font-bold tracking-tight">¿Ya sabés cuánto levantás?</h1>
      <p className="text-sm text-slate">
        El catálogo de Blue Horse todavía se está cargando: por ahora esto solo guarda tu
        preferencia. Cuando esté disponible el equipamiento real, te lo preguntamos ejercicio por
        ejercicio.
      </p>

      <div className="flex flex-col gap-2">
        <motion.button
          type="button"
          {...tappable}
          onClick={() => setMode('declared')}
          className={`rounded-xl border px-4 py-3 text-left text-sm ${
            baselineMode === 'declared' ? 'border-teal bg-teal/10' : 'border-line bg-navy-soft'
          }`}
        >
          <span className="font-semibold">Ya sé con cuánto entreno</span>
          <span className="mt-0.5 block text-xs text-slate">
            Te voy a pedir tus pesos cuando cargues el primer ejercicio.
          </span>
        </motion.button>
        <motion.button
          type="button"
          {...tappable}
          onClick={() => setMode('calibrate')}
          className={`rounded-xl border px-4 py-3 text-left text-sm ${
            baselineMode === 'calibrate' ? 'border-teal bg-teal/10' : 'border-line bg-navy-soft'
          }`}
        >
          <span className="font-semibold">Prefiero que lo calculen por mí</span>
          <span className="mt-0.5 block text-xs text-slate">
            Las primeras sesiones arrancan livianas y se ajustan según cómo te sientas.
          </span>
        </motion.button>
      </div>

      <div className="mt-2 flex gap-3">
        <motion.button
          type="button"
          {...tappable}
          onClick={onBack}
          disabled={busy}
          className="rounded-xl border border-line px-4 py-3.5 text-sm font-semibold text-slate disabled:opacity-50"
        >
          Atrás
        </motion.button>
        <motion.button
          type="submit"
          {...tappable}
          disabled={busy || onboardingUnavailable}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3.5 text-sm font-semibold text-navy disabled:opacity-50"
        >
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
          Empezar
        </motion.button>
      </div>
    </motion.form>
  );
}
