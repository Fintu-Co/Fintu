import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './UsageMeter.css';
import UsageAnalysis from '@/modules/analytics/components/UsageAnalysis';

function UsageMeter({ porcentajeUso, deudaActual, lineaCredito, simboloMoneda, tarjetaId }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [displayPct, setDisplayPct]     = useState(0);

  const simbolo    = simboloMoneda || 'S/';
  const deudaNum   = parseFloat(deudaActual  || 0);
  const lineaNum   = parseFloat(lineaCredito || 0);
  const disponible = lineaNum - deudaNum;
  const pct        = Math.min(porcentajeUso, 100);

  const nivel =
    pct <= 30 ? 'good' :
    pct <= 70 ? 'warn' : 'bad';

  const colorStroke =
    nivel === 'good' ? '#1d9a6c' :
    nivel === 'warn' ? '#f59e0b' : '#ef4444';

  const colorRgb =
    nivel === 'good' ? '29,154,108' :
    nivel === 'warn' ? '245,158,11' : '239,68,68';

  const statusMap = {
    good: { label: 'Uso saludable', tip: 'Estás en el rango ideal. Mantén el uso bajo el 30% para un score óptimo.' },
    warn: { label: 'Uso moderado',  tip: 'Intenta bajar del 30% pagando más del mínimo recomendado.' },
    bad:  { label: 'Uso elevado',   tip: 'Prioriza pagar pronto — el uso alto afecta directamente tu score.' },
  };
  const status = statusMap[nivel];

  /* ── Contador animado ── */
  useEffect(() => {
    let rafId;
    const target   = pct;
    const duration = 1400;
    const t0       = performance.now();
    const run = (now) => {
      const elapsed  = Math.min(now - t0, duration);
      const t        = elapsed / duration;
      const eased    = 1 - Math.pow(1 - t, 3);
      setDisplayPct(Math.round(eased * target));
      if (elapsed < duration) rafId = requestAnimationFrame(run);
    };
    rafId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafId);
  }, [pct]);

  /* ── SVG gauge 270° ── */
  const R    = 82;
  const cx   = 120;
  const cy   = 126;
  const circ = 2 * Math.PI * R;

  const arcLen     = circ * 0.75;
  const trackD     = `${arcLen} ${circ - arcLen}`;
  const fillLen    = arcLen * (displayPct / 100);
  const fillD      = `${fillLen} ${circ - fillLen}`;
  // Shimmer: short bright segment that sweeps the track
  const shimLen    = arcLen * 0.14;
  const shimD      = `${shimLen} ${circ - shimLen}`;

  const rotStyle = { transform: 'rotate(135deg)', transformOrigin: `${cx}px ${cy}px` };

  const arcPt = (p) => {
    const rad = (135 + p * 2.7) * Math.PI / 180;
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) };
  };

  const mark30 = arcPt(30);
  const mark70 = arcPt(70);
  const dotPos = arcPt(displayPct);

  const fmt = n => parseFloat(n).toLocaleString('es-PE', {
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

  return (
    <>
      <div className={`um-wrap um-wrap-${nivel}`} style={{ '--clr': colorStroke, '--rgb': colorRgb }}>

        {/* ── Fondo glow radial detrás del gauge ── */}
        <div className="um-bg-glow" />

        {/* ── Gauge SVG ── */}
        <div className={`um-gauge-wrap um-pulse-${nivel}`}>
          <svg viewBox="0 0 240 236" className="um-svg" aria-hidden="true">

            {/* Track */}
            <circle cx={cx} cy={cy} r={R}
              fill="none" stroke="rgba(30,45,100,0.08)" strokeWidth="14"
              strokeDasharray={trackD} strokeLinecap="round" style={rotStyle}
            />

            {/* Glow exterior (breathing) */}
            <circle cx={cx} cy={cy} r={R}
              fill="none" stroke={colorStroke} strokeWidth="30"
              strokeDasharray={fillD} strokeLinecap="round"
              style={{ ...rotStyle, transition: 'stroke 0.5s' }}
              className={`um-glow-arc um-glow-${nivel}`}
            />

            {/* Fill principal */}
            <circle cx={cx} cy={cy} r={R}
              fill="none" stroke={colorStroke} strokeWidth="14"
              strokeDasharray={fillD} strokeLinecap="round"
              style={{ ...rotStyle, transition: 'stroke 0.5s' }}
            />

            {/* Shimmer que recorre el arco */}
            <circle cx={cx} cy={cy} r={R}
              fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="4"
              strokeDasharray={shimD} strokeLinecap="round"
              style={rotStyle}
              className="um-shimmer"
            />

            {/* Marca 30% */}
            <circle cx={mark30.x} cy={mark30.y} r="5"
              fill={displayPct >= 30 ? '#1d9a6c' : 'rgba(30,45,100,0.10)'}
              stroke={displayPct >= 30 ? '#157a55' : 'rgba(30,45,100,0.18)'}
              strokeWidth="1.5" style={{ transition: 'fill 0.4s' }}
            />
            <text x={mark30.x - 14} y={mark30.y - 9}
              fontSize="8" fontWeight="700" fill="#9aa4c0" textAnchor="middle"
            >30%</text>

            {/* Marca 70% */}
            <circle cx={mark70.x} cy={mark70.y} r="5"
              fill={displayPct >= 70 ? '#dc2626' : 'rgba(30,45,100,0.10)'}
              stroke={displayPct >= 70 ? '#b91c1c' : 'rgba(30,45,100,0.18)'}
              strokeWidth="1.5" style={{ transition: 'fill 0.4s' }}
            />
            <text x={mark70.x + 14} y={mark70.y - 9}
              fontSize="8" fontWeight="700" fill="#9aa4c0" textAnchor="middle"
            >70%</text>

            {/* Punto deslizante al final del fill */}
            {displayPct > 1 && (<>
              <circle cx={dotPos.x} cy={dotPos.y} r="11"
                fill="none" stroke={colorStroke} strokeWidth="2"
                className="um-dot-ring1"
              />
              <circle cx={dotPos.x} cy={dotPos.y} r="8"
                fill="none" stroke={colorStroke} strokeWidth="1.5"
                className="um-dot-ring2"
              />
              <circle cx={dotPos.x} cy={dotPos.y} r="6"
                fill={colorStroke} stroke="rgba(0,0,0,0.7)" strokeWidth="2.5"
              />
            </>)}

          </svg>

          {/* Centro */}
          <div className="um-center">
            <div className="um-center-glow" style={{ background: `radial-gradient(circle, rgba(${colorRgb},0.25) 0%, transparent 70%)` }} />
            <span className={`um-pct um-pct-${nivel}`}>
              {displayPct}<span className="um-pct-sign">%</span>
            </span>
            <span className="um-pct-label">utilizado</span>
          </div>
        </div>

        {/* ── Badge estado ── */}
        <div className={`um-badge um-badge-${nivel}`}>
          <svg className="um-badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {nivel === 'good' && <polyline points="20 6 9 17 4 12"/>}
            {nivel === 'warn' && <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
            {nivel === 'bad'  && <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
          </svg>
          {status.label}
        </div>

        {/* ── Stats ── */}
        <div className="um-stats-grid">
          <div className="um-stat-card">
            <span className="um-stat-card-label">Deuda</span>
            <span className={`um-stat-card-val um-val-${nivel}`}>{simbolo} {fmt(deudaNum)}</span>
            <div className="um-micro-bar-track">
              <div className={`um-micro-bar-fill um-fill-${nivel}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
          <div className="um-stat-card">
            <span className="um-stat-card-label">Disponible</span>
            <span className="um-stat-card-val um-val-good">{simbolo} {fmt(disponible)}</span>
            <div className="um-micro-bar-track">
              <div className="um-micro-bar-fill um-fill-good" style={{ width: `${Math.max(0, 100 - pct)}%` }} />
            </div>
          </div>
        </div>

        <div className="um-total-row">
          <span className="um-total-label">Línea de crédito total</span>
          <span className="um-total-val">{simbolo} {fmt(lineaNum)}</span>
        </div>

        {/* ── Tip ── */}
        <div className={`um-tip um-tip-${nivel}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{status.tip}</span>
        </div>

        {/* ── Botón análisis — llamativo ── */}
        <button className={`um-btn-analysis um-btn-${nivel}`} onClick={() => setShowAnalysis(true)}>
          <span className="um-btn-live" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6"  y1="20" x2="6"  y2="14"/>
          </svg>
          Ver Análisis Completo
          <svg className="um-btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

      </div>

      {showAnalysis && createPortal(
        <UsageAnalysis
          tarjetaId={tarjetaId}
          simboloMoneda={simboloMoneda}
          porcentajeUso={pct}
          deudaActual={deudaActual}
          lineaCredito={lineaCredito}
          onClose={() => setShowAnalysis(false)}
        />,
        document.body
      )}
    </>
  );
}

export default UsageMeter;
