import { Download, X } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';
import { duration, ease, tappable } from '../lib/motion.ts';
import { useInstallPrompt } from '../lib/use-install-prompt.ts';
import { Button, buttonClass } from './ui/index.ts';

/**
 * INVITACIÓN A INSTALAR, UNA SOLA VEZ
 *
 * Una hoja que sube desde abajo con el ícono real que va a quedar en la
 * pantalla de inicio — no un dibujo genérico de "instalar": lo que se muestra
 * es exactamente lo que la persona va a ver después en su teléfono.
 *
 * Se cierra arrastrándola para abajo (el gesto que cualquiera prueba primero
 * con una hoja inferior) o con la X. Cerrarla no la esconde para siempre sin
 * decir nada: `AppShell` muestra a dónde quedó el botón, porque una hoja que
 * desaparece sin dejar rastro convierte una decisión de "ahora no" en "nunca
 * más", sin que la persona lo haya elegido.
 *
 * En iOS no hay instalación programática, así que ahí el botón lleva a
 * `/instalar`, que ya tiene el paso a paso de Safari. No se duplica esa
 * explicación acá.
 */
export function InstallSheet({ onDismiss }: { readonly onDismiss: () => void }) {
  const { platform, canPromptInstall, promptInstall } = useInstallPrompt();
  const reduceMotion = useReducedMotion();

  async function handleInstall() {
    const outcome = await promptInstall();
    // Aceptado o rechazado, la hoja ya cumplió: si aceptó se está instalando,
    // y si rechazó insistir en la misma pantalla es pelear con la decisión que
    // acaba de tomar.
    if (outcome !== null) onDismiss();
  }

  return (
    <>
      {/* El velo no cierra al tocarlo: con la hoja pegada al borde de abajo,
          el pulgar toca el velo todo el tiempo sin querer. Se cierra con el
          gesto o con la X, que son deliberados. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: duration.quick }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-sheet-title"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: duration.base, ease: ease.inOut }}
        drag={reduceMotion ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        // Solo elástico hacia abajo: tirar para arriba de una hoja que ya está
        // arriba de todo no lleva a ningún lado.
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          // Un tirón corto y rápido cuenta igual que uno largo y lento: en el
          // gimnasio el gesto sale apurado y con una sola mano.
          if (info.offset.y > 110 || info.velocity.y > 550) onDismiss();
        }}
        className="fixed inset-x-0 bottom-0 z-50 touch-none rounded-t-[1.75rem] border-t border-line bg-navy pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgb(0_0_0_/_0.5)]"
      >
        {/* El agarre no es decorativo: es lo que dice que esto se arrastra. */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="h-1.5 w-11 rounded-full bg-line-bright" aria-hidden="true" />
        </div>

        <motion.button
          type="button"
          {...tappable}
          onClick={onDismiss}
          aria-label="Ahora no"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-line text-slate transition-colors hover:border-line-bright hover:text-ink"
        >
          <X size={15} aria-hidden="true" />
        </motion.button>

        <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-6 pt-3">
          {/* El ícono real de la PWA, con la misma esquina redondeada que le
              pone Android: es una vista previa, no un adorno. */}
          <img
            src="/icon-192.png"
            alt=""
            width={72}
            height={72}
            className="size-[72px] rounded-[1.25rem] border border-line/80 shadow-brand"
          />

          <div className="flex flex-col items-center gap-1.5 text-center">
            <h2
              id="install-sheet-title"
              className="font-display text-2xl font-semibold uppercase leading-none tracking-tight"
            >
              Instalá Blue Horse
            </h2>
            <p className="text-sm leading-relaxed text-slate">
              Queda como una app más en tu teléfono: entrás desde el ícono, a pantalla completa y
              sin la barra del navegador.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2">
            {platform === 'ios' || !canPromptInstall ? (
              <Link
                to="/instalar"
                onClick={onDismiss}
                className={buttonClass('primary', 'lg', 'w-full')}
              >
                <Download size={16} aria-hidden="true" />
                Cómo instalarla
              </Link>
            ) : (
              <Button variant="primary" size="lg" onClick={() => void handleInstall()}>
                <Download size={16} aria-hidden="true" />
                Instalar
              </Button>
            )}
            <Button variant="ghost" size="md" onClick={onDismiss}>
              Ahora no
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
