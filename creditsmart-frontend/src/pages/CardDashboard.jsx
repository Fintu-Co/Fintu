import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cardsApi, movementsApi } from '../services/api';
import { generarEstadoCuenta } from '../utils/generarPDF';
import './CardDashboard.css';

// Importar componentes
import MovementForm from '../components/card-dashboard/MovementForm'; 
import UsageMeter from '../components/card-dashboard/UsageMeter'; 
import CardCalendar from '../components/card-dashboard/CardCalendar';
import MonthTimeline from '../components/card-dashboard/MonthTimeline';
import CardHero from '../components/card-dashboard/CardHero';
import HistoryChart from '../components/card-dashboard/HistoryChart';
import DailyTip from '../components/card-dashboard/DailyTip'; 
import FinancialHealthButton from '../components/card-dashboard/FinancialHealthButton'; 
import FloatingMovementsButton from '../components/card-dashboard/FloatingMovementsButton';
import InterestCalculator from '../components/card-dashboard/InterestCalculator';
import QuickActions from '../components/card-dashboard/QuickActions';

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

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatosTarjeta(user.id, slotNumero);
  }, [slotNumero, user, navigate]);

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

  // Función para manejar cuando se agrega un movimiento
  const handleMovementAdded = () => {
    setRefreshMovements(prev => prev + 1);
    cargarDatosTarjeta(user.id, slotNumero);
    setShowMovementModal(false);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  /* ── QuickActions handlers ── */
  const handleVerReportes = () => {
    document.getElementById('section-historial')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const handleMisMetas = () => {
    navigate('/objetivos');
  };
  const handleConsejos = () => {
    document.getElementById('section-tips')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const handleConfiguracion = () => {
    navigate('/perfil');
  };

  const handleExportPDF = async () => {
    if (!tarjeta || pdfLoading) return;
    try {
      setPdfLoading(true);
      showToast('Generando estado de cuenta…', 'info');

      /* ── Calcular el inicio del ciclo activo ── */
      const hoy  = new Date();
      const diaI = tarjeta.dia_inicio_ciclo;
      let fechaInicio;
      if (hoy.getDate() >= diaI) {
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), diaI);
      } else {
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, diaI);
      }

      /* ── Traer solo movimientos del ciclo activo (mes/año del inicio) ── */
      const mes  = fechaInicio.getMonth() + 1;   // 1-12
      const anio = fechaInicio.getFullYear();

      const data = await movementsApi.getByCycle({ tarjetaId: tarjeta.id, mes, anio });
      const movimientos = data?.movimientos || [];
      const simbolo = tarjeta.simbolo_moneda || 'S/';
      await generarEstadoCuenta(tarjeta, movimientos, simbolo);
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
  const bancoBreve    = (tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'B')
                          .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const fmt = (n) => parseFloat(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });
  const fmtFecha = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  };

  return (
    <div className="card-dashboard-container">

      {/* Botón flotante de regreso */}
      <button className="btn-back-float" onClick={handleBack} title="Volver">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      {/* ── HEADER PREMIUM ── */}
      <header className="card-dashboard-header">
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
        </div>
      </header>

      {/* ── FRANJA KPI ── */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <span className="kpi-label">Deuda actual</span>
          <span className="kpi-value kpi-gold">{simboloMoneda} {fmt(deudaNum)}</span>
          <span className="kpi-sub">Saldo pendiente</span>
          <span className="kpi-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Disponible</span>
          <span className="kpi-value kpi-good">{simboloMoneda} {fmt(disponible)}</span>
          <span className="kpi-sub">Crédito libre</span>
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
          <span className="kpi-icon-svg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
        </div>
      </div>

      {/* ── GRID 3 COLUMNAS ── */}
      <div className="card-dashboard-grid">

        {/* ==================== COLUMNA IZQUIERDA ==================== */}
        <div className="dashboard-column">

          <CardHero tarjeta={tarjeta} simboloMoneda={simboloMoneda} />

          <FinancialHealthButton
            tarjetaId={tarjeta.id}
            simboloMoneda={simboloMoneda}
            tarjetaData={tarjeta}
          />

          <div className="card-block">
            <div className="block-header"><h3>Uso de Línea</h3></div>
            <UsageMeter
              porcentajeUso={porcentajeUso}
              deudaActual={tarjeta.deuda_actual || 0}
              lineaCredito={tarjeta.linea_credito}
              simboloMoneda={simboloMoneda}
              tarjetaId={tarjeta.id}
            />
          </div>

        </div>

        {/* ==================== COLUMNA CENTRO ==================== */}
        <div className="dashboard-column">

          <div id="section-historial" className="card-block">
            <div className="block-header"><h3>Historial</h3></div>
            <HistoryChart
              tarjetaId={tarjeta.id}
              simboloMoneda={simboloMoneda}
              deudaInicial={parseFloat(tarjeta.deuda_actual || 0)}
              lineaCredito={tarjeta.linea_credito}
            />
          </div>

          <div className="card-block">
            <div className="block-header"><h3>Timeline</h3></div>
            <MonthTimeline
              diaInicio={tarjeta.dia_inicio_ciclo}
              diaCierre={tarjeta.dia_cierre_ciclo}
              diaPago={tarjeta.dia_pago}
            />
          </div>

        </div>

        {/* ==================== COLUMNA DERECHA ==================== */}
        <div className="dashboard-column">

          <div className="card-block">
            <div className="block-header"><h3>Calendario de Ciclo</h3></div>
            <CardCalendar
              diaInicio={tarjeta.dia_inicio_ciclo}
              diaCierre={tarjeta.dia_cierre_ciclo}
              diaPago={tarjeta.dia_pago}
              fechaInicio={tarjeta.fecha_inicio}
              fechaCierre={tarjeta.fecha_cierre}
              fechaPago={tarjeta.fecha_pago}
            />
          </div>

          <div id="section-tips">
            <DailyTip />
          </div>

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
          {showCalculadora && (
            <InterestCalculator
              tarjeta={tarjeta}
              simboloMoneda={simboloMoneda}
              onClose={() => setShowCalculadora(false)}
            />
          )}

          <QuickActions
            onVerReportes={handleVerReportes}
            onMisMetas={handleMisMetas}
            onConfiguracion={handleConfiguracion}
          />

        </div>

      </div>

      {/* ==================== BOTÓN FLOTANTE DE MOVIMIENTOS ==================== */}
      <FloatingMovementsButton
        tarjetaId={tarjeta.id}
        simboloMoneda={simboloMoneda}
        refreshTrigger={refreshMovements}
        onAddMovement={() => setShowMovementModal(true)}
      />

      {/* ==================== MODAL DE NUEVO MOVIMIENTO ==================== */}
      {showMovementModal && (
        <MovementForm
          tarjetaId={tarjeta.id}
          userId={user.id}
          simboloMoneda={simboloMoneda}
          deudaActual={tarjeta.deuda_actual || 0}
          lineaCredito={tarjeta.linea_credito}
          onMovementAdded={handleMovementAdded}
          onClose={() => setShowMovementModal(false)}
        />
      )}

    </div>
  );
}

export default CardDashboard;