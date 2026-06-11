import annotationPlugin from 'chartjs-plugin-annotation';
import { useEffect, useState } from 'react';

/* ── SVG icons ── */
const IcChart  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
const IcBulb   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L12 18l-3.7-3c-2-1.3-3.3-3.5-3.3-6a7 7 0 0 1 7-7z"/></svg>);
const IcFire   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>);
const IcCheck  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IcBolt   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IcTrendU = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>);
const IcTrendD = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>);
const IcWarn   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IcStar   = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
import { movementsApi } from '../../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler

} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './HistoryChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin 
);

function HistoryChart({ tarjetaId, simboloMoneda, lineaCredito }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(14);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    cargarDatosGrafico();
  }, [tarjetaId, periodo]);

  const cargarDatosGrafico = async () => {
    try {
      setLoading(true);
      const data = await movementsApi.getChartDetailed(`${tarjetaId}?dias=${periodo}`);

      if (data.success && data.chartData.length > 0) {
        procesarDatos(data.chartData, data.insights);
      } else {
        setChartData(null);
        setInsights(null);
      }
    } catch (error) {
      console.error('Error al cargar datos del gráfico:', error);
      setChartData(null);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  const procesarDatos = (datos, insightsData) => {
    const labels = datos.map(item => {
      const fecha = new Date(item.fecha);
      return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
    });

    const gastos = datos.map(item => item.gasto || 0);
    const pagos = datos.map(item => item.pago || 0);
    const deudas = datos.map(item => item.deuda_acumulada);

    setInsights(insightsData);

    setChartData({
      labels,
      datasets: [
        // Barras de gastos (rojas)
        {
          type: 'bar',
          label: 'Gastos',
          data: gastos,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: '#ef4444',
          borderWidth: 2,
          borderRadius: 6,
          order: 2
        },
        // Barras de pagos (verdes)
        {
          type: 'bar',
          label: 'Pagos',
          data: pagos,
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderColor: '#22c55e',
          borderWidth: 2,
          borderRadius: 6,
          order: 2
        },
        // Línea de deuda (dorada)
        {
          type: 'line',
          label: 'Deuda',
          data: deudas,
          borderColor: '#d4a574',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(212, 165, 116, 0.4)');
            gradient.addColorStop(1, 'rgba(212, 165, 116, 0.05)');
            return gradient;
          },
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 8,
          pointBackgroundColor: '#d4a574',
          pointBorderColor: '#1a1a1a',
          pointBorderWidth: 2,
          order: 1
        }
      ]
    });
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#e5e5e5',
          font: { size: 12, weight: '600' },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        titleColor: '#d4a574',
        bodyColor: '#e5e5e5',
        borderColor: '#d4a574',
        borderWidth: 2,
        padding: 16,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 14, weight: 'bold' },
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (value > 0) {
              return `${label}: ${simboloMoneda} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
            }
            return null;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#999',
          font: { size: 11, weight: '600' },
          maxRotation: 0,
          autoSkip: true
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.03)',
          drawBorder: false
        },
        ticks: {
          color: '#999',
          font: { size: 11, weight: '600' },
          callback: function(value) {
            return value >= 1000 ? `${simboloMoneda}${(value / 1000).toFixed(1)}k` : `${simboloMoneda}${value}`;
          }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  // Agregar líneas de referencia si hay insights
  if (insights && chartData) {
    options.plugins.annotation = {
      annotations: {
        linea30: {
          type: 'line',
          yMin: insights.uso_30_porciento,
          yMax: insights.uso_30_porciento,
          borderColor: 'rgba(251, 191, 36, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            content: '30% - Uso saludable',
            enabled: true,
            position: 'end',
            backgroundColor: 'rgba(251, 191, 36, 0.8)',
            color: '#1a1a1a',
            font: { size: 10, weight: 'bold' }
          }
        },
        linea70: {
          type: 'line',
          yMin: insights.uso_70_porciento,
          yMax: insights.uso_70_porciento,
          borderColor: 'rgba(249, 115, 22, 0.5)',
          borderWidth: 2,
          borderDash: [5, 5],
          label: {
            content: '70% - Zona de peligro',
            enabled: true,
            position: 'end',
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            color: '#fff',
            font: { size: 10, weight: 'bold' }
          }
        },
        limite: {
          type: 'line',
          yMin: insights.linea_credito,
          yMax: insights.linea_credito,
          borderColor: 'rgba(239, 68, 68, 0.6)',
          borderWidth: 3,
          borderDash: [10, 5],
          label: {
            content: 'Límite',
            enabled: true,
            position: 'end',
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            font: { size: 11, weight: 'bold' }
          }
        }
      }
    };
  }

  if (loading) {
    return (
      <div className="history-chart-loading">
        <div className="spinner"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  const simbolo = simboloMoneda || 'S/';

  return (
    <div className="history-chart">
      
      {/* Controles */}
      <div className="chart-controls">
        <div className="period-selector-improved">
          <button 
            className={`period-btn-new ${periodo === 7 ? 'active' : ''}`}
            onClick={() => setPeriodo(7)}
          >
            <span className="period-label">Última</span>
            <span className="period-value">Semana</span>
          </button>
          <button 
            className={`period-btn-new ${periodo === 14 ? 'active' : ''}`}
            onClick={() => setPeriodo(14)}
          >
            <span className="period-label">Últimas</span>
            <span className="period-value">2 Semanas</span>
          </button>
          <button 
            className={`period-btn-new ${periodo === 30 ? 'active' : ''}`}
            onClick={() => setPeriodo(30)}
          >
            <span className="period-label">Último</span>
            <span className="period-value">Mes</span>
          </button>
        </div>
      </div>

      {/* Gráfico */}
      <div className="chart-container-improved">
        {chartData ? (
          <Chart type='bar' data={chartData} options={options} />
        ) : (
          <div className="chart-empty">
            <span className="empty-icon"><IcChart /></span>
            <p>Aún no hay movimientos registrados</p>
            <span className="empty-hint">
              Registra tus gastos y pagos para ver tu análisis
            </span>
          </div>
        )}
      </div>

      {/* Insights automáticos */}
      {insights && chartData && (
        <div className="chart-insights">
          <h4 className="insights-title"><span className="hc-title-icon"><IcBulb /></span> Insights de tu periodo</h4>
          
          <div className="insights-grid">
            {/* Pico de gasto */}
            {insights.pico_gasto && (
              <div className="insight-card danger">
                <div className="insight-icon hc-ic danger"><IcFire /></div>
                <div className="insight-content">
                  <span className="insight-label">Pico de gasto</span>
                  <span className="insight-value">
                    {simbolo} {insights.pico_gasto.monto.toLocaleString('es-PE')}
                  </span>
                  <span className="insight-date">
                    {new Date(insights.pico_gasto.fecha).toLocaleDateString('es-PE')}
                  </span>
                </div>
              </div>
            )}

            {/* Mejor pago */}
            {insights.mejor_pago && (
              <div className="insight-card success">
                <div className="insight-icon hc-ic success"><IcCheck /></div>
                <div className="insight-content">
                  <span className="insight-label">Mejor pago</span>
                  <span className="insight-value">
                    {simbolo} {insights.mejor_pago.monto.toLocaleString('es-PE')}
                  </span>
                  <span className="insight-date">
                    {new Date(insights.mejor_pago.fecha).toLocaleDateString('es-PE')}
                  </span>
                </div>
              </div>
            )}

            {/* Velocidad de gasto */}
            <div className="insight-card info">
              <div className="insight-icon hc-ic info"><IcBolt /></div>
              <div className="insight-content">
                <span className="insight-label">Velocidad</span>
                <span className="insight-value">
                  {simbolo} {insights.promedio_gasto_diario.toFixed(0)}/día
                </span>
                <span className="insight-hint">Promedio diario</span>
              </div>
            </div>

            {/* Tendencia */}
            <div className={`insight-card ${insights.variacion_deuda > 0 ? 'warning' : 'success'}`}>
              <div className={`insight-icon hc-ic ${insights.variacion_deuda > 0 ? 'warning' : 'success'}`}>
                {insights.variacion_deuda > 0 ? <IcTrendU /> : <IcTrendD />}
              </div>
              <div className="insight-content">
                <span className="insight-label">Tendencia</span>
                <span className="insight-value">
                  {insights.variacion_deuda > 0 ? '+' : ''}
                  {simbolo} {Math.abs(insights.variacion_deuda).toLocaleString('es-PE')}
                </span>
                <span className="insight-hint">
                  {insights.variacion_deuda > 0 ? 'Subiendo' : 'Bajando'}
                </span>
              </div>
            </div>
          </div>

          {/* Consejo educativo */}
          <div className="educational-tip">
            {insights.deuda_final > insights.uso_70_porciento ? (
              <>
                <span className="tip-icon hc-tip warn"><IcWarn /></span>
                <span className="tip-text">
                  <strong>Alto uso ({((insights.deuda_final / insights.linea_credito) * 100).toFixed(0)}%):</strong> 
                  {' '}Paga al menos {simbolo} {(insights.deuda_final - insights.uso_30_porciento).toFixed(0)} para bajar a un uso saludable (30%)
                </span>
              </>
            ) : insights.deuda_final > insights.uso_30_porciento ? (
              <>
                <span className="tip-icon hc-tip info"><IcBulb /></span>
                <span className="tip-text">
                  <strong>Uso moderado ({((insights.deuda_final / insights.linea_credito) * 100).toFixed(0)}%):</strong>
                  {' '}Intenta mantener tu deuda bajo {simbolo} {insights.uso_30_porciento.toFixed(0)} (30%) para un score óptimo
                </span>
              </>
            ) : (
              <>
                <span className="tip-icon hc-tip good"><IcStar /></span>
                <span className="tip-text">
                  <strong>¡Excelente!</strong> Tu uso está en {((insights.deuda_final / insights.linea_credito) * 100).toFixed(0)}%. 
                  Mantén este hábito para un score crediticio saludable.
                </span>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default HistoryChart;