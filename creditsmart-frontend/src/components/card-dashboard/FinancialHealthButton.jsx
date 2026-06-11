import { useState } from 'react';
import './FinancialHealthButton.css';
import FinancialHealthModal from './FinancialHealthModal';

/* ── Función compartida ── */
export const calcularScoreBasico = (tarjetaData) => {
  if (!tarjetaData) return 0;
  const usoLinea = (parseFloat(tarjetaData.deuda_actual || 0) / parseFloat(tarjetaData.linea_credito || 1)) * 100;
  let puntosUso = 0;
  if      (usoLinea <= 10) puntosUso = 40;
  else if (usoLinea <= 30) puntosUso = 35;
  else if (usoLinea <= 50) puntosUso = 25;
  else if (usoLinea <= 70) puntosUso = 15;
  else                      puntosUso = 5;
  return Math.min(100, Math.round(puntosUso + 35 + 25));
};

/* ── SVG icons ── */
const IcHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IcArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcCard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IcCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcRepeat = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

function FinancialHealthButton({ tarjetaId, simboloMoneda, tarjetaData }) {
  const [showModal, setShowModal] = useState(false);

  if (!tarjetaData) return null;

  const scorePreview = calcularScoreBasico(tarjetaData);
  const usoLinea     = (parseFloat(tarjetaData.deuda_actual || 0) / parseFloat(tarjetaData.linea_credito || 1)) * 100;

  const getColorClass = (s) =>
    s >= 80 ? 'excellent' : s >= 60 ? 'good' : s >= 40 ? 'warning' : 'danger';
  const getLabel = (s) =>
    s >= 80 ? 'Excelente' : s >= 60 ? 'Saludable' : s >= 40 ? 'Mejorable' : 'Crítico';

  const colorClass = getColorClass(scorePreview);

  /* ── Factores ── */
  const usoColor  = usoLinea <= 30 ? 'excellent' : usoLinea <= 50 ? 'good' : usoLinea <= 70 ? 'warning' : 'danger';
  const puntosUso = scorePreview - 35 - 25;
  const puntPts   = 35;
  const frecPts   = 15;
  const frecColor = frecPts >= 20 ? 'good' : frecPts >= 10 ? 'warning' : 'danger';

  /* ── Tip dinámico (corto) ── */
  const getTip = (uso) => {
    if (uso > 70) return 'Reduce tu deuda cuanto antes para proteger tu score';
    if (uso > 50) return 'Bajar el uso al 30% puede sumarte hasta +20 pts';
    if (uso > 30) return 'Llevar el uso al 30% te daría unos +10 pts extra';
    return 'Tu uso es óptimo · Sigue así para mantener este nivel';
  };

  return (
    <>
      <button
        className={`fhb-trigger ${colorClass}`}
        onClick={() => setShowModal(true)}
        title="Ver mi salud financiera"
      >
        <div className="fhb-glow" />
        <span className="fhb-shimmer" />

        <div className="fhb-content">

          {/* ══ FILA SUPERIOR: ícono + score + badge + flecha ══ */}
          <div className="fhb-header">

            <div className="fhb-icon">
              <IcHeart />
              <span className="fhb-pulse" />
              <span className="fhb-pulse fhb-pulse-2" />
            </div>

            <div className="fhb-score-info">
              <div className="fhb-top-row">
                <span className="fhb-label">Tu Salud Financiera</span>
                <span className={`fhb-level-badge ${colorClass}`}>{getLabel(scorePreview)}</span>
              </div>
              <div className="fhb-score-row">
                <span className="fhb-score-num">{scorePreview}</span>
                <span className="fhb-score-max">/100</span>
              </div>
              <div className="fhb-bar-track">
                <div className={`fhb-bar-fill ${colorClass}`} style={{ '--fw': `${scorePreview}%` }} />
              </div>
            </div>

            <span className="fhb-arrow"><IcArrow /></span>
          </div>

          {/* ══ DIVISOR ══ */}
          <div className="fhb-divider" />

          {/* ══ DESGLOSE ANCHO COMPLETO ══ */}
          <div className="fhb-desglose">

            <span className="fhb-desglose-title">Composición del score</span>

            <div className="fhb-factor-row">
              <span className="fhb-factor-ico"><IcCard /></span>
              <span className="fhb-factor-name">Uso de línea</span>
              <div className="fhb-factor-bar-track">
                <div className={`fhb-factor-bar-fill ${usoColor}`}
                  style={{ '--ffw': `${(puntosUso / 40) * 100}%` }} />
              </div>
              <span className={`fhb-factor-pts ${usoColor}`}>{puntosUso}<em>/40</em></span>
            </div>

            <div className="fhb-factor-row">
              <span className="fhb-factor-ico"><IcCheck /></span>
              <span className="fhb-factor-name">Puntualidad</span>
              <div className="fhb-factor-bar-track">
                <div className="fhb-factor-bar-fill excellent" style={{ '--ffw': '100%' }} />
              </div>
              <span className="fhb-factor-pts excellent">{puntPts}<em>/35</em></span>
            </div>

            <div className="fhb-factor-row">
              <span className="fhb-factor-ico"><IcRepeat /></span>
              <span className="fhb-factor-name">Frecuencia</span>
              <div className="fhb-factor-bar-track">
                <div className={`fhb-factor-bar-fill ${frecColor}`}
                  style={{ '--ffw': `${(frecPts / 25) * 100}%` }} />
              </div>
              <span className={`fhb-factor-pts ${frecColor}`}>{frecPts}<em>/25</em></span>
            </div>
          </div>

          {/* ══ TIP ══ */}
          <div className="fhb-tip">
            <span className="fhb-tip-bullet">💡</span>
            <span className="fhb-tip-text">{getTip(usoLinea)}</span>
          </div>

        </div>
      </button>

      {showModal && (
        <FinancialHealthModal
          tarjetaId={tarjetaId}
          simboloMoneda={simboloMoneda}
          tarjetaData={tarjetaData}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

export default FinancialHealthButton;
