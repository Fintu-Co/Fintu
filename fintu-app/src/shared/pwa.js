/*
  App instalable (PWA).
  · Registra el service worker (solo en producción: en desarrollo cachearía
    archivos que Vite cambia a cada rato).
  · Guarda el evento `beforeinstallprompt` apenas llega —suele dispararse
    antes de que se monte cualquier pantalla— para poder mostrar un botón
    "Instalar app" cuando la pantalla lo pida.
*/
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function initPWA() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();          // sin el mini-banner del navegador: el botón es nuestro
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => { deferredPrompt = null; notify(); });

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('SW no registrado:', err));
    });
  }
}

/** ¿Ya corre como app instalada? */
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

/** iPhone/iPad en Safari: no hay botón de instalar, se hace desde "Compartir". */
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const canPromptInstall = () => Boolean(deferredPrompt);

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === 'accepted';
}

export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
