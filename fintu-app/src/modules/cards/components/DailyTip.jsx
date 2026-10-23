import { useState, useEffect } from 'react';
import './DailyTip.css';

/* ── SVG icons ── */
const IcBulb    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L12 18l-3.7-3c-2-1.3-3.3-3.5-3.3-6a7 7 0 0 1 7-7z"/></svg>);
const IcBolt    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IcChart   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
const IcTarget  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IcCoin    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>);
const IcCal     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IcStar    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IcChevL   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const IcChevR   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);

const tipIconMap = {
  bulb: IcBulb,
  bolt: IcBolt,
  chart: IcChart,
  target: IcTarget,
  coin: IcCoin,
  cal: IcCal,
  star: IcStar,
};

function DailyTip() {

  const tips = [
    {
      id: 1,
      icon: 'bulb',
      categoria: 'Score Crediticio',
      titulo: '¿Sabías que...?',
      texto: 'Mantener tu uso de línea entre 10-30% es el rango óptimo para un score crediticio saludable. Por debajo de 10% no generas suficiente historial, y por encima de 30% empiezas a afectar negativamente tu score.',
    },
    {
      id: 2,
      icon: 'bolt',
      categoria: 'Pago Estratégico',
      titulo: 'Pro Tip',
      texto: 'Pagar ANTES del cierre reduce tu "utilización reportada" a las agencias de crédito, mejorando tu score más rápido que pagar después del cierre pero antes de la fecha límite.',
    },
    {
      id: 3,
      icon: 'chart',
      categoria: 'Frecuencia de Pago',
      titulo: 'Consejo del día',
      texto: 'Hacer pagos pequeños y frecuentes durante el mes es mejor que un solo pago grande. Esto mantiene tu utilización baja constantemente y demuestra mejor control financiero.',
    },
    {
      id: 4,
      icon: 'target',
      categoria: 'Uso Saludable',
      titulo: 'Importante',
      texto: 'Nunca uses más del 70% de tu línea. A partir de este punto, tu score crediticio comienza a sufrir daños significativos. Si estás cerca, considera pagar antes de hacer nuevos gastos.',
    },
    {
      id: 5,
      icon: 'coin',
      categoria: 'Pago Mínimo',
      titulo: '¡Atención!',
      texto: 'Pagar solo el mínimo puede parecer conveniente, pero los intereses se acumulan rápidamente. Intenta pagar al menos el 50% de tu deuda cada mes, idealmente el 100%.',
    },
    {
      id: 6,
      icon: 'cal',
      categoria: 'Timing',
      titulo: 'Estrategia',
      texto: 'Los gastos grandes hazlos justo después del cierre. Así tienes todo el ciclo para pagarlo antes del siguiente corte, sin afectar tu utilización reportada del mes actual.',
    },
    {
      id: 7,
      icon: 'star',
      categoria: 'Historial',
      titulo: 'Construye tu futuro',
      texto: 'Tu historial crediticio es como tu CV financiero. Cada pago puntual y cada mes con buen uso suman puntos. Un buen historial te abrirá puertas a mejores tasas y límites más altos.',
    }
  ];

  const getTipDelDia = () => {
    const hoy = new Date();
    const diaDelAño = Math.floor((hoy - new Date(hoy.getFullYear(), 0, 0)) / 86400000);
    return tips[diaDelAño % tips.length];
  };

  const [tipActual, setTipActual] = useState(getTipDelDia());
  const [indiceActual, setIndiceActual] = useState(0);

  useEffect(() => {
    const tip = getTipDelDia();
    setTipActual(tip);
    setIndiceActual(tips.findIndex(t => t.id === tip.id));
  }, []);

  const navegarTip = (direccion) => {
    const nuevoIndice =
      direccion === 'prev'
        ? (indiceActual === 0 ? tips.length - 1 : indiceActual - 1)
        : (indiceActual === tips.length - 1 ? 0 : indiceActual + 1);
    setIndiceActual(nuevoIndice);
    setTipActual(tips[nuevoIndice]);
  };

  const IconComp = tipIconMap[tipActual.icon] || IcBulb;

  return (
    <div className="dt-wrap">

      {/* Header */}
      <div className="dt-header">
        <div className="dt-badge">
          <span className="dt-badge-icon">
            <IcBulb />
          </span>
          <span className="dt-badge-text">Tip del Día</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="dt-body">
        <div className="dt-categoria">
          <span className="dt-cat-icon"><IconComp /></span>
          <span className="dt-cat-label">{tipActual.categoria}</span>
        </div>

        <h3 className="dt-titulo">{tipActual.titulo}</h3>
        <p className="dt-texto">{tipActual.texto}</p>
      </div>

      {/* Footer nav */}
      <div className="dt-footer">
        <button className="dt-nav-btn" onClick={() => navegarTip('prev')} title="Tip anterior">
          <IcChevL />
        </button>

        <div className="dt-counter">
          <span className="dt-cur">{indiceActual + 1}</span>
          <span className="dt-sep">/</span>
          <span className="dt-tot">{tips.length}</span>
        </div>

        <button className="dt-nav-btn" onClick={() => navegarTip('next')} title="Siguiente tip">
          <IcChevR />
        </button>
      </div>

      <div className="dt-glow" />
    </div>
  );
}

export default DailyTip;
