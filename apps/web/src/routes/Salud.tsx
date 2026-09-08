import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BrandMark, Button, Card, Notice, SectionLabel, Wordmark } from '../components/ui/index.ts';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { activeRuleset } from '../lib/engine.ts';
import { isCleared, useScreeningState, useSubmitScreening } from '../lib/health-screening.ts';
import { fadeUp, screen } from '../lib/motion.ts';

/**
 * CRIBADO PREVIO A ENTRENAR
 *
 * Antes de la primera sesión: siete preguntas de salud y el aviso legal. Es lo
 * único de la app que puede decir "esto no lo resolvemos nosotros, andá al
 * médico" — y tiene que poder decirlo, porque una app que arma planes sin
 * preguntar nada le da sentadillas con carga a alguien con angina inestable.
 *
 * Las preguntas y los textos salen del ruleset, no de acá.
 */
export function Salud() {
  const navigate = useNavigate();
  const { status } = useAuth();
  const state = useScreeningState();
  const submit = useSubmitScreening();
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const safety = activeRuleset.safety;

  // La sesión primero: una query gateada por sesión se queda en `isPending`
  // para siempre cuando Supabase no está configurado.
  if (status !== 'signed-in') {
    return (
      <Shell>
        <Notice tone="warn">Necesitás entrar antes de completar el cuestionario de salud.</Notice>
      </Shell>
    );
  }

  if (!safety) {
    return (
      <Shell>
        <Notice tone="warn">
          El contenido activo todavía no define un cuestionario de salud, así que no hay nada que
          completar acá.
        </Notice>
        <Button onClick={() => void navigate('/')}>Ir al entrenamiento</Button>
      </Shell>
    );
  }

  const { screening, disclaimer } = safety;

  if (state.isPending) {
    return (
      <Shell>
        <div role="status" className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-brand" aria-hidden="true" />
          <span className="sr-only">Cargando el cuestionario…</span>
        </div>
      </Shell>
    );
  }

  // Ya lo respondió y quedó frenado: se le vuelve a mostrar el motivo en vez de
  // dejarlo dando vueltas sin entender por qué no puede entrar.
  if (state.data?.answered && !state.data.cleared) {
    return (
      <Shell>
        <Notice tone="warn" icon={<AlertCircle size={16} aria-hidden="true" />}>
          {screening.blockedMessage}
        </Notice>
        <Button variant="ghost" onClick={() => setAnswers({})}>
          Responder de nuevo
        </Button>
      </Shell>
    );
  }

  const allAnswered = screening.questions.every((q) => answers[q.id] !== undefined);
  const wouldBlock = allAnswered && !isCleared(answers);

  async function onSubmit() {
    const cleared = await submit.mutateAsync(answers);
    if (cleared) await navigate('/onboarding');
  }

  return (
    <Shell>
      <SectionLabel>Antes de empezar</SectionLabel>
      <p className="text-sm text-slate">{screening.intro}</p>

      <ul className="flex flex-col gap-3">
        {screening.questions.map((question) => (
          <li key={question.id}>
            <Card>
              <p className="mb-3 text-sm font-medium text-ice">{question.text}</p>
              <div className="flex gap-2">
                <Answer
                  selected={answers[question.id] === false}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: false }))}
                >
                  No
                </Answer>
                <Answer
                  tone="warn"
                  selected={answers[question.id] === true}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: true }))}
                >
                  Sí
                </Answer>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {wouldBlock && (
        <Notice tone="warn" icon={<AlertCircle size={16} aria-hidden="true" />}>
          {screening.blockedMessage}
        </Notice>
      )}

      <Card tone="nested">
        <p className="text-xs leading-relaxed text-slate">{disclaimer}</p>
      </Card>

      {submit.isError && (
        <Notice tone="error" role="alert">
          No se pudo guardar el cuestionario. Probá de nuevo.
        </Notice>
      )}

      <Button disabled={!allAnswered || submit.isPending} onClick={() => void onSubmit()}>
        {submit.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShieldCheck size={16} aria-hidden="true" />
        )}
        {wouldBlock ? 'Guardar y ver qué sigue' : 'Acepto y quiero empezar'}
      </Button>
    </Shell>
  );
}

function Answer({
  selected,
  tone = 'brand',
  onClick,
  children,
}: {
  readonly selected: boolean;
  readonly tone?: 'brand' | 'warn';
  readonly onClick: () => void;
  readonly children: string;
}) {
  const selectedClass =
    tone === 'warn'
      ? 'border-amber bg-amber/15 text-amber'
      : 'border-brand bg-brand/15 text-brand shadow-brand';

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-11 flex-1 rounded-xl border px-4 text-sm font-semibold transition-colors ${
        selected ? selectedClass : 'border-line bg-surface-2 text-slate hover:border-line-bright'
      }`}
    >
      {children}
    </button>
  );
}

function Shell({ children }: { readonly children: React.ReactNode }) {
  return (
    <motion.main {...screen} className="mx-auto flex max-w-md flex-col gap-5 px-4 py-8">
      <motion.header {...fadeUp} className="flex flex-col items-center gap-2 text-center">
        <BrandMark className="size-14" />
        <Wordmark />
      </motion.header>
      {children}
    </motion.main>
  );
}
