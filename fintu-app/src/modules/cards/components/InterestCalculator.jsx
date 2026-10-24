import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler
} from 'chart.js';
import { simularPagos, tasaMensual, textoMeses } from '@/shared/utils/intereses';
import './InterestCalculator.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');
const fmt2 = (n) => n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const IcClose = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

/**
 * Calculadora de intereses: "si pago X al mes, ¿en cuánto termino y cuánto me cuesta?"
 * Un solo monto que se mueve con un deslizador; todo lo demás responde al instante.
 */
function InterestCalculator({ tarjeta, deudaBase, etiquetaDeuda = 'Hoy debes', simboloMoneda, onClose }) {
  const simbolo = simboloMoneda || 'S/';
  // Misma base que "¿Cuánto pagar este ciclo?": lo que vence, o toda la deuda si aún acumula
  const deuda   = parseFloat(deudaBase ?? tarjeta.deuda_actual ?? 0);
  const tea     = parseFloat(tarjeta.tasa_interes || 0);
  const minimo  = parseFloat(tarjeta.pago_minimo || 0);
  const banco   = tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Tu tarjeta';

  const iMes       = tasaMensual(tea);
  const interesMes = deuda * iMes;

  /* Rango del deslizador: desde lo que apenas supera el interés hasta pagar todo */
  const paso   = deuda > 3000 ? 10 : 5;
  const desde  = Math.min(Math.ceil(deuda), Math.max(paso, Math.ceil((interesMes + 1) / paso) * paso));
  const hasta  = Math.ceil(deuda);
  const inicial = minimo > interesMes ? Math.round(minimo) : Math.round(Math.max(desde, deuda * 0.1));

  const [pago, setPago] = useState(String(inicial));

  /* Cerrar con Escape */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shell = (contenido) => createPortal(
    <div className="ic-overlay" onClick={onClose}>
      <div className="ic-modal" role="dialog" aria-modal="true" aria-labelledby="ic-title" onClick={(e) => e.stopPropagation()}>
        <header className="ic-head">
          <div>
            <h2 id="ic-title">Calculadora de intereses</h2>
            <span>{banco}{tea > 0 ? ` · TEA ${tea}%` : ''}</span>
          </div>
          <button className="ic-x" onClick={onClose} aria-label="Cerrar"><IcClose /></button>
        </header>
        <div className="ic-body">{contenido}</div>
        <footer className="ic-foot">
          <button className="ic-done" onClick={onClose}>Listo</button>
        </footer>
      </div>
    </div>,
    document.body
  );

  /* ── Casos sin nada que simular ── */
  if (deuda <= 0) {
    return shell(
      <div className="ic-empty">
        <h3>No tienes deuda en esta tarjeta</h3>
        <p>No pagas intereses. Si la usas, paga el total antes de la fecha de pago y seguirá así.</p>
      </div>
    );
  }
  if (tea <= 0) {
    return shell(
      <div className="ic-empty">
        <h3>Falta la TEA de esta tarjeta</h3>
        <p>Sin la tasa no podemos calcular los intereses. La encuentras en tu estado de cuenta; regístrala al editar la tarjeta.</p>
      </div>
    );
  }

  /* ── Simulación ── */
  const pagoNum   = parseFloat(pago) || 0;
  const pagaTodo  = pagoNum >= deuda;
  const r         = pagaTodo ? null : simularPagos(deuda, tea, pagoNum);
  const rMin      = minimo > 0 ? simularPagos(deuda, tea, minimo) : null;
  const intereses = pagaTodo ? 0 : r.intereses;
  const meses     = pagaTodo ? 1 : r.meses;
  const imposible = !pagaTodo && r.imposible;

  const tono = pagaTodo ? 'good' : imposible ? 'bad' : meses <= 6 ? 'good' : meses <= 18 ? 'warn' : 'bad';

  // Frente al mínimo: cuánto ahorras y cuántos meses antes terminas
  const comparaMin = rMin && !rMin.imposible && !imposible && pagoNum > minimo + 0.5
    ? { ahorro: rMin.intereses - intereses, antes: rMin.meses - meses }
    : null;

  const pctIntereses = imposible ? 0 : Math.round((intereses / (deuda + intereses)) * 100);

  const chips = [
    ...(minimo > 0 ? [{ tag: 'Mínimo', val: Math.round(minimo) }, { tag: 'El doble', val: Math.min(hasta, Math.round(minimo * 2)) }] : []),
    { tag: 'Todo', val: hasta },
  ];

  /* ── Gráfico: tu plan vs solo el mínimo ── */
  const serieTu  = pagaTodo ? [deuda, 0] : (imposible ? null : r.saldos);
  const serieMin = rMin && !rMin.imposible && Math.abs(pagoNum - minimo) > 0.5 ? rMin.saldos : null;
  const largo    = Math.max(serieTu?.length || 0, serieMin?.length || 0);
  const relleno  = (s) => s ? [...s, ...Array(Math.max(0, largo - s.length)).fill(null)] : [];
  const chartData = {
    labels: Array.from({ length: largo }, (_, i) => (i === 0 ? 'Hoy' : `Mes ${i}`)),
    datasets: [
      ...(serieTu ? [{
        label: `Pagando ${simbolo} ${fmt0(pagoNum)}`,
        data: relleno(serieTu),
        borderColor: '#2F4A3E', backgroundColor: 'rgba(47, 74, 62, 0.08)',
        fill: true, tension: 0.3, pointRadius: 0, borderWidth: 3,
      }] : []),
      ...(serieMin ? [{
        label: `Solo el mínimo (${simbolo} ${fmt0(minimo)})`,
        data: relleno(serieMin),
        borderColor: '#C2462A', backgroundColor: 'transparent',
        fill: false, tension: 0.3, pointRadius: 0, borderWidth: 2, borderDash: [6, 4],
      }] : []),
    ],
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#6B5148', font: { size: 11, weight: '600' }, usePointStyle: true, pointStyle: 'line', padding: 12 } },
      tooltip: {
        backgroundColor: '#ffffff', titleColor: '#2B1B17', bodyColor: '#6B5148',
        borderColor: 'rgba(74, 47, 40, 0.12)', borderWidth: 1, padding: 10,
        callbacks: { label: (c) => c.parsed.y == null ? null : `Debes ${simbolo} ${fmt0(c.parsed.y)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8A746A', font: { size: 10 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } },
      y: { beginAtZero: true, grid: { color: 'rgba(74, 47, 40, 0.06)' }, ticks: { color: '#8A746A', font: { size: 10 }, callback: (v) => `${simbolo}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}` } },
    },
    interaction: { mode: 'index', intersect: false },
  };

  return shell(
    <>
      {/* Para qué sirve */}
      <p className="ic-intro">
        Elige cuánto pagarías cada mes y verás <strong>en cuánto tiempo terminas</strong> y <strong>cuánto te cobran de intereses</strong>.
        Úsala para decidir cuánto pagar este mes.
      </p>

      {/* Hoy */}
      <div className="ic-hoy">
        <div>
          <span className="ic-label">{etiquetaDeuda}</span>
          <b>{simbolo} {fmt2(deuda)}</b>
        </div>
        <p>
          Lo que no pagues suma unos <strong>{simbolo} {fmt0(interesMes)} de intereses al mes</strong> ({simbolo} {fmt2(interesMes / 30)} por día).
        </p>
      </div>

      {/* ¿Cuánto pagarías? */}
      <section className="ic-pago">
        <label className="ic-label" htmlFor="ic-monto">¿Cuánto pagarías al mes?</label>
        <div className="ic-monto">
          <span>{simbolo}</span>
          <input
            id="ic-monto"
            type="number"
            inputMode="decimal"
            min="0"
            value={pago}
            onChange={(e) => setPago(e.target.value)}
          />
        </div>
        <input
          className="ic-slider"
          type="range"
          min={desde}
          max={hasta}
          step={paso}
          value={Math.min(hasta, Math.max(desde, pagoNum))}
          onChange={(e) => setPago(e.target.value)}
          aria-label="Monto mensual"
          style={{ '--p': `${((Math.min(hasta, Math.max(desde, pagoNum)) - desde) / Math.max(1, hasta - desde)) * 100}%` }}
        />
        <div className="ic-chips">
          {chips.map((c) => (
            <button
              key={c.tag}
              className={`ic-chip ${Math.abs(pagoNum - c.val) < 1 ? 'active' : ''}`}
              onClick={() => setPago(String(c.val))}
            >
              {c.tag} <b>{simbolo} {fmt0(c.val)}</b>
            </button>
          ))}
        </div>
        {minimo <= 0 && (
          <p className="ic-nota">Registra el pago mínimo de tu tarjeta para compararlo aquí.</p>
        )}
      </section>

      {/* Resultado */}
      {pagoNum <= 0 ? (
        <div className="ic-res">
          <p className="ic-res-sub">Escribe un monto o mueve la barra.</p>
        </div>
      ) : imposible ? (
        <div className="ic-res bad">
          <span className="ic-label">Resultado</span>
          <p className="ic-res-big">Tu deuda no baja</p>
          <p className="ic-res-sub">
            Con {simbolo} {fmt0(pagoNum)} al mes, los intereses ({simbolo} {fmt0(interesMes)}) se comen todo el pago. Paga al menos {simbolo} {fmt0(desde)}.
          </p>
        </div>
      ) : (
        <div className={`ic-res ${tono}`}>
          <span className="ic-label">Resultado</span>
          <p className="ic-res-big">
            {pagaTodo ? 'Terminas este mes' : <>Terminas en {textoMeses(meses)}</>}
          </p>
          <p className="ic-res-sub">
            {pagaTodo
              ? <>y pagas <strong>{simbolo} 0 de intereses</strong>, si pagas antes de la fecha de pago.</>
              : <>y pagas <strong>{simbolo} {fmt0(intereses)} de intereses</strong>: en total {simbolo} {fmt0(deuda + intereses)}.</>}
          </p>

          <div className="ic-split" aria-hidden="true">
            <div className="ic-split-deuda" style={{ width: `${100 - pctIntereses}%` }} />
            <div className="ic-split-int" style={{ width: `${pctIntereses}%` }} />
          </div>
          <div className="ic-split-leyenda">
            <span><i className="d" /> Tu deuda {simbolo} {fmt0(deuda)}</span>
            <span><i className="i" /> Intereses {simbolo} {fmt0(intereses)}</span>
          </div>

          {comparaMin && comparaMin.ahorro >= 1 && (
            <p className="ic-ahorro">
              Frente a pagar solo el mínimo, <strong>ahorras {simbolo} {fmt0(comparaMin.ahorro)}</strong>
              {comparaMin.antes > 0 && <> y terminas <strong>{textoMeses(comparaMin.antes)} antes</strong></>}.
            </p>
          )}
        </div>
      )}

      {/* Cómo baja tu deuda */}
      {serieTu && largo > 2 && (
        <section className="ic-chart-wrap">
          <span className="ic-label">Cómo baja tu deuda</span>
          <div className="ic-chart"><Line data={chartData} options={chartOpts} /></div>
        </section>
      )}

      {/* Por qué */}
      <div className="ic-porque">
        <strong>¿Por qué pasa esto?</strong>
        <p>
          Tu TEA de {tea}% equivale a <strong>{(iMes * 100).toFixed(2)}% al mes</strong> sobre lo que dejas sin pagar.
          Por eso cada sol extra que pagas hoy te ahorra intereses todos los meses siguientes.
        </p>
      </div>
    </>
  );
}

export default InterestCalculator;
