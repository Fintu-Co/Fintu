import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';import { authApi } from '@/modules/auth/services/authApi';
import AddCardModal from '@/modules/cards/modals/AddCardModal';
import GoalsModal from '@/modules/goals/modals/GoalsModal';
import WelcomeModal from '@/modules/cards/modals/WelcomeModal';
import Sidebar from '@/shared/components/Sidebar';
import AppFooter from '@/shared/components/AppFooter';
import { parseISODate } from '@/shared/utils/fecha';
import imgCreation from '@/assets/images/creation-cat.png';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

import './Dashboard.css';
import FinancialSummaryModal from '@/modules/cards/modals/FinancialSummaryModal';

// ── Centro de Aprendizaje: micro-conceptos que rotan a diario ─────────────────
// Cada concepto enlaza a una herramienta existente (cta):
//   'tea' → /educacion · 'regla' → /educacion?tab=regla
//   'bancos' → /comparador · 'calc' → calculadora de la 1ª tarjeta
const LEARN_CONCEPTS = [
  {
    cat: 'Conceptos básicos',
    titulo: '¿Qué es la TEA?',
    texto: 'La Tasa Efectiva Anual es el costo real de tu crédito. Se aplica cuando no pagas el total del mes y en tarjetas peruanas puede superar el 100%.',
    cta: 'tea', ctaLabel: 'Aprender sobre la TEA',
  },
  {
    cat: 'Hábitos',
    titulo: 'El pago mínimo es una trampa',
    texto: 'Pagar solo el mínimo cubre sobre todo intereses y casi no reduce tu deuda. Una deuda pequeña puede tomar años en desaparecer así.',
    cta: 'calc', ctaLabel: 'Calcular mi caso',
  },
  {
    cat: 'Score crediticio',
    titulo: 'La regla 15/30',
    texto: 'Paga antes del cierre y mantén tu uso debajo del 30% de la línea. Es la fórmula más simple para que tu score suba mes a mes.',
    cta: 'regla', ctaLabel: 'Ver la regla completa',
  },
  {
    cat: 'Fechas clave',
    titulo: 'Cierre no es lo mismo que pago',
    texto: 'El cierre define cuánto pagarás y la fecha de pago es el límite sin mora. Comprar justo después del cierre te da casi 50 días sin intereses.',
    cta: 'tea', ctaLabel: 'Entender mis fechas',
  },
  {
    cat: 'Comparación',
    titulo: 'No todas las tarjetas cobran igual',
    texto: 'Entre bancos peruanos la TEA puede ir del 25% a más del 100%. Conocer la tasa de tu tarjeta es el primer paso para pagar menos.',
    cta: 'bancos', ctaLabel: 'Comparar bancos',
  },
  {
    cat: 'Score crediticio',
    titulo: 'Tu uso ideal: debajo del 30%',
    texto: 'Usar más del 30% de tu línea reporta riesgo a las centrales. Si tu línea es S/ 1,000, intenta no deber más de S/ 300 al cierre.',
    cta: 'regla', ctaLabel: 'Cómo lograrlo',
  },
  {
    cat: 'Intereses',
    titulo: 'Pagar antes del cierre ahorra doble',
    texto: 'Reduces el saldo sobre el que se calculan intereses y bajas tu utilización reportada. Dos beneficios con un solo hábito.',
    cta: 'calc', ctaLabel: 'Probar con mi deuda',
  },
];

// Concepto que toca hoy (rota cada día, mismo para toda la sesión)
const TODAY_CONCEPT_IDX = Math.floor(Date.now() / 86400000) % LEARN_CONCEPTS.length;

// ── SVG Icons (sin emojis) ────────────────────────────────────────────────────
const IcTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
);
const IcCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IcMoney = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const IcCardPlus = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="3"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
    <line x1="12" y1="14" x2="12" y2="18"/>
    <line x1="10" y1="16" x2="14" y2="16"/>
  </svg>
);
const IcPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IcLightbulb = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14"/>
  </svg>
);
const IcCalcAction = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="10" y2="10"/><line x1="12" y1="10" x2="14" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="10" y2="14"/><line x1="12" y1="14" x2="14" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="10" y2="18"/><line x1="12" y1="18" x2="14" y2="18"/><line x1="16" y1="18" x2="16" y2="18"/>
  </svg>
);
const IcCompare = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
    <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
  </svg>
);
const IcBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
  </svg>
);
const IcTarget = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const IcArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
// ── Chart de uso por tarjeta ──────────────────────────────────────────────────
function UsageBarChart({ tarjetas }) {
  const activas = tarjetas.filter(t => !t.esta_vacia);
  if (activas.length === 0) return (
    <div className="dash-chart-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
      Agrega tarjetas para ver el análisis de uso
    </div>
  );

  const labels = activas.map(t => (t.banco_nombre || t.banco_nombre_custom || 'Banco').slice(0, 12));
  const usageData = activas.map(t => {
    const linea = parseFloat(t.linea_credito || 1);
    const deuda = parseFloat(t.deuda_actual || 0);
    return linea > 0 ? Math.round((deuda / linea) * 100) : 0;
  });
  // Si todas las deudas son 0, mostrar barra de disponible (línea completa)
  const allZero = usageData.every(v => v === 0);
  const displayData = allZero ? activas.map(() => 100) : usageData;
  const bgColors = allZero
    ? activas.map(() => 'rgba(29,154,108,0.20)')
    : usageData.map(v =>
        v >= 70 ? 'rgba(220,38,38,0.80)' :
        v >= 30 ? 'rgba(217,119,6,0.80)' :
                  'rgba(29,154,108,0.80)'
      );

  const data = {
    labels,
    datasets: [{
      label: allZero ? 'Línea disponible (%)' : 'Uso de línea (%)',
      data: displayData,
      backgroundColor: bgColors,
      borderRadius: 10,
      borderSkipped: false,
      barPercentage: 0.55,
    }],
  };

  const options = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff', titleColor: '#1a1d2e', bodyColor: '#5c6480',
        borderColor: 'rgba(30,45,100,0.10)', borderWidth: 1,
        padding: 12, cornerRadius: 10,
        callbacks: {
          label: ctx => allZero
            ? ` Sin deuda — línea libre al 100%`
            : ` ${ctx.parsed.y}% de uso`,
          afterLabel: ctx => {
            const t = activas[ctx.dataIndex];
            const s = t.simbolo_moneda || 'S/';
            const linea = parseFloat(t.linea_credito || 0);
            return allZero
              ? ` Línea: ${s} ${linea.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
              : ` Deuda: ${s} ${parseFloat(t.deuda_actual || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9aa4c0', font: { size: 12, family: "'DM Sans', sans-serif" } },
        border: { display: false },
      },
      y: {
        min: 0, max: 100,
        grid: { color: 'rgba(30,45,100,0.06)', drawTicks: false },
        ticks: {
          color: '#9aa4c0', font: { size: 11, family: "'DM Sans', sans-serif" },
          callback: v => v + '%', stepSize: 25, padding: 8,
        },
        border: { display: false },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

// ── Gradiente por banco ──
const getBankGradient = (banco) => {
  const b = (banco || '').toLowerCase();
  if (b.includes('bcp'))        return 'linear-gradient(145deg, #0d1e3d 0%, #0a1628 60%, #061020 100%)';
  if (b.includes('bbva'))       return 'linear-gradient(145deg, #0d0d3d 0%, #07072a 60%, #040420 100%)';
  if (b.includes('interbank'))  return 'linear-gradient(145deg, #0d2a0d 0%, #081a08 60%, #051005 100%)';
  if (b.includes('scotiabank')) return 'linear-gradient(145deg, #3a0d0d 0%, #280808 60%, #1a0505 100%)';
  if (b.includes('pichincha'))  return 'linear-gradient(145deg, #1a2a1a 0%, #0d1a0d 60%, #081008 100%)';
  if (b.includes('banbif'))     return 'linear-gradient(145deg, #1a0d2a 0%, #110818 60%, #0a0512 100%)';
  if (b.includes('falabella'))  return 'linear-gradient(145deg, #2a1a0d 0%, #1a0d08 60%, #120805 100%)';
  if (b.includes('ripley'))     return 'linear-gradient(145deg, #2a0d2a 0%, #1a0818 60%, #120512 100%)';
  return 'linear-gradient(145deg, #1e1812 0%, #150f0a 60%, #0e0a07 100%)';
};

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ultimaConsultaTexto, setUltimaConsultaTexto] = useState("Nunca");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tarjetas, setTarjetas] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [conceptIdx, setConceptIdx] = useState(TODAY_CONCEPT_IDX);
  const [showResumen, setShowResumen] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const generarInsight = (tarjetas) => {
    const cantidad = tarjetas.filter(t => !t.esta_vacia).length;
    if (cantidad === 0) return { titulo: "Aún no tienes tarjetas registradas", mensaje: "Agrega tu primera tarjeta para comenzar a recibir recomendaciones y llevar control de tus pagos.", tipo: "info" };
    if (cantidad === 1) return { titulo: "Buen comienzo", mensaje: "Tener una tarjeta es un buen primer paso. Procura pagar a tiempo y mantener un uso moderado.", tipo: "bueno" };
    if (cantidad <= 3) return { titulo: "Manejo en crecimiento", mensaje: "Tener varias tarjetas puede ayudarte a organizar tus gastos, pero es importante controlar fechas y saldos.", tipo: "medio" };
    return { titulo: "Mayor responsabilidad", mensaje: "Tener varias tarjetas no es negativo, pero requiere organización. Procura pagar a tiempo y evitar sobreendeudarte.", tipo: "malo" };
  };

  const insight = generarInsight(tarjetas);

  const cargarTarjetas = async (userId) => {
    try {
      setLoadingCards(true);
      const data = await cardsApi.getUserCards(userId);
      if (data.success) setTarjetas(data.tarjetas);
    } catch (error) {
      console.error('Error al cargar tarjetas:', error);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleDeleteCard = async (slotNumero) => {
    try {
      const data = await cardsApi.clearCard({ userId: user.id, slotNumero });
      if (data.success) cargarTarjetas(user.id);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleOpenModal = (slotNumero) => { setCurrentSlot(slotNumero); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setCurrentSlot(null); };

  const tarjetasActivas = tarjetas.filter(t => !t.esta_vacia);
  const totalLinea = tarjetasActivas.reduce((sum, t) => sum + (parseFloat(t.linea_credito) || 0), 0);
  const totalUsado = tarjetasActivas.reduce((sum, t) => sum + (parseFloat(t.deuda_actual) || 0), 0);
  const usoPromedio = totalLinea > 0 ? Math.round((totalUsado / totalLinea) * 100) : 0;
  const proximoPago = [...tarjetasActivas].sort((a, b) => (a.dias_al_pago ?? 999) - (b.dias_al_pago ?? 999))[0];
  const fechaHoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? 'Buenos días' : horaActual < 19 ? 'Buenas tardes' : 'Buenas noches';
  const kpiUsoColor = usoPromedio > 70 ? 'danger' : usoPromedio > 30 ? 'warning' : 'good';
  const kpiPagoColor = (proximoPago?.dias_al_pago ?? 999) <= 3 ? 'danger' : (proximoPago?.dias_al_pago ?? 999) <= 5 ? 'warning' : '';

  // Deuda por moneda (para mostrar correctamente si hay S/ y $ mezclados)
  const deudaPorMoneda = tarjetasActivas.reduce((acc, t) => {
    const s = t.simbolo_moneda || 'S/';
    acc[s] = (acc[s] || 0) + (parseFloat(t.deuda_actual) || 0);
    return acc;
  }, {});
  const monedasUsadas = Object.keys(deudaPorMoneda);
  const deudaTexto = monedasUsadas.length === 0
    ? '—'
    : monedasUsadas.map(s => `${s} ${deudaPorMoneda[s].toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`).join(' · ');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    // Mostrar bienvenida solo la primera vez
    const key = `welcome_done_${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowWelcome(true);
      localStorage.setItem(key, 'true');
    }
    cargarTarjetas(user.id);
    authApi.getSentinel(user.id)
      .then(data => {
        if (data.success && data.ultima_consulta_sentinel) {
          const dias = Math.floor((new Date() - new Date(data.ultima_consulta_sentinel)) / (1000 * 60 * 60 * 24));
          setUltimaConsultaTexto(dias === 0 ? "Hoy" : dias === 1 ? "Hace 1 día" : `Hace ${dias} días`);
        } else setUltimaConsultaTexto("Nunca");
      })
      .catch(() => setUltimaConsultaTexto("Nunca"));
  }, [user, navigate]);


  const registrarConsultaSentinel = async () => {
    if (!user?.id) return;
    try {
      await authApi.registrarSentinel({ userId: user.id });
      setUltimaConsultaTexto("Hoy");
    } catch (error) { console.error('Error:', error); }
    window.open("https://www.misentinel.com.pe/usuario/login?cross_source=misentinel", "_blank");
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const fecha = parseISODate(fechaISO);
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  };

  if (!user) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-dark">

      {/* ── WELCOME ONBOARDING MODAL ── */}
      {showWelcome && (
        <WelcomeModal
          nombre={user.nombre}
          onClose={() => setShowWelcome(false)}
          onAddCard={() => { setShowWelcome(false); handleOpenModal(1); }}
        />
      )}

      {/* SIDEBAR */}
      <Sidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout">

      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Abrir menú">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="15" y2="18"/>
            </svg>
          </button>
          <h1 className="header-title">Dashboard</h1>
        </div>
        <div className="header-right">
          <div
            className="header-avatar"
            onClick={() => navigate('/perfil')}
            role="button"
            tabIndex={0}
            title="Mi Perfil"
          >
            {user.nombre?.charAt(0).toUpperCase()}{user.apellido?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">

          {/* ── KPI ROW — welcome + stat cards ── */}
          <div className="dash-welcome">

            {/* Card de bienvenida — arte "La Creación" al lado derecho */}
            <div className="dash-welcome-info">
              <img src={imgCreation} alt="" className="dash-welcome-art" aria-hidden="true" draggable="false" />
              <div className="dash-welcome-scrim" aria-hidden="true"></div>
              <div>
                <div className="dash-welcome-eyebrow">Tu espacio financiero</div>
                <div className="dash-welcome-greeting">
                  {saludo}, <span className="dash-welcome-name">{user.nombre}</span>
                </div>
                <div className="dash-welcome-date">{fechaHoy}</div>
              </div>
              {tarjetasActivas.length === 0 && (
                <div className="dash-welcome-empty">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Agrega tu primera tarjeta
                </div>
              )}
            </div>

            {/* KPI 1 — Deuda total */}
            <div className="dash-kpi-card">
              <span className="dash-kpi-label">Deuda total</span>
              <span className="dash-kpi-value">{deudaTexto === '—' ? '—' : deudaTexto}</span>
              <button className="dash-kpi-detail" onClick={() => setShowResumen(true)}>
                Ver detalle
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
              </button>
            </div>

            {/* KPI 2 — Uso promedio */}
            <div className="dash-kpi-card">
              <span className="dash-kpi-label">Uso promedio</span>
              <span className={`dash-kpi-value ${kpiUsoColor}`}>{usoPromedio}%</span>
              <span className="dash-kpi-detail" style={{ cursor: 'default' }}>
                {usoPromedio > 70 ? 'Reducir urgente' : usoPromedio > 30 ? 'Zona de riesgo' : 'Rango ideal ✓'}
              </span>
            </div>

            {/* KPI 3 — Próximo pago */}
            <div className="dash-kpi-card">
              <span className="dash-kpi-label">Próximo pago</span>
              <span className={`dash-kpi-value ${kpiPagoColor}`}>
                {proximoPago
                  ? (proximoPago.dias_al_pago === 0 ? '¡Hoy!' : `${proximoPago.dias_al_pago} días`)
                  : '—'}
              </span>
              <span className="dash-kpi-detail" style={{ cursor: 'default' }}>
                {proximoPago?.banco_nombre || proximoPago?.banco_nombre_custom || 'Sin tarjetas'}
              </span>
            </div>

          </div>

          {/* ===== 1. MIS TARJETAS ===== */}
          <section className="cards-section">
            <div className="section-header-inline">
              <h2 className="section-title">Mis Tarjetas</h2>
              <p className="section-subtitle">Gestiona tus tarjetas de crédito (máx. 4)</p>
            </div>

            {loadingCards ? (
              <div className="loading-cards">Cargando tarjetas...</div>
            ) : (
              <div className="cards-grid">
                {tarjetas.filter(t => !t.esta_vacia).map((tarjeta) => {
                  const porcentajeUso = tarjeta.linea_credito > 0 ? Math.round((tarjeta.deuda_actual / tarjeta.linea_credito) * 100) : 0;
                  const simboloMoneda = tarjeta.simbolo_moneda || 'S/';
                  const alertaColor = porcentajeUso >= 70 ? 'danger' : porcentajeUso >= 30 ? 'warning' : 'good';

                  return (
                    <div key={tarjeta.slot_numero} className="card-module filled clickable" onClick={() => navigate(`/tarjeta/${tarjeta.slot_numero}`)}>
                      <div className="card-visual" style={{ background: getBankGradient(tarjeta.banco_nombre || tarjeta.banco_nombre_custom) }}>
                        <div className="cv-top">
                          <div className="cv-chip">
                            <svg width="32" height="26" viewBox="0 0 32 26" fill="none">
                              <rect width="32" height="26" rx="4" fill="rgba(212,165,116,0.25)"/>
                              <rect x="3" y="7" width="26" height="12" rx="2" fill="rgba(212,165,116,0.1)" stroke="rgba(212,165,116,0.35)" strokeWidth="0.8"/>
                              <line x1="16" y1="7" x2="16" y2="19" stroke="rgba(212,165,116,0.35)" strokeWidth="0.8"/>
                              <line x1="3" y1="13" x2="29" y2="13" stroke="rgba(212,165,116,0.35)" strokeWidth="0.8"/>
                            </svg>
                          </div>
                          <svg className="cv-wifi" width="20" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2">
                            <path d="M5 12.55a11 11 0 0114.08 0"/>
                            <path d="M1.42 9a16 16 0 0121.16 0"/>
                            <path d="M8.53 16.11a6 6 0 016.95 0"/>
                            <circle cx="12" cy="20" r="1.2" fill="rgba(255,255,255,0.2)" stroke="none"/>
                          </svg>
                        </div>
                        <div className="cv-number">•••• •••• •••• ••••</div>
                        <div className="cv-bottom">
                          <div className="cv-names">
                            <span className="cv-bank">{tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco'}</span>
                            <span className="cv-card-name">{tarjeta.nombre_tarjeta || tarjeta.categoria_principal || 'Mi tarjeta'}</span>
                          </div>
                          <span className="cv-badge">CRÉDITO</span>
                        </div>
                        <button className="btn-delete-card" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ slotNumero: tarjeta.slot_numero, nombre: tarjeta.nombre_tarjeta || `Slot ${tarjeta.slot_numero}` }); }} title="Eliminar tarjeta"><IcTrash /></button>
                      </div>

                      <div className="card-info">
                        <div className="card-stat"><span className="stat-label">Línea</span><span className="stat-value">{simboloMoneda} {parseFloat(tarjeta.linea_credito).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                        <div className="card-stat"><span className="stat-label">Deuda</span><span className="stat-value">{simboloMoneda} {parseFloat(tarjeta.deuda_actual || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span></div>
                      </div>
                      <div className="card-sep" />

                      <div className="usage-indicator">
                        <div className="usage-header">
                          <span className="usage-label">Uso de línea</span>
                          <span className={`usage-percentage ${alertaColor}`}>{porcentajeUso}%</span>
                        </div>
                        <div className="usage-bar">
                          <div className={`usage-fill ${alertaColor}`} style={{ width: `${Math.min(porcentajeUso, 100)}%` }}></div>
                        </div>
                      </div>

                      <div className="card-cycle">
                        <div className="cycle-item">
                          <div className="cycle-icon-svg"><IcCalendar /></div>
                          <div className="cycle-info">
                            <span className="cycle-label">Cierre</span>
                            <span className="cycle-date">{formatearFecha(tarjeta.fecha_cierre)}</span>
                            {tarjeta.dias_al_cierre !== undefined && <span className="cycle-countdown">{tarjeta.dias_al_cierre === 0 ? 'Hoy' : `${tarjeta.dias_al_cierre} días`}</span>}
                          </div>
                        </div>
                        <div className="cycle-divider"></div>
                        <div className="cycle-item important">
                          <div className="cycle-icon-svg cycle-icon-money"><IcMoney /></div>
                          <div className="cycle-info">
                            <span className="cycle-label">Pago</span>
                            <span className="cycle-date">{formatearFecha(tarjeta.fecha_pago)}</span>
                            {tarjeta.dias_al_pago !== undefined && <span className={`cycle-countdown ${tarjeta.dias_al_pago <= 5 ? 'urgent' : ''}`}>{tarjeta.dias_al_pago === 0 ? '¡Hoy!' : `${tarjeta.dias_al_pago} días`}</span>}
                          </div>
                        </div>
                      </div>

                      {porcentajeUso >= 70 && <div className="card-alert danger">⚠️ Alto uso de línea. Procura pagar pronto.</div>}
                      {tarjeta.dias_al_pago <= 5 && tarjeta.dias_al_pago > 0 && tarjeta.deuda_actual > 0 && (
                        <div className="card-alert warning">🔔 Pago próximo: {tarjeta.dias_al_pago} día{tarjeta.dias_al_pago !== 1 ? 's' : ''}</div>
                      )}
                    </div>
                  );
                })}

                {tarjetas.filter(t => t.esta_vacia).map((tarjeta) => (
                  <div key={tarjeta.slot_numero} className="card-module empty">
                    <div className="empty-card-content">
                      <div className="empty-card-icon"><IcCardPlus /></div>
                      <div className="empty-card-text">
                        <h3>Nueva tarjeta</h3>
                        <p>Slot {tarjeta.slot_numero} de 4</p>
                      </div>
                      <button className="btn-add-card-inline" onClick={() => handleOpenModal(tarjeta.slot_numero)}>
                        <IcPlus /> Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
                    {/* ── CHART — Uso de línea por tarjeta ── */}
          <div className="dash-chart-section">
            <div className="dash-chart-header">
              <div>
                <div className="dash-chart-title">Uso de línea por tarjeta</div>
                <div className="dash-chart-subtitle">
                  {tarjetasActivas.length === 0
                    ? 'Agrega tarjetas para ver el análisis'
                    : tarjetasActivas.every(t => parseFloat(t.deuda_actual || 0) === 0)
                      ? '¡Sin deuda activa! Toda tu línea está disponible'
                      : '% de crédito utilizado · meta ideal: bajo 30%'}
                </div>
              </div>
            </div>
            <div style={{ height: '200px' }}>
              <UsageBarChart tarjetas={tarjetas} />
            </div>
          </div>

          {/* ===== 2. CENTRO DE APRENDIZAJE ===== */}
          <section className="quick-actions-section">
            <div className="section-header-inline">
              <h2 className="section-title">Centro de Aprendizaje</h2>
              <p className="section-subtitle">Un concepto nuevo cada día y las herramientas para aplicarlo</p>
            </div>

            <div className="learn-grid">

              {/* Concepto del día — rota a diario, navegable */}
              {(() => {
                const c = LEARN_CONCEPTS[conceptIdx];
                const runCta = () => {
                  if (c.cta === 'tea') navigate('/educacion');
                  else if (c.cta === 'regla') navigate('/educacion?tab=regla');
                  else if (c.cta === 'bancos') navigate('/comparador');
                  else { const p = tarjetasActivas[0]; if (p) navigate(`/tarjeta/${p.slot_numero}`); }
                };
                return (
                  <div className="learn-featured">
                    <div className="learn-featured-top">
                      <span className="learn-label">Concepto del día</span>
                      <div className="learn-nav">
                        <span className="learn-count">{conceptIdx + 1} / {LEARN_CONCEPTS.length}</span>
                        <button className="learn-nav-btn" aria-label="Concepto anterior"
                          onClick={() => setConceptIdx((conceptIdx - 1 + LEARN_CONCEPTS.length) % LEARN_CONCEPTS.length)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        <button className="learn-nav-btn" aria-label="Siguiente concepto"
                          onClick={() => setConceptIdx((conceptIdx + 1) % LEARN_CONCEPTS.length)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>
                    <span className="learn-cat" key={`cat-${conceptIdx}`}>{c.cat}</span>
                    <h3 className="learn-title" key={`t-${conceptIdx}`}>{c.titulo}</h3>
                    <p className="learn-text" key={`x-${conceptIdx}`}>{c.texto}</p>
                    <button className="learn-cta" onClick={runCta}>
                      {c.ctaLabel} <IcArrow />
                    </button>
                    <div className="learn-dots" aria-hidden="true">
                      {LEARN_CONCEPTS.map((_, i) => (
                        <span key={i} className={`learn-dot${i === conceptIdx ? ' on' : ''}`} onClick={() => setConceptIdx(i)} />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Herramientas (2×2) */}
              <div className="learn-tools">
                <div className="action-card ac-calculadora" onClick={() => { const p = tarjetasActivas[0]; if (p) navigate(`/tarjeta/${p.slot_numero}`); }}>
                  <div className="ac-icon-wrap"><IcCalcAction /></div>
                  <div className="ac-content">
                    <span className="ac-tag">Herramienta</span>
                    <h4>Calcular Intereses</h4><p>¿Cuánto estás pagando de más?</p>
                  </div>
                  <span className="ac-arrow"><IcArrow /></span>
                  <div className="ac-glow"></div>
                </div>
                <div className="action-card ac-comparar" onClick={() => navigate('/comparador')}>
                  <div className="ac-icon-wrap"><IcCompare /></div>
                  <div className="ac-content">
                    <span className="ac-tag">Herramienta</span>
                    <h4>Comparar Bancos</h4><p>Encuentra la menor TEA</p>
                  </div>
                  <span className="ac-arrow"><IcArrow /></span>
                  <div className="ac-glow"></div>
                </div>
                <div className="action-card ac-tea" onClick={() => navigate('/educacion')}>
                  <div className="ac-icon-wrap"><IcBook /></div>
                  <div className="ac-content">
                    <span className="ac-tag">Guía</span>
                    <h4>Educación Financiera</h4><p>TEA, intereses y reglas de oro</p>
                  </div>
                  <span className="ac-arrow"><IcArrow /></span>
                  <div className="ac-glow"></div>
                </div>
                <div className="action-card ac-regla" onClick={() => navigate('/educacion?tab=regla')}>
                  <div className="ac-icon-wrap"><IcTarget /></div>
                  <div className="ac-content">
                    <span className="ac-tag">Guía</span>
                    <h4>Regla 15/30</h4><p>El secreto de un buen score</p>
                  </div>
                  <span className="ac-arrow"><IcArrow /></span>
                  <div className="ac-glow"></div>
                </div>
              </div>

            </div>
          </section>

          {/* ===== 3. SENTINEL ===== */}
          <section className="sentinel-section">
            <div className="sentinel-card">

              {/* Panel visual — foto dorada + scrim navy */}
              <div className="sentinel-visual">
                <div className="sentinel-visual-scrim" />
                <div className="sentinel-visual-body">
                  <div className="sentinel-shield">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                  </div>
                  <span className="sentinel-visual-label">Historial<br/>Crediticio</span>
                </div>
              </div>

              {/* Contenido */}
              <div className="sentinel-right">
                <div className="sentinel-grid">
                  <div className="sentinel-main">
                    <span className="sentinel-eyebrow">Central de riesgo · Perú</span>
                    <h3>Consulta tu historial crediticio</h3>
                    <p>Sentinel muestra tu historial crediticio global, incluyendo información reportada por bancos, financieras y otras entidades del sistema financiero.</p>
                    <button onClick={registrarConsultaSentinel} className="btn-sentinel">
                      Ver mi score en Sentinel
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </button>
                    {ultimaConsultaTexto !== "Nunca" && (
                      <div className="sentinel-warning">Recomendación: revisa tu historial al menos una vez al mes.</div>
                    )}
                  </div>
                  <div className="sentinel-meta-panel">
                    <div className="meta-block"><span className="meta-label">Última consulta</span><span className="meta-value">{ultimaConsultaTexto}</span></div>
                    <div className="meta-divider" />
                    <div className="meta-block"><span className="meta-label">Frecuencia recomendada</span><span className="meta-value good">1 vez al mes</span></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== 5. TIP DEL DÍA ===== */}
          <section className="tip-section">
            <div className={`tip-card-large ${insight.tipo}`}>
              <div className="tip-icon-large"><IcLightbulb /></div>
              <div className="tip-content-large">
                <h3>{insight.titulo}</h3>
                <p>{insight.mensaje}</p>
              </div>
            </div>
          </section>

          <AppFooter variant="light" />

        </div>
      </main>

      {/* MODALES */}
      <AddCardModal isOpen={modalOpen} onClose={handleCloseModal} userId={user?.id} slotNumero={currentSlot} onCardAdded={() => cargarTarjetas(user.id)} />

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <div className="confirm-icon">⚠️</div>
              <h3>¿Eliminar esta tarjeta?</h3>
            </div>
            <div className="confirm-modal-body">
              <p>Estás a punto de eliminar todos los datos de:<strong>{deleteConfirm.nombre}</strong></p>
              <div className="confirm-warning">Esta acción limpiará permanentemente la información de este slot.</div>
            </div>
            <div className="confirm-buttons">
              <button className="btn-cancel-confirm" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-delete-confirm" onClick={() => handleDeleteCard(deleteConfirm.slotNumero)}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showResumen        && <FinancialSummaryModal tarjetas={tarjetas} onClose={() => setShowResumen(false)} />}
      {showGoals && (
        <GoalsModal userId={user.id} tarjetas={tarjetas} onClose={() => setShowGoals(false)} />
      )}

      </div>{/* /dashboard-layout */}
    </div>
  );
}

export default Dashboard;