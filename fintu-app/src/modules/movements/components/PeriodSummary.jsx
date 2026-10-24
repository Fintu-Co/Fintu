import './HistoryChart.css';

const fmtMonto = (n) => n.toLocaleString('es-PE', { maximumFractionDigits: 0 });
const fmtFecha = (f) => new Date(f).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });

/* Resumen del periodo que muestra el gráfico: lista corta + un consejo */
function PeriodSummary({ insights, dias, simboloMoneda }) {
  if (!insights) return null;

  const simbolo = simboloMoneda || 'S/';
  const variacion = insights.variacion_deuda || 0;
  const uso = insights.linea_credito > 0
    ? Math.round((insights.deuda_final / insights.linea_credito) * 100)
    : 0;

  let tendencia = { texto: 'Sin cambios', clase: '' };
  if (variacion > 0) tendencia = { texto: `Subió ${simbolo} ${fmtMonto(variacion)}`, clase: 'up' };
  if (variacion < 0) tendencia = { texto: `Bajó ${simbolo} ${fmtMonto(Math.abs(variacion))}`, clase: 'down' };

  let consejo;
  if (insights.deuda_final > insights.uso_70_porciento) {
    consejo = {
      clase: 'alto',
      texto: <>Usas el <strong>{uso}%</strong> de tu línea. Paga al menos {simbolo} {fmtMonto(insights.deuda_final - insights.uso_30_porciento)} para bajar al 30%.</>,
    };
  } else if (insights.deuda_final > insights.uso_30_porciento) {
    consejo = {
      clase: 'medio',
      texto: <>Usas el <strong>{uso}%</strong> de tu línea. Bájala a {simbolo} {fmtMonto(insights.uso_30_porciento)} (30%) para cuidar tu score.</>,
    };
  } else {
    consejo = {
      clase: 'bien',
      texto: <>Usas el <strong>{uso}%</strong> de tu línea. Vas bien: mantente bajo el 30%.</>,
    };
  }

  return (
    <div className="ps">
      <h3 className="cdx-card-title ps-title">¿Cómo va tu periodo?</h3>
      <p className="ps-sub">Últimos {dias} días</p>

      <dl className="ps-list">
        {insights.pico_gasto && (
          <div className="ps-row">
            <dt>Tu gasto más alto <span>{fmtFecha(insights.pico_gasto.fecha)}</span></dt>
            <dd>{simbolo} {fmtMonto(insights.pico_gasto.monto)}</dd>
          </div>
        )}
        {insights.mejor_pago && (
          <div className="ps-row">
            <dt>Tu mayor pago <span>{fmtFecha(insights.mejor_pago.fecha)}</span></dt>
            <dd className="down">{simbolo} {fmtMonto(insights.mejor_pago.monto)}</dd>
          </div>
        )}
        <div className="ps-row">
          <dt>Gastas en promedio</dt>
          <dd>{simbolo} {fmtMonto(insights.promedio_gasto_diario)} <span>al día</span></dd>
        </div>
        <div className="ps-row">
          <dt>Tu deuda</dt>
          <dd className={tendencia.clase}>{tendencia.texto}</dd>
        </div>
      </dl>

      <p className={`ps-tip ${consejo.clase}`}>{consejo.texto}</p>
    </div>
  );
}

export default PeriodSummary;
