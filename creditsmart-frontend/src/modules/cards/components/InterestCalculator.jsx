import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler
} from 'chart.js';
import './InterestCalculator.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

function InterestCalculator({ tarjeta, simboloMoneda, onClose }) {
  const deudaInicial  = parseFloat(tarjeta.deuda_actual  || 0);
  const teaOriginal   = parseFloat(tarjeta.tasa_interes  || 85);
  const simbolo       = simboloMoneda || 'S/';
  const nombreBanco   = tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco';

  const [pagoMensual,   setPagoMensual]   = useState('');
  const [resultado,     setResultado]     = useState(null);
  const [tab,           setTab]           = useState('simular');
  const [canScrollDown, setCanScrollDown] = useState(false);
  const inputRef   = useRef(null);
  const resultRef  = useRef(null);
  const contentRef = useRef(null);

  /* ── Cálculos base ── */
  const tasaMensual = Math.pow(1 + teaOriginal / 100, 1 / 12) - 1;
  const interesMes  = deudaInicial * tasaMensual;
  const costoDiario = interesMes / 30;
  const pagoMinimo  = Math.max(interesMes + deudaInicial * 0.05, 50);
  const nivelTEA    = teaOriginal >= 70 ? 'alta' : teaOriginal >= 40 ? 'media' : 'baja';

  /* ── Foco automático ── */
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  /* ── Cálculo en vivo (sin botón) ── */
  useEffect(() => {
    const pago = parseFloat(pagoMensual);
    if (!pago || pago <= 0) { setResultado(null); return; }
    const t = setTimeout(() => setResultado(simular(deudaInicial, tasaMensual, pago)), 250);
    return () => clearTimeout(t);
  }, [pagoMensual]);

  /* ── Auto-scroll al resultado cuando aparece ── */
  useEffect(() => {
    if (resultado && !resultado.error && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  }, [resultado]);

  /* ── Detectar si hay contenido para bajar ── */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 12);
    // Doble check: inmediato + 200ms para asegurar que el DOM esté pintado
    check();
    const t = setTimeout(check, 200);
    el.addEventListener('scroll', check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { clearTimeout(t); el.removeEventListener('scroll', check); ro.disconnect(); };
  }, [tab, resultado]);

  /* ── Amortización ── */
  const simular = (deuda, tasaMes, pago) => {
    if (pago <= deuda * tasaMes) return { error: true };
    let saldo = deuda, totalIntereses = 0, meses = 0;
    while (saldo > 0.01 && meses < 600) {
      const interes = saldo * tasaMes;
      saldo -= Math.min(pago - interes, saldo);
      totalIntereses += interes;
      meses++;
    }
    const a = Math.floor(meses / 12), m = meses % 12;
    return {
      error: false, meses, totalPagado: deuda + totalIntereses, totalIntereses,
      tiempoTexto: a > 0
        ? `${a} año${a > 1 ? 's' : ''}${m > 0 ? ` y ${m} mes${m > 1 ? 'es' : ''}` : ''}`
        : `${meses} mes${meses > 1 ? 'es' : ''}`,
    };
  };

  /* ── Proyección mes a mes ── */
  const proyectar = (pago, max = 120) => {
    if (!pago || pago <= deudaInicial * tasaMensual) return null;
    let saldo = deudaInicial;
    const pts = [parseFloat(deudaInicial.toFixed(2))];
    for (let i = 1; i <= max; i++) {
      const int = saldo * tasaMensual;
      saldo = Math.max(saldo - Math.min(pago - int, saldo), 0);
      pts.push(parseFloat(saldo.toFixed(2)));
      if (saldo < 0.01) break;
    }
    return pts;
  };

  /* ── Escenarios comparativa ── */
  const escenarios = [
    { label: 'Pago mínimo',     color: 'red',    pago: pagoMinimo,       desc: 'Lo mínimo para no caer en mora' },
    { label: 'Doble del mínimo',color: 'yellow',  pago: pagoMinimo * 2,  desc: 'Reduce el tiempo a la mitad'    },
    { label: 'Liquidar todo',   color: 'green',   pago: deudaInicial,    desc: 'Un solo pago, sin intereses'    },
  ].map(e => ({ ...e, res: simular(deudaInicial, tasaMensual, e.pago) }));

  const maxMesesComp = Math.max(...escenarios.filter(e => !e.res.error).map(e => e.res.meses));

  /* ── Chart de proyección ── */
  const pUsr  = parseFloat(pagoMensual);
  const pMin  = proyectar(pagoMinimo);
  const pDob  = proyectar(pagoMinimo * 2);
  const pUser = pUsr > 0 && Math.abs(pUsr - pagoMinimo) > 5 && Math.abs(pUsr - pagoMinimo * 2) > 5
    ? proyectar(pUsr) : null;
  const maxL  = Math.max(pMin?.length || 0, pDob?.length || 0, pUser?.length || 0);
  const pad   = arr => { if (!arr) return Array(maxL).fill(null); const c=[...arr]; while(c.length<maxL)c.push(0); return c; };

  const chartData = {
    labels: Array.from({ length: maxL }, (_, i) => i === 0 ? 'Hoy' : `M${i}`),
    datasets: [
      { label: `Mínimo · ${simbolo}${pagoMinimo.toFixed(0)}/mes`, data: pad(pMin), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.07)', fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, borderDash: [6,3] },
      ...(pDob  ? [{ label: `×2 · ${simbolo}${(pagoMinimo*2).toFixed(0)}/mes`, data: pad(pDob), borderColor: '#f59e0b', backgroundColor: 'transparent', fill: false, tension: 0.35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2 }] : []),
      ...(pUser ? [{ label: `Tu pago · ${simbolo}${pUsr.toFixed(0)}/mes`, data: pad(pUser), borderColor: '#d4a574', backgroundColor: 'rgba(212,165,116,0.1)', fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 5, borderWidth: 3 }] : []),
    ],
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { color: '#777', font: { size: 11, weight: '600' }, padding: 12, usePointStyle: true, pointStyle: 'line' } },
      tooltip: {
        backgroundColor: 'rgba(10,10,10,0.96)', titleColor: '#d4a574', bodyColor: '#e5e5e5',
        borderColor: 'rgba(212,165,116,0.2)', borderWidth: 1, padding: 10,
        callbacks: {
          title: items => `Mes ${items[0].dataIndex}`,
          label: ctx => `${ctx.dataset.label.split('·')[0].trim()}: ${simbolo} ${ctx.parsed.y.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#555', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
      y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#555', font: { size: 10 }, callback: v => v >= 1000 ? `${simbolo}${(v/1000).toFixed(1)}k` : `${simbolo}${v}` } },
    },
    interaction: { mode: 'index', intersect: false },
  };

  /* ── Sin deuda ── */
  if (deudaInicial === 0) return createPortal(
    <div className="ic-overlay" onClick={onClose}>
      <div className="ic-modal" onClick={e => e.stopPropagation()}>
        <div className="ic-header">
          <div className="ic-header-left">
            <div className="ic-header-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
            <div><h2>Calculadora de Intereses</h2><span>{nombreBanco}</span></div>
          </div>
          <button className="ic-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>
        <div className="ic-zero">
          <div className="ic-zero-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
          <h3>¡Sin deuda!</h3>
          <p>Esta tarjeta está saldada. No pagas ningún interés.</p>
          <div className="ic-zero-tip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>Pagar el total cada mes es la única forma de no pagar intereses jamás.</p>
          </div>
        </div>
        <div className="ic-footer"><button className="ic-btn-close" onClick={onClose}>Entendido</button></div>
      </div>
    </div>,
    document.body
  );

  /* ── Helper colores ── */
  const colorPorMeses = m => m <= 6 ? 'good' : m <= 24 ? 'warn' : 'bad';
  const cadaPeso = resultado && !resultado.error && resultado.totalIntereses > 0
    ? (resultado.totalPagado / deudaInicial).toFixed(2) : null;

  const TABS = [
    { id: 'simular',    label: 'Simular',    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="11" y2="18"/></svg> },
    { id: 'comparar',   label: 'Comparar',   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { id: 'proyeccion', label: 'Proyección', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
  ];

  /* ══════════════════════════════════════════════════════════════
     RENDER PRINCIPAL
  ══════════════════════════════════════════════════════════════ */
  return createPortal(
    <div className="ic-overlay" onClick={onClose}>
      <div className="ic-modal" onClick={e => e.stopPropagation()}>

        {/* ── HEADER ── */}
        <div className="ic-header">
          <div className="ic-header-left">
            <div className="ic-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div className="ic-header-info">
              <h2>Calculadora de Intereses</h2>
              <div className="ic-header-meta">
                <span>{nombreBanco}</span>
                <span className={`ic-tea-badge ${nivelTEA}`}>
                  TEA {teaOriginal}% — tasa {nivelTEA === 'alta' ? 'alta' : nivelTEA === 'media' ? 'media' : 'baja'}
                </span>
              </div>
            </div>
          </div>
          <button className="ic-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── TABS ── */}
        <div className="ic-tabs">
          {TABS.map(t => (
            <button key={t.id} className={`ic-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.icon}<span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── CONTENIDO ── */}
        <div className="ic-content-wrap">
          <div className="ic-content" ref={contentRef}>

          {/* ══════════════ SIMULAR ══════════════ */}
          {tab === 'simular' && (
            <>
              {/* Situación actual */}
              <div className="ic-situacion">
                <div className="ic-situ-left">
                  <span className="ic-situ-label">Tu deuda actual</span>
                  <span className="ic-situ-deuda">{simbolo} {deudaInicial.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                  <span className="ic-situ-desc">
                    Cada mes pagas{' '}
                    <strong>{simbolo} {interesMes.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</strong>{' '}
                    solo en intereses — sin bajar la deuda
                  </span>
                </div>
                <div className="ic-situ-right">
                  <span className="ic-situ-day-val">{simbolo} {costoDiario.toFixed(2)}</span>
                  <span className="ic-situ-day-label">costo<br/>por día</span>
                </div>
              </div>

              {/* Input */}
              <div className="ic-input-block">
                <label className="ic-input-label">¿Cuánto puedes pagar al mes?</label>
                <div className="ic-input-wrap">
                  <span className="ic-curr">{simbolo}</span>
                  <input
                    ref={inputRef}
                    type="number"
                    className="ic-input"
                    placeholder="0"
                    value={pagoMensual}
                    onChange={e => setPagoMensual(e.target.value)}
                    step="1"
                    min="0"
                  />
                </div>
                <div className="ic-presets">
                  {[
                    { tag: 'Mínimo', val: pagoMinimo },
                    { tag: '×1.5',   val: pagoMinimo * 1.5 },
                    { tag: '×2',     val: pagoMinimo * 2 },
                    { tag: 'Todo',   val: deudaInicial },
                  ].map((p, i) => (
                    <button
                      key={i}
                      className={`ic-preset ${Math.abs(parseFloat(pagoMensual||0) - p.val) < 1 ? 'active' : ''}`}
                      onClick={() => setPagoMensual(p.val.toFixed(0))}
                    >
                      <span className="ic-preset-tag">{p.tag}</span>
                      <span className="ic-preset-val">{simbolo} {p.val.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sin input */}
              {!pagoMensual && (
                <div className="ic-hint">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
                  <p>Escribe un monto o elige una sugerencia — el resultado aparece al instante</p>
                </div>
              )}

              {/* Error */}
              {resultado?.error && (
                <div className="ic-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div>
                    <strong>Pago insuficiente</strong>
                    <p>Con ese monto no cubres los intereses — la deuda seguiría creciendo. Mínimo: <strong>{simbolo} {pagoMinimo.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</strong></p>
                  </div>
                </div>
              )}

              {/* Resultado en vivo */}
              {resultado && !resultado.error && (() => {
                const color = colorPorMeses(resultado.meses);
                const pct = ((deudaInicial / resultado.totalPagado) * 100).toFixed(0);
                const pctInt = (100 - pct);
                return (
                  <div className={`ic-result ${color}`} ref={resultRef}>

                    {/* Titular */}
                    <div className="ic-result-top">
                      <div className="ic-result-left">
                        <span className="ic-result-prefix">Estarías libre en</span>
                        <span className="ic-result-time">{resultado.tiempoTexto}</span>
                        <span className="ic-result-cuotas">{resultado.meses} cuotas de {simbolo} {parseFloat(pagoMensual).toLocaleString('es-PE', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className={`ic-verdict ${color}`}>
                        {color === 'good' ? 'Excelente' : color === 'warn' ? 'Aceptable' : 'Muy lento'}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="ic-result-stats">
                      <div className="ic-stat">
                        <span>Total a pagar</span>
                        <strong>{simbolo} {resultado.totalPagado.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</strong>
                      </div>
                      <div className="ic-stat danger">
                        <span>Intereses extra</span>
                        <strong>{simbolo} {resultado.totalIntereses.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</strong>
                      </div>
                      <div className="ic-stat">
                        <span>Sobrecosto</span>
                        <strong>+{((resultado.totalIntereses / deudaInicial) * 100).toFixed(0)}%</strong>
                      </div>
                    </div>

                    {/* Barra capital / intereses */}
                    <div className="ic-bar-section">
                      <div className="ic-bar-labels">
                        <span><i className="ic-dot cyan"></i>Tu deuda {pct}%</span>
                        <span><i className="ic-dot orange"></i>Intereses {pctInt}%</span>
                      </div>
                      <div className="ic-bar-track">
                        <div className="ic-bar-cap" style={{ width: `${pct}%` }}></div>
                        <div className="ic-bar-int" style={{ width: `${pctInt}%` }}></div>
                      </div>
                    </div>

                    {/* Insight en lenguaje humano */}
                    <div className="ic-insight">
                      {cadaPeso && parseFloat(cadaPeso) > 1.05
                        ? <p>Por cada <strong>{simbolo} 1</strong> que debes, terminarás pagando <strong>{simbolo} {cadaPeso}</strong> en total — el banco cobra <strong>{simbolo} {(parseFloat(cadaPeso) - 1).toFixed(2)}</strong> de más.</p>
                        : <p>¡Casi sin costo! Pagas rápido y los intereses son mínimos.</p>
                      }
                    </div>
                  </div>
                );
              })()}

              {/* TEA explicada */}
              <div className="ic-tea-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div>
                  <strong>¿Qué es la TEA {teaOriginal}%?</strong>
                  <p>El costo real anual de tu deuda. Cada mes el banco aplica un <strong>{(tasaMensual * 100).toFixed(2)}%</strong> sobre tu saldo pendiente — por eso pagar solo el mínimo tarda tanto.</p>
                </div>
              </div>
            </>
          )}

          {/* ══════════════ COMPARAR ══════════════ */}
          {tab === 'comparar' && (
            <>
              <div className="ic-comp-intro">
                <p>¿Cuánto cuesta realmente una deuda de <strong>{simbolo} {deudaInicial.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</strong> según cómo la pagas?</p>
              </div>

              {/* Barras de carrera */}
              <div className="ic-race">
                {escenarios.map((e, i) => (
                  <div key={i} className={`ic-race-row ${e.color}`}>
                    <div className="ic-race-info">
                      <span className="ic-race-name">{e.label}</span>
                      <span className="ic-race-pago">{simbolo} {e.pago.toLocaleString('es-PE', { maximumFractionDigits: 0 })}/mes</span>
                    </div>
                    <div className="ic-race-visual">
                      <div className="ic-race-track">
                        <div
                          className={`ic-race-bar ${e.color}`}
                          style={{ width: `${Math.max(4, (e.res.meses / maxMesesComp) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="ic-race-tiempo">{e.res.tiempoTexto}</span>
                    </div>
                    <div className="ic-race-costo">
                      <span>+intereses</span>
                      <strong className={e.color}>
                        {e.res.totalIntereses > 0
                          ? `${simbolo} ${e.res.totalIntereses.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
                          : '— Gratis'}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Ahorro destacado */}
              {!escenarios[0].res.error && !escenarios[1].res.error && (() => {
                const ahInt   = escenarios[0].res.totalIntereses - escenarios[1].res.totalIntereses;
                const ahMeses = escenarios[0].res.meses - escenarios[1].res.meses;
                return (
                  <div className="ic-ahorro">
                    <div className="ic-ahorro-num">
                      {simbolo} {ahInt.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="ic-ahorro-info">
                      <strong>ahorras en intereses</strong>
                      <span>pagando el doble del mínimo</span>
                      <small>y terminas <strong>{ahMeses} meses antes</strong></small>
                    </div>
                  </div>
                );
              })()}

              {/* Tabla resumen */}
              <div className="ic-tabla">
                <div className="ic-tabla-head">
                  <div className="ic-th-empty"></div>
                  {escenarios.map((e, i) => (
                    <div key={i} className={`ic-th ${e.color}`}>{e.label}</div>
                  ))}
                </div>
                {[
                  { label: 'Pago mensual', vals: escenarios.map(e => `${simbolo} ${e.pago.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`) },
                  { label: 'Tiempo',       vals: escenarios.map(e => e.res.tiempoTexto) },
                  { label: 'Total pagado', vals: escenarios.map(e => `${simbolo} ${e.res.totalPagado.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`) },
                  { label: 'Intereses',    vals: escenarios.map(e => e.res.totalIntereses > 0 ? `${simbolo} ${e.res.totalIntereses.toLocaleString('es-PE', { maximumFractionDigits: 0 })}` : '—') },
                ].map((row, i) => (
                  <div key={i} className="ic-tabla-row">
                    <div className="ic-td-label">{row.label}</div>
                    {row.vals.map((v, j) => <div key={j} className={`ic-td ${j === 2 ? 'green' : ''}`}>{v}</div>)}
                  </div>
                ))}
              </div>

              <div className="ic-regla">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <div>
                  <strong>Regla de oro</strong>
                  <p>Cada sol extra que pagas va directo a reducir tu deuda, no a pagar intereses. Siempre paga más del mínimo.</p>
                </div>
              </div>
            </>
          )}

          {/* ══════════════ PROYECCIÓN ══════════════ */}
          {tab === 'proyeccion' && (
            <>
              <div className="ic-proy-intro">
                <p>Curva de tu deuda mes a mes — ingresa un monto en <strong>Simular</strong> para ver tu escenario personalizado en dorado.</p>
              </div>

              <div className="ic-proy-chart">
                <Line data={chartData} options={chartOpts} />
              </div>

              <div className="ic-proy-cards">
                {[
                  { label: 'Mínimo',  pago: pagoMinimo,      color: 'red'    },
                  { label: 'Doble',   pago: pagoMinimo * 2,  color: 'yellow' },
                  ...(pUser ? [{ label: 'Tu pago', pago: pUsr, color: 'gold' }] : []),
                ].map((sc, i) => {
                  const r = simular(deudaInicial, tasaMensual, sc.pago);
                  return (
                    <div key={i} className={`ic-proy-card ${sc.color}`}>
                      <div className="ic-proy-card-top">
                        <span>{sc.label}</span>
                        <span>{simbolo} {sc.pago.toLocaleString('es-PE', { maximumFractionDigits: 0 })}/mes</span>
                      </div>
                      <div className="ic-proy-card-stat"><span>Libre en</span><strong>{r.tiempoTexto}</strong></div>
                      <div className="ic-proy-card-stat"><span>Intereses</span><strong>{simbolo} {r.totalIntereses.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</strong></div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const r0 = simular(deudaInicial, tasaMensual, pagoMinimo);
                const r1 = simular(deudaInicial, tasaMensual, pagoMinimo * 2);
                const ahM = r0.meses - r1.meses;
                const ahI = r0.totalIntereses - r1.totalIntereses;
                return ahM > 0 ? (
                  <div className="ic-proy-tip">
                    <span className="ic-tip-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L12 18l-3.7-3c-2-1.3-3.3-3.5-3.3-6a7 7 0 0 1 7-7z"/></svg></span>
                    <p>Pagando el doble terminas <strong>{ahM} meses antes</strong> y ahorras <strong>{simbolo} {ahI.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</strong> en intereses.</p>
                  </div>
                ) : null;
              })()}
            </>
          )}
          </div>

        </div>

        {/* ── FOOTER ── */}
        <div className="ic-footer">
          <button className="ic-btn-close" onClick={onClose}>Cerrar</button>
        </div>

      </div>
    </div>,
    document.body
  );
}

export default InterestCalculator;
