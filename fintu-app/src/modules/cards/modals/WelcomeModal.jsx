import './WelcomeModal.css';

const STEPS = [
  {
    num: '01',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="1" y="4" width="22" height="16" rx="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    titulo: 'Agrega tu tarjeta',
    desc: 'Ingresa tu banco, línea de crédito y fechas de ciclo. Sin números de tarjeta ni claves.',
  },
  {
    num: '02',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    titulo: 'Registra tus gastos',
    desc: 'Añade movimientos y lleva el control de cuánto llevas gastado en cada ciclo.',
  },
  {
    num: '03',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    titulo: 'Toma el control',
    desc: 'Recibe alertas de fechas críticas, analiza tu uso y mejora tu salud financiera.',
  },
];

function WelcomeModal({ nombre, onClose, onAddCard }) {
  return (
    <div className="wm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="wm-card">

        {/* Encabezado navy — logo + saludo */}
        <div className="wm-top">
          <div className="wm-header">
            <div className="wm-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <button className="wm-close" onClick={onClose} aria-label="Cerrar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="wm-greeting">
            <h2>¡Bienvenido, {nombre}!</h2>
            <p>Tu cuenta está lista. Sigue estos 3 pasos para comenzar a controlar tus finanzas.</p>
          </div>
        </div>

        {/* Cuerpo blanco — pasos + acciones */}
        <div className="wm-body">
          <div className="wm-steps">
            {STEPS.map((step, i) => (
              <div className="wm-step" key={i}>
                <div className="wm-step-icon">{step.icon}</div>
                <div className="wm-step-body">
                  <div className="wm-step-num">{step.num}</div>
                  <div className="wm-step-titulo">{step.titulo}</div>
                  <div className="wm-step-desc">{step.desc}</div>
                </div>
                {i < STEPS.length - 1 && <div className="wm-step-connector" />}
              </div>
            ))}
          </div>

          <div className="wm-actions">
            <button className="wm-btn-primary" onClick={onAddCard}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Agregar mi primera tarjeta
            </button>
            <button className="wm-btn-ghost" onClick={onClose}>
              Explorar primero
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default WelcomeModal;
