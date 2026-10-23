import { useState, useEffect } from 'react';
import { analyticsApi } from '@/modules/analytics/services/analyticsApi';
import './UsageAnalysis.css';

/* ── SVG icons ── */
const IcClose  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcCheck  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IcWarn   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcInfo   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
const IcShield = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const IcTarget = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const IcBolt   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IcBalance= () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="3" x2="12" y2="21"/><path d="M6 17l-3-5 3-5"/><path d="M18 7l3 5-3 5"/><line x1="3" y1="12" x2="21" y2="12"/></svg>;
const IcChart  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcTrend  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
const IcPin    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcMortar = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>;
const IcEmpty  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="13" y2="14"/></svg>;
const IcUp     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>;
const IcDown   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/></svg>;
const IcEq     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/></svg>;

function UsageAnalysis({ tarjetaId, simboloMoneda, porcentajeUso, deudaActual, lineaCredito, onClose }) {
  const [analysis,       setAnalysis]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [sinMovimientos, setSinMovimientos] = useState(false);

  useEffect(() => { cargarAnalisis(); }, [tarjetaId]);

  const cargarAnalisis = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getUsageAnalysis(tarjetaId);
      if (data.success) {
        if (data.analysis.num_gastos === 0 && data.analysis.num_pagos === 0) {
          setSinMovimientos(true);
        } else {
          setAnalysis(data.analysis);
        }
      }
    } catch {
      setSinMovimientos(true);
    } finally {
      setLoading(false);
    }
  };

  const simbolo = simboloMoneda || 'S/';

  /* ── Fix bug: la clasificación de la API se basa en patrones de movimientos
     pero debe respetar el % de uso real para no mostrar "En Riesgo" cuando
     la deuda es baja. ── */
  const getClasificacion = (clasificacion, pct) => {
    // Override: nunca mostrar riesgo alto si el uso real es bajo
    let efectiva = clasificacion;
    if (pct <= 30 && ['En Riesgo', 'Impulsivo'].includes(clasificacion)) {
      efectiva = 'Estratégico';
    } else if (pct <= 70 && clasificacion === 'En Riesgo') {
      efectiva = 'Moderado';
    }

    const map = {
      'Conservador': {
        color: 'blue', Icon: IcShield,
        titulo: 'Uso Conservador', badge: 'Bajo riesgo',
        desc: 'Usas poco de tu línea. Estás en el rango ideal (10–30%) para un historial saludable.',
        consejo: 'Mantener el uso entre 10% y 30% y pagar puntualmente es la mejor estrategia.',
      },
      'Estratégico': {
        color: 'green', Icon: IcTarget,
        titulo: 'Uso Estratégico', badge: '¡Excelente!',
        desc: 'Usas tu tarjeta de forma inteligente. Tu deuda está en el rango ideal.',
        consejo: 'Pagar el total de tu deuda cada mes evita por completo los intereses.',
      },
      'Impulsivo': {
        color: 'orange', Icon: IcBolt,
        titulo: 'Uso Frecuente', badge: 'Atención',
        desc: 'Tienes muchas transacciones pequeñas. Puede ser difícil llevar el control.',
        consejo: 'Intenta agrupar compras y revisar tu saldo semanal para no perder el control.',
      },
      'En Riesgo': {
        color: 'red', Icon: IcWarn,
        titulo: 'Uso Elevado', badge: 'Requiere acción',
        desc: 'Tu deuda está cerca del límite. Esto afecta negativamente tu score crediticio.',
        consejo: 'Prioriza reducir la deuda antes de nuevos gastos. El objetivo es bajar del 30%.',
      },
      'Moderado': {
        color: 'yellow', Icon: IcBalance,
        titulo: 'Uso Moderado', badge: 'Mejorable',
        desc: 'Tu uso está en un nivel aceptable, pero hay margen para mejorar.',
        consejo: 'Intenta reducir gradualmente tu deuda para llegar al rango ideal (10–30%).',
      },
    };

    // Si el pct es muy bajo, sobrescribir también la descripción
    if (pct < 10 && !['En Riesgo','Impulsivo'].includes(clasificacion)) {
      return {
        color: 'blue', Icon: IcShield,
        titulo: 'Uso Muy Bajo', badge: 'Conservador',
        desc: `Estás usando solo el ${pct}% de tu línea. Estás bien, pero el rango ideal es 10–30% para construir historial.`,
        consejo: 'Usar entre 10% y 30% de tu línea y pagarlo puntualmente tiene el mejor impacto en tu historial.',
      };
    }

    return map[efectiva] || map['Moderado'];
  };

  const getTendencia = (tendencia, variacion) => {
    if (tendencia === 'up')   return { Icon: IcUp,   color: 'danger',  texto: `+${Math.abs(variacion)}% vs ciclo anterior` };
    if (tendencia === 'down') return { Icon: IcDown, color: 'good',    texto: `-${Math.abs(variacion)}% vs ciclo anterior` };
    return                           { Icon: IcEq,   color: 'neutral', texto: 'Similar al ciclo anterior' };
  };

  /* ──────────────── HEADER compartido ──────────────── */
  const Header = () => (
    <div className="ua-header">
      <div className="ua-header-left">
        <div className="ua-header-icon"><IcChart /></div>
        <div>
          <h2>Análisis de Uso</h2>
          <p>Línea de crédito · {porcentajeUso}% utilizado</p>
        </div>
      </div>
      <button className="ua-close" onClick={onClose}><IcClose /></button>
    </div>
  );

  /* ──────────────── LOADING ──────────────── */
  if (loading) return (
    <div className="ua-overlay" onClick={onClose}>
      <div className="ua-modal" onClick={e => e.stopPropagation()}>
        <Header />
        <div className="ua-loading"><div className="ua-spinner" /><span>Analizando tu comportamiento…</span></div>
      </div>
    </div>
  );

  /* ──────────────── SIN MOVIMIENTOS ──────────────── */
  if (sinMovimientos) return (
    <div className="ua-overlay" onClick={onClose}>
      <div className="ua-modal" onClick={e => e.stopPropagation()}>
        <Header />

        <div className="ua-body">
          {/* Summary */}
          <div className="ua-summary">
            {[
              { label: 'Línea total', val: `${simbolo} ${parseFloat(lineaCredito).toLocaleString('es-PE')}`, cls: '' },
              { label: 'Deuda actual', val: `${simbolo} ${parseFloat(deudaActual).toLocaleString('es-PE')}`, cls: 'gold' },
              { label: 'Uso actual', val: `${porcentajeUso}%`, cls: porcentajeUso > 70 ? 'danger' : porcentajeUso > 30 ? 'warn' : 'good' },
            ].map((s, i) => (
              <div key={i} className="ua-sum-item">
                <span className="ua-sum-label">{s.label}</span>
                <span className={`ua-sum-val ${s.cls}`}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Empty */}
          <div className="ua-empty">
            <div className="ua-empty-icon"><IcEmpty /></div>
            <h3>Sin datos aún</h3>
            <p>Registra tus primeros gastos y pagos para ver un análisis personalizado de tu comportamiento.</p>
          </div>

          {/* Educativo */}
          <div className="ua-section">
            <h3 className="ua-section-title">¿Qué es un buen uso de tarjeta?</h3>
            <div className="ua-edu-list">
              {[
                { Icon: IcCheck, color: 'good',   title: 'Ideal: bajo 30%',      desc: 'Uso saludable que cuida tu historial crediticio' },
                { Icon: IcWarn,  color: 'warn',   title: 'Aceptable: 30% – 70%', desc: 'Funciona, pero intenta reducirlo gradualmente' },
                { Icon: IcWarn,  color: 'danger', title: 'Riesgo: más del 70%',  desc: 'Puede afectar negativamente tu score crediticio' },
              ].map((e, i) => (
                <div key={i} className={`ua-edu-card ${e.color}`}>
                  <div className={`ua-edu-icon ${e.color}`}><e.Icon /></div>
                  <div>
                    <strong>{e.title}</strong>
                    <p>{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Qué verás */}
          <div className="ua-section">
            <h3 className="ua-section-title">Cuando registres movimientos verás</h3>
            <div className="ua-features">
              {[
                { Icon: IcTrend,  text: 'Comparación con tu ciclo anterior' },
                { Icon: IcTarget, text: 'Tu clasificación de comportamiento' },
                { Icon: IcInfo,   text: 'Recomendaciones personalizadas' },
                { Icon: IcChart,  text: 'Métricas de gastos y pagos' },
              ].map((f, i) => (
                <div key={i} className="ua-feature-row">
                  <div className="ua-feature-icon"><f.Icon /></div>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ua-footer">
          <button className="ua-btn-ok" onClick={onClose}>
            <IcCheck /> Entendido
          </button>
        </div>
      </div>
    </div>
  );

  if (!analysis) return null;

  const cfg       = getClasificacion(analysis.clasificacion, porcentajeUso);
  const tendencia = getTendencia(analysis.tendencia, analysis.variacion_porcentaje);

  /* ──────────────── ESTADO NORMAL ──────────────── */
  return (
    <div className="ua-overlay" onClick={onClose}>
      <div className="ua-modal" onClick={e => e.stopPropagation()}>
        <Header />

        <div className="ua-body">

          {/* Summary */}
          <div className="ua-summary">
            {[
              { label: 'Línea total',  val: `${simbolo} ${parseFloat(lineaCredito).toLocaleString('es-PE')}`, cls: '' },
              { label: 'Deuda actual', val: `${simbolo} ${parseFloat(deudaActual).toLocaleString('es-PE')}`,  cls: 'gold' },
              { label: 'Uso actual',   val: `${porcentajeUso}%`, cls: porcentajeUso > 70 ? 'danger' : porcentajeUso > 30 ? 'warn' : 'good' },
            ].map((s, i) => (
              <div key={i} className="ua-sum-item">
                <span className="ua-sum-label">{s.label}</span>
                <span className={`ua-sum-val ${s.cls}`}>{s.val}</span>
              </div>
            ))}
          </div>

          {/* Clasificación de comportamiento */}
          <div className={`ua-behavior ${cfg.color}`}>
            <div className={`ua-behavior-icon ${cfg.color}`}><cfg.Icon /></div>
            <div className="ua-behavior-body">
              <div className="ua-behavior-top">
                <h3>{cfg.titulo}</h3>
                <span className={`ua-badge ${cfg.color}`}>{cfg.badge}</span>
              </div>
              <p>{cfg.desc}</p>
              <div className="ua-behavior-tip">
                <IcInfo />
                <span>{cfg.consejo}</span>
              </div>
            </div>
          </div>

          {/* Comparación ciclos */}
          <div className="ua-section">
            <h3 className="ua-section-title">Comparación con ciclo anterior</h3>
            <div className="ua-comparison">
              <div className="ua-cmp-item">
                <span className="ua-cmp-label">Ciclo anterior</span>
                <span className="ua-cmp-val">{simbolo} {parseFloat(analysis.gastos_ciclo_anterior).toLocaleString('es-PE')}</span>
              </div>
              <div className={`ua-cmp-arrow ${tendencia.color}`}><tendencia.Icon /></div>
              <div className="ua-cmp-item">
                <span className="ua-cmp-label">Ciclo actual</span>
                <span className="ua-cmp-val">{simbolo} {parseFloat(analysis.gastos_ciclo_actual).toLocaleString('es-PE')}</span>
              </div>
            </div>
            <div className={`ua-variation ${tendencia.color}`}>{tendencia.texto}</div>
          </div>

          {/* Métricas */}
          <div className="ua-section">
            <h3 className="ua-section-title">Métricas del ciclo</h3>
            <div className="ua-metrics">
              {[
                { label: 'Gastos registrados',          val: analysis.num_gastos,                                              cls: '' },
                { label: 'Pagos realizados',             val: analysis.num_pagos,                                               cls: '' },
                { label: 'Promedio por gasto',           val: `${simbolo} ${analysis.promedio_gasto_por_transaccion.toFixed(2)}`, cls: '' },
                { label: '¿Cuánto pagaste de lo gastado?', val: `${(analysis.ratio_gasto_pago * 100).toFixed(0)}%`,             cls: analysis.ratio_gasto_pago < 0.5 ? 'danger' : 'good' },
              ].map((m, i) => (
                <div key={i} className="ua-metric-row">
                  <span>{m.label}</span>
                  <span className={`ua-metric-val ${m.cls}`}>{m.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guía de pagos */}
          <div className="ua-section">
            <h3 className="ua-section-title">¿Cuánto debería pagar?</h3>
            <div className="ua-payments">
              {[
                {
                  color: 'good', badge: 'Recomendado', Icon: IcCheck,
                  title: 'Pago total',
                  amount: `${simbolo} ${parseFloat(deudaActual).toLocaleString('es-PE')}`,
                  desc: 'Pagas todo y no generas ningún interés. La mejor estrategia.',
                },
                {
                  color: 'blue', badge: 'Aceptable', Icon: IcTarget,
                  title: 'Más del mínimo',
                  amount: 'Lo más que puedas',
                  desc: 'Reduce la deuda más rápido y pagas menos intereses.',
                },
                {
                  color: 'warn', badge: 'Emergencia', Icon: IcWarn,
                  title: 'Solo el mínimo',
                  amount: 'Evita la mora',
                  desc: 'Mantiene la tarjeta activa pero genera altos intereses. Solo si es necesario.',
                },
              ].map((p, i) => (
                <div key={i} className={`ua-payment ${p.color}`}>
                  <div className={`ua-payment-icon ${p.color}`}><p.Icon /></div>
                  <div className="ua-payment-body">
                    <div className="ua-payment-top">
                      <strong>{p.title}</strong>
                      <span className={`ua-badge ${p.color}`}>{p.badge}</span>
                    </div>
                    <span className={`ua-payment-amount ${p.color}`}>{p.amount}</span>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="ua-rule-note">
              <div className="ua-rule-icon"><IcPin /></div>
              <p>El pago mínimo cubre intereses y al menos el 5% de tu deuda principal. Pagar solo eso puede triplicar el tiempo para saldar tu deuda.</p>
            </div>
          </div>

          {/* Tip educativo */}
          <div className="ua-edu-final">
            <div className="ua-edu-final-icon"><IcMortar /></div>
            <div>
              <strong>¿Sabías esto?</strong>
              <p>Las entidades financieras revisan tu porcentaje de uso al calcular tu score. Mantenerlo bajo el 30% puede mejorar significativamente tu perfil crediticio.</p>
            </div>
          </div>

        </div>

        <div className="ua-footer">
          <button className="ua-btn-ok" onClick={onClose}>
            <IcCheck /> Entendido
          </button>
        </div>

      </div>
    </div>
  );
}

export default UsageAnalysis;
