import { AlertCircle, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { type FormEvent, useState } from 'react';
import { useAuth } from '../lib/auth/AuthProvider.tsx';
import { signInSchema, signUpSchema } from '../lib/auth/schemas.ts';
import { fadeUp, tappable } from '../lib/motion.ts';

/**
 * Pantalla de acceso. Google primero (un toque, sin contraseña que recordar
 * parado en el gimnasio) y email/contraseña como alternativa siempre visible.
 *
 * No exige ser socio de Blue Horse para crear la cuenta — ver ADR y el
 * onboarding, que es donde se asocia al gimnasio con el código de invitación.
 */

type Mode = 'sign-in' | 'sign-up';

export function SignIn() {
  const { signInWithPassword, signUpWithPassword, signInWithGoogle, status } = useAuth();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const unconfigured = status === 'unconfigured';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === 'sign-in') {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
        return;
      }
      setBusy(true);
      const { error: authError } = await signInWithPassword(
        parsed.data.email,
        parsed.data.password,
      );
      setBusy(false);
      if (authError) setError(authError);
      return;
    }

    const parsed = signUpSchema.safeParse({ email, password, displayName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.');
      return;
    }
    setBusy(true);
    const { error: authError } = await signUpWithPassword(
      parsed.data.email,
      parsed.data.password,
      parsed.data.displayName,
    );
    setBusy(false);
    if (authError) setError(authError);
  }

  async function handleGoogle() {
    setError(null);
    setGoogleBusy(true);
    const { error: authError } = await signInWithGoogle();
    setGoogleBusy(false);
    if (authError) setError(authError);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-10">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-2 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
          Blue Horse Gym
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {mode === 'sign-in' ? 'Entrá a tu cuenta' : 'Creá tu cuenta'}
        </h1>
      </motion.header>

      {unconfigured && (
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-start gap-2 rounded-lg border border-amber/40 bg-amber/10 px-4 py-3 text-sm"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber" aria-hidden="true" />
          Supabase no está configurado en este entorno: no se puede entrar todavía.
        </motion.p>
      )}

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5"
      >
        <motion.button
          type="button"
          {...tappable}
          disabled={unconfigured || googleBusy}
          onClick={handleGoogle}
          className="flex items-center justify-center gap-2.5 rounded-xl border border-line bg-navy-soft px-4 py-3.5 text-sm font-semibold disabled:opacity-50"
        >
          {googleBusy ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <GoogleMark />
          )}
          Continuar con Google
        </motion.button>

        <div className="flex items-center gap-3 text-xs text-slate">
          <span className="h-px flex-1 bg-line" />o con tu email
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {mode === 'sign-up' && (
              <motion.div
                key="displayName"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <label className="flex flex-col gap-1.5 text-sm" htmlFor="displayName">
                  Nombre
                  <input
                    id="displayName"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-lg border border-line bg-navy-soft px-3.5 py-2.5 text-ink outline-none focus:border-teal"
                  />
                </label>
              </motion.div>
            )}
          </AnimatePresence>

          <label className="flex flex-col gap-1.5 text-sm" htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-line bg-navy-soft px-3.5 py-2.5 text-ink outline-none focus:border-teal"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm" htmlFor="password">
            Contraseña
            <input
              id="password"
              type="password"
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-line bg-navy-soft px-3.5 py-2.5 text-ink outline-none focus:border-teal"
            />
          </label>

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

          <motion.button
            type="submit"
            {...tappable}
            disabled={unconfigured || busy}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3.5 text-sm font-semibold text-navy disabled:opacity-50"
          >
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {mode === 'sign-in' ? 'Entrar' : 'Crear cuenta'}
          </motion.button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
            setError(null);
          }}
          className="text-center text-sm text-slate underline-offset-4 hover:underline"
        >
          {mode === 'sign-in' ? '¿No tenés cuenta? Creala' : '¿Ya tenés cuenta? Entrá'}
        </button>
      </motion.div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.96H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.61H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}
