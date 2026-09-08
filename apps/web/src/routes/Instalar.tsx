import { Download, Share, SquarePlus, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { Button, buttonClass, Card, Mascota, Notice } from '../components/ui/index.ts';
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
        className="flex flex-col items-center gap-4 text-center"
      >
        <Mascota size={168} />
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-[0.7rem] font-medium uppercase tracking-[0.28em] text-brand">
            Blue Horse Gym · Arroyo Seco
          </p>
          <h1 className="font-display text-4xl font-semibold uppercase leading-none tracking-tight">
            Push your limits
          </h1>
        </div>
        <p className="text-sm leading-relaxed text-slate">
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
    <div className="flex flex-col gap-4">
      <Notice tone="info">
        Ya la tenés instalada. Abrila desde el ícono en tu pantalla de inicio.
      </Notice>
      <CtaLink primary />
    </div>
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
        <Button variant="primary" size="lg" onClick={() => void onInstall()}>
          <Download size={16} aria-hidden="true" />
          Instalar la app
        </Button>
      )}
      <p className="text-center text-xs leading-relaxed text-slate">
        {canPromptInstall
          ? 'O seguí sin instalar: también funciona directo desde el navegador.'
          : 'Tu navegador todavía no ofrece instalar — desde el menú (⋮) buscá "Agregar a pantalla de inicio". También funciona directo desde acá.'}
      </p>
      <CtaLink primary={!canPromptInstall} />
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
          <motion.li key={step.text} variants={listItem}>
            <Card animate={false} className="flex items-center gap-3 px-4 py-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-brand/30 bg-brand/10 font-display text-sm font-semibold text-brand">
                {i + 1}
              </span>
              <span className="text-brand">{step.icon}</span>
              <span className="text-sm leading-snug">{step.text}</span>
            </Card>
          </motion.li>
        ))}
      </motion.ol>
      <p className="text-center text-xs text-slate">
        ¿Preferís no instalarla ahora? También funciona directo desde Safari.
      </p>
      <CtaLink primary />
    </motion.div>
  );
}

function CtaLink({ primary = false }: { primary?: boolean }) {
  return (
    <motion.div {...tappable}>
      <Link to="/auth" className={buttonClass(primary ? 'primary' : 'secondary', 'lg', 'w-full')}>
        Entrar
      </Link>
    </motion.div>
  );
}
