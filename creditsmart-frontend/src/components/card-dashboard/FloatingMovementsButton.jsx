import { useState } from 'react';
import { createPortal } from 'react-dom';
import MovementList from './MovementList';
import './FloatingMovementsButton.css';

function FloatingMovementsButton({ tarjetaId, simboloMoneda, refreshTrigger, onAddMovement }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón Flotante */}
      <button
        className="fab-btn"
        onClick={() => setIsOpen(true)}
        title="Ver movimientos"
      >
        <svg className="fab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <circle cx="3" cy="6"  r="1" fill="currentColor" stroke="none"/>
          <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/>
          <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
        </svg>
        <span className="fab-label">Movimientos</span>
      </button>

      {isOpen && createPortal(
        <>
          <div className="mp-overlay" onClick={() => setIsOpen(false)} />

          <div className="mp-panel">
            {/* Header */}
            <div className="mp-header">
              <div className="mp-header-left">
                <div className="mp-header-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <circle cx="3" cy="6"  r="1" fill="currentColor" stroke="none"/>
                    <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none"/>
                    <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </div>
                <div>
                  <h2 className="mp-title">Movimientos</h2>
                  <p className="mp-subtitle">Historial de gastos y pagos</p>
                </div>
              </div>
              <div className="mp-header-actions">
                <button className="mp-btn-add" onClick={onAddMovement}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Agregar
                </button>
                <button className="mp-btn-close" onClick={() => setIsOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="mp-body">
              <MovementList
                tarjetaId={tarjetaId}
                simboloMoneda={simboloMoneda}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

export default FloatingMovementsButton;
