import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { useToast } from '@/shared/context/ToastContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import { movementsApi } from '@/modules/movements/services/movementsApi';
import { generarEstadoCuenta } from '@/shared/utils/generarPDF';
/* Armazón compartido — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './CardDashboard.css';

import MovementForm from '@/modules/movements/components/MovementForm';
import MiniCycleCalendar from '@/modules/cards/components/MiniCycleCalendar';
import UsageDonut from '@/modules/cards/components/UsageDonut';
import PaymentPlan from '@/modules/cards/components/PaymentPlan';
import HistoryChart from '@/modules/movements/components/HistoryChart';
import MovementsTable from '@/modules/movements/components/MovementsTable';
import MovementsPanel from '@/modules/movements/components/MovementsPanel';
import TeaMarketCard from '@/modules/cards/components/TeaMarketCard';
import FinancialHealthButton from '@/modules/analytics/components/FinancialHealthButton';
import InterestCalculator from '@/modules/cards/components/InterestCalculator';
import Sidebar from '@/shared/components/Sidebar';
import { BrandSymbol } from '@/shared/components/BrandLogo';
import { calcularCiclo, proximoPago, saldoPendiente, aISO } from '@/shared/utils/ciclo';

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_C = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fechaLarga = (d) => `${d.getDate()} de ${MESES[d.getMonth()]}`;
const fechaCorta = (d) => `${d.getDate()} ${MESES_C[d.getMonth()]}`;
const DIA = 86400000;
const soloDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/* ── Íconos ── */
const IcBack = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
const IcPlus = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IcDoc = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" /></svg>);
const IcMenu = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>);
const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>);

/* Encabezado de cada bloque: qué es + la pregunta que responde + para qué sirve */
function Section({ id, tag, title, text, actions, children }) {
  return (
    <section className="cdx-sec" id={id} aria-labelledby={`${id}-t`}>
      <div className="cdx-sec-head">
        <div>
          <span className="cdx-tag">{tag}</span>
          <h2 id={`${id}-t`}>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        {actions && <div className="cdx-sec-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

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
  const [showMovements, setShowMovements] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historial, setHistorial] = useState(null);

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

  /* ── Historial: hace falta para saber cuánto vence de verdad ──
     `deuda_actual` mezcla el ciclo cerrado con lo que llevas gastado del
     que aún acumula; el monto que vence sale de los movimientos. */
  useEffect(() => {
    if (!tarjeta?.id) return;
    let cancelado = false;
    (async () => {
      try {
        const hasta = new Date();
        const desde = new Date(hasta);
        desde.setMonth(desde.getMonth() - 12);   // igual que la retención del backend
        const data = await movementsApi.getByRange({ tarjetaId: tarjeta.id, desde: aISO(desde), hasta: aISO(hasta) });
        if (!cancelado) setHistorial(data?.movimientos || []);
      } catch (err) {
        console.error('Error al cargar el historial:', err);
        if (!cancelado) setHistorial([]);
      }
    })();
    return () => { cancelado = true; };
  }, [tarjeta?.id, refreshMovements]);

  const handleMovementAdded = () => {
    setRefreshMovements(prev => prev + 1);
    cargarDatosTarjeta(user.id, slotNumero);
    setShowMovementModal(false);
  };

  const handleExportPDF = async () => {
    if (!tarjeta || pdfLoading) return;
    try {
      setPdfLoading(true);
      showToast('Generando estado de cuenta…', 'info');
      /* Rango real del ciclo, no el mes calendario: un ciclo que cruza de
         mes perdería la mayor parte de sus movimientos. */
      const { inicio, cierre } = calcularCiclo(tarjeta);
      const data = await movementsApi.getByRange({ tarjetaId: tarjeta.id, desde: aISO(inicio), hasta: aISO(cierre) });
      await generarEstadoCuenta(tarjeta, data?.movimientos || [], tarjeta.simbolo_moneda || 'S/', { usuario: user });
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
        <p>Cargando tarjeta…</p>
      </div>
    );
  }
  if (!tarjeta) return null;

  /* ── Datos ── */
  const simbolo    = tarjeta.simbolo_moneda || 'S/';
  const deudaNum   = parseFloat(tarjeta.deuda_actual || 0);
  const lineaNum   = parseFloat(tarjeta.linea_credito || 0);
  const disponible = Math.max(0, lineaNum - deudaNum);
  const uso        = lineaNum > 0 ? Math.round((deudaNum / lineaNum) * 100) : 0;
  const usoTono    = uso >= 70 ? 'bad' : uso >= 30 ? 'warn' : 'good';
  const fmt  = (n) => parseFloat(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');
  const banco = tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco';
  const iniciales = banco.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const tea = parseFloat(tarjeta.tasa_interes || 0);

  /* ── Ciclo actual y lo que hay que pagar ── */
  const hoy = soloDia(new Date());
  const ciclo = calcularCiclo(tarjeta);
  const largoCiclo = Math.max(1, Math.round((soloDia(ciclo.cierre) - soloDia(ciclo.inicio)) / DIA) + 1);
  const diaCiclo = Math.min(largoCiclo, Math.max(1, Math.round((hoy - soloDia(ciclo.inicio)) / DIA) + 1));
  const diasAlCierre = Math.max(0, Math.round((soloDia(ciclo.cierre) - hoy) / DIA));
  const avance = Math.round((diaCiclo / largoCiclo) * 100);

  const pago = proximoPago(tarjeta);
  let hero;
  if (deudaNum <= 0) {
    hero = { tipo: 'ok' };
  } else if (pago.cerrado && historial) {
    const { saldo } = saldoPendiente(historial, pago.cicloCierre);
    if (saldo > 0) hero = { tipo: 'vence', monto: saldo, vence: pago.vence, dias: pago.dias, corte: pago.cicloCierre };
  }
  if (!hero) hero = { tipo: 'acumula', monto: deudaNum, vence: ciclo.pago };
  const urgente = hero.tipo === 'vence' && hero.dias <= 3;
  const cuandoVence = hero.tipo === 'vence'
    ? (hero.dias <= 0 ? 'Vence hoy.' : hero.dias === 1 ? 'Vence mañana.' : `Te quedan ${hero.dias} días.`)
    : '';

  return (
    <div className="card-shell">
      <Sidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="card-dashboard-container cdx">

        {/* ── ENCABEZADO ── */}
        <header className="cdx-top">
          <div className="cdx-top-nav">
            <button className="cdx-icon-btn cd-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><IcMenu /></button>
            <button className="cdx-back" onClick={() => navigate('/dashboard')}><IcBack /> Mis tarjetas</button>
          </div>
          <div className="cdx-id">
            <span className="cdx-avatar" aria-hidden="true">{iniciales}</span>
            <div>
              <h1>{banco}</h1>
              <p>
                {tarjeta.nombre_tarjeta || 'Tarjeta de crédito'} · {tarjeta.moneda || 'Soles'}
                {tea > 0 && <> · TEA {tea}%</>}
              </p>
            </div>
          </div>
          <div className="cdx-top-actions">
            <button className="cdx-btn cdx-btn--outline" onClick={handleExportPDF} disabled={pdfLoading}>
              <IcDoc /> {pdfLoading ? 'Generando…' : 'Estado de cuenta'}
            </button>
            <button className="cdx-btn cdx-btn--green" onClick={() => setShowMovementModal(true)}>
              <IcPlus /> Registrar movimiento
            </button>
          </div>
        </header>

        {/* ── RESPUESTA PRINCIPAL: cuánto y cuándo pagar ── */}
        <section className={`cdx-hero${urgente ? ' is-urgent' : ''}`} aria-label="Resumen de este ciclo">
          <div className="cdx-hero-msg">
            {hero.tipo === 'ok' && (
              <>
                <span className="cdx-hero-tag">Este ciclo</span>
                <h2>Estás al día.</h2>
                <p>No tienes deuda, así que este mes no pagas intereses.</p>
              </>
            )}
            {hero.tipo === 'vence' && (
              <>
                <span className="cdx-hero-tag">{urgente ? 'Pago urgente' : 'Tu próximo pago'}</span>
                <h2>Paga <em>{simbolo} {fmt(hero.monto)}</em> antes del {fechaLarga(hero.vence)}.</h2>
                <p>Cubre lo que gastaste hasta el corte del {fechaCorta(hero.corte)} y no pagas intereses. {cuandoVence}</p>
              </>
            )}
            {hero.tipo === 'acumula' && (
              <>
                <span className="cdx-hero-tag">Este ciclo</span>
                <h2>Llevas <em>{simbolo} {fmt(hero.monto)}</em> gastados.</h2>
                <p>Págalo completo hasta el {fechaLarga(hero.vence)} y no pagas intereses.</p>
              </>
            )}
          </div>

          <div className="cdx-cycle">
            <div className="cdx-cycle-head">
              <span>Ciclo actual</span>
              <span>Día {diaCiclo} de {largoCiclo}</span>
            </div>
            <div className="cdx-cycle-bar" role="progressbar" aria-valuemin={0} aria-valuemax={largoCiclo} aria-valuenow={diaCiclo} aria-label="Avance del ciclo">
              <div className="cdx-cycle-fill" style={{ width: `${avance}%` }} />
              <BrandSymbol />
            </div>
            <div className="cdx-cycle-dates">
              <span><b>{fechaCorta(ciclo.inicio)}</b>Inicio</span>
              <span><b>{fechaCorta(ciclo.cierre)}</b>Corte</span>
              <span><b>{fechaCorta(ciclo.pago)}</b>Pago</span>
            </div>
          </div>
        </section>

        {/* ── TRES DATOS ── */}
        <div className="cdx-stats">
          <div className="cdx-stat">
            <span className="cdx-stat-label">Disponible</span>
            <strong>{simbolo} {fmt(disponible)}</strong>
            <span className="cdx-stat-sub">de {simbolo} {fmt0(lineaNum)} de línea</span>
          </div>
          <div className="cdx-stat">
            <span className="cdx-stat-label">Uso de línea</span>
            <strong className={`is-${usoTono}`}>{uso}%</strong>
            <div className="cdx-meter" aria-hidden="true">
              <div className={`cdx-meter-fill is-${usoTono}`} style={{ width: `${Math.min(100, uso)}%` }} />
              <i className="cdx-meter-goal" />
            </div>
            <span className="cdx-stat-sub">{uso < 30 ? 'Bien: menos de 30% cuida tu score' : 'Ideal: bajar de 30% para cuidar tu score'}</span>
          </div>
          <div className="cdx-stat">
            <span className="cdx-stat-label">Próximo corte</span>
            <strong>{fechaCorta(ciclo.cierre)}</strong>
            <span className="cdx-stat-sub">{diasAlCierre === 0 ? 'Cierra hoy' : `En ${diasAlCierre} ${diasAlCierre === 1 ? 'día' : 'días'} · lo que gastes después va al siguiente`}</span>
          </div>
        </div>

        {/* ── 1. CUÁNTO PAGAR ── */}
        <section className="cdx-sec cdx-sec--plan" aria-label="Cuánto pagar este ciclo">
          <span className="cdx-tag">Pagos</span>
          {/* Mismo monto que la portada: si ya hay un pago que vence, el plan es sobre ese pago */}
          <PaymentPlan
            deuda={hero.tipo === 'vence' ? hero.monto : deudaNum}
            linea={lineaNum}
            pagoMinimo={tarjeta.pago_minimo}
            tea={tarjeta.tasa_interes}
            simboloMoneda={simbolo}
            onVerCalculadora={() => setShowCalculadora(true)}
          />
        </section>

        {/* ── 2. MOVIMIENTOS ── */}
        <Section
          id="movimientos"
          tag="Movimientos"
          title="¿En qué se fue tu dinero?"
          text="Cada consumo y pago de esta tarjeta."
          actions={
            <>
              <button className="cdx-link" onClick={() => setShowMovements(true)}>Ver todos <IcArrow /></button>
              <button className="cdx-btn cdx-btn--soft" onClick={() => setShowMovementModal(true)}><IcPlus /> Registrar</button>
            </>
          }
        >
          <div className="cdx-card cdx-card--flush">
            <MovementsTable
              tarjetaId={tarjeta.id}
              userId={user.id}
              simboloMoneda={simbolo}
              refreshTrigger={refreshMovements}
              onAdd={() => setShowMovementModal(true)}
            />
          </div>
        </Section>

        {/* ── 3. EVOLUCIÓN ── */}
        <Section
          id="evolucion"
          tag="Evolución"
          title="¿Tu deuda sube o baja?"
          text="Tu deuda y tus gastos en el tiempo, y las fechas que mueven todo."
        >
          <div className="cdx-grid-2">
            <div className="cdx-card">
              <HistoryChart
                tarjetaId={tarjeta.id}
                simboloMoneda={simbolo}
                deudaInicial={deudaNum}
                lineaCredito={tarjeta.linea_credito}
              />
            </div>
            <div className="cdx-card">
              <h3 className="cdx-card-title">Fechas clave</h3>
              <MiniCycleCalendar
                diaInicio={tarjeta.dia_inicio_ciclo}
                diaCierre={tarjeta.dia_cierre_ciclo}
                diaPago={tarjeta.dia_pago}
              />
            </div>
          </div>
        </Section>

        {/* ── 4. MEJORA ── */}
        <Section
          id="mejora"
          tag="Mejora"
          title="¿Qué puedes mejorar?"
          text="Lo que más pesa en tu score y en lo que pagas de intereses."
        >
          <div className="cdx-grid-3">
            <div className="cdx-card">
              <UsageDonut
                porcentajeUso={uso}
                deudaActual={deudaNum}
                lineaCredito={tarjeta.linea_credito}
                simboloMoneda={simbolo}
                tarjetaId={tarjeta.id}
              />
            </div>
            <FinancialHealthButton tarjetaId={tarjeta.id} simboloMoneda={simbolo} tarjetaData={tarjeta} />
            <TeaMarketCard tea={tarjeta.tasa_interes} deuda={deudaNum} simboloMoneda={simbolo} />
          </div>
        </Section>

        <p className="cdx-note">
          Cálculos referenciales con los datos que registras. No reemplazan el estado de cuenta de tu banco.
        </p>

        {showCalculadora && (
          <InterestCalculator tarjeta={tarjeta} simboloMoneda={simbolo} onClose={() => setShowCalculadora(false)} />
        )}

        <MovementsPanel
          open={showMovements}
          onClose={() => setShowMovements(false)}
          onAddMovement={() => { setShowMovements(false); setShowMovementModal(true); }}
          tarjetaId={tarjeta.id}
          simboloMoneda={simbolo}
          refreshTrigger={refreshMovements}
        />

        {showMovementModal && (
          <MovementForm
            tarjeta={tarjeta}
            tarjetaId={tarjeta.id}
            userId={user.id}
            simboloMoneda={simbolo}
            deudaActual={deudaNum}
            lineaCredito={tarjeta.linea_credito}
            onMovementAdded={handleMovementAdded}
            onClose={() => setShowMovementModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default CardDashboard;
