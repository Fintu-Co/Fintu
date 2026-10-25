import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import { rangoMercado, textoRango } from '@/shared/utils/teaAprox';
import ImproveCard from './ImproveCard';

/**
 * "¿Tu tasa es cara?"
 *
 * Compara la TEA que registró el usuario (exacta) con el mercado en RANGOS
 * APROXIMADOS (teaAprox.js) y estima cuánto ahorraría al año con una tasa
 * cercana a la más baja.
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

  // El mercado en bandas aproximadas: de la más baja a la más alta
  const mercado = rangoMercado(teasMercado);
  const min = mercado.baja.desde;
  const max = mercado.alta.hasta;
  const porDebajo = teaNum < mercado.promedio.desde;
  const enPromedio = !porDebajo && teaNum < mercado.promedio.hasta;

  // Posición en la escala del mercado (0-100%)
  const rango = Math.max(1, max - min);
  const pos = Math.min(100, Math.max(0, ((teaNum - min) / rango) * 100));

  // Ahorro al año con una TEA en la banda más baja (si mantuvieras la deuda un año)
  const ahorro = (techo) => (deudaNum > 0 ? deudaNum * (Math.max(0, teaNum - techo) / 100) : 0);
  const ahorroMin = ahorro(mercado.baja.hasta);
  const ahorroMax = ahorro(mercado.baja.desde);

  const paso = ahorroMax >= 1
    ? `Con una TEA cercana a la más baja (${textoRango(mercado.baja)}) ahorrarías unos ${simbolo} ${fmt0(ahorroMin)}–${fmt0(ahorroMax)} al año sobre tu deuda actual.`
    : porDebajo
      ? 'Tu tasa está bien. Lo que más te ahorra es pagar el total cada mes.'
      : 'Revisa si otro banco te ofrece una TEA menor.';

  return (
    <ImproveCard
      {...base}
      valor={`${teaNum}%`}
      tono={porDebajo ? 'good' : enPromedio ? '' : 'warn'}
      detalle={porDebajo
        ? `Menor al promedio (${textoRango(mercado.promedio)})`
        : enPromedio
          ? `Cerca del promedio (${textoRango(mercado.promedio)})`
          : `Mayor al promedio (${textoRango(mercado.promedio)})`}
      paso={paso}
    >
      <div className="mj-bar">
        <div className="mj-track mj-track--escala" />
        <div className="mj-dot" style={{ left: `${pos}%` }} title={`Tu TEA: ${teaNum}%`} />
        <div className="mj-ends">
          <span>aprox. <b>{min}%</b> la más baja</span>
          <span>aprox. <b>{max}%</b> la más alta</span>
        </div>
      </div>
    </ImproveCard>
  );
}

export default TeaMarketCard;
