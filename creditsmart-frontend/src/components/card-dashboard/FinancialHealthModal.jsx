import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { movementsApi } from '../../services/api';
import './FinancialHealthModal.css';
import { calcularScoreBasico } from './FinancialHealthButton';
import { useToast } from '../../context/ToastContext';

/* ── SVG icons ── */
const IcClose  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IcTarget = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IcChart  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
const IcBulb   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L12 18l-3.7-3c-2-1.3-3.3-3.5-3.3-6a7 7 0 0 1 7-7z"/></svg>);
const IcCheck  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IcWarn   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IcSeed   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M12 12C12 12 7 9 7 5c0-2.8 2.2-5 5-5s5 2.2 5 5c0 4-5 7-5 7z"/><path d="M12 12s-5 3-5 7h10c0-4-5-7-5-7z"/></svg>);
const IcCard   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>);
const IcMoney  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IcStar   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IcPie    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>);
const IcArrowUR= () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>);
const IcArrowU = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>);
const IcArrowDR= () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></svg>);
const IcHeart  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>);

const actionIconMap = { card: IcCard, money: IcMoney, star: IcStar };
const factorIconMap = { card: IcCard, check: IcCheck, money: IcMoney };

const NIVEL_HEX = {
  excellent: '#22c55e',
  good:      '#06b6d4',
  warning:   '#fbbf24',
  danger:    '#ef4444',
};

/* ── Gauge needle position ──
 * El arc usa rotate(-90 100 100) + dashoffset=125.6 (=25% circunferencia).
 * Resultado: track visible desde las 3 en punto (derecha) → CW → 12 en punto (arriba).
 * Ángulo SVG: 0°=derecha, 90°=abajo, 180°=izquierda, 270°=arriba.
 * score 0 → 0° (derecha), score 100 → 270° (arriba).
 */
const gaugePoint = (score, r = 80) => {
  const deg = (score / 100) * 270;              // 0° → 270° CW desde las 3
  const rad = deg * Math.PI / 180;
  return {
    x: 100 + r * Math.cos(rad),
    y: 100 + r * Math.sin(rad),
  };
};

function FinancialHealthModal({ tarjetaId, simboloMoneda, tarjetaData, onClose }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  if (!tarjetaData) {
    return createPortal(
      <div className="fhm-overlay" onClick={onClose}>
        <div className="fhm-loading" onClick={(e) => e.stopPropagation()}>
          <p>Error: No se pudo cargar la información</p>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>,
      document.body
    );
  }

  useEffect(() => {
    calcularSaludFinanciera();
  }, [tarjetaId]);

  const calcularSaludFinanciera = async () => {
    try {
      setLoading(true);
      const dataMovements = await movementsApi.getByCard(`${tarjetaId}?limite=100`);
      const movimientos = dataMovements.success ? dataMovements.movimientos : [];
      setHealthData(calcularScore(tarjetaData, movimientos));
    } catch (error) {
      console.error('Error al calcular salud financiera:', error);
      showToast('Error al calcular la salud financiera', 'error');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const calcularScore = (tarjeta, movimientos) => {
    const scoreTotal = calcularScoreBasico(tarjeta);
    const usoLinea   = (parseFloat(tarjeta.deuda_actual || 0) / parseFloat(tarjeta.linea_credito)) * 100;

    let puntosUso = 0;
    if      (usoLinea <= 10) puntosUso = 40;
    else if (usoLinea <= 30) puntosUso = 35;
    else if (usoLinea <= 50) puntosUso = 25;
    else if (usoLinea <= 70) puntosUso = 15;
    else                      puntosUso = 5;

    const puntosPuntualidad = 35;
    const pagos = movimientos.filter(m => m.tipo === 'pago');
    let puntosFrecuencia = 0;
    if      (pagos.length >= 4) puntosFrecuencia = 25;
    else if (pagos.length >= 2) puntosFrecuencia = 18;
    else if (pagos.length >= 1) puntosFrecuencia = 10;

    let nivel = 'Crítico', nivelColor = 'danger';
    if      (scoreTotal >= 80) { nivel = 'Excelente'; nivelColor = 'excellent'; }
    else if (scoreTotal >= 60) { nivel = 'Saludable'; nivelColor = 'good'; }
    else if (scoreTotal >= 40) { nivel = 'Mejorable'; nivelColor = 'warning'; }

    const acciones = [];
    const simbolo  = simboloMoneda || 'S/';

    if (usoLinea > 30) {
      const montoPagar   = ((usoLinea - 25) / 100) * parseFloat(tarjeta.linea_credito);
      const impactoScore = Math.round((usoLinea - 25) * 0.5);
      acciones.push({
        icon: 'card',
        texto: `Paga ${simbolo} ${montoPagar.toFixed(2)} antes del cierre para bajar tu uso a 25%`,
        impacto: `+${impactoScore} pts`,
      });
    }

    if (pagos.length < 2) {
      acciones.push({
        icon: 'money',
        texto: 'Realiza al menos 2 pagos parciales por ciclo, aunque sean pequeños',
        impacto: '+8 pts',
      });
    }

    if (acciones.length === 0) {
      acciones.push({
        icon: 'star',
        texto: 'Mantén tus buenos hábitos. Estás en el top de usuarios CreditSmart.',
        impacto: '↗ Mantener',
      });
    }

    const hoy = new Date();
    const tieneCicloAnterior = movimientos.some(mov => {
      const d = new Date(mov.fecha_movimiento);
      return d.getFullYear() < hoy.getFullYear() ||
        (d.getFullYear() === hoy.getFullYear() && d.getMonth() < hoy.getMonth());
    });
    const evolucion = tieneCicloAnterior ? [{ mes: 'Actual', score: scoreTotal }] : null;

    return {
      scoreTotal, nivel, nivelColor,
      desglose: {
        usoLinea:    { puntos: puntosUso,          max: 40, porcentaje: usoLinea.toFixed(1) },
        puntualidad: { puntos: puntosPuntualidad,   max: 35 },
        frecuencia:  { puntos: puntosFrecuencia,    max: 25, numPagos: pagos.length },
      },
      acciones, evolucion, tieneCicloAnterior,
    };
  };

  /* ── Loading ── */
  if (loading) {
    return createPortal(
      <div className="fhm-overlay" onClick={onClose}>
        <div className="fhm-loading" onClick={(e) => e.stopPropagation()}>
          <div className="fhm-spinner" />
          <p>Analizando tu salud financiera…</p>
        </div>
      </div>,
      document.body
    );
  }

  if (!healthData) return null;

  /* ── Gauge needle ── */
  const scoreHex   = NIVEL_HEX[healthData.nivelColor] || '#d4a574';
  const needle     = gaugePoint(healthData.scoreTotal);
  const tickScores = [0, 25, 50, 75, 100];

  /* ── Factor bars data ── */
  const factores = [
    {
      key: 'uso',
      icon: 'card',
      label: 'Uso de Línea',
      puntos: healthData.desglose.usoLinea.puntos,
      max: 40,
      desc: `${healthData.desglose.usoLinea.porcentaje}% de línea utilizada · Óptimo: ≤ 30%`,
    },
    {
      key: 'puntualidad',
      icon: 'check',
      label: 'Puntualidad',
      puntos: healthData.desglose.puntualidad.puntos,
      max: 35,
      desc: 'Historial de pagos a tiempo',
    },
    {
      key: 'frecuencia',
      icon: 'money',
      label: 'Frecuencia de pagos',
      puntos: healthData.desglose.frecuencia.puntos,
      max: 25,
      desc: `${healthData.desglose.frecuencia.numPagos} pago${healthData.desglose.frecuencia.numPagos !== 1 ? 's' : ''} registrado${healthData.desglose.frecuencia.numPagos !== 1 ? 's' : ''} · Recomendado: ≥ 2 por ciclo`,
    },
  ];

  const factorColor = (pct) =>
    pct >= 85 ? 'excellent' : pct >= 60 ? 'good' : pct >= 35 ? 'warning' : 'danger';

  /* ── Modal ── */
  return createPortal(
    <div className="fhm-overlay" onClick={onClose}>
      <div className="fhm-modal" onClick={(e) => e.stopPropagation()}>

        <div className="fhm-glow" />

        {/* ── Header ── */}
        <div className="fhm-header">
          <div className="fhm-header-left">
            <span className="fhm-header-icon"><IcHeart /></span>
            <div>
              <h2 className="fhm-title">Tu Salud Financiera</h2>
              <p className="fhm-subtitle">Análisis basado en tus hábitos de uso</p>
            </div>
          </div>
          <button className="fhm-close" onClick={onClose}><IcClose /></button>
        </div>

        {/* ── Body ── */}
        <div className="fhm-body">

          {/* ── Score Principal ── */}
          <div className={`fhm-score-card ${healthData.nivelColor}`}>

            {/* ── Gauge circular (izquierda) ── */}
            <div className="fhm-gauge-wrap">
              <svg viewBox="0 0 200 200" className="fhm-gauge-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="fhmGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#ef4444" />
                    <stop offset="35%"  stopColor="#fbbf24" />
                    <stop offset="65%"  stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
                {/* Track */}
                <circle cx="100" cy="100" r="80" fill="none"
                  stroke="rgba(255,255,255,0.07)" strokeWidth="18"
                  strokeDasharray="502.4 502.4" strokeDashoffset="125.6"
                  transform="rotate(-90 100 100)" />
                {/* Progress */}
                <circle cx="100" cy="100" r="80" fill="none"
                  stroke="url(#fhmGaugeGrad)" strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={`${(healthData.scoreTotal / 100) * 376.8} 502.4`}
                  strokeDashoffset="125.6"
                  transform="rotate(-90 100 100)"
                  style={{
                    transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)',
                    filter: `drop-shadow(0 0 10px ${scoreHex}aa)`,
                  }}
                />
                {/* Número central */}
                <text x="100" y="96" textAnchor="middle" dominantBaseline="middle"
                  fontSize="52" fontWeight="900" fill={scoreHex}
                  fontFamily="inherit"
                  style={{ filter: `drop-shadow(0 0 16px ${scoreHex}88)` }}>
                  {healthData.scoreTotal}
                </text>
                <text x="100" y="126" textAnchor="middle" dominantBaseline="middle"
                  fontSize="14" fontWeight="700" fill="rgba(255,255,255,0.3)"
                  fontFamily="inherit">
                  de 100
                </text>
              </svg>
            </div>

            {/* ── Info (derecha) ── */}
            <div className="fhm-score-left">
              <span className="fhm-score-label">Tu Score</span>

              <div className={`fhm-score-badge ${healthData.nivelColor}`}>
                {healthData.nivel}
              </div>

              {/* Barra de progreso */}
              <div className="fhm-score-bar-track">
                <div
                  className={`fhm-score-bar-fill ${healthData.nivelColor}`}
                  style={{ '--sw': `${healthData.scoreTotal}%` }}
                />
              </div>
              <span className="fhm-score-bar-label">{healthData.scoreTotal}/100 puntos</span>

              <p className="fhm-score-desc">
                {healthData.scoreTotal >= 80 && 'Excelente manejo. Mantén este ritmo para acceder a mejores beneficios.'}
                {healthData.scoreTotal >= 60 && healthData.scoreTotal < 80 && 'Buen camino. Con pequeños ajustes alcanzas "Excelente".'}
                {healthData.scoreTotal >= 40 && healthData.scoreTotal < 60 && 'Sigue las recomendaciones para mejorar tu score.'}
                {healthData.scoreTotal < 40 && (
                  <span className="fhm-critical-msg">
                    <span className="fhm-critical-icon"><IcWarn /></span>
                    Situación de riesgo. Actúa cuanto antes.
                  </span>
                )}
              </p>
            </div>

          </div>

          {/* ── Composición del Score ── */}
          <div className="fhm-section">
            <div className="fhm-section-title">
              <span className="fhm-section-icon"><IcPie /></span>
              Composición del Score
            </div>

            <div className="fhm-desglose-list">
              {factores.map((f, i) => {
                const pct   = Math.round((f.puntos / f.max) * 100);
                const color = factorColor(pct);
                const IcF   = factorIconMap[f.icon] || IcCard;
                return (
                  <div key={f.key} className={`fhm-factor ${color}`}
                    style={{ animationDelay: `${i * 0.12}s` }}>

                    <div className="fhm-factor-header">
                      <div className="fhm-factor-left">
                        <span className="fhm-factor-icon"><IcF /></span>
                        <span className="fhm-factor-label">{f.label}</span>
                      </div>
                      <div className="fhm-factor-pts-wrap">
                        <span className={`fhm-factor-pts ${color}`}>{f.puntos}</span>
                        <span className="fhm-factor-max">/{f.max} pts</span>
                      </div>
                    </div>

                    <div className="fhm-factor-bar-track">
                      <div
                        className={`fhm-factor-bar-fill ${color}`}
                        style={{ '--fw': `${pct}%`, animationDelay: `${i * 0.12 + 0.25}s` }}
                      />
                    </div>

                    <div className="fhm-factor-bottom">
                      <span className="fhm-factor-desc">{f.desc}</span>
                      <span className={`fhm-factor-pct ${color}`}>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Acciones para mejorar ── */}
          <div className="fhm-section">
            <div className="fhm-section-title">
              <span className="fhm-section-icon"><IcTarget /></span>
              Acciones para mejorar
            </div>

            <div className="fhm-actions-list">
              {healthData.acciones.map((accion, i) => {
                const IconComp = actionIconMap[accion.icon] || IcStar;
                return (
                  <div key={i} className="fhm-action-card" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="fhm-action-header">
                      <span className="fhm-action-icon"><IconComp /></span>
                      <span className="fhm-action-impact">{accion.impacto}</span>
                    </div>
                    <p className="fhm-action-text">{accion.texto}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Proyección ── */}
          <div className="fhm-section">
            <div className="fhm-section-title">
              <span className="fhm-section-icon"><IcChart /></span>
              Proyección a 30 días
            </div>

            <div className="fhm-proj-list">
              <div className="fhm-proj-item good">
                <div className="fhm-proj-left">
                  <span className="fhm-proj-scenario">Si mantienes tus hábitos actuales</span>
                  <span className="fhm-proj-sub">Sin cambios en uso ni pagos</span>
                </div>
                <div className="fhm-proj-result">
                  <span className="fhm-proj-arrow good"><IcArrowUR /></span>
                  <span className="fhm-proj-score good">{Math.min(100, healthData.scoreTotal + 3)}</span>
                </div>
              </div>

              {healthData.scoreTotal < 100 && (
                <div className="fhm-proj-item excellent">
                  <div className="fhm-proj-left">
                    <span className="fhm-proj-scenario">
                      Si sigues las recomendaciones
                    </span>
                    <span className="fhm-proj-sub">Reduciendo uso y pagando más frecuente</span>
                  </div>
                  <div className="fhm-proj-result">
                    <span className="fhm-proj-arrow excellent"><IcArrowU /></span>
                    <span className="fhm-proj-score excellent">{Math.min(100, healthData.scoreTotal + 10)}</span>
                  </div>
                </div>
              )}

              {parseFloat(healthData.desglose.usoLinea.porcentaje) < 70 && (
                <div className="fhm-proj-item warning">
                  <div className="fhm-proj-left">
                    <span className="fhm-proj-scenario">Si superas el 70% de uso</span>
                    <span className="fhm-proj-sub">Impacto negativo inmediato en score</span>
                  </div>
                  <div className="fhm-proj-result">
                    <span className="fhm-proj-arrow warning"><IcArrowDR /></span>
                    <span className="fhm-proj-score warning">{Math.max(40, healthData.scoreTotal - 15)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Historial / Inicio ── */}
          {healthData.tieneCicloAnterior && healthData.evolucion ? (
            <div className="fhm-section">
              <div className="fhm-section-title">Tu progreso</div>
              <div className="fhm-evo-chart">
                {healthData.evolucion.map((p, i) => (
                  <div key={i} className="fhm-evo-point">
                    <div className="fhm-evo-bar" style={{ height: `${p.score}%` }}>
                      <span className="fhm-evo-val">{p.score}</span>
                    </div>
                    <span className="fhm-evo-label">{p.mes}</span>
                  </div>
                ))}
              </div>
              <div className="fhm-evo-msg positive">
                Seguiremos registrando tu evolución mes a mes
              </div>
            </div>
          ) : (
            <div className="fhm-section">
              <div className="fhm-section-title">Tu progreso</div>
              <div className="fhm-new-card">
                <div className="fhm-new-icon"><IcSeed /></div>
                <div className="fhm-new-body">
                  <p className="fhm-new-title">Comienza tu historial</p>
                  <p className="fhm-new-text">
                    Estamos registrando tu primer ciclo. A partir del próximo mes verás aquí
                    la evolución de tu score para que puedas comparar tu progreso.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Tips ── */}
          <div className="fhm-section fhm-tips-wrap">
            <div className="fhm-section-title">
              <span className="fhm-section-icon"><IcBulb /></span>
              Recuerda siempre
            </div>
            <ul className="fhm-tips-list">
              {[
                { text: 'Mantén tu uso entre 10–30% para un score óptimo', color: 'good' },
                { text: 'Paga antes del cierre para mejorar más rápido', color: 'excellent' },
                { text: 'Varios pagos pequeños suman más que uno grande', color: 'excellent' },
                { text: 'Nunca superes el 70% de tu línea de crédito', color: 'warning' },
              ].map((tip, i) => (
                <li key={i} className={`fhm-tip-item ${tip.color}`}>
                  <span className="fhm-tip-icon"><IcCheck /></span>
                  {tip.text}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}

export default FinancialHealthModal;
