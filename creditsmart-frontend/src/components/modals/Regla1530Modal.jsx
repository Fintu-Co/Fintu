import { createPortal } from 'react-dom';
import './Regla1530Modal.css';

function Regla1530Modal({ onClose }) {
  return createPortal(
    <div className="modal-overlay-regla" onClick={onClose}>
      <div className="modal-content-regla" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="regla-header">
          <div className="regla-icon-large">🎯</div>
          <h2>Regla 15/30</h2>
          <button className="regla-close" onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className="regla-body">
          
          {/* Intro */}
          <div className="regla-intro">
            <p>
              La <strong>Regla 15/30</strong> es una guía simple para mantener 
              un score crediticio saludable y evitar sobreendeudamiento.
            </p>
          </div>

          {/* Reglas */}
          <div className="regla-cards">
            
            <div className="regla-card green">
              <div className="regla-card-header">
                <span className="regla-number">15%</span>
                <span className="regla-emoji">✅</span>
              </div>
              <h3>Mínimo recomendado</h3>
              <p>
                Usa al menos el <strong>15% de tu línea</strong> cada mes. 
                Esto genera historial crediticio positivo.
              </p>
              <div className="regla-example">
                <strong>Ejemplo:</strong>
                <br />
                Línea: S/ 5,000 → Usa mínimo S/ 750
              </div>
            </div>

            <div className="regla-card yellow">
              <div className="regla-card-header">
                <span className="regla-number">30%</span>
                <span className="regla-emoji">⚠️</span>
              </div>
              <h3>Máximo saludable</h3>
              <p>
                No uses más del <strong>30% de tu línea</strong>. 
                Exceder esto puede afectar tu score crediticio.
              </p>
              <div className="regla-example">
                <strong>Ejemplo:</strong>
                <br />
                Línea: S/ 5,000 → Usa máximo S/ 1,500
              </div>
            </div>

          </div>

          {/* Por qué funciona */}
          <div className="regla-why">
            <h3>💡 ¿Por qué funciona?</h3>
            <ul className="regla-list">
              <li>
                <strong>Genera historial:</strong> Usar la tarjeta demuestra que eres un usuario activo
              </li>
              <li>
                <strong>Muestra control:</strong> No usar más del 30% indica que no dependes del crédito
              </li>
              <li>
                <strong>Mejora tu score:</strong> Los bancos ven que manejas bien tus deudas
              </li>
              <li>
                <strong>Evita sobreendeudamiento:</strong> Te mantiene en un rango seguro
              </li>
            </ul>
          </div>

          {/* Tips adicionales */}
          <div className="regla-tips">
            <h3>🚀 Tips para aplicarla</h3>
            <div className="tips-grid">
              <div className="tip-item">
                <span>1️⃣</span>
                <p>Paga <strong>antes del cierre</strong> para reducir el uso reportado</p>
              </div>
              <div className="tip-item">
                <span>2️⃣</span>
                <p>Distribuye gastos entre <strong>varias tarjetas</strong> si tienes más de una</p>
              </div>
              <div className="tip-item">
                <span>3️⃣</span>
                <p>Configura <strong>alertas</strong> cuando llegues al 25% de uso</p>
              </div>
              <div className="tip-item">
                <span>4️⃣</span>
                <p>Si pasas el 30%, haz un <strong>pago parcial inmediato</strong></p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}

export default Regla1530Modal;