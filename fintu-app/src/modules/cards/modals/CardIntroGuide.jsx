import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CardIntroGuide.css';

/**
 * GUÍA DE PRIMERA VISITA — interior de una tarjeta.
 *
 * Acompaña al usuario la primera vez que abre el panel de una tarjeta,
 * explicando para qué sirve cada sección. Se muestra una sola vez por
 * usuario (localStorage) y puede reabrirse desde el botón "?" del header.
 */

/* ── SVG icons ── */
const IcChart = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
const IcPlus  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const IcCal   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IcBulb  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/></svg>);
const IcClose = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IcChevL = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><polyline points="15 18 9 12 15 6"/></svg>);
const IcChevR = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>);

const STEPS = [
  {
    icon: <IcChart />,
    cat: 'Vista rápida',
    titulo: 'Tus números clave, arriba',
    texto: 'La franja superior resume lo importante de un vistazo: cuánto debes, cuánto crédito te queda libre, qué porcentaje de tu línea usas y cuántos días faltan para tu próximo pago.',
    tip: 'Mantén el "Uso de línea" debajo del 30% para cuidar tu score.',
  },
  {
    icon: <IcPlus />,
    cat: 'Mantenla al día',
    titulo: 'Registra tus movimientos',
    texto: 'Usa el botón flotante de la esquina para anotar tus consumos y pagos. Cada movimiento actualiza tu deuda y tu historial automáticamente.',
    tip: 'Anota tus gastos apenas los hagas: así tus números siempre reflejan la realidad.',
  },
  {
    icon: <IcCal />,
    cat: 'No te pierdas fechas',
    titulo: 'Controla tu ciclo',
    texto: 'En "Ciclo y fechas" ves cuándo cierra tu tarjeta y cuándo vence el pago, con una cuenta regresiva. El botón "Ver calendario" abre la vista completa del mes.',
    tip: 'Comprar justo después del cierre te da casi 50 días para pagar sin intereses.',
  },
  {
    icon: <IcBulb />,
    cat: 'Aprende y decide',
    titulo: 'Herramientas para pagar menos',
    texto: 'Abajo tienes el Tip del día, la Calculadora de intereses para simular cuánto te cuesta tu deuda, y accesos rápidos a tus metas y reportes.',
    tip: 'Puedes volver a abrir esta guía cuando quieras con el botón "?" del encabezado.',
  },
];

function CardIntroGuide({ onClose }) {
  const [idx, setIdx] = useState(0);
  const total = STEPS.length;
  const step = STEPS[idx];
  const esUltimo = idx === total - 1;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const siguiente = () => { if (!esUltimo) setIdx(idx + 1); else onClose(); };
  const anterior  = () => { if (idx > 0) setIdx(idx - 1); };

  return createPortal(
    <div className="cig-overlay" onClick={onClose} role="presentation">
      <div className="cig-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Cómo usar tu tarjeta">

        {/* Header */}
        <div className="cig-head">
          <div className="cig-head-left">
            <span className="cig-head-eyebrow">Cómo usar esta pantalla</span>
            <h3 className="cig-head-title">Guía rápida de tu tarjeta</h3>
          </div>
          <button className="cig-x" onClick={onClose} aria-label="Cerrar guía"><IcClose /></button>
        </div>

        {/* Cuerpo — paso actual */}
        <div className="cig-body" key={idx}>
          <div className="cig-step-icon">{step.icon}</div>
          <span className="cig-cat">{step.cat}</span>
          <h4 className="cig-title">{step.titulo}</h4>
          <p className="cig-text">{step.texto}</p>
          <div className="cig-tip">
            <IcBulb />
            <p>{step.tip}</p>
          </div>
        </div>

        {/* Puntos de progreso */}
        <div className="cig-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`cig-dot${i === idx ? ' on' : ''}`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>

        {/* Footer navegación */}
        <div className="cig-foot">
          {idx > 0 ? (
            <button className="cig-btn-ghost" onClick={anterior}><IcChevL /> Anterior</button>
          ) : (
            <button className="cig-btn-ghost" onClick={onClose}>Saltar guía</button>
          )}
          <span className="cig-count">{idx + 1} / {total}</span>
          <button className="cig-btn-navy" onClick={siguiente}>
            {esUltimo ? '¡Entendido!' : <>Siguiente <IcChevR /></>}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default CardIntroGuide;
