import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './MonthTimeline.css';
import './CardCalendar.css';
import { TripleMonthModal } from './CardCalendar';
import { calcularCiclo as calcularCicloBase, proximoPago } from '@/shared/utils/ciclo';

/* ── SVG icons ── */
const IcFlag    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>);
const IcLock    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IcCoin    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IcCart    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
const IcWarn    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IcClip    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const IcAlert   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>);
const IcX       = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IcRefresh = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);
const IcScroll  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/></svg>);
const IcCal     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IcBulb    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L12 18l-3.7-3c-2-1.3-3.5-3.3-3.3-6a7 7 0 0 1 7-7z"/></svg>);
const IcInfo    = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>);
const IcPin     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>);
const IcShop    = () =>(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>);
const IcHourglass = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 00-.586-1.414L12 12l-4.414 4.414A2 2 0 007 17.828V22M7 2v4.172a2 2 0 00.586 1.414L12 12l4.414-4.414A2 2 0 0017 6.172V2"/></svg>);

const phaseIconMap = { cart: IcCart, warn: IcWarn, clip: IcClip, alert: IcAlert, x: IcX };

function MonthTimeline({ diaInicio, diaCierre, diaPago }) {
  const [cicloOffset, setCicloOffset] = useState(0);
  const [faseActual, setFaseActual]   = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const mesesCorto = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  /* ── Las 3 fechas del ciclo para un offset dado ──
     Delega en shared/utils/ciclo para no divergir del PDF ni del backend. */
  const calcularCiclo = (offset = 0) => {
    const c = calcularCicloBase(
      { dia_inicio_ciclo: diaInicio, dia_cierre_ciclo: diaCierre, dia_pago: diaPago },
      new Date(),
      offset
    );
    const fmt = (d) => `${d.getDate()} ${mesesCorto[d.getMonth()]}`;
    return {
      fechaInicio: c.inicio, fechaCierre: c.cierre, fechaPago: c.pago,
      inicioStr: fmt(c.inicio),
      cierreStr: fmt(c.cierre),
      pagoStr:   fmt(c.pago),
    };
  };

  const ciclo = calcularCiclo(cicloOffset);

  /* ── Fase actual (solo ciclo 0) ── */
  useEffect(() => {
    if (cicloOffset !== 0) { setFaseActual(null); return; }
    const hoy  = new Date();
    const c    = calcularCiclo(0);
    const dCierre = Math.ceil((c.fechaCierre - hoy) / 86400000);
    /* Los días al pago salen del vencimiento VIGENTE, que tras el cierre es
       el del ciclo anterior. Con el pago del ciclo que acumula, las fases
       "Pago Urgente" y "Pago Vencido" nunca llegaban a dispararse. */
    const dPago = proximoPago(
      { dia_inicio_ciclo: diaInicio, dia_cierre_ciclo: diaCierre, dia_pago: diaPago },
      hoy
    ).dias;

    let fase;
    if      (dCierre > 7)  fase = { nombre: 'Período de Consumo',  tipo: 'safe',     icon: 'cart',  dias: dCierre, evento: 'cierre', descripcion: 'Puedes usar tu tarjeta con tranquilidad.',      consejo: 'Buen momento para compras planificadas. Mantén el uso por debajo del 30 % de tu línea para cuidar tu score crediticio.' };
    else if (dCierre > 0)  fase = { nombre: 'Pre-Cierre',           tipo: 'warning',  icon: 'warn',  dias: dCierre, evento: 'cierre', descripcion: 'El ciclo está por cerrar.',                     consejo: 'Evita compras grandes ahora. Todo lo que gastes se sumará al estado de cuenta que está por generarse.' };
    else if (dPago   > 3)  fase = { nombre: 'Período de Gracia',    tipo: 'info',     icon: 'clip',  dias: dPago,   evento: 'pago',   descripcion: 'Deuda definida. Hora de preparar el pago.',     consejo: 'Tu deuda ya está calculada. Pagar más del mínimo ahorra intereses significativos en el siguiente ciclo.' };
    else if (dPago   > 0)  fase = { nombre: 'Pago Urgente',         tipo: 'danger',   icon: 'alert', dias: dPago,   evento: 'pago',   descripcion: '¡Debes pagar antes de que venza!',              consejo: '¡Paga hoy! Cada día de retraso genera intereses y puede afectar negativamente tu historial crediticio.' };
    else                   fase = { nombre: 'Pago Vencido',         tipo: 'critical', icon: 'x',     dias: Math.abs(dPago), evento: 'vencido', descripcion: 'Acción inmediata requerida.',      consejo: '¡Paga de inmediato! Cada día adicional daña tu score y genera intereses y cargos por mora.' };
    setFaseActual(fase);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cicloOffset, diaInicio, diaCierre, diaPago]);

  /* ── Barra bifásica: muestra todo el ciclo inicio→cierre→pago ── */
  const bifase = (() => {
    if (cicloOffset !== 0) return null;
    const hoy    = new Date().getTime();
    const inicio = ciclo.fechaInicio.getTime();
    const cierre = ciclo.fechaCierre.getTime();
    const pago   = ciclo.fechaPago.getTime();
    const total  = pago - inicio;

    const pctCierre = ((cierre - inicio) / total) * 100;
    let   pctHoy    = Math.min(100, Math.max(0, ((hoy - inicio) / total) * 100));
    const faseBar   = hoy < cierre ? 'compras' : hoy < pago ? 'gracia' : 'vencido';
    return { pctCierre, pctHoy, faseBar };
  })();

  /* ── Countdown para cada fecha ── */
  const countdown = (fecha) => {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const tgt = new Date(fecha); tgt.setHours(0,0,0,0);
    const d   = Math.round((tgt - hoy) / 86400000);
    if (d === 0) return { text: 'Hoy',                                   cls: 'today'  };
    if (d  > 0)  return { text: `En ${d} día${d === 1 ? '' : 's'}`,     cls: 'future' };
    return           { text: `Hace ${Math.abs(d)} día${Math.abs(d)===1?'':'s'}`, cls: 'past' };
  };

  const cicloStatus = cicloOffset === 0 ? 'actual' : cicloOffset < 0 ? 'pasado' : 'futuro';
  const CycleIcon   = cicloStatus === 'actual' ? IcRefresh : cicloStatus === 'pasado' ? IcScroll : IcCal;

  const dateCards = [
    { cls: 'inicio', Icon: IcFlag,  label: 'Inicio de ciclo', hint: 'Comienza el período de compras',  fecha: ciclo.fechaInicio, str: ciclo.inicioStr },
    { cls: 'cierre', Icon: IcLock,  label: 'Fecha de cierre', hint: 'Se calcula tu deuda total',       fecha: ciclo.fechaCierre, str: ciclo.cierreStr },
    { cls: 'pago',   Icon: IcCoin,  label: 'Pago límite',     hint: 'Último día para pagar sin mora',  fecha: ciclo.fechaPago,   str: ciclo.pagoStr, highlight: true },
  ];

  return (
    <div className="mt-wrap">

      {/* ── HEADER ── */}
      <div className="mt-head">
        <div className="mt-head-top">
          <div className="mt-head-title">
            <span className="mt-head-title-icon"><CycleIcon /></span>
            <div>
              <h3 className="mt-head-h">Ciclo y fechas</h3>
              <p className="mt-head-range">{ciclo.inicioStr} · {ciclo.cierreStr} · {ciclo.pagoStr}</p>
            </div>
          </div>
          <button className="mt-cal-btn" onClick={() => setShowCalendar(true)} title="Ver calendario completo del ciclo">
            <IcCal />
            <span>Ver calendario</span>
          </button>
        </div>

        {/* Selector de ciclo — pills estilo segmentado */}
        <div className="mt-seg" role="tablist" aria-label="Seleccionar ciclo">
          <button
            className={`mt-seg-btn${cicloOffset < 0 ? ' active' : ''}`}
            onClick={() => setCicloOffset(-1)}
            role="tab"
            aria-selected={cicloOffset < 0}
          >Anterior</button>
          <button
            className={`mt-seg-btn${cicloOffset === 0 ? ' active' : ''}`}
            onClick={() => setCicloOffset(0)}
            role="tab"
            aria-selected={cicloOffset === 0}
          >Actual</button>
          <button
            className={`mt-seg-btn${cicloOffset > 0 ? ' active' : ''}`}
            onClick={() => setCicloOffset(1)}
            role="tab"
            aria-selected={cicloOffset > 0}
          >Siguiente</button>
        </div>
      </div>

      {/* ── FASE ACTUAL ── */}
      {faseActual && cicloOffset === 0 && (() => {
        const PhaseIcon = phaseIconMap[faseActual.icon] || IcInfo;
        return (
          <div className={`mt-fase mt-fase-${faseActual.tipo}`}>
            <div className={`mt-fase-icon mt-fase-icon-${faseActual.tipo}`}><PhaseIcon /></div>
            <div className="mt-fase-body">
              <div className="mt-fase-top">
                <span className="mt-fase-nombre">{faseActual.nombre}</span>
                <span className={`mt-fase-pill mt-fase-pill-${faseActual.tipo}`}>
                  {faseActual.evento === 'vencido'
                    ? `Vencido hace ${faseActual.dias} día${faseActual.dias===1?'':'s'}`
                    : `${faseActual.dias} día${faseActual.dias===1?'':'s'} para el ${faseActual.evento === 'cierre' ? 'cierre' : 'pago'}`}
                </span>
              </div>
              <p className="mt-fase-desc">{faseActual.descripcion}</p>
            </div>
          </div>
        );
      })()}

      {/* ── BARRA BIFÁSICA ── */}
      {bifase && (
        <div className="mt-bifase">
          {/* Leyenda superior */}
          <div className="mt-bifase-legend">
            <span className="mt-bifase-leg mt-bifase-leg-compras">
              <span className="mt-bifase-dot" /><IcShop />Período de Compras
            </span>
            <span className="mt-bifase-leg mt-bifase-leg-gracia">
              <span className="mt-bifase-dot" /><IcHourglass />Período de Gracia
            </span>
          </div>

          {/* Barra */}
          <div className="mt-bifase-track-wrap">
            <div className="mt-bifase-track">
              {/* Segmento compras */}
              <div className="mt-bifase-seg mt-bifase-seg-compras" style={{ width: `${bifase.pctCierre}%` }}>
                <div className="mt-bifase-seg-shine" />
              </div>
              {/* Segmento gracia */}
              <div className="mt-bifase-seg mt-bifase-seg-gracia" style={{ width: `${100 - bifase.pctCierre}%` }}>
                <div className="mt-bifase-seg-shine" />
              </div>
            </div>

            {/* Divisor cierre */}
            <div className="mt-bifase-divider" style={{ left: `${bifase.pctCierre}%` }}>
              <div className="mt-bifase-divider-line" />
            </div>

            {/* Dot HOY */}
            <div className={`mt-bifase-hoy ${bifase.faseBar === 'vencido' ? 'mt-bifase-hoy-vencido' : ''}`} style={{ left: `${bifase.pctHoy}%` }}>
              <div className="mt-bifase-hoy-ring" />
              <div className="mt-bifase-hoy-core" />
              <span className="mt-bifase-hoy-label">Hoy</span>
            </div>
          </div>

          {/* Etiquetas de fechas */}
          <div className="mt-bifase-dates">
            <span className="mt-bifase-date inicio">{ciclo.inicioStr}</span>
            <span className="mt-bifase-date cierre" style={{ left: `${bifase.pctCierre}%` }}>{ciclo.cierreStr}</span>
            <span className="mt-bifase-date pago">{ciclo.pagoStr}</span>
          </div>
        </div>
      )}

      {/* ── 3 TARJETAS DE FECHAS CON COUNTDOWN ── */}
      <div className="mt-cards">
        {dateCards.map(({ cls, Icon, label, hint, fecha, str, highlight }) => {
          const cd = countdown(fecha);
          return (
            <div key={cls} className={`mt-card mt-card-${cls}${highlight ? ' mt-card-highlight' : ''}`}>
              {/* Icono */}
              <div className={`mt-card-icon mt-card-icon-${cls}`}><Icon /></div>
              {/* Info */}
              <div className="mt-card-body">
                <span className="mt-card-label">{label}</span>
                <span className="mt-card-date">{str}</span>
                <span className="mt-card-hint">{hint}</span>
              </div>
              {/* Countdown badge */}
              <span className={`mt-card-cd mt-card-cd-${cd.cls}${cd.cls === 'today' ? ' mt-card-cd-pulse' : ''}`}>
                {cd.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── CONSEJO EDUCATIVO ── */}
      {faseActual && cicloOffset === 0 && (
        <div className={`mt-tip mt-tip-${faseActual.tipo}`}>
          <div className="mt-tip-icon"><IcBulb /></div>
          <div className="mt-tip-body">
            <span className="mt-tip-title">Consejo para esta fase</span>
            <p className="mt-tip-text">{faseActual.consejo}</p>
          </div>
        </div>
      )}

      {/* ── MENSAJE CICLOS PASADO / FUTURO ── */}
      {cicloOffset !== 0 && (
        <div className="mt-info-msg">
          <span className="mt-info-icon">
            {cicloStatus === 'pasado' ? <IcInfo /> : <IcPin />}
          </span>
          <span className="mt-info-text">
            {cicloStatus === 'pasado'
              ? 'Este ciclo ya finalizó. Consulta tu historial para ver los movimientos de ese período.'
              : 'Este es un ciclo futuro. Las fechas son proyectadas según tu configuración actual.'}
          </span>
        </div>
      )}

      {/* ── MODAL CALENDARIO (vista completa) ── */}
      {showCalendar && createPortal(
        <TripleMonthModal
          diaInicio={diaInicio}
          diaCierre={diaCierre}
          diaPago={diaPago}
          onClose={() => setShowCalendar(false)}
        />,
        document.body
      )}
    </div>
  );
}

export default MonthTimeline;
