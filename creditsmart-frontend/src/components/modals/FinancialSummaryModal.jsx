import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './FinancialSummaryModal.css';

// ── SVG Icons ────────────────────────────────────────────────
const IcChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IcClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcMoney = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const IcTrend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcWarn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcBell = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const IcCard = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="3"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IcChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

// ── Componente ───────────────────────────────────────────────
function FinancialSummaryModal({ tarjetas, onClose }) {
  const [expandedId, setExpandedId] = useState(null);
  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  const tarjetasOrdenadas = [...tarjetas]
    .filter(t => !t.esta_vacia)
    .sort((a, b) => (a.dias_al_pago ?? 999) - (b.dias_al_pago ?? 999));

  const deudaPorMoneda = tarjetasOrdenadas.reduce((acc, t) => {
    const simbolo = t.simbolo_moneda || 'S/';
    const deuda = parseFloat(t.deuda_actual || 0);
    if (!acc[simbolo]) acc[simbolo] = 0;
    acc[simbolo] += deuda;
    return acc;
  }, {});

  const getUsoColor = (pct) => {
    if (pct <= 30) return 'good';
    if (pct <= 70) return 'warning';
    return 'danger';
  };

  const getUrgenciaBadge = (dias) => {
    if (dias === 0) return { label: '¡Hoy!', color: 'critico' };
    if (dias <= 3)  return { label: `${dias} días`, color: 'critico' };
    if (dias <= 7)  return { label: `${dias} días`, color: 'urgente' };
    return null;
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '—';
    const fecha = new Date(fechaISO);
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  };

  return createPortal(
    <div className="rsm-overlay" onClick={onClose}>
      <div className="rsm-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="rsm-header">
          <div className="rsm-header-left">
            <div className="rsm-header-icon"><IcChart /></div>
            <div>
              <h2 className="rsm-title">Resumen Financiero</h2>
              <span className="rsm-subtitle">
                {tarjetasOrdenadas.length} tarjeta{tarjetasOrdenadas.length !== 1 ? 's' : ''} activa{tarjetasOrdenadas.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button className="rsm-close" onClick={onClose}><IcClose /></button>
        </div>

        {/* ── Totales por moneda ── */}
        {Object.keys(deudaPorMoneda).length > 0 && (
          <div className="rsm-totales">
            {Object.entries(deudaPorMoneda).map(([simbolo, total]) => (
              <div key={simbolo} className="rsm-total-item">
                <span className="rsm-total-label">Deuda total en {simbolo}</span>
                <span className="rsm-total-value">
                  {simbolo} {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Lista de tarjetas ── */}
        <div className="rsm-content">
          {tarjetasOrdenadas.length === 0 ? (
            <div className="rsm-empty">
              <div className="rsm-empty-icon"><IcCard /></div>
              <p>No tienes tarjetas activas aún</p>
            </div>
          ) : (
            tarjetasOrdenadas.map((tarjeta, i) => {
              const simbolo   = tarjeta.simbolo_moneda || 'S/';
              const deuda     = parseFloat(tarjeta.deuda_actual || 0);
              const linea     = parseFloat(tarjeta.linea_credito || 1);
              const disponible = linea - deuda;
              const pct       = Math.round((deuda / linea) * 100);
              const colorUso  = getUsoColor(pct);
              const urgencia  = getUrgenciaBadge(tarjeta.dias_al_pago);
              const esPrimero = i === 0 && urgencia;

              const isOpen = expandedId === tarjeta.id;

              return (
                <div key={tarjeta.id} className={`rsm-card${esPrimero ? ' rsm-card--urgent' : ''}${isOpen ? ' rsm-card--open' : ''}`}>

                  {/* Card header — clickable */}
                  <div className="rsm-card-header rsm-card-header--btn" onClick={() => toggle(tarjeta.id)}>
                    <div className="rsm-card-left">
                      <span className="rsm-card-rank">#{i + 1}</span>
                      <div>
                        <h3 className="rsm-card-banco">
                          {tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco'}
                        </h3>
                        {tarjeta.nombre_tarjeta && (
                          <span className="rsm-card-nombre">{tarjeta.nombre_tarjeta}</span>
                        )}
                      </div>
                    </div>
                    <div className="rsm-card-right-row">
                      <div className="rsm-card-badges">
                        {urgencia && (
                          <span className={`rsm-badge rsm-badge--${urgencia.color}`}>
                            Pago en {urgencia.label}
                          </span>
                        )}
                        <span className={`rsm-badge rsm-badge--uso rsm-badge--${colorUso}`}>
                          {pct}% uso
                        </span>
                      </div>
                      <span className={`rsm-chevron${isOpen ? ' rsm-chevron--open' : ''}`}>
                        <IcChevron />
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo expandible */}
                  {isOpen && (
                    <div className="rsm-card-body">
                      <div className="rsm-card-sep" />

                      {/* Montos */}
                      <div className="rsm-montos">
                    <div className="rsm-monto-item">
                      <span className="rsm-monto-label">Deuda</span>
                      <span className={`rsm-monto-value${deuda > 0 ? ' rsm-monto--deuda' : ' rsm-monto--cero'}`}>
                        {simbolo} {deuda.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="rsm-monto-item">
                      <span className="rsm-monto-label">Disponible</span>
                      <span className="rsm-monto-value rsm-monto--disp">
                        {simbolo} {disponible.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="rsm-monto-item">
                      <span className="rsm-monto-label">Línea total</span>
                      <span className="rsm-monto-value">
                        {simbolo} {linea.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Barra de uso */}
                  <div className="rsm-barra-wrap">
                    <div className="rsm-barra-track">
                      <div
                        className={`rsm-barra-fill rsm-barra--${colorUso}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                      <div className="rsm-barra-marker" />
                    </div>
                    <div className="rsm-barra-labels">
                      <span>0%</span>
                      <span className="rsm-barra-mid">30% ideal</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Fechas */}
                  <div className="rsm-fechas">
                    <div className="rsm-fecha-item">
                      <div className="rsm-fecha-icon rsm-fecha-icon--cal"><IcCalendar /></div>
                      <div>
                        <span className="rsm-fecha-label">Cierre</span>
                        <span className="rsm-fecha-value">{formatearFecha(tarjeta.fecha_cierre)}</span>
                        <span className="rsm-fecha-dias">
                          {tarjeta.dias_al_cierre === 0 ? 'Hoy' : `${tarjeta.dias_al_cierre} días`}
                        </span>
                      </div>
                    </div>

                    <div className={`rsm-fecha-item${urgencia ? ' rsm-fecha-item--urgent' : ''}`}>
                      <div className="rsm-fecha-icon rsm-fecha-icon--pay"><IcMoney /></div>
                      <div>
                        <span className="rsm-fecha-label">Pago</span>
                        <span className="rsm-fecha-value">{formatearFecha(tarjeta.fecha_pago)}</span>
                        <span className={`rsm-fecha-dias${urgencia ? ` rsm-dias--${urgencia.color}` : ''}`}>
                          {tarjeta.dias_al_pago === 0 ? '¡Hoy!' : `${tarjeta.dias_al_pago} días`}
                        </span>
                      </div>
                    </div>

                    {tarjeta.tasa_interes && (
                      <div className="rsm-fecha-item">
                        <div className="rsm-fecha-icon rsm-fecha-icon--tea"><IcTrend /></div>
                        <div>
                          <span className="rsm-fecha-label">TEA</span>
                          <span className="rsm-fecha-value">{tarjeta.tasa_interes}%</span>
                          <span className="rsm-fecha-dias">anual</span>
                        </div>
                      </div>
                    )}
                  </div>

                      {/* Tips */}
                      {pct >= 70 && (
                        <div className="rsm-tip rsm-tip--danger">
                          <IcWarn /> Uso elevado. Paga antes del cierre para mejorar tu score.
                        </div>
                      )}
                      {urgencia?.color === 'critico' && deuda > 0 && (
                        <div className="rsm-tip rsm-tip--warning">
                          <IcBell /> Pago muy próximo. Evita cargos por mora.
                        </div>
                      )}
                      {pct <= 15 && deuda === 0 && (
                        <div className="rsm-tip rsm-tip--good">
                          <IcCheck /> Sin deuda. ¡Excelente manejo!
                        </div>
                      )}
                    </div>
                  )}{/* /rsm-card-body */}

                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="rsm-footer">
          <p className="rsm-footer-note">
            Ordenado por urgencia de pago · Actualizado al día de hoy
          </p>
          <button className="rsm-btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default FinancialSummaryModal;
