import { useState } from 'react';
import { createPortal } from 'react-dom';
import { movementsApi } from '../../services/api';
import './MovementForm.css';

/* ── SVG icons ── */
const IcClose   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IcCard    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
const IcMoney   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IcChart   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
const IcWarn    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IcCheck   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IcBulb    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L12 18l-3.7-3c-2-1.3-3.3-3.5-3.3-6a7 7 0 0 1 7-7z"/></svg>);
const IcArrowUp   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>);
const IcArrowDown = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></svg>);

function MovementForm({ tarjetaId, userId, simboloMoneda, deudaActual, lineaCredito, onMovementAdded, onClose }) {
  const [tipo, setTipo] = useState('gasto');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const simbolo = simboloMoneda || 'S/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedMonto = parseFloat(monto);

    if (!parsedMonto || parsedMonto <= 0) {
      setError('Ingresa un monto válido mayor a 0');
      return;
    }
    if (tipo === 'pago' && parsedMonto > parseFloat(deudaActual)) {
      setError(`No puedes pagar más de tu deuda actual (${simbolo} ${parseFloat(deudaActual).toFixed(2)})`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await movementsApi.create({
        tarjeta_id:  tarjetaId,
        usuario_id:  userId,
        tipo,
        monto:       parsedMonto,
        descripcion: descripcion.trim() || null,
      });

      if (!data.success) throw new Error(data.message || 'Error al registrar movimiento');

      setMonto('');
      setDescripcion('');
      setSuccess(`${tipo === 'gasto' ? 'Gasto' : 'Pago'} registrado correctamente`);

      if (onMovementAdded) onMovementAdded();
      setTimeout(() => { if (onClose) onClose(); }, 800);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const calcularImpacto = () => {
    const montoNum  = parseFloat(monto) || 0;
    if (montoNum === 0) return null;
    const deudaNum  = parseFloat(deudaActual) || 0;
    const lineaNum  = parseFloat(lineaCredito) || 1;
    const deudaRes  = tipo === 'gasto' ? deudaNum + montoNum : Math.max(0, deudaNum - montoNum);
    return {
      deudaResultante: deudaRes,
      usoActual:       (deudaNum / lineaNum) * 100,
      usoNuevo:        (deudaRes / lineaNum) * 100,
      disponibleNuevo: lineaNum - deudaRes,
    };
  };

  const impacto = calcularImpacto();

  return createPortal(
    <div className="mf-overlay" onClick={onClose}>
      <div className="mf-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="mf-header">
          <h2 className="mf-title">Registrar Movimiento</h2>
          <button className="mf-close" onClick={onClose}><IcClose /></button>
        </div>

        {/* Contenido */}
        <div className="mf-body">

          {/* Tabs */}
          <div className="mf-tabs">
            <button
              type="button"
              className={`mf-tab ${tipo === 'gasto' ? 'active gasto' : ''}`}
              onClick={() => setTipo('gasto')}
            >
              <span className="mf-tab-icon gasto-col"><IcCard /></span>
              <div className="mf-tab-text">
                <span className="mf-tab-title">Gasto</span>
                <span className="mf-tab-hint">Suma a tu deuda</span>
              </div>
            </button>

            <button
              type="button"
              className={`mf-tab ${tipo === 'pago' ? 'active pago' : ''}`}
              onClick={() => setTipo('pago')}
            >
              <span className="mf-tab-icon pago-col"><IcMoney /></span>
              <div className="mf-tab-text">
                <span className="mf-tab-title">Pago</span>
                <span className="mf-tab-hint">Reduce tu deuda</span>
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit}>

            {/* Monto */}
            <div className="mf-group">
              <label className="mf-label">Monto *</label>
              <div className="mf-input-wrap">
                <span className="mf-input-prefix">{simbolo}</span>
                <input
                  type="number" step="0.01" min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                  disabled={loading}
                  className="mf-input"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="mf-group">
              <label className="mf-label">Descripción (opcional)</label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder={tipo === 'gasto' ? 'Ej: Supermercado' : 'Ej: Pago parcial'}
                disabled={loading}
                maxLength="100"
                className="mf-input"
              />
            </div>

            {/* Preview impacto */}
            {impacto && (
              <div className={`mf-preview ${tipo}`}>
                <div className="mf-preview-header">
                  <span className="mf-preview-icon"><IcChart /></span>
                  <span className="mf-preview-title">Impacto</span>
                </div>

                <div className="mf-preview-grid">
                  <div className="mf-preview-card">
                    <span className="mf-preview-label">Deuda resultante</span>
                    <span className="mf-preview-value">{simbolo} {impacto.deudaResultante.toFixed(2)}</span>
                  </div>
                  <div className="mf-preview-card">
                    <span className="mf-preview-label">Uso de línea</span>
                    <span className="mf-preview-value">{impacto.usoNuevo.toFixed(1)}%</span>
                    <span className="mf-preview-change">
                      <span className={`mf-arrow ${tipo}`}>
                        {tipo === 'gasto' ? <IcArrowUp /> : <IcArrowDown />}
                      </span>
                      {Math.abs(impacto.usoNuevo - impacto.usoActual).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mf-preview-card">
                    <span className="mf-preview-label">Disponible</span>
                    <span className="mf-preview-value">{simbolo} {impacto.disponibleNuevo.toFixed(2)}</span>
                  </div>
                </div>

                {impacto.usoNuevo > 70 && (
                  <div className="mf-warning">
                    <span className="mf-warning-icon"><IcWarn /></span>
                    Usar más del 70% afecta tu score crediticio
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mf-error">
                <span className="mf-status-icon"><IcWarn /></span>
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mf-success">
                <span className="mf-status-icon"><IcCheck /></span>
                {success}
              </div>
            )}

            {/* Submit */}
            <button type="submit" className={`mf-submit ${tipo}`} disabled={loading}>
              {loading ? 'Registrando...' : (tipo === 'gasto' ? 'Registrar Gasto' : 'Registrar Pago')}
            </button>

            {/* Info */}
            <div className="mf-info">
              <span className="mf-info-icon"><IcBulb /></span>
              <p>
                {tipo === 'gasto'
                  ? 'Los gastos incrementan tu deuda actual'
                  : 'Los pagos reducen tu deuda y liberan línea disponible'}
              </p>
            </div>

          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MovementForm;
