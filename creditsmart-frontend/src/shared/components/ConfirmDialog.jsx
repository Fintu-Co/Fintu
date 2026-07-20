import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

/*
  Modal de confirmación reutilizable — reemplaza a window.confirm().
  Se renderiza por portal, así nunca la recorta el overflow de un contenedor.

  Props:
   · open        — boolean, si se muestra
   · title       — título (ej. "¿Eliminar este movimiento?")
   · message     — texto explicativo (opcional)
   · confirmText — texto del botón principal (default "Eliminar")
   · cancelText  — default "Cancelar"
   · danger      — estilo rojo destructivo (default true)
   · onConfirm / onCancel
*/
function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return createPortal(
    <div className="cfd-overlay" onClick={onCancel}>
      <div
        className="cfd"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className={`cfd-icon${danger ? ' danger' : ''}`}>
          {danger ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        <h3 className="cfd-title">{title}</h3>
        {message && <p className="cfd-msg">{message}</p>}

        <div className="cfd-actions">
          <button className="cfd-cancel" onClick={onCancel}>{cancelText}</button>
          <button className={`cfd-confirm${danger ? ' danger' : ''}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmDialog;
