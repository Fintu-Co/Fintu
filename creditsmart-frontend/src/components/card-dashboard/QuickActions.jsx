import './QuickActions.css';

/* ── SVG icons ── */
const IcReport   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
const IcTarget   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IcSettings = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>);
const IcArrow    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);

const iconMap = {
  report:   IcReport,
  target:   IcTarget,
  settings: IcSettings,
};

const colorMap = {
  blue:  { icon: 'rgba(6,182,212,0.12)',   stroke: '#06b6d4' },
  green: { icon: 'rgba(34,197,94,0.12)',   stroke: '#22c55e' },
  gold:  { icon: 'rgba(212,165,116,0.12)', stroke: '#d4a574' },
  gray:  { icon: 'rgba(156,163,175,0.12)', stroke: '#9ca3af' },
};

/**
 * @param {{ onVerReportes, onMisMetas, onConfiguracion }} props
 */
function QuickActions({ onVerReportes, onMisMetas, onConfiguracion }) {

  const acciones = [
    {
      id: 1, icon: 'report',   color: 'blue',
      titulo: 'Ver Reportes',  descripcion: 'Historial de uso',
      onClick: onVerReportes,
    },
    {
      id: 2, icon: 'target',   color: 'green',
      titulo: 'Mis Metas',     descripcion: 'Objetivos financieros',
      onClick: onMisMetas,
    },
    {
      id: 3, icon: 'settings', color: 'gray',
      titulo: 'Mi Perfil',     descripcion: 'Cuenta y ajustes',
      onClick: onConfiguracion,
    },
  ];

  return (
    <div className="qa-wrap">

      <div className="qa-header">
        <h3 className="qa-title">Acciones Rápidas</h3>
        <span className="qa-badge">{acciones.length}</span>
      </div>

      <div className="qa-list">
        {acciones.map((accion, index) => {
          const IconComp = iconMap[accion.icon] || IcBulb;
          const colors   = colorMap[accion.color];
          return (
            <button
              key={accion.id}
              className={`qa-item ${accion.color}`}
              onClick={accion.onClick}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {/* shimmer */}
              <span className="qa-shimmer" />

              <div
                className="qa-icon-box"
                style={{ '--ic-bg': colors.icon, '--ic-stroke': colors.stroke }}
              >
                <IconComp />
              </div>

              <div className="qa-content">
                <span className="qa-name">{accion.titulo}</span>
                <span className="qa-desc">{accion.descripcion}</span>
              </div>

              <span className="qa-arrow"><IcArrow /></span>
            </button>
          );
        })}
      </div>

    </div>
  );
}

export default QuickActions;
