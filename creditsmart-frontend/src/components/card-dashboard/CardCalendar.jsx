import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './CardCalendar.css';

/* ── SVG icons ── */
const IcFlag  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>);
const IcLock  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const IcCoin  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IcCal   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const IcBulb  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L12 18l-3.7-3c-2-1.3-3.3-3.5-3.3-6a7 7 0 0 1 7-7z"/></svg>);
const IcBook  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
const IcStar  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IcChevL = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const IcChevR = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);
const IcClose = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

function CardCalendar({ diaInicio, diaCierre, diaPago }) {
  const [showModal, setShowModal] = useState(false);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [proximoEvento, setProximoEvento] = useState(null);

  const hoy = new Date();
  const fechaVista = new Date(
    hoy.getFullYear(),
    hoy.getMonth() + currentMonthOffset,
    1
  );

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const mesesCorto = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  // Calcular ciclo activo
  const calcularCicloActivo = () => {
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();
    const diaActual = hoy.getDate();

    let fechaInicioCiclo = new Date(anioActual, mesActual, diaInicio);
    if (diaActual < diaInicio) {
      fechaInicioCiclo.setMonth(fechaInicioCiclo.getMonth() - 1);
    }

    let fechaCierreCiclo = new Date(fechaInicioCiclo);
    if (diaCierre >= diaInicio) {
      fechaCierreCiclo.setDate(diaCierre);
    } else {
      fechaCierreCiclo.setMonth(fechaCierreCiclo.getMonth() + 1);
      fechaCierreCiclo.setDate(diaCierre);
    }

    let fechaPagoCiclo = new Date(fechaCierreCiclo);
    if (diaPago >= diaCierre) {
      fechaPagoCiclo.setDate(diaPago);
    } else {
      fechaPagoCiclo.setMonth(fechaPagoCiclo.getMonth() + 1);
      fechaPagoCiclo.setDate(diaPago);
    }

    return {
      inicio: fechaInicioCiclo,
      cierre: fechaCierreCiclo,
      pago: fechaPagoCiclo
    };
  };

  const ciclo = calcularCicloActivo();

  // Calcular próximo evento
  useEffect(() => {
    const calcularProximoEvento = () => {
      const diffCierre = Math.ceil((ciclo.cierre - hoy) / (1000 * 60 * 60 * 24));
      const diffPago = Math.ceil((ciclo.pago - hoy) / (1000 * 60 * 60 * 24));

      if (diffCierre > 0) {
        return {
          tipo: 'cierre',
          nombre: 'Cierre de Ciclo',
          icon: 'lock',
          dias: diffCierre,
          fecha: ciclo.cierre,
          urgencia: diffCierre <= 3 ? 'critical' : diffCierre <= 7 ? 'warning' : 'normal'
        };
      } else if (diffPago > 0) {
        return {
          tipo: 'pago',
          nombre: 'Fecha de Pago',
          icon: 'coin',
          dias: diffPago,
          fecha: ciclo.pago,
          urgencia: diffPago <= 3 ? 'critical' : diffPago <= 7 ? 'warning' : 'normal'
        };
      } else {
        // Calcular próximo inicio de ciclo
        const proximoInicio = new Date(ciclo.inicio);
        proximoInicio.setMonth(proximoInicio.getMonth() + 1);
        const diffInicio = Math.ceil((proximoInicio - hoy) / (1000 * 60 * 60 * 24));
        
        return {
          tipo: 'inicio',
          nombre: 'Inicio de Ciclo',
          icon: 'flag',
          dias: diffInicio,
          fecha: proximoInicio,
          urgencia: 'normal'
        };
      }
    };

    setProximoEvento(calcularProximoEvento());
  }, []);

  // Generar días del mes
  const getDaysInMonth = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const mesActualVista = fechaVista.getMonth();
  const anioActualVista = fechaVista.getFullYear();
  const days = getDaysInMonth(anioActualVista, mesActualVista);

  // Determinar tipo y urgencia de día
  const getDayInfo = (day) => {
    if (!day) return null;

    const fechaActual = new Date(anioActualVista, mesActualVista, day);
    const diffDays = Math.ceil((fechaActual - hoy) / (1000 * 60 * 60 * 24));

    // Es hoy
    const esHoy = fechaActual.toDateString() === hoy.toDateString();

    // Días clave
    const esInicio = fechaActual.toDateString() === ciclo.inicio.toDateString();
    const esCierre = fechaActual.toDateString() === ciclo.cierre.toDateString();
    const esPago = fechaActual.toDateString() === ciclo.pago.toDateString();

    // Fases del ciclo
    const enPeriodoCompras = fechaActual > ciclo.inicio && fechaActual < ciclo.cierre;
    const enPeriodoGracia = fechaActual > ciclo.cierre && fechaActual < ciclo.pago;
    const despuesPago = fechaActual > ciclo.pago;

    // Calcular urgencia para días importantes
    let urgencia = null;
    if (esCierre || esPago) {
      if (diffDays <= 3 && diffDays >= 0) urgencia = 'critical';
      else if (diffDays <= 7 && diffDays >= 0) urgencia = 'warning';
      else if (diffDays > 7 && diffDays <= 14) urgencia = 'info';
    }

    return {
      esHoy,
      esInicio,
      esCierre,
      esPago,
      enPeriodoCompras,
      enPeriodoGracia,
      despuesPago,
      urgencia,
      diffDays
    };
  };

  // Obtener tooltip educativo
  const getTooltip = (dayInfo) => {
    if (!dayInfo) return '';
    
    if (dayInfo.esInicio) return 'Inicio del Ciclo: Comienza un nuevo período de facturación';
    if (dayInfo.esCierre) return 'Cierre del Ciclo: Se calcula tu deuda total';
    if (dayInfo.esPago) return 'Fecha Límite de Pago: Paga antes de este día para evitar cargos';
    if (dayInfo.enPeriodoCompras) return 'Período de Compras: Tus gastos cuentan para este ciclo';
    if (dayInfo.enPeriodoGracia) return 'Período de Gracia: Prepara tu pago antes de la fecha límite';
    if (dayInfo.despuesPago) return 'Fuera del ciclo actual';
    
    return '';
  };

  return (
    <>
      <div className="card-calendar-enhanced">

        {/* Contador regresivo prominente */}
        {proximoEvento && currentMonthOffset === 0 && (
          <div className={`proximo-evento-card ${proximoEvento.urgencia}`}>
            <div className="evento-icon cc-evt-icon">
              {proximoEvento.icon === 'lock' && <IcLock />}
              {proximoEvento.icon === 'coin' && <IcCoin />}
              {proximoEvento.icon === 'flag' && <IcFlag />}
            </div>
            <div className="evento-content">
              <span className="evento-label">Próximo:</span>
              <span className="evento-nombre">{proximoEvento.nombre}</span>
              <div className="evento-countdown">
                <span className="countdown-numero">{proximoEvento.dias}</span>
                <span className="countdown-texto">días</span>
              </div>
              <span className="evento-fecha">
                {proximoEvento.fecha.getDate()} {mesesCorto[proximoEvento.fecha.getMonth()]}
              </span>
            </div>
          </div>
        )}

        {/* Header con navegación */}
        <div className="calendar-header-enhanced">
          <div className="calendar-navigation-enhanced">
            <button
              className="nav-btn-calendar"
              onClick={() => setCurrentMonthOffset(currentMonthOffset - 1)}
              title="Mes anterior"
            >
              <IcChevL />
            </button>

            <h4 className="calendar-month-title">
              {meses[mesActualVista]} {anioActualVista}
            </h4>

            <button
              className="nav-btn-calendar"
              onClick={() => setCurrentMonthOffset(currentMonthOffset + 1)}
              title="Mes siguiente"
            >
              <IcChevR />
            </button>
          </div>

          <button
            className="btn-expand-calendar-enhanced"
            onClick={() => setShowModal(true)}
          >
            <span className="expand-icon cc-svg-icon"><IcCal /></span>
            <span>Vista Completa</span>
          </button>
        </div>

        {/* Días de la semana */}
        <div className="calendar-weekdays-enhanced">
          {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d, i) => (
            <div key={i} className="weekday-enhanced">{d}</div>
          ))}
        </div>

        {/* Grid del calendario */}
        <div className="calendar-grid-enhanced">
          {days.map((day, index) => {
            const dayInfo = getDayInfo(day);
            const tooltip = getTooltip(dayInfo);

            return (
              <div
                key={index}
                className={`
                  calendar-day-enhanced 
                  ${!day ? 'empty' : ''}
                  ${dayInfo?.esHoy ? 'hoy' : ''}
                  ${dayInfo?.esInicio ? 'inicio' : ''}
                  ${dayInfo?.esCierre ? 'cierre' : ''}
                  ${dayInfo?.esPago ? 'pago' : ''}
                  ${dayInfo?.enPeriodoCompras ? 'periodo-compras' : ''}
                  ${dayInfo?.enPeriodoGracia ? 'periodo-gracia' : ''}
                  ${dayInfo?.urgencia ? `urgencia-${dayInfo.urgencia}` : ''}
                `}
                title={tooltip}
              >
                {day && (
                  <>
                    <span className="day-number-enhanced">{day}</span>
                    
                    {dayInfo?.esInicio && <span className="day-badge cc-badge inicio"><IcFlag /></span>}
                    {dayInfo?.esCierre && <span className="day-badge cc-badge cierre"><IcLock /></span>}
                    {dayInfo?.esPago   && <span className="day-badge cc-badge pago"><IcCoin /></span>}

                    {dayInfo?.esHoy && <div className="today-ring"></div>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Leyenda mejorada */}
        <div className="calendar-legend-enhanced">
          <div className="legend-item-enhanced">
            <span className="legend-badge cc-leg inicio"><IcFlag /></span>
            <span className="legend-text">Inicio</span>
          </div>
          <div className="legend-item-enhanced">
            <span className="legend-badge cc-leg cierre"><IcLock /></span>
            <span className="legend-text">Cierre</span>
          </div>
          <div className="legend-item-enhanced">
            <span className="legend-badge cc-leg pago"><IcCoin /></span>
            <span className="legend-text">Pago</span>
          </div>
        </div>

        {/* Tip educativo */}
        {proximoEvento && currentMonthOffset === 0 && (
          <div className="calendar-tip-enhanced">
            <span className="tip-icon-cal cc-svg-icon"><IcBulb /></span>
            <span className="tip-text-cal">
              {proximoEvento.tipo === 'cierre' && (
                <>Estás en período de compras. Controla tus gastos para no exceder el 30% de tu línea.</>
              )}
              {proximoEvento.tipo === 'pago' && (
                <>Tu ciclo cerró. Planifica tu pago para evitar intereses y cargos por mora.</>
              )}
              {proximoEvento.tipo === 'inicio' && (
                <>Buen momento para revisar tus hábitos del ciclo anterior y planear mejor.</>
              )}
            </span>
          </div>
        )}

      </div>

      {/* Modal con vista de 3 meses */}
      {showModal && createPortal(
        <TripleMonthModal 
          diaInicio={diaInicio}
          diaCierre={diaCierre}
          diaPago={diaPago}
          ciclo={ciclo}
          onClose={() => setShowModal(false)}
        />,
        document.body
      )}
    </>
  );
}

// Componente Modal con vista de 3 meses
function TripleMonthModal({ diaInicio, diaCierre, diaPago, onClose }) {
  const hoy = new Date();

  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun',
                       'Jul','Ago','Sep','Oct','Nov','Dic'];

  /* ── Calcula las 3 fechas clave de un ciclo dado su offset ── */
  const calcularCiclo = (cicloOffset) => {
    const diaActual = hoy.getDate();
    const mesBase   = hoy.getMonth();
    const anioBase  = hoy.getFullYear();

    let fechaInicio = diaActual >= diaInicio
      ? new Date(anioBase, mesBase, diaInicio)
      : new Date(anioBase, mesBase - 1, diaInicio);

    fechaInicio = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + cicloOffset, diaInicio);

    let fechaCierre = diaCierre >= diaInicio
      ? new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), diaCierre)
      : new Date(fechaInicio.getFullYear(), fechaInicio.getMonth() + 1, diaCierre);

    let fechaPago = diaPago >= diaCierre
      ? new Date(fechaCierre.getFullYear(), fechaCierre.getMonth(), diaPago)
      : new Date(fechaCierre.getFullYear(), fechaCierre.getMonth() + 1, diaPago);

    return { inicio: fechaInicio, cierre: fechaCierre, pago: fechaPago };
  };

  // Ciclo activo y ciclo anterior
  const c0   = calcularCiclo(0);
  const cPrev = calcularCiclo(-1);

  // Si el pago del ciclo anterior aún no venció, lo mostramos como pendiente
  const pagoAnteriorPendiente = cPrev.pago > hoy ? cPrev : null;

  // Los 3 meses a mostrar son exactamente los del ciclo activo:
  // mes del inicio → mes del cierre → mes del pago
  const mesesCiclo = [
    { anio: c0.inicio.getFullYear(), mes: c0.inicio.getMonth() },
    { anio: c0.cierre.getFullYear(), mes: c0.cierre.getMonth() },
    { anio: c0.pago.getFullYear(),   mes: c0.pago.getMonth()   },
  ];

  /* ── Info de un día: fechas clave del ciclo activo + pago anterior ── */
  const getInfoDia = (anio, mes, dia) => {
    const fecha = new Date(anio, mes, dia);
    const esHoy = fecha.toDateString() === hoy.toDateString();

    // Fechas clave del ciclo activo
    const esInicio = fecha.toDateString() === c0.inicio.toDateString();
    const esCierre = fecha.toDateString() === c0.cierre.toDateString();
    const esPago   = fecha.toDateString() === c0.pago.toDateString();

    // Sombreado de período solo del ciclo activo
    const enCompras = fecha > c0.inicio && fecha < c0.cierre;
    const enGracia  = fecha > c0.cierre && fecha < c0.pago;

    // Pago del ciclo anterior aún vigente
    const esPagoAnterior = pagoAnteriorPendiente
      ? fecha.toDateString() === pagoAnteriorPendiente.pago.toDateString()
      : false;

    return { esHoy, esInicio, esCierre, esPago, esPagoAnterior, enCompras, enGracia };
  };

  /* ── Renderiza un mes pasándole su año y mes exactos ── */
  const renderMes = ({ anio, mes }) => {
    const esActual = mes === hoy.getMonth() && anio === hoy.getFullYear();

    const primerDia = new Date(anio, mes, 1).getDay();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const days = [
      ...Array(primerDia).fill(null),
      ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
    ];

    return (
      <div className={`modal-mes-calendar ${esActual ? 'mes-actual' : ''}`} key={`${anio}-${mes}`}>
        <div className="modal-mes-header">
          <h4 className="modal-mes-titulo">
            {MESES[mes]}
            <span className="modal-mes-anio">{anio}</span>
          </h4>
          {esActual && <span className="modal-mes-badge">Hoy</span>}
        </div>

        <div className="modal-weekdays">
          {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map((d, i) => (
            <div key={i} className="modal-weekday">{d}</div>
          ))}
        </div>

        <div className="modal-calendar-grid">
          {days.map((day, index) => {
            if (!day) return <div key={index} className="modal-day empty" />;

            const info = getInfoDia(anio, mes, day);

            // Tooltip explicativo para el pago del ciclo anterior
            const tooltip = info.esPagoAnterior
              ? `Pago del ciclo anterior (${MESES_CORTO[cPrev.inicio.getMonth()]} ${cPrev.inicio.getDate()} → ${MESES_CORTO[cPrev.cierre.getMonth()]} ${cPrev.cierre.getDate()}) — aún pendiente`
              : '';

            const cls = [
              'modal-day',
              info.esHoy          ? 'hoy'           : '',
              info.esInicio       ? 'inicio'         : '',
              info.esCierre       ? 'cierre'         : '',
              info.esPago         ? 'pago'           : '',
              info.esPagoAnterior ? 'pago-anterior'  : '',
              info.enCompras      ? 'en-compras'     : '',
              info.enGracia       ? 'en-gracia'      : '',
            ].filter(Boolean).join(' ');

            return (
              <div key={index} className={cls} title={tooltip}>
                <span className="modal-day-number">{day}</span>
                {info.esInicio       && <span className="modal-badge cc-badge inicio"><IcFlag /></span>}
                {info.esCierre       && <span className="modal-badge cc-badge cierre"><IcLock /></span>}
                {info.esPago         && <span className="modal-badge cc-badge pago"><IcCoin /></span>}
                {info.esPagoAnterior && <span className="modal-badge cc-badge pago-ant"><IcCoin /></span>}
                {info.esHoy          && <div className="modal-today-dot" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-modal-overlay-enhanced" onClick={onClose}>
      <div className="calendar-modal-content-enhanced" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header-enhanced">
          <div className="modal-header-left">
            <span className="modal-header-icon cc-svg-icon"><IcCal /></span>
            <div>
              <h3 className="modal-header-title">Vista Trimestral</h3>
              <p className="modal-header-sub">Ciclo de facturación · días {diaInicio} → {diaCierre} → {diaPago}</p>
            </div>
          </div>
          <button className="modal-close-btn-enhanced cc-close-btn" onClick={onClose}><IcClose /></button>
        </div>

        {/* Leyenda */}
        <div className="modal-leyenda">
          <div className="modal-ley-item">
            <span className="modal-ley-dot inicio" />
            <span>Inicio ciclo</span>
          </div>
          <div className="modal-ley-item">
            <span className="modal-ley-dot en-compras" />
            <span>Período compras</span>
          </div>
          <div className="modal-ley-item">
            <span className="modal-ley-dot cierre" />
            <span>Cierre</span>
          </div>
          <div className="modal-ley-item">
            <span className="modal-ley-dot en-gracia" />
            <span>Período gracia</span>
          </div>
          <div className="modal-ley-item">
            <span className="modal-ley-dot pago" />
            <span>Pago límite</span>
          </div>
          {pagoAnteriorPendiente && (
            <div className="modal-ley-item">
              <span className="modal-ley-dot pago-anterior" />
              <span>Pago ciclo anterior</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="modal-body-enhanced">

          {/* Aviso de pago anterior pendiente */}
          {pagoAnteriorPendiente && (
            <div className="modal-aviso-pago-ant">
              <span className="aviso-icon cc-svg-icon"><IcCoin /></span>
              <div className="aviso-texto">
                <strong>Pago del ciclo anterior pendiente</strong>
                <p>
                  Tu ciclo anterior ({MESES_CORTO[cPrev.inicio.getMonth()]} {cPrev.inicio.getDate()} → {MESES_CORTO[cPrev.cierre.getMonth()]} {cPrev.cierre.getDate()})
                  aún tiene una fecha de pago activa el <strong>{pagoAnteriorPendiente.pago.getDate()} de {MESES[pagoAnteriorPendiente.pago.getMonth()]}</strong>.
                  Aparece marcado en naranja en el calendario.
                </p>
              </div>
            </div>
          )}

          {/* 3 calendarios — los meses exactos del ciclo activo */}
          <div className="triple-month-grid">
            {mesesCiclo.map(m => renderMes(m))}
          </div>

          {/* Guía */}
          <div className="modal-info-section">
            <h4 className="cc-guide-title">
              <span className="cc-svg-icon"><IcBook /></span>
              Guía de tu Ciclo
            </h4>

            <div className="info-cards-grid">
              <div className="info-card inicio">
                <span className="info-icon cc-info-icon inicio"><IcFlag /></span>
                <div className="info-content">
                  <strong>Inicio de Ciclo — día {diaInicio}</strong>
                  <p>Comienza tu período de facturación. Los gastos desde hoy cuentan para este ciclo.</p>
                </div>
              </div>

              <div className="info-card cierre">
                <span className="info-icon cc-info-icon cierre"><IcLock /></span>
                <div className="info-content">
                  <strong>Cierre de Ciclo — día {diaCierre}</strong>
                  <p>Se calcula tu deuda total. Los gastos después de hoy van al siguiente ciclo.</p>
                </div>
              </div>

              <div className="info-card pago">
                <span className="info-icon cc-info-icon pago"><IcCoin /></span>
                <div className="info-content">
                  <strong>Fecha de Pago — día {diaPago}</strong>
                  <p>Último día para pagar sin intereses. Intenta pagar el doble del mínimo para reducir intereses más rápido.</p>
                </div>
              </div>
            </div>

            <div className="pro-tip-modal">
              <span className="pro-tip-icon cc-svg-icon"><IcStar /></span>
              <div className="pro-tip-content">
                <strong>Pro Tip</strong>
                <p>
                  Pagar <em>antes del cierre</em> reduce tu "utilización reportada" a las agencias de crédito
                  y mejora tu score más rápido que pagar después del corte.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default CardCalendar;