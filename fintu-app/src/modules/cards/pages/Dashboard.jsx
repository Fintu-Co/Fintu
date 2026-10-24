import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import { authApi } from '@/modules/auth/services/authApi';
import { movementsApi } from '@/modules/movements/services/movementsApi';
import AddCardModal from '@/modules/cards/modals/AddCardModal';
import FinancialSummaryModal from '@/modules/cards/modals/FinancialSummaryModal';
import Sidebar from '@/shared/components/Sidebar';
import InstallApp from '@/shared/components/InstallApp';
import { pagoVigente, aISO } from '@/shared/utils/ciclo';

/* Armazón compartido (header, layout, modal de confirmación) + estilos propios */
import './Dashboard.css';
import './DashboardHome.css';

// ── Concepto del día: rota a diario; cada uno lleva a una herramienta ─────────
//   'tea' → /educacion · 'regla' → /educacion?tab=regla · 'bancos' → /comparador
const LEARN_CONCEPTS = [
  { cat: 'Conceptos básicos', titulo: '¿Qué es la TEA?',
    texto: 'Es el costo real de tu crédito. Se aplica cuando no pagas el total del mes y en tarjetas peruanas puede superar el 100%.',
    cta: 'tea', ctaLabel: 'Aprender sobre la TEA' },
  { cat: 'Hábitos', titulo: 'El pago mínimo es una trampa',
    texto: 'Cubre sobre todo intereses y casi no baja tu deuda. Una deuda pequeña puede tardar años en desaparecer así.',
    cta: 'tea', ctaLabel: 'Ver por qué' },
  { cat: 'Score crediticio', titulo: 'La regla 15/30',
    texto: 'Paga antes del cierre y mantén tu uso debajo del 30% de la línea. Es la forma más simple de que tu score suba.',
    cta: 'regla', ctaLabel: 'Ver la regla' },
  { cat: 'Fechas clave', titulo: 'Cierre no es lo mismo que pago',
    texto: 'El cierre define cuánto pagarás; la fecha de pago es el límite sin mora. Comprar justo después del cierre te da casi 50 días sin intereses.',
    cta: 'tea', ctaLabel: 'Entender mis fechas' },
  { cat: 'Comparación', titulo: 'No todas las tarjetas cobran igual',
    texto: 'Entre bancos peruanos la TEA va de ~25% a más de 100%. Conocer la tuya es el primer paso para pagar menos.',
    cta: 'bancos', ctaLabel: 'Comparar bancos' },
  { cat: 'Experiencias', titulo: '¿Quieres más línea o dejar la garantía?',
    texto: 'Dos usuarios cuentan qué les funcionó: historial limpio, ingresos comprobables y dejar que los bancos compitan por ti.',
    cta: 'experiencias', ctaLabel: 'Leer sus experiencias' },
  { cat: 'Intereses', titulo: 'Pagar antes del cierre ahorra doble',
    texto: 'Bajas el saldo sobre el que se calculan intereses y también el uso que se reporta a las centrales.',
    cta: 'regla', ctaLabel: 'Cómo hacerlo' },
];
const TODAY_CONCEPT_IDX = Math.floor(Date.now() / 86400000) % LEARN_CONCEPTS.length;

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MESES_C = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fechaLarga = (d) => `${d.getDate()} de ${MESES[d.getMonth()]}`;
const fechaCorta = (d) => `${d.getDate()} ${MESES_C[d.getMonth()]}`;
const fmt = (n) => parseFloat(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = (n) => Math.round(parseFloat(n || 0)).toLocaleString('es-PE');
const nombreBanco = (t) => t.banco_nombre || t.banco_nombre_custom || 'Banco';
const diasTexto = (d) => (d <= 0 ? 'Hoy' : d === 1 ? 'Mañana' : `${d} días`);

/* Colores de cada banco en la cabecera de su tarjeta (reconocibles a simple vista) */
const getBankGradient = (banco) => {
  const b = (banco || '').toLowerCase();
  if (b.includes('bcp'))        return 'linear-gradient(145deg, #0d1e3d 0%, #061020 100%)';
  if (b.includes('bbva'))       return 'linear-gradient(145deg, #0d0d3d 0%, #040420 100%)';
  if (b.includes('interbank'))  return 'linear-gradient(145deg, #0d2a0d 0%, #051005 100%)';
  if (b.includes('scotiabank')) return 'linear-gradient(145deg, #3a0d0d 0%, #1a0505 100%)';
  if (b.includes('pichincha'))  return 'linear-gradient(145deg, #1a2a1a 0%, #081008 100%)';
  if (b.includes('banbif'))     return 'linear-gradient(145deg, #1a0d2a 0%, #0a0512 100%)';
  if (b.includes('falabella'))  return 'linear-gradient(145deg, #2a1a0d 0%, #120805 100%)';
  if (b.includes('ripley'))     return 'linear-gradient(145deg, #2a0d2a 0%, #120512 100%)';
  return 'linear-gradient(145deg, #4A2F28 0%, #2B1B17 100%)';
};

/* ── Íconos ── */
const IcPlus  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const IcChev  = ({ left }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points={left ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} /></svg>);
const IcTrash = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>);
const IcMenu  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>);
const IcShield = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>);
const IcCompare = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /></svg>);
const IcBook = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>);
const IcTarget = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tarjetas, setTarjetas] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [historiales, setHistoriales] = useState({});   // tarjetaId → movimientos
  const [modalOpen, setModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [conceptIdx, setConceptIdx] = useState(TODAY_CONCEPT_IDX);
  const [showResumen, setShowResumen] = useState(false);
  const [ultimaConsulta, setUltimaConsulta] = useState('Nunca');

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

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarTarjetas(user.id);
    authApi.getSentinel(user.id)
      .then(data => {
        if (data.success && data.ultima_consulta_sentinel) {
          const dias = Math.floor((new Date() - new Date(data.ultima_consulta_sentinel)) / 86400000);
          setUltimaConsulta(dias === 0 ? 'Hoy' : dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`);
        }
      })
      .catch(() => {});
  }, [user, navigate]);

  /* Movimientos de cada tarjeta: sin ellos no se sabe cuánto vence de verdad
     (deuda_actual mezcla el ciclo cerrado con el que aún acumula). */
  const activasIds = tarjetas.filter(t => !t.esta_vacia).map(t => t.id).join(',');
  useEffect(() => {
    if (!activasIds) return;
    let cancelado = false;
    const hasta = new Date();
    const desde = new Date(hasta);
    desde.setMonth(desde.getMonth() - 12);
    Promise.all(activasIds.split(',').map(id =>
      movementsApi.getByRange({ tarjetaId: id, desde: aISO(desde), hasta: aISO(hasta) })
        .then(d => [id, d?.movimientos || []])
        .catch(() => [id, []])
    )).then(pares => { if (!cancelado) setHistoriales(Object.fromEntries(pares)); });
    return () => { cancelado = true; };
  }, [activasIds]);

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

  const abrirAgregar = (slot) => { setCurrentSlot(slot); setModalOpen(true); };

  const abrirSentinel = async () => {
    try {
      await authApi.registrarSentinel({ userId: user.id });
      setUltimaConsulta('Hoy');
    } catch (error) { console.error('Error:', error); }
    window.open('https://www.misentinel.com.pe/usuario/login?cross_source=misentinel', '_blank', 'noopener');
  };

  if (!user) return <div className="loading-screen"><div className="spinner"></div></div>;

  /* ── Datos ── */
  const activas = tarjetas.filter(t => !t.esta_vacia);
  const vacias = tarjetas.filter(t => t.esta_vacia);

  const porMoneda = (campo) => activas.reduce((acc, t) => {
    const s = t.simbolo_moneda || 'S/';
    acc[s] = (acc[s] || 0) + (parseFloat(t[campo]) || 0);
    return acc;
  }, {});
  const deudas = porMoneda('deuda_actual');
  const lineas = porMoneda('linea_credito');
  const monedas = Object.keys(lineas);
  const texto = (mapa) => monedas.map(s => `${s} ${fmt0(mapa[s] || 0)}`).join(' · ');
  const disponibles = Object.fromEntries(monedas.map(s => [s, Math.max(0, (lineas[s] || 0) - (deudas[s] || 0))]));

  const totalLinea = activas.reduce((s, t) => s + (parseFloat(t.linea_credito) || 0), 0);
  const totalDeuda = activas.reduce((s, t) => s + (parseFloat(t.deuda_actual) || 0), 0);
  const uso = totalLinea > 0 ? Math.round((totalDeuda / totalLinea) * 100) : 0;
  const usoTono = uso >= 70 ? 'bad' : uso >= 30 ? 'warn' : 'good';

  /* Pagos de cada tarjeta, el más cercano primero */
  const pagos = activas
    .map(t => ({ t, p: pagoVigente(t, historiales[t.id] ?? null) }))
    .sort((a, b) => {
      if (a.p.tipo === 'ok') return 1;
      if (b.p.tipo === 'ok') return -1;
      return a.p.vence - b.p.vence;
    });
  const primero = pagos.find(x => x.p.tipo !== 'ok');
  const urgente = primero?.p.tipo === 'vence' && primero.p.dias <= 3;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  const c = LEARN_CONCEPTS[conceptIdx];
  const irConcepto = () => {
    if (c.cta === 'bancos') navigate('/comparador');
    else if (c.cta === 'regla') navigate('/educacion?tab=regla');
    else if (c.cta === 'experiencias') navigate('/educacion?tab=experiencias');
    else navigate('/educacion');
  };

  return (
    <div className="dashboard-dark">
      <Sidebar active="dashboard" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout">
        <main className="dh">

          {/* ── SALUDO ── */}
          <header className="dh-top">
            <button className="dh-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><IcMenu /></button>
            <div className="dh-hello">
              <h1>{saludo}, {user.nombre}</h1>
              <p>{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <button className="dh-avatar" onClick={() => navigate('/perfil')} aria-label="Mi perfil">
              {user.nombre?.charAt(0).toUpperCase()}{user.apellido?.charAt(0).toUpperCase()}
            </button>
          </header>

          {/* ── RESPUESTA PRINCIPAL: qué pagar primero ── */}
          <section className={`dh-hero${urgente ? ' is-urgent' : ''}`} aria-label="Tu próximo pago">
            <div className="dh-hero-msg">
              {loadingCards ? (
                <h2>Cargando tus tarjetas…</h2>
              ) : activas.length === 0 ? (
                <>
                  <span className="dh-hero-tag">Empieza aquí</span>
                  <h2>Agrega tu primera tarjeta.</h2>
                  <p>Con el banco, la línea y tus fechas, Fintú te dice cuánto y cuándo pagar.</p>
                  <button className="dh-btn dh-btn--peach" onClick={() => abrirAgregar(vacias[0]?.slot_numero || 1)}>
                    <IcPlus /> Agregar tarjeta
                  </button>
                </>
              ) : !primero ? (
                <>
                  <span className="dh-hero-tag">Este mes</span>
                  <h2>Estás al día.</h2>
                  <p>Ninguna tarjeta tiene deuda, así que no pagas intereses.</p>
                </>
              ) : primero.p.tipo === 'vence' ? (
                <>
                  <span className="dh-hero-tag">{urgente ? 'Pago urgente' : 'Tu próximo pago'}</span>
                  <h2>Paga <em>{primero.t.simbolo_moneda || 'S/'} {fmt(primero.p.monto)}</em> de tu {nombreBanco(primero.t)} antes del {fechaLarga(primero.p.vence)}.</h2>
                  <p>Así no pagas intereses. {primero.p.dias <= 0 ? 'Vence hoy.' : primero.p.dias === 1 ? 'Vence mañana.' : `Te quedan ${primero.p.dias} días.`}</p>
                  <button className="dh-btn dh-btn--peach" onClick={() => navigate(`/tarjeta/${primero.t.slot_numero}`)}>
                    Ver tarjeta <IcArrow />
                  </button>
                </>
              ) : (
                <>
                  <span className="dh-hero-tag">Este ciclo</span>
                  <h2>Llevas <em>{primero.t.simbolo_moneda || 'S/'} {fmt(primero.p.monto)}</em> en tu {nombreBanco(primero.t)}.</h2>
                  <p>Págalo completo hasta el {fechaLarga(primero.p.vence)} y no pagas intereses.</p>
                  <button className="dh-btn dh-btn--peach" onClick={() => navigate(`/tarjeta/${primero.t.slot_numero}`)}>
                    Ver tarjeta <IcArrow />
                  </button>
                </>
              )}
            </div>

            {pagos.length > 0 && (
              <div className="dh-agenda">
                <span className="dh-agenda-title">Próximos pagos</span>
                <ul>
                  {pagos.map(({ t, p }) => (
                    <li key={t.id}>
                      <button onClick={() => navigate(`/tarjeta/${t.slot_numero}`)}>
                        <span className="dh-agenda-bank">
                          <b>{nombreBanco(t)}</b>
                          <small>{p.tipo === 'ok' ? 'Sin deuda' : p.tipo === 'vence' ? `Vence el ${fechaCorta(p.vence)}` : `En curso · pagas el ${fechaCorta(p.vence)}`}</small>
                        </span>
                        <span className="dh-agenda-amt">
                          {p.tipo === 'ok' ? '—' : `${t.simbolo_moneda || 'S/'} ${fmt(p.monto)}`}
                          {p.tipo === 'vence' && <i className={p.dias <= 3 ? 'is-urgent' : ''}>{diasTexto(p.dias)}</i>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ── TRES DATOS ── */}
          {activas.length > 0 && (
            <div className="dh-stats">
              <div className="dh-stat">
                <span className="dh-stat-label">Deuda total</span>
                <strong>{texto(deudas)}</strong>
                <button className="dh-link" onClick={() => setShowResumen(true)}>Ver resumen <IcChev /></button>
              </div>
              <div className="dh-stat">
                <span className="dh-stat-label">Uso de tus líneas</span>
                <strong className={`is-${usoTono}`}>{uso}%</strong>
                <div className="dh-meter" aria-hidden="true">
                  <div className={`dh-meter-fill is-${usoTono}`} style={{ width: `${Math.min(100, uso)}%` }} />
                  <i />
                </div>
                <span className="dh-stat-sub">{uso < 30 ? 'Bien: menos de 30% cuida tu score' : 'Ideal: bajar de 30% para cuidar tu score'}</span>
              </div>
              <div className="dh-stat">
                <span className="dh-stat-label">Disponible</span>
                <strong>{texto(disponibles)}</strong>
                <span className="dh-stat-sub">de {texto(lineas)} en total</span>
              </div>
            </div>
          )}

          <InstallApp />

          {/* ── TARJETAS ── */}
          <section className="dh-sec" aria-labelledby="dh-cards-t">
            <div className="dh-sec-head">
              <div>
                <span className="dh-tag">Tarjetas</span>
                <h2 id="dh-cards-t">¿Cómo va cada tarjeta?</h2>
                <p>Toca una para ver cuánto pagar, tus movimientos y qué mejorar.</p>
              </div>
            </div>

            <div className="dh-cards">
              {activas.map((t) => {
                const s = t.simbolo_moneda || 'S/';
                const u = t.linea_credito > 0 ? Math.round((t.deuda_actual / t.linea_credito) * 100) : 0;
                const tono = u >= 70 ? 'bad' : u >= 30 ? 'warn' : 'good';
                const p = pagos.find(x => x.t.id === t.id)?.p;
                return (
                  <article key={t.id} className="dh-card">
                    <button className="dh-card-open" onClick={() => navigate(`/tarjeta/${t.slot_numero}`)} aria-label={`Ver ${nombreBanco(t)}`} />
                    <div className="dh-card-top" style={{ background: getBankGradient(nombreBanco(t)) }}>
                      <span className="dh-card-bank">{nombreBanco(t)}</span>
                      <span className="dh-card-name">{t.nombre_tarjeta || 'Tarjeta de crédito'}</span>
                    </div>
                    <div className="dh-card-body">
                      <div className="dh-card-row">
                        <span>Deuda</span>
                        <strong>{s} {fmt(t.deuda_actual)}</strong>
                      </div>
                      <div className="dh-card-use">
                        <div className="dh-meter dh-meter--sm" aria-hidden="true">
                          <div className={`dh-meter-fill is-${tono}`} style={{ width: `${Math.min(100, u)}%` }} />
                          <i />
                        </div>
                        <span className={`is-${tono}`}>{u}% de {s} {fmt0(t.linea_credito)}</span>
                      </div>
                      <div className="dh-card-foot">
                        <span>{p && p.tipo !== 'ok' ? `Pagas el ${fechaCorta(p.vence)}` : 'Sin deuda'}</span>
                        {p?.tipo === 'vence' && <i className={p.dias <= 3 ? 'is-urgent' : ''}>{diasTexto(p.dias)}</i>}
                      </div>
                    </div>
                    <button
                      className="dh-card-del"
                      onClick={() => setDeleteConfirm({ slotNumero: t.slot_numero, nombre: nombreBanco(t) })}
                      aria-label={`Eliminar ${nombreBanco(t)}`}
                    >
                      <IcTrash />
                    </button>
                  </article>
                );
              })}

              {!loadingCards && vacias.length > 0 && (
                <button className="dh-card dh-card--add" onClick={() => abrirAgregar(vacias[0].slot_numero)}>
                  <span className="dh-add-ico"><IcPlus /></span>
                  <b>Agregar tarjeta</b>
                  <small>{vacias.length === 4 ? 'Puedes tener hasta 4' : `Te ${vacias.length === 1 ? 'queda 1 espacio' : `quedan ${vacias.length} espacios`}`}</small>
                </button>
              )}
            </div>
          </section>

          {/* ── APRENDE Y MEJORA ── */}
          <section className="dh-sec" aria-labelledby="dh-learn-t">
            <div className="dh-sec-head">
              <div>
                <span className="dh-tag">Mejora</span>
                <h2 id="dh-learn-t">¿Qué puedes hacer hoy?</h2>
                <p>Una idea al día y las herramientas para aplicarla.</p>
              </div>
            </div>

            <div className="dh-learn">
              <article className="dh-concept">
                <div className="dh-concept-top">
                  <span className="dh-concept-cat">Idea del día · {c.cat}</span>
                  <div className="dh-concept-nav">
                    <button aria-label="Idea anterior" onClick={() => setConceptIdx((conceptIdx - 1 + LEARN_CONCEPTS.length) % LEARN_CONCEPTS.length)}><IcChev left /></button>
                    <button aria-label="Siguiente idea" onClick={() => setConceptIdx((conceptIdx + 1) % LEARN_CONCEPTS.length)}><IcChev /></button>
                  </div>
                </div>
                <h3>{c.titulo}</h3>
                <p>{c.texto}</p>
                <button className="dh-btn dh-btn--peach" onClick={irConcepto}>{c.ctaLabel} <IcArrow /></button>
              </article>

              <article className="dh-panel">
                <span className="dh-panel-ico"><IcShield /></span>
                <h3>Revisa tu historial crediticio</h3>
                <p>Mira lo que los bancos ven de ti en Sentinel. Lo ideal: una vez al mes.</p>
                <span className="dh-panel-meta">Última consulta: <b>{ultimaConsulta}</b></span>
                <button className="dh-btn dh-btn--outline" onClick={abrirSentinel}>Abrir Sentinel <IcArrow /></button>
              </article>

              <nav className="dh-panel dh-tools" aria-label="Herramientas">
                <h3>Herramientas</h3>
                <button onClick={() => navigate('/comparador')}>
                  <span className="dh-tool-ico"><IcCompare /></span>
                  <span><b>Comparar bancos</b><small>Encuentra una TEA más baja</small></span>
                  <IcChev />
                </button>
                <button onClick={() => navigate('/educacion')}>
                  <span className="dh-tool-ico"><IcBook /></span>
                  <span><b>Educación financiera</b><small>TEA, intereses y reglas clave</small></span>
                  <IcChev />
                </button>
                <button onClick={() => navigate('/objetivos')}>
                  <span className="dh-tool-ico"><IcTarget /></span>
                  <span><b>Mis objetivos</b><small>Metas para bajar tu deuda</small></span>
                  <IcChev />
                </button>
              </nav>
            </div>
          </section>

          <p className="dh-note">Cálculos referenciales con los datos que registras. No reemplazan el estado de cuenta de tu banco.</p>
        </main>
      </div>

      {/* ── MODALES ── */}
      <AddCardModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setCurrentSlot(null); }} userId={user.id} slotNumero={currentSlot} onCardAdded={() => cargarTarjetas(user.id)} />

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Eliminar tarjeta">
            <div className="confirm-modal-header">
              <h3>¿Eliminar {deleteConfirm.nombre}?</h3>
            </div>
            <div className="confirm-modal-body">
              <div className="confirm-warning">Se borran sus datos y movimientos. No se puede deshacer.</div>
            </div>
            <div className="confirm-buttons">
              <button className="btn-cancel-confirm" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-delete-confirm" onClick={() => handleDeleteCard(deleteConfirm.slotNumero)}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showResumen && <FinancialSummaryModal tarjetas={tarjetas} onClose={() => setShowResumen(false)} />}
    </div>
  );
}

export default Dashboard;
