import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { duration, ease, spring } from '../../lib/motion.ts';
import { Button, type ButtonVariant } from './Button.tsx';
import { Spinner } from './Feedback.tsx';

/**
 * CONFIRMAR ANTES DE HACER
 *
 * Hasta acá, las decisiones que no se pueden deshacer pasaban de una: tocabas
 * el ícono de salir y ya estabas afuera. Con el teléfono en la mano, entre
 * series, tocar algo sin querer es la norma, no la excepción — y varias de
 * esas acciones tiran trabajo (cerrar la sesión con series sin sincronizar,
 * cambiar el plan del día, cerrar una sesión a medio hacer).
 *
 * Es una hoja que sube desde abajo y no un `window.confirm`: el diálogo del
 * navegador aparece pegado arriba de todo, fuera del alcance del pulgar, con
 * la tipografía del sistema y en el idioma del navegador. Además bloquea el
 * hilo, así que ninguna animación de la app sigue corriendo detrás.
 *
 * Accesible por teclado: `Escape` cancela, el foco entra en el diálogo y
 * vuelve a donde estaba al cerrarse.
 */

export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly children?: ReactNode;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  readonly confirmVariant?: ButtonVariant;
  readonly icon?: ReactNode;
  /** Deshabilita los dos botones y muestra el anillo en el de confirmar. */
  readonly busy?: boolean;
  /**
   * Bloquea SOLO confirmar, dejando cancelar disponible. Para cuando falta
   * algo del propio diálogo — hoy, escribir el nombre del plan que se borra.
   */
  readonly confirmDisabled?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  icon,
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<Element | null>(null);
  /** Si ya se movió el foco adentro de este cuadro desde que se abrió. */
  const focusedOnOpen = useRef(false);

  /**
   * `onCancel` por ref y no en las dependencias del efecto.
   *
   * Quien usa este cuadro le pasa una función nueva en cada render (`onCancel=
   * {() => setAlgo(null)}`, que es lo normal). Con `onCancel` en las
   * dependencias, el efecto se desmontaba y volvía a montar en CADA render del
   * padre — y su limpieza devuelve el foco a donde estaba antes de abrirse.
   *
   * Con un cuadro de solo botones no se notaba. Con uno que tiene un campo de
   * texto adentro (escribir el nombre del plan para borrarlo) era imposible de
   * usar: cada tecla cambiaba el estado del padre, el efecto se rearmaba, y el
   * foco se volaba del campo. Había que tocar el campo, escribir una letra,
   * tocar de nuevo, otra letra.
   */
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) {
      focusedOnOpen.current = false;
      return;
    }

    returnFocusTo.current = document.activeElement;
    // Un cuadro por encima de la barra fija de abajo: sin esto se puede seguir
    // haciendo scroll detrás y la hoja "flota" sobre contenido que se mueve.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancelRef.current();
    }
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (returnFocusTo.current instanceof HTMLElement) returnFocusTo.current.focus();
    };
  }, [open]);

  /**
   * El foco entra al cuadro una sola vez, cuando termina de aparecer.
   *
   * `onAnimationComplete` se dispara cada vez que motion termina una
   * animación, no solo la de entrada: sin la guarda, cada render del padre
   * volvía a tirar el foco al botón de confirmar. Y si la persona ya está
   * escribiendo adentro del cuadro, no se le mueve el foco de ningún modo.
   */
  function focusOnOpen(): void {
    if (focusedOnOpen.current) return;
    if (panelRef.current?.contains(document.activeElement)) return;
    focusedOnOpen.current = true;
    confirmRef.current?.focus();
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* El fondo no se apaga a negro: se difumina. Así se sigue viendo
              dónde estabas y la hoja se lee como una capa, no como otra
              pantalla. */}
          <motion.button
            type="button"
            aria-label={cancelLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.quick, ease: ease.out }}
            onClick={busy ? undefined : onCancel}
            className="absolute inset-0 size-full bg-navy/70 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: spring.settle }}
            exit={{ opacity: 0, y: 16, transition: { duration: duration.instant } }}
            onAnimationComplete={focusOnOpen}
            className="relative m-3 flex w-full max-w-sm flex-col gap-4 rounded-panel border border-line-bright bg-surface p-5 shadow-raised"
          >
            <div className="flex items-start gap-3">
              {icon && (
                <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full border border-brand/25 bg-brand/10 text-brand">
                  {icon}
                </span>
              )}
              <div className="flex min-w-0 flex-col gap-1.5">
                <h2
                  id={titleId}
                  className="font-display text-lg font-semibold uppercase leading-tight tracking-tight"
                >
                  {title}
                </h2>
                {children && <div className="text-sm leading-relaxed text-slate">{children}</div>}
              </div>
            </div>

            {/* Confirmar a la derecha y cancelar a la izquierda: el pulgar de
                la mano que sostiene el teléfono cae sobre el destructivo si se
                invierte. */}
            <div className="flex gap-2.5">
              <Button
                variant="ghost"
                size="lg"
                className="flex-1"
                disabled={busy}
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
              <Button
                ref={confirmRef}
                variant={confirmVariant}
                size="lg"
                className="flex-1"
                disabled={busy || confirmDisabled}
                onClick={onConfirm}
              >
                {busy && <Spinner size={15} />}
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
