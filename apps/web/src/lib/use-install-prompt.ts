import { useEffect, useState } from 'react';

/**
 * Detección de plataforma e instalación para la pantalla de instalación
 * (destino del QR en el gimnasio). Solo Chrome/Android exponen una API real
 * (`beforeinstallprompt`); Safari/iOS no tiene instalación programática —
 * ahí solo se puede mostrar el paso a paso manual (Compartir → Agregar a
 * inicio). Vive acá y no en un componente para poder testear la detección
 * sin renderizar nada.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallPlatform = 'ios' | 'android-chrome' | 'other';

export function detectPlatform(userAgent: string): InstallPlatform {
  if (/iphone|ipad|ipod/i.test(userAgent) && !/CriOS|FxiOS/i.test(userAgent)) return 'ios';
  if (/android/i.test(userAgent)) return 'android-chrome';
  return 'other';
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function promptInstall(): Promise<'accepted' | 'dismissed' | null> {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  }

  return {
    platform: typeof navigator === 'undefined' ? 'other' : detectPlatform(navigator.userAgent),
    isStandalone: isStandaloneDisplay() || installed,
    canPromptInstall: deferredPrompt !== null,
    promptInstall,
  };
}
