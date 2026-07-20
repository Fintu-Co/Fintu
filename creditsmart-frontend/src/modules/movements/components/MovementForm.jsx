import { useState } from 'react';
import { createPortal } from 'react-dom';
import { movementsApi } from '@/modules/movements/services/movementsApi';
import { useToast } from '@/shared/context/ToastContext';
import { aISO, cicloDeFecha } from '@/shared/utils/ciclo';
import { parseISODate } from '@/shared/utils/fecha';
import './MovementForm.css';

/* Días hacia atrás admitidos (mismo tope que Movement.DIAS_RETRO_MAX en el backend). */
const DIAS_RETRO_MAX = 90;

const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const dm     = (d) => `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`;
const dLargo = (d) => `${d.getDate()} de ${MESES[d.getMonth()]}`;

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

function MovementForm({ tarjeta, tarjetaId, userId, simboloMoneda, deudaActual, lineaCredito, onMovementAdded, onClose }) {
  const { showToast } = useToast();
  const hoyISO = aISO(new Date());
  const minISO = (() => {
    const d = new Date();
    d.setDate(d.getDate() - DIAS_RETRO_MAX);
    return aISO(d);
  })();

  const [tipo, setTipo] = useState('gasto');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(hoyISO);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const simbolo = simboloMoneda || 'S/';

  /* Etiqueta de la antigüedad: deja claro a qué día se está imputando. */
  const diasAtras = Math.round((new Date(hoyISO) - new Date(fecha)) / 86400000);
  const etiquetaFecha = !fecha || isNaN(diasAtras) ? ''
    : diasAtras === 0 ? 'Hoy'
    : diasAtras === 1 ? 'Ayer'
    : `Hace ${diasAtras} días`;

  /* A qué estado de cuenta va a parar: lo que no era evidente al fechar
     un movimiento en el pasado. */
  const cicloDestino = (() => {
    if (!tarjeta || !fecha || fecha > hoyISO || fecha < minISO) return null;
    const d = parseISODate(fecha);
    if (!d || isNaN(d)) return null;
    return cicloDeFecha(tarjeta, d);
  })();

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
    if (!fecha) {
      setError('Selecciona la fecha del movimiento');
      return;
    }
    if (fecha > hoyISO) {
      setError('La fecha no puede ser futura');
      return;
    }
    if (fecha < minISO) {
      setError(`La fecha no puede tener más de ${DIAS_RETRO_MAX} días de antigüedad`);
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
        fecha_movimiento: fecha,
      });

      if (!data.success) throw new Error(data.message || 'Error al registrar movimiento');

      const etiqueta = tipo === 'gasto' ? 'Gasto' : 'Pago';

      /* Con fecha pasada el movimiento no sale en "recientes", así que se
         dice explícitamente en qué estado de cuenta quedó. */
      if (diasAtras > 0 && cicloDestino) {
        showToast(
          `${etiqueta} registrado el ${dm(parseISODate(fecha))} · entra en el ciclo ` +
          `${dm(cicloDestino.inicio)} – ${dm(cicloDestino.cierre)}, vence el ${dm(cicloDestino.pago)}`,
          'success'
        );
      } else {
        showToast(`${etiqueta} registrado correctamente`, 'success');
      }

      setMonto('');
      setDescripcion('');
      setFecha(hoyISO);
      setSuccess(`${etiqueta} registrado correctamente`);

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

            {/* Fecha */}
            <div className="mf-group">
              <div className="mf-fecha-row">
                <label className="mf-label">Fecha del {tipo}</label>
                {etiquetaFecha && (
                  <span className={`mf-fecha-hint${diasAtras > 0 ? ' retro' : ''}`}>{etiquetaFecha}</span>
                )}
              </div>
              <input
                type="date"
                value={fecha}
                min={minISO}
                max={hoyISO}
                onChange={(e) => setFecha(e.target.value)}
                disabled={loading}
                className="mf-input"
              />

              {cicloDestino && (
                <p className={`mf-ciclo${diasAtras > 0 ? ' retro' : ''}`}>
                  Entra en el estado de cuenta{' '}
                  <strong>{dm(cicloDestino.inicio)} – {dm(cicloDestino.cierre)}</strong>,
                  que vence el <strong>{dLargo(cicloDestino.pago)}</strong>.
                </p>
              )}
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
                {diasAtras > 0
                  ? 'Al fecharlo en un día pasado, el movimiento entra en el estado de cuenta de ese ciclo. Tu deuda actual se ajusta igual.'
                  : tipo === 'gasto'
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
