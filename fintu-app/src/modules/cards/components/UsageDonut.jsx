import { useState } from 'react';
import { createPortal } from 'react-dom';
import UsageAnalysis from '@/modules/analytics/components/UsageAnalysis';
import './UsageDonut.css';

/**
 * Donut compacto de uso de línea — formato "Community growth" de la referencia.
 * El detalle completo se abre en el modal de análisis existente.
 */
function UsageDonut({ porcentajeUso, deudaActual, lineaCredito, simboloMoneda, tarjetaId }) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const simbolo = simboloMoneda || 'S/';
  const pct     = Math.min(Math.max(porcentajeUso || 0, 0), 100);
  const deuda   = parseFloat(deudaActual || 0);
  const linea   = parseFloat(lineaCredito || 0);

  const nivel =
    pct <= 30 ? 'good' :
    pct <= 70 ? 'warn' : 'bad';

  const color =
    nivel === 'good' ? '#157a55' :
    nivel === 'warn' ? '#d97706' : '#dc2626';

  const estado =
    nivel === 'good' ? 'Zona saludable' :
    nivel === 'warn' ? 'Zona moderada'  : 'Zona de riesgo';

  const fmt = (n) => parseFloat(n).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  /* SVG donut */
  const R = 38;
  const circ = 2 * Math.PI * R;
  const offset = circ * (1 - pct / 100);

  return (
    <>
      <div className="ud-wrap">
        <div className="ud-donut">
          <svg width="92" height="92" viewBox="0 0 92 92">
            <circle cx="46" cy="46" r={R} fill="none" stroke="#eef1f8" strokeWidth="10" />
            <circle
              cx="46" cy="46" r={R} fill="none" stroke={color} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              transform="rotate(-90 46 46)"
              style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.4s' }}
            />
          </svg>
          <div className="ud-pct">
            <b style={{ color }}>{pct}%</b>
            <span>Uso</span>
          </div>
        </div>

        <div className="ud-info">
          <h4>Uso de línea</h4>
          <p>Usas {simbolo} {fmt(deuda)} de tu línea de {simbolo} {fmt(linea)}.</p>
          <span className={`ud-tag ud-tag-${nivel}`}>{estado}</span>
          <button className="ud-btn" onClick={() => setShowAnalysis(true)}>
            Ver análisis
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
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

export default UsageDonut;
