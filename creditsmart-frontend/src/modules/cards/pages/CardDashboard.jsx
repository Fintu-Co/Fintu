import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useToast } from '@/shared/context/ToastContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';import { movementsApi } from '@/modules/movements/services/movementsApi';
import { generarEstadoCuenta } from '@/shared/utils/generarPDF';
/* Armazón compartido — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './CardDashboard.css';

// Importar componentes
import MovementForm from '@/modules/movements/components/MovementForm';
import MiniCycleCalendar from '@/modules/cards/components/MiniCycleCalendar';
import UsageDonut from '@/modules/cards/components/UsageDonut';
import PaymentPlan from '@/modules/cards/components/PaymentPlan';
import PaymentDueAlert from '@/modules/cards/components/PaymentDueAlert';
import HistoryChart from '@/modules/movements/components/HistoryChart';
import MovementsTable from '@/modules/movements/components/MovementsTable';
import MovementsPanel from '@/modules/movements/components/MovementsPanel';
import DailyTip from '@/modules/cards/components/DailyTip';
import TeaMarketCard from '@/modules/cards/components/TeaMarketCard';
import FinancialHealthButton from '@/modules/analytics/components/FinancialHealthButton';
import FloatingMovementsButton from '@/modules/movements/components/FloatingMovementsButton';
import InterestCalculator from '@/modules/cards/components/InterestCalculator';
import CardIntroGuide from '@/modules/cards/modals/CardIntroGuide';
import Sidebar from '@/shared/components/Sidebar';
import { parseISODate } from '@/shared/utils/fecha';
import { calcularCiclo, aISO } from '@/shared/utils/ciclo';

function CardDashboard() {
  const { slotNumero } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tarjeta, setTarjeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [refreshMovements, setRefreshMovements] = useState(0);
  const [showCalculadora, setShowCalculadora] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historial, setHistorial] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatosTarjeta(user.id, slotNumero);
  }, [slotNumero, user, navigate]);

  // Guía de primera visita: se muestra una sola vez por usuario
  useEffect(() => {
    if (!user || !tarjeta) return;
    const key = `card_intro_done_${user.id}`;
    if (!localStorage.getItem(key)) {
      setShowIntro(true);
      localStorage.setItem(key, 'true');
    }
  }, [user, tarjeta]);

  const cargarDatosTarjeta = async (userId, slot) => {
    try {
      setLoading(true);

      const dataCards = await cardsApi.getUserCards(userId);

      if (dataCards.success) {
        const tarjetaEncontrada = dataCards.tarjetas.find(t => t.slot_numero === parseInt(slot));

        if (!tarjetaEncontrada) {
          showToast('Tarjeta no encontrada', 'error');
          navigate('/dashboard');
          return;
        }

        if (tarjetaEncontrada.esta_vacia) {
          showToast('Esta tarjeta está vacía. Agrégala primero.', 'warning');
          navigate('/dashboard');
          return;
        }

        setTarjeta(tarjetaEncontrada);
      }

    } catch (error) {
      console.error('Error al cargar datos:', error);
      showToast('Error al cargar la tarjeta', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  /* ── Historial para el aviso de pago por vencer ──
     Hace falta el detalle de movimientos, no `deuda_actual`: ese saldo mezcla
     el ciclo cerrado con lo que llevas gastado del que aún acumula. */
  useEffect(() => {
    if (!tarjeta?.id) return;
    let cancelado = false;

    (async () => {
      try {
        const hasta = new Date();
        const desde = new Date(hasta);
        desde.setMonth(desde.getMonth() - 12);   // igual que la retención del backend

        const data = await movementsApi.getByRange({
          tarjetaId: tarjeta.id,
          desde: aISO(desde),
          hasta: aISO(hasta),
        });
        if (!cancelado) setHistorial(data?.movimientos || []);
      } catch (err) {
        console.error('Error al cargar el historial:', err);
        if (!cancelado) setHistorial([]);
      }
    })();

    return () => { cancelado = true; };
  }, [tarjeta?.id, refreshMovements]);

  // Función para manejar cuando se agrega un movimiento
  const handleMovementAdded = () => {
    setRefreshMovements(prev => prev + 1);
    cargarDatosTarjeta(user.id, slotNumero);
    setShowMovementModal(false);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleExportPDF = async () => {
    if (!tarjeta || pdfLoading) return;
    try {
      setPdfLoading(true);
      showToast('Generando estado de cuenta…', 'info');

      /* ── Traer los movimientos del rango real del ciclo ──
         No por mes calendario: un ciclo que cruza de mes (p. ej. 25/06 al
         24/07) perdería la mayor parte de sus movimientos. */
      const { inicio, cierre } = calcularCiclo(tarjeta);

      const data = await movementsApi.getByRange({
        tarjetaId: tarjeta.id,
        desde: aISO(inicio),
        hasta: aISO(cierre),
      });
      const movimientos = data?.movimientos || [];
      const simbolo = tarjeta.simbolo_moneda || 'S/';
      await generarEstadoCuenta(tarjeta, movimientos, simbolo, { usuario: user });
      showToast('¡PDF descargado correctamente!', 'success');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      showToast('Error al generar el PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card-dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando tarjeta...</p>
      </div>
    );
  }

  if (!tarjeta) {
    return null;
  }

  // Calcular datos
  const simboloMoneda = tarjeta.simbolo_moneda || 'S/';
  const porcentajeUso = tarjeta.linea_credito > 0
    ? Math.round((tarjeta.deuda_actual / tarjeta.linea_credito) * 100)
    : 0;
  const deudaNum      = parseFloat(tarjeta.deuda_actual || 0);
  const lineaNum      = parseFloat(tarjeta.linea_credito || 0);
  const disponible    = lineaNum - deudaNum;
  const disponiblePct = lineaNum > 0 ? Math.round((disponible / lineaNum) * 100) : 0;
  const bancoBreve    = (tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'B')
                          .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const fmt = (n) => parseFloat(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const fmtFecha = (iso) => {
    if (!iso) return '—';
    const d = parseISODate(iso);
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  };

  return (
    <div className="card-shell">

      {/* Sidebar compartido (mismo del dashboard principal) */}
      <Sidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="card-dashboard-container">

      {/* Botón flotante de regreso */}
      <button className="btn-back-float" onClick={handleBack} title="Volver">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      {/* ── HEADER PREMIUM ── */}
      <header className="card-dashboard-header">
        <button className="cd-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
          </svg>
        </button>
        <div className="header-bank-logo">{bancoBreve}</div>
        <div className="header-info">
          <h1 className="card-title-header">
            {tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco'}
          </h1>
          <div className="card-subtitle-row">
            <span className="card-subtitle">
              {tarjeta.nombre_tarjeta || tarjeta.categoria_principal || 'Tarjeta de crédito'}
              &nbsp;·&nbsp;{tarjeta.moneda || 'Soles'}
            </span>
            {tarjeta.tasa_interes && (
              <span className={`badge-tea ${parseFloat(tarjeta.tasa_interes) >= 70 ? 'tea-alta' : parseFloat(tarjeta.tasa_interes) >= 40 ? 'tea-media' : 'tea-baja'}`}>
                TEA {tarjeta.tasa_interes}%
              </span>
            )}
          </div>
        </div>
        <div className="header-badge">
          <span className="badge-status active">
            <span className="badge-dot" />
            Activa
          </span>
          <span className="badge-slot">Slot {tarjeta.slot_numero}</span>

          <button
            className={`btn-export-pdf${pdfLoading ? ' pdf-loading' : ''}`}
            onClick={handleExportPDF}
            disabled={pdfLoading}
            title="Exportar estado de cuenta en PDF"
          >
            {pdfLoading ? (
              <>
                <svg className="pdf-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Generando…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <polyline points="9 15 12 18 15 15"/>
                </svg>
                Exportar PDF
              </>
            )}
          </button>
                    <button
            className="btn-help-guide"
            onClick={() => setShowIntro(true)}
            title="¿Cómo usar esta pantalla?"
            aria-label="Abrir guía de uso"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </button>
        </div>
      </header>

      {/* ── FRANJA KPI ── */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <span className="kpi-label">Deuda actual</span>
          <span className="kpi-value kpi-gold">{simboloMoneda} {fmt(deudaNum)}</span>
          <span className="kpi-sub">Saldo pendiente</span>
          <span className={`kpi-trend ${porcentajeUso >= 70 ? 'down' : porcentajeUso >= 30 ? 'warn' : 'up'}`}>
            <svg className="kpi-trend-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="8 7 17 7 17 16"/></svg>
            {porcentajeUso}%
          </span>
          <span className="kpi-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Disponible</span>
          <span className="kpi-value kpi-good">{simboloMoneda} {fmt(disponible)}</span>
          <span className="kpi-sub">Crédito libre</span>
          <span className="kpi-trend up">
            <svg className="kpi-trend-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="8 7 17 7 17 16"/></svg>
            {disponiblePct}%
          </span>
          <span className="kpi-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/><polyline points="9 12 11 14 15 10"/></svg>
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Uso de línea</span>
          <span className={`kpi-value ${porcentajeUso >= 70 ? 'kpi-danger' : porcentajeUso >= 30 ? 'kpi-warn' : 'kpi-good'}`}>
            {porcentajeUso}%
          </span>
          <span className="kpi-sub">
            {porcentajeUso < 30 ? 'Saludable' : porcentajeUso < 70 ? 'Moderado' : 'Alto riesgo'}
          </span>
          <span className="kpi-trend neutral">Meta 30%</span>
          <span className="kpi-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Próximo pago</span>
          <span className={`kpi-value ${tarjeta.dias_al_pago <= 5 ? 'kpi-danger' : ''}`}>
            {tarjeta.dias_al_pago === 0 ? '¡Hoy!' : `${tarjeta.dias_al_pago ?? '—'} días`}
          </span>
          <span className="kpi-sub">{fmtFecha(tarjeta.fecha_pago)}</span>
          <span className={`kpi-trend ${tarjeta.dias_al_pago <= 5 ? 'down' : 'up'}`}>
            <svg className="kpi-trend-arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="8 7 17 7 17 16"/></svg>
            {tarjeta.dias_al_pago <= 5 ? 'Pronto' : 'A tiempo'}
          </span>
          <span className="kpi-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
        </div>
      </div>

      {/* ── LAYOUT PRINCIPAL: gráfico grande + panel lateral ── */}
      <div className="cd-main-grid">

        {/* Gráfico grande (como "Total Revenue") */}
        <div id="section-historial" className="cd-panel">
          <div className="cd-panel-head">
            <div>
              <h3 className="cd-panel-title">Evolución de deuda</h3>
              <p className="cd-panel-sub">Seguimiento de tu deuda a lo largo del tiempo</p>
            </div>
          </div>
          <HistoryChart
            tarjetaId={tarjeta.id}
            simboloMoneda={simboloMoneda}
            deudaInicial={parseFloat(tarjeta.deuda_actual || 0)}
            lineaCredito={tarjeta.linea_credito}
          />
        </div>

        {/* Panel lateral: calendario semanal + donut de uso */}
        <div className="cd-side-col">
          <div className="cd-panel">
            <div className="cd-panel-head">
              <h3 className="cd-panel-title">Fechas del ciclo</h3>
            </div>
            <MiniCycleCalendar
              diaInicio={tarjeta.dia_inicio_ciclo}
              diaCierre={tarjeta.dia_cierre_ciclo}
              diaPago={tarjeta.dia_pago}
            />
          </div>

          <div className="cd-panel">
            <UsageDonut
              porcentajeUso={porcentajeUso}
              deudaActual={tarjeta.deuda_actual || 0}
              lineaCredito={tarjeta.linea_credito}
              simboloMoneda={simboloMoneda}
              tarjetaId={tarjeta.id}
            />
          </div>

          {/* Calculadora — llena el espacio del panel lateral */}
          <div className="calc-promo-card" onClick={() => setShowCalculadora(true)}>
            <div className="calc-promo-glow" />
            <div className="calc-promo-left">
              <div className="calc-promo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="20" height="20">
                  <rect x="4" y="2" width="16" height="20" rx="2"/>
                  <line x1="8" y1="10" x2="16" y2="10"/>
                  <line x1="8" y1="14" x2="16" y2="14"/>
                  <line x1="8" y1="18" x2="11" y2="18"/>
                </svg>
              </div>
              <div className="calc-promo-text">
                <h4>Calculadora de Intereses</h4>
                <p>¿Cuánto tiempo para liquidar tu deuda?</p>
                <div className="calc-promo-tags">
                  <span>Simulador</span>
                  <span>Comparar</span>
                  <span>Proyección</span>
                </div>
              </div>
            </div>
            <div className="calc-promo-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* ── PAGO POR VENCER (solo con el ciclo ya cerrado y deuda viva) ── */}
      <PaymentDueAlert tarjeta={tarjeta} movimientos={historial} />

      {/* ── ¿CUÁNTO PAGAR ESTE CICLO? ── */}
      <PaymentPlan
        deuda={tarjeta.deuda_actual || 0}
        linea={tarjeta.linea_credito}
        pagoMinimo={tarjeta.pago_minimo}
        tea={tarjeta.tasa_interes}
        simboloMoneda={simboloMoneda}
      />

      {/* ── TABLA DE MOVIMIENTOS (como "Course Purchases") ── */}
      <div className="cd-panel cd-panel-table">
        <div className="cd-panel-head">
          <div>
            <h3 className="cd-panel-title">Movimientos recientes</h3>
            <p className="cd-panel-sub">Tus últimos consumos y pagos registrados</p>
          </div>
          <div className="cd-panel-head-actions">
            <button className="cd-panel-link" onClick={() => setShowMovements(true)}>
              Ver todo
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button className="cd-panel-add" onClick={() => setShowMovementModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Registrar
            </button>
          </div>
        </div>
        <MovementsTable
          tarjetaId={tarjeta.id}
          userId={user.id}
          simboloMoneda={simboloMoneda}
          refreshTrigger={refreshMovements}
          onAdd={() => setShowMovementModal(true)}
        />
      </div>

      {/* ── APRENDE Y ORGANIZA (el resto, siguiendo el formato) ── */}
      <div className="cd-resto-label">Aprende y organiza</div>
      <div className="cd-resto-grid">

        <FinancialHealthButton
          tarjetaId={tarjeta.id}
          simboloMoneda={simboloMoneda}
          tarjetaData={tarjeta}
        />

        <div id="section-tips">
          <DailyTip />
        </div>

        <TeaMarketCard
          tea={tarjeta.tasa_interes}
          deuda={tarjeta.deuda_actual || 0}
          simboloMoneda={simboloMoneda}
        />

      </div>

      {showCalculadora && (
        <InterestCalculator
          tarjeta={tarjeta}
          simboloMoneda={simboloMoneda}
          onClose={() => setShowCalculadora(false)}
        />
      )}

      {/* ==================== FOOTER ==================== */}
      <footer className="cd-footer" data-fab-stop>
          <div className="cd-footer-line" />

          <div className="cd-footer-main">
            <div className="cd-footer-brand">
              <div className="cd-footer-logo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="3"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                  <line x1="5" y1="15" x2="9" y2="15"/>
                  <line x1="12" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div className="cd-footer-brand-text">
                <span className="cd-footer-name">Fintú &amp; Co.</span>
                <span className="cd-footer-tag">Tus tarjetas, bajo control.</span>
              </div>
            </div>

            <div className="cd-footer-links">
              <button onClick={() => navigate('/dashboard')}>Dashboard</button>
              <span className="cd-footer-dot" />
              <button onClick={() => navigate('/objetivos')}>Objetivos</button>
              <span className="cd-footer-dot" />
              <button onClick={() => navigate('/educacion')}>Educación</button>
              <span className="cd-footer-dot" />
              <button onClick={() => navigate('/comparador')}>Comparador</button>
            </div>
          </div>

          <div className="cd-footer-note">
            Los cálculos mostrados son referenciales y no reemplazan el estado de cuenta oficial de tu banco.
          </div>

          <div className="cd-footer-bottom">
            <span>© {new Date().getFullYear()} Fintú &amp; Co.</span>
            <span className="cd-footer-dot" />
            <span>Hecho en Perú 🇵🇪</span>
          </div>
      </footer>

      {/* ==================== BOTÓN FLOTANTE DE MOVIMIENTOS ==================== */}
      <FloatingMovementsButton onOpen={() => setShowMovements(true)} />

      {/* ==================== PANEL COMPLETO DE MOVIMIENTOS ==================== */}
      <MovementsPanel
        open={showMovements}
        onClose={() => setShowMovements(false)}
        onAddMovement={() => { setShowMovements(false); setShowMovementModal(true); }}
        tarjetaId={tarjeta.id}
        simboloMoneda={simboloMoneda}
        refreshTrigger={refreshMovements}
      />

      {/* ==================== GUÍA DE PRIMERA VISITA ==================== */}
      {showIntro && (
        <CardIntroGuide onClose={() => setShowIntro(false)} />
      )}

      {/* ==================== MODAL DE NUEVO MOVIMIENTO ==================== */}
      {showMovementModal && (
        <MovementForm
          tarjeta={tarjeta}
          tarjetaId={tarjeta.id}
          userId={user.id}
          simboloMoneda={simboloMoneda}
          deudaActual={tarjeta.deuda_actual || 0}
          lineaCredito={tarjeta.linea_credito}
          onMovementAdded={handleMovementAdded}
          onClose={() => setShowMovementModal(false)}
        />
      )}

      </div>{/* /card-dashboard-container */}
    </div>
  );
}

export default CardDashboard;