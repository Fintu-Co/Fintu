import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { movementsApi } from '../../services/api';
import './MovementList.css';

/* ── SVG Icons ── */
const IconGasto = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const IconPago = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IconEmpty = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="13" y2="14"/>
  </svg>
);
const IconInfo = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconTip = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 8 12 12 14 14"/>
  </svg>
);
const IconChevron = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function MovementList({ tarjetaId, simboloMoneda, refreshTrigger }) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtro,      setFiltro]      = useState('todo');
  const [showModal,   setShowModal]   = useState(false);
  const [selected,    setSelected]    = useState(null);

  useEffect(() => { cargarMovimientos(); }, [tarjetaId, refreshTrigger]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      const data = await movementsApi.getByCard(`${tarjetaId}?limite=15`);
      if (data.success) setMovimientos(data.movimientos);
    } catch (e) {
      console.error('Error al cargar movimientos:', e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Agrupado por fecha ── */
  const agrupar = (movs) => {
    const hoy  = new Date();
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
    const sem  = new Date(hoy); sem.setDate(sem.getDate() - 7);
    const g = { hoy: [], ayer: [], semana: [], anteriores: [] };
    movs.forEach(m => {
      const f = new Date(m.fecha_movimiento);
      if (f.toDateString() === hoy.toDateString())  g.hoy.push(m);
      else if (f.toDateString() === ayer.toDateString()) g.ayer.push(m);
      else if (f >= sem) g.semana.push(m);
      else g.anteriores.push(m);
    });
    return g;
  };

  const fmtFecha = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };
  const fmtHora = (iso) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const resumen = () => {
    const gastos = movimientos.filter(m => m.tipo === 'gasto');
    const pagos  = movimientos.filter(m => m.tipo === 'pago');
    return {
      numGastos:   gastos.length,
      numPagos:    pagos.length,
      totalGastos: gastos.reduce((s, m) => s + parseFloat(m.monto), 0),
      totalPagos:  pagos.reduce((s, m) => s + parseFloat(m.monto), 0),
    };
  };

  const simbolo = simboloMoneda || 'S/';
  const filtrados = movimientos
    .filter(m => filtro === 'gastos' ? m.tipo === 'gasto' : filtro === 'pagos' ? m.tipo === 'pago' : true)
    .slice(0, 15);
  const grupos = agrupar(filtrados);
  const res    = resumen();

  /* ── Loading ── */
  if (loading) return (
    <div className="ml-loading">
      <div className="ml-spinner" />
      <span>Cargando movimientos…</span>
    </div>
  );

  /* ── Empty ── */
  if (movimientos.length === 0) return (
    <div className="ml-empty">
      <div className="ml-empty-icon"><IconEmpty /></div>
      <p className="ml-empty-title">Sin movimientos aún</p>
      <span className="ml-empty-hint">Usa <strong>Agregar</strong> para registrar tu primer movimiento</span>
    </div>
  );

  return (
    <>
      <div className="ml-wrap">

        {/* ── Resumen ── */}
        <div className="ml-summary">
          <div className="ml-sum-card gastos">
            <div className="ml-sum-icon"><IconGasto /></div>
            <div className="ml-sum-body">
              <span className="ml-sum-label">Gastos</span>
              <span className="ml-sum-val">{simbolo} {res.totalGastos.toFixed(2)}</span>
              <span className="ml-sum-count">{res.numGastos} movimiento{res.numGastos !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="ml-sum-divider" />
          <div className="ml-sum-card pagos">
            <div className="ml-sum-icon"><IconPago /></div>
            <div className="ml-sum-body">
              <span className="ml-sum-label">Pagos</span>
              <span className="ml-sum-val">{simbolo} {res.totalPagos.toFixed(2)}</span>
              <span className="ml-sum-count">{res.numPagos} movimiento{res.numPagos !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="ml-filters">
          {[
            { id: 'todo',   label: 'Todos',  count: movimientos.length },
            { id: 'gastos', label: 'Gastos', count: res.numGastos },
            { id: 'pagos',  label: 'Pagos',  count: res.numPagos  },
          ].map(f => (
            <button
              key={f.id}
              className={`ml-filter ${filtro === f.id ? 'active' : ''}`}
              onClick={() => setFiltro(f.id)}
            >
              {f.label}
              <span className="ml-filter-count">{f.count}</span>
            </button>
          ))}
        </div>

        {/* ── Timeline ── */}
        <div className="ml-timeline">
          {[
            { key: 'hoy',        label: 'Hoy',          items: grupos.hoy },
            { key: 'ayer',       label: 'Ayer',          items: grupos.ayer },
            { key: 'semana',     label: 'Esta semana',   items: grupos.semana },
            { key: 'anteriores', label: 'Anteriores',    items: grupos.anteriores },
          ].filter(g => g.items.length > 0).map(g => (
            <div key={g.key} className="ml-group">
              <div className="ml-group-header">
                <span className="ml-group-label">{g.label}</span>
                <span className="ml-group-count">{g.items.length}</span>
              </div>
              <div className="ml-group-items">
                {g.items.map((mov, i) => (
                  <MovItem
                    key={mov.id}
                    mov={mov}
                    simbolo={simbolo}
                    fmtHora={fmtHora}
                    fmtFecha={fmtFecha}
                    index={i}
                    onClick={() => { setSelected(mov); setShowModal(true); }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Límite */}
        {movimientos.length > 15 && (
          <div className="ml-limit">
            <IconInfo />
            <span>Mostrando los últimos 15 de {movimientos.length} movimientos</span>
          </div>
        )}

      </div>

      {/* Modal de detalle */}
      {showModal && selected && createPortal(
        <DetailModal
          mov={selected}
          simbolo={simbolo}
          fmtFecha={fmtFecha}
          fmtHora={fmtHora}
          onClose={() => setShowModal(false)}
        />,
        document.body
      )}
    </>
  );
}

/* ═══════════════════════════════════════
   Ítem de movimiento
═══════════════════════════════════════ */
function MovItem({ mov, simbolo, fmtHora, fmtFecha, index, onClick }) {
  const esGasto = mov.tipo === 'gasto';
  return (
    <div
      className={`ml-item ${mov.tipo}`}
      style={{ animationDelay: `${index * 0.04}s` }}
      onClick={onClick}
    >
      <div className={`ml-item-icon ${mov.tipo}`}>
        {esGasto ? <IconGasto /> : <IconPago />}
      </div>

      <div className="ml-item-info">
        <span className="ml-item-desc">
          {mov.descripcion || (esGasto ? 'Gasto registrado' : 'Pago realizado')}
        </span>
        <span className="ml-item-time">
          {fmtHora ? fmtHora(mov.fecha_movimiento) : fmtFecha(mov.fecha_movimiento)}
        </span>
      </div>

      <div className={`ml-item-amount ${mov.tipo}`}>
        <span className="ml-item-sign">{esGasto ? '+' : '-'}</span>
        <span className="ml-item-val">{simbolo} {parseFloat(mov.monto).toFixed(2)}</span>
      </div>

      <div className="ml-item-chevron"><IconChevron /></div>
    </div>
  );
}

/* ═══════════════════════════════════════
   Modal de detalle
═══════════════════════════════════════ */
function DetailModal({ mov, simbolo, fmtFecha, fmtHora, onClose }) {
  const esGasto = mov.tipo === 'gasto';
  return (
    <div className="ml-modal-overlay" onClick={onClose}>
      <div className="ml-modal" onClick={e => e.stopPropagation()}>

        <div className="ml-modal-header">
          <div className="ml-modal-header-left">
            <div className={`ml-modal-type-icon ${mov.tipo}`}>
              {esGasto ? <IconGasto /> : <IconPago />}
            </div>
            <div>
              <h3>{esGasto ? 'Gasto' : 'Pago'}</h3>
              <p>{fmtFecha(mov.fecha_movimiento)} · {fmtHora(mov.fecha_movimiento)}</p>
            </div>
          </div>
          <button className="ml-modal-close" onClick={onClose}><IconClose /></button>
        </div>

        <div className="ml-modal-body">
          <div className={`ml-modal-amount ${mov.tipo}`}>
            <span className="ml-modal-sign">{esGasto ? '+' : '-'}</span>
            {simbolo} {parseFloat(mov.monto).toFixed(2)}
          </div>

          <div className="ml-modal-rows">
            <div className="ml-modal-row">
              <span>Descripción</span>
              <span>{mov.descripcion || (esGasto ? 'Gasto registrado' : 'Pago realizado')}</span>
            </div>
            <div className="ml-modal-row">
              <span>Fecha</span>
              <span>{fmtFecha(mov.fecha_movimiento)}</span>
            </div>
            <div className="ml-modal-row">
              <span>Hora</span>
              <span>{fmtHora(mov.fecha_movimiento)}</span>
            </div>
            <div className="ml-modal-row">
              <span>Tipo</span>
              <span className={`ml-modal-badge ${mov.tipo}`}>{esGasto ? 'Gasto' : 'Pago'}</span>
            </div>
          </div>

          <div className="ml-modal-tip">
            <div className="ml-modal-tip-icon"><IconTip /></div>
            <p>
              {esGasto
                ? 'Este gasto suma a tu deuda. Controla tus gastos para mantener un uso saludable de tu línea de crédito.'
                : 'Este pago reduce tu deuda. ¡Excelente! Pagar regularmente mejora tu historial crediticio.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default MovementList;
