import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import ImproveCard from './ImproveCard';

/**
 * "¿Tu tasa es cara?"
 *
 * Ubica la tasa de ESTA tarjeta dentro del rango de TEA de los bancos
 * peruanos (usa `tea_promedio` de getBancos) y, si el usuario paga por
 * encima de la más baja, estima cuánto le cuesta al año sobre su deuda.
 */

const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');

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

  const base = {
    chip: 'Elige mejor tarjeta',
    pregunta: '¿Tu tasa es cara?',
    cta: 'Comparar bancos',
    onCta: () => navigate('/comparador'),
  };

  /* ── Sin TEA registrada: no hay nada que comparar ── */
  if (!loading && teaNum <= 0) {
    return (
      <ImproveCard
        {...base}
        valor="—"
        detalle="Falta la TEA de esta tarjeta"
        paso="Búscala en tu estado de cuenta y regístrala para compararla con los bancos."
      />
    );
  }

  const teasMercado = bancos
    .map(b => parseFloat(b.tea_promedio))
    .filter(t => !isNaN(t) && t > 0);

  if (loading || teasMercado.length === 0) {
    return (
      <ImproveCard
        {...base}
        valor={teaNum > 0 ? `${teaNum}%` : '—'}
        detalle={loading ? 'Comparando con el mercado…' : 'Mercado no disponible por ahora.'}
      />
    );
  }

  const min = Math.min(...teasMercado);
  const max = Math.max(...teasMercado);
  const promedio = teasMercado.reduce((s, t) => s + t, 0) / teasMercado.length;
  const porDebajo = teaNum <= promedio;

  // Posición en la escala del mercado (0-100%)
  const rango = Math.max(1, max - min);
  const pos = Math.min(100, Math.max(0, ((teaNum - min) / rango) * 100));

  // Ahorro al año con la TEA más baja del mercado (si mantuvieras la deuda un año)
  const ahorroAnual = deudaNum > 0 ? deudaNum * (Math.max(0, teaNum - min) / 100) : 0;

  const paso = ahorroAnual >= 1
    ? `Con la TEA más baja (${min.toFixed(0)}%) ahorrarías unos ${simbolo} ${fmt0(ahorroAnual)} al año sobre tu deuda actual.`
    : porDebajo
      ? 'Tu tasa está bien. Lo que más te ahorra es pagar el total cada mes.'
      : 'Revisa si otro banco te ofrece una TEA menor.';

  return (
    <ImproveCard
      {...base}
      valor={`${teaNum}%`}
      tono={porDebajo ? 'good' : 'warn'}
      detalle={porDebajo
        ? `Menor al promedio (${promedio.toFixed(0)}%)`
        : `Mayor al promedio (${promedio.toFixed(0)}%)`}
      paso={paso}
    >
      <div className="mj-bar">
        <div className="mj-track mj-track--escala" />
        <div className="mj-dot" style={{ left: `${pos}%` }} title={`Tu TEA: ${teaNum}%`} />
        <div className="mj-ends">
          <span><b>{min.toFixed(0)}%</b> la más baja</span>
          <span><b>{max.toFixed(0)}%</b> la más alta</span>
        </div>
      </div>
    </ImproveCard>
  );
}

export default TeaMarketCard;
