import { Download, Share, SquarePlus, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { fadeUp, listContainer, listItem, tappable } from '../lib/motion.ts';
import { useInstallPrompt } from '../lib/use-install-prompt.ts';

/**
 * DESTINO DEL QR pegado en Blue Horse Gym. Pública a propósito — nadie
 * escaneó ese cartel con una cuenta creada todavía. Instala la PWA (o
 * explica cómo, en iOS, que no tiene instalación programática) y de ahí
 * pasa a `/auth`. No hace falta estar en el gimnasio para entrar acá, pero
 * el diseño asume que sí: alguien con el teléfono en la mano, mirando de
 * reojo un cartel en la pared.
 */
export function Instalar() {
  const { platform, isStandalone, canPromptInstall, promptInstall } = useInstallPrompt();

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-10">
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-3 text-center"
      >
        <img src="/icon.svg" alt="" className="size-16" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
            Blue Horse Gym · Arroyo Seco
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Push your limits</h1>
        </div>
        <p className="text-sm text-slate">
          Tu entrenamiento, ajustado a lo que hay en el gimnasio. Instalala una vez y arrancás desde
          el ícono, como cualquier app.
        </p>
      </motion.header>

      {isStandalone ? (
        <StandaloneCta />
      ) : platform === 'ios' ? (
        <IosSteps />
      ) : (
        <AndroidOrOtherCta canPromptInstall={canPromptInstall} onInstall={promptInstall} />
      )}
    </main>
  );
}

function StandaloneCta() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      <p className="rounded-lg border border-teal/40 bg-teal/10 px-4 py-3 text-center text-sm">
        Ya la tenés instalada. Abrila desde el ícono en tu pantalla de inicio.
      </p>
      <CtaLink />
    </motion.div>
  );
}

function AndroidOrOtherCta({
  canPromptInstall,
  onInstall,
}: {
  canPromptInstall: boolean;
  onInstall: () => Promise<'accepted' | 'dismissed' | null>;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {canPromptInstall && (
        <motion.button
          type="button"
          {...tappable}
          onClick={() => void onInstall()}
          className="flex items-center justify-center gap-2.5 rounded-xl bg-teal px-4 py-3.5 text-sm font-semibold text-navy"
        >
          <Download size={16} aria-hidden="true" />
          Instalar la app
        </motion.button>
      )}
      <p className="text-center text-xs text-slate">
        {canPromptInstall
          ? 'O seguí sin instalar: también funciona directo desde el navegador.'
          : 'Tu navegador todavía no ofrece instalar — desde el menú (⋮) buscá "Agregar a pantalla de inicio". También funciona directo desde acá.'}
      </p>
      <CtaLink />
    </motion.div>
  );
}

function IosSteps() {
  const steps = [
    {
      icon: <Share size={16} aria-hidden="true" />,
      text: 'Tocá el ícono de Compartir, abajo en Safari.',
    },
    {
      icon: <SquarePlus size={16} aria-hidden="true" />,
      text: 'Elegí "Agregar a inicio".',
    },
    {
      icon: <Wifi size={16} aria-hidden="true" />,
      text: 'Confirmá — y ya tenés el ícono en tu pantalla, como cualquier app.',
    },
  ];

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      <motion.ol
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2.5"
      >
        {steps.map((step, i) => (
          <motion.li
            key={step.text}
            variants={listItem}
            className="flex items-center gap-3 rounded-xl border border-line bg-navy-soft px-4 py-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-teal">
              {i + 1}
            </span>
            <span className="text-teal">{step.icon}</span>
            <span className="text-sm">{step.text}</span>
          </motion.li>
        ))}
      </motion.ol>
      <p className="text-center text-xs text-slate">
        Preferís no instalarla ahora? También funciona directo desde Safari.
      </p>
      <CtaLink />
    </motion.div>
  );
}

function CtaLink() {
  return (
    <motion.div {...tappable}>
      <Link
        to="/auth"
        className="flex items-center justify-center rounded-xl border border-line px-4 py-3.5 text-sm font-semibold text-ink"
      >
        Entrar
      </Link>
    </motion.div>
  );
}
