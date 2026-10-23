import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import './TeaMarketCard.css';

/**
 * "Tu TEA vs el mercado"
 *
 * Ubica la tasa de ESTA tarjeta dentro del rango de TEA de los bancos
 * peruanos (usa `tea_promedio` de getBancos) y, si el usuario paga por
 * encima de la más baja, estima cuánto le cuesta al año sobre su deuda.
 */

const IcScale = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><path d="M5 7h14M7 7l-4 7h8zM17 7l-4 7h8z"/></svg>);
const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);

function TeaMarketCard({ tea, deuda, simboloMoneda }) {
  const navigate = useNavigate();
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(true);

  const simbolo = simboloMoneda || 'S/';
  const teaNum = parseFloat(tea || 0);
  const deudaNum = parseFloat(deuda || 0);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const data = await cardsApi.getBancos();
        if (activo && data.success) setBancos(data.bancos || []);
      } catch (e) {
        console.error('Error al cargar bancos:', e);
      } finally {
        if (activo) setLoading(false);
      }
    })();
    return () => { activo = false; };
  }, []);

  /* ── Sin TEA registrada: no hay nada que comparar ── */
  if (!loading && teaNum <= 0) {
    return (
      <div className="tmc-wrap">
        <div className="tmc-badge"><IcScale /> Tu TEA vs el mercado</div>
        <p className="tmc-empty">
          No registraste la TEA de esta tarjeta, así que no podemos compararla con el mercado.
          Puedes encontrarla en tu estado de cuenta.
        </p>
        <button className="tmc-cta" onClick={() => navigate('/comparador')}>
          Ver TEA de los bancos <IcArrow />
        </button>
      </div>
    );
  }

  const teasMercado = bancos
    .map(b => parseFloat(b.tea_promedio))
    .filter(t => !isNaN(t) && t > 0);

  if (loading || teasMercado.length === 0) {
    return (
      <div className="tmc-wrap">
        <div className="tmc-badge"><IcScale /> Tu TEA vs el mercado</div>
        <div className="tmc-loading">{loading ? 'Comparando con el mercado…' : 'Mercado no disponible por ahora.'}</div>
      </div>
    );
  }

  const min = Math.min(...teasMercado);
  const max = Math.max(...teasMercado);
  const promedio = teasMercado.reduce((s, t) => s + t, 0) / teasMercado.length;

  const diffProm = teaNum - promedio;          // + = pagas más que el promedio
  const porDebajo = diffProm <= 0;

  // Posición de tu TEA en la escala del mercado (0-100%)
  const rango = Math.max(1, max - min);
  const pos = Math.min(100, Math.max(0, ((teaNum - min) / rango) * 100));
  const posProm = Math.min(100, Math.max(0, ((promedio - min) / rango) * 100));

  // Costo anual extra vs la TEA más baja del mercado (si mantuvieras la deuda un año)
  const puntosSobreMin = Math.max(0, teaNum - min);
  const costoExtraAnual = deudaNum > 0 ? deudaNum * (puntosSobreMin / 100) : 0;

  const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');
  const tono = porDebajo ? 'good' : 'warn';

  return (
    <div className="tmc-wrap">
      <div className="tmc-badge"><IcScale /> Tu TEA vs el mercado</div>

      {/* Titular */}
      <div className="tmc-head">
        <span className={`tmc-tea tmc-tea-${tono}`}>{teaNum}%</span>
        <span className={`tmc-pill tmc-pill-${tono}`}>
          {porDebajo
            ? `${Math.abs(diffProm).toFixed(0)} pts bajo el promedio`
            : `${diffProm.toFixed(0)} pts sobre el promedio`}
        </span>
      </div>

      {/* Escala del mercado */}
      <div className="tmc-scale">
        <div className="tmc-track">
          <div className="tmc-prom" style={{ left: `${posProm}%` }} title={`Promedio del mercado: ${promedio.toFixed(0)}%`} />
          <div className={`tmc-marker tmc-marker-${tono}`} style={{ left: `${pos}%` }}>
            <span className="tmc-marker-dot" />
          </div>
        </div>
        <div className="tmc-scale-labels">
          <span>{min.toFixed(0)}% <em>la más baja</em></span>
          <span>{max.toFixed(0)}% <em>la más alta</em></span>
        </div>
      </div>

      {/* Lectura */}
      <p className="tmc-text">
        {porDebajo ? (
          <>Tu tasa está <strong>por debajo del promedio</strong> del mercado ({promedio.toFixed(0)}%). Buena señal: si algún día pagas intereses, te costarán menos que a la mayoría.</>
        ) : (
          <>Tu tasa está <strong>por encima del promedio</strong> del mercado ({promedio.toFixed(0)}%). Vale la pena revisar si otro banco te ofrece una TEA menor.</>
        )}
      </p>

      {/* Costo real vs la mejor tasa */}
      {costoExtraAnual > 0 && (
        <div className="tmc-costo">
          <strong>~{simbolo} {fmt0(costoExtraAnual)} al año</strong>
          <span>
            Es lo que te costaría de más tu deuda de {simbolo} {fmt0(deudaNum)} frente a la TEA más baja del mercado ({min.toFixed(0)}%), si la mantuvieras un año.
          </span>
        </div>
      )}

      <button className="tmc-cta" onClick={() => navigate('/comparador')}>
        Comparar bancos <IcArrow />
      </button>
    </div>
  );
}

export default TeaMarketCard;
