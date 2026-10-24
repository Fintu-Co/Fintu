import annotationPlugin from 'chartjs-plugin-annotation';
import { useEffect, useState } from 'react';

/* ── SVG icons ── */
const IcChart  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>);
import { movementsApi } from '@/modules/movements/services/movementsApi';
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

function HistoryChart({ tarjetaId, simboloMoneda, onResumen }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(14);
  const [insights, setInsights] = useState(null);
  const [puntos, setPuntos] = useState(0);

  useEffect(() => {
    cargarDatosGrafico();
  }, [tarjetaId, periodo]);

  // El resumen del periodo se muestra fuera del gráfico (columna derecha)
  useEffect(() => {
    onResumen?.(chartData ? insights : null, periodo);
  }, [insights, chartData, periodo]);

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
    // El gráfico parte de 0: un saldo a favor se dibuja en 0 (el tooltip muestra el real)
    const deudasGrafico = deudas.map(d => Math.max(0, d));

    setInsights(insightsData);
    setPuntos(datos.length);

    setChartData({
      labels,
      // Guardamos pagos para mostrarlos en el tooltip
      pagosData: pagos,
      datasets: [
        // Barras chocolate = gasto diario (mismo color que la leyenda)
        {
          type: 'bar',
          label: 'Gastos',
          data: gastos,
          backgroundColor: '#4A2F28',
          hoverBackgroundColor: '#2B1B17',
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.62,
          categoryPercentage: 0.72,
          maxBarThickness: 36,
          order: 2,
        },
        // Línea durazno = evolución de la deuda
        {
          type: 'line',
          label: 'Deuda',
          data: deudasGrafico,
          deudaReal: deudas,
          borderColor: '#E8946A',
          borderWidth: 3,
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          pointHoverRadius: 7,
          pointBackgroundColor: '#E8946A',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          order: 1,
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
        align: 'end',
        labels: {
          color: '#6B5148',
          font: { size: 12, weight: '600' },
          padding: 14,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
        }
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#2B1B17',
        bodyColor: '#6B5148',
        borderColor: 'rgba(74, 47, 40,0.10)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 13, weight: 'bold' },
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            if (context.dataset.label === 'Deuda') {
              const real = context.dataset.deudaReal?.[context.dataIndex] ?? value;
              if (real < 0) {
                return `Saldo a favor: ${simboloMoneda} ${Math.abs(real).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
              }
              return `Deuda: ${simboloMoneda} ${real.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
            }
            if (value > 0) {
              return `Gastos: ${simboloMoneda} ${value.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
            }
            return null;
          },
          afterBody: function(items) {
            const i = items[0].dataIndex;
            const data = items[0].chart.data;
            const p = data.pagosData?.[i] || 0;
            if (p > 0) return [`Pagos: ${simboloMoneda} ${p.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`];
            return [];
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#8A746A',
          font: { size: 11, weight: '600' },
          maxRotation: 0,
          autoSkip: true
        }
      },
      y: {
        beginAtZero: true,
        min: 0,
        grid: { color: 'rgba(74, 47, 40,0.06)' },
        border: { display: false },
        ticks: {
          color: '#8A746A',
          font: { size: 11, weight: '600' },
          padding: 8,
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

  // Líneas de referencia: límite de la tarjeta y 30% ideal
  if (insights && chartData) {
    // Etiqueta pegada a la línea: arriba (yAdjust < 0) o abajo (yAdjust > 0)
    const etiqueta = (content, color, yAdjust) => ({
      display: true,
      content,
      position: 'start',
      xAdjust: 6,
      yAdjust,
      backgroundColor: 'transparent',
      color,
      padding: 0,
      font: { family: "'DM Sans', system-ui, sans-serif", size: 10.5, weight: '700' },
    });
    options.plugins.annotation = {
      annotations: {
        linea30: {
          type: 'line',
          yMin: insights.uso_30_porciento,
          yMax: insights.uso_30_porciento,
          borderColor: 'rgba(47, 74, 62, 0.45)',
          borderWidth: 1.5,
          borderDash: [4, 4],
          label: etiqueta(`30% ideal · ${simboloMoneda} ${Math.round(insights.uso_30_porciento)}`, '#2F4A3E', -9),
        },
        limite: {
          type: 'line',
          yMin: insights.linea_credito,
          yMax: insights.linea_credito,
          borderColor: 'rgba(194, 70, 42, 0.45)',
          borderWidth: 1.5,
          borderDash: [8, 5],
          label: etiqueta(`Límite · ${simboloMoneda} ${Math.round(insights.linea_credito)}`, '#C2462A', 9),
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

  return (
    <div className="history-chart">

      {/* Controles */}
      <div className="chart-controls">
        <div className="period-seg" role="group" aria-label="Periodo">
          {[[7, 'Última semana'], [14, '2 semanas'], [30, 'Último mes']].map(([dias, texto]) => (
            <button
              key={dias}
              className={`period-seg-btn ${periodo === dias ? 'active' : ''}`}
              aria-pressed={periodo === dias}
              onClick={() => setPeriodo(dias)}
            >
              {texto}
            </button>
          ))}
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

      {chartData && puntos < 3 && (
        <p className="chart-hint">
          Recién empiezas: con más movimientos verás mejor tu tendencia.
        </p>
      )}

    </div>
  );
}

export default HistoryChart;
