import { useState, useEffect } from 'react';
import { BrandSymbol } from '@/shared/components/BrandLogo';
import { canPromptInstall, isIOS, isStandalone, onInstallChange, promptInstall } from '@/shared/pwa';
import './InstallApp.css';

const DISMISS_KEY = 'fintu_install_dismissed';

const IcX = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const IcShare = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>);

/*
  Franja "Instala Fintú en tu celular".
  · Android / Chrome: botón que abre el instalador del sistema.
  · iPhone (Safari): Apple no permite un botón; se explican los dos toques.
  · No aparece si ya es app instalada, si el navegador no lo permite o si
    la persona la cerró.
*/
function InstallApp() {
  const [, refrescar] = useState(0);
  const [verPasos, setVerPasos] = useState(false);
  const [cerrada, setCerrada] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => onInstallChange(() => refrescar(n => n + 1)), []);

  const ios = isIOS();
  if (cerrada || isStandalone() || (!canPromptInstall() && !ios)) return null;

  const cerrar = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* sin almacenamiento: se oculta solo por ahora */ }
    setCerrada(true);
  };

  return (
    <aside className="ia" aria-label="Instalar la app">
      <span className="ia-icon" aria-hidden="true"><BrandSymbol /></span>
      <div className="ia-text">
        <b>Lleva Fintú en tu celular</b>
        <span>Ábrela como una app, con un toque, sin buscar la página.</span>
        {ios && verPasos && (
          <ol className="ia-steps">
            <li>Toca <IcShare /> <b>Compartir</b> abajo en Safari.</li>
            <li>Elige <b>Agregar a inicio</b>.</li>
          </ol>
        )}
      </div>
      {ios ? (
        !verPasos && <button className="ia-btn" onClick={() => setVerPasos(true)}>Cómo instalarla</button>
      ) : (
        <button className="ia-btn" onClick={promptInstall}>Instalar app</button>
      )}
      <button className="ia-close" onClick={cerrar} aria-label="Ocultar este aviso"><IcX /></button>
    </aside>
  );
}

export default InstallApp;
