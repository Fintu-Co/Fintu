import { useState } from 'react';
import { createPortal } from 'react-dom';
import { TripleMonthModal } from './CardCalendar';
import { calcularCiclo } from '@/shared/utils/ciclo';
import './CardCalendar.css';
import './MiniCycleCalendar.css';

/* ── SVG icons ── */
const IcChevL = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const IcChevR = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);
const IcCal   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const WEEKDAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

const sameDay = (a, b) => a.toDateString() === b.toDateString();
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };

/* ── Lunes de la semana que contiene `date` ── */
function mondayOf(date) {
  const d = startOfDay(date);
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow);
  return d;
}

function MiniCycleCalendar({ diaInicio, diaCierre, diaPago }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const hoy = startOfDay(new Date());

  /* ── Fechas del ciclo activo (misma lógica que el backend y el PDF) ── */
  const c = calcularCiclo({ dia_inicio_ciclo: diaInicio, dia_cierre_ciclo: diaCierre, dia_pago: diaPago });
  const ciclo = {
    inicio: startOfDay(c.inicio),
    cierre: startOfDay(c.cierre),
    pago:   startOfDay(c.pago),
  };

  /* ── Ancla: próximo evento (cierre → pago → hoy) ── */
  const anchor = ciclo.cierre >= hoy ? ciclo.cierre : ciclo.pago >= hoy ? ciclo.pago : hoy;

  /* ── Semana visible ── */
  const weekStart = mondayOf(anchor);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  /* ── Mes/año representativo (jueves de la semana) ── */
  const midDay = days[3];
  const monthLabel = `${MESES[midDay.getMonth()]} ${midDay.getFullYear()}`;

  /* ── Próximo evento para la línea informativa ── */
  const diasA = (f) => Math.round((f - hoy) / 86400000);
  let proximo = null;
  if (ciclo.cierre >= hoy)      proximo = { nombre: 'Cierre', dias: diasA(ciclo.cierre), fecha: ciclo.cierre, cls: 'close' };
  else if (ciclo.pago >= hoy)   proximo = { nombre: 'Pago',   dias: diasA(ciclo.pago),   fecha: ciclo.pago,   cls: 'pay'   };

  const dayClass = (d) => {
    if (sameDay(d, ciclo.pago))   return 'pay';
    if (sameDay(d, ciclo.cierre)) return 'close';
    if (sameDay(d, ciclo.inicio)) return 'start';
    return '';
  };

  return (
    <div className="mcc-wrap">

      {/* Header: navegación por semana */}
      <div className="mcc-head">
        <button className="mcc-arw" onClick={() => setWeekOffset(weekOffset - 1)} title="Semana anterior"><IcChevL /></button>
        <h4 className="mcc-month">{monthLabel}</h4>
        <button className="mcc-arw" onClick={() => setWeekOffset(weekOffset + 1)} title="Semana siguiente"><IcChevR /></button>
      </div>

      {/* Semana */}
      <div className="mcc-week">
        {WEEKDAYS.map((w) => <div key={w} className="mcc-wd">{w}</div>)}
        {days.map((d) => {
          const cls = dayClass(d);
          const esHoy = sameDay(d, hoy);
          return (
            <div key={d.toISOString()} className={`mcc-day ${cls}${esHoy ? ' today' : ''}`}>
              <span className="mcc-day-num">{d.getDate()}</span>
              {cls === 'pay'   && <small className="mcc-day-tag pay">Pago</small>}
              {cls === 'close' && <small className="mcc-day-tag close">Cierre</small>}
              {cls === 'start' && <small className="mcc-day-tag start">Inicio</small>}
            </div>
          );
        })}
      </div>

      {/* Línea de próximo evento */}
      {proximo && (
        <div className={`mcc-next mcc-next-${proximo.cls}`}>
          <span className="mcc-next-label">Próximo · {proximo.nombre}</span>
          <span className="mcc-next-value">
            {proximo.dias === 0 ? 'Hoy' : `en ${proximo.dias} día${proximo.dias === 1 ? '' : 's'}`}
            <span className="mcc-next-date">{proximo.fecha.getDate()} {MESES_CORTO[proximo.fecha.getMonth()]}</span>
          </span>
        </div>
      )}

      {/* Footer: leyenda + calendario completo */}
      <div className="mcc-foot">
        <div className="mcc-legend">
          <span><i className="mcc-dot close" /> Cierre</span>
          <span><i className="mcc-dot pay" /> Pago</span>
        </div>
        <button className="mcc-cal-btn" onClick={() => setShowModal(true)}>
          <IcCal /> Ver calendario
        </button>
      </div>

      {showModal && createPortal(
        <TripleMonthModal
          diaInicio={diaInicio}
          diaCierre={diaCierre}
          diaPago={diaPago}
          onClose={() => setShowModal(false)}
        />,
        document.body
      )}
    </div>
  );
}

export default MiniCycleCalendar;
