import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cardsApi, goalsApi } from '../services/api';
import './Goals.css';

const GOAL_TYPES = [
  {
    tipo: 'reducir_uso',
    titulo: 'Reducir uso de línea',
    descripcion: 'Baja el % de uso de una tarjeta específica',
    color: 'cyan',
    necesitaMeta: true,
    metaLabel: '¿A qué % quieres llegar?',
    metaPlaceholder: '30',
    metaSufijo: '%',
    necesitaFecha: true,
    necesitaTarjeta: true,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>),
  },
  {
    tipo: 'reducir_deuda',
    titulo: 'Reducir mi deuda',
    descripcion: 'Lleva la deuda de una tarjeta a un monto objetivo',
    color: 'gold',
    necesitaMeta: true,
    metaLabel: '¿A cuánto quieres reducir la deuda?',
    metaPlaceholder: '500',
    metaSufijo: 'S/',
    necesitaFecha: true,
    necesitaTarjeta: true,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>),
  },
  {
    tipo: 'pago_total',
    titulo: 'Pagar el total de una tarjeta',
    descripcion: 'Liquida toda la deuda de una tarjeta este mes',
    color: 'green',
    necesitaMeta: false,
    necesitaFecha: false,
    necesitaTarjeta: true,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>),
  },
  {
    tipo: 'no_atrasar',
    titulo: 'No atrasar pagos',
    descripcion: 'Mantén todos tus pagos al día por 3 meses',
    color: 'purple',
    necesitaMeta: false,
    necesitaFecha: false,
    necesitaTarjeta: true,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
  },
  {
    tipo: 'mantener_uso',
    titulo: 'Mantener uso bajo 30%',
    descripcion: 'Mantén una tarjeta bajo el 30% por un período',
    color: 'orange',
    necesitaMeta: false,
    necesitaFecha: true,
    necesitaTarjeta: true,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  },
];

const generarPlanExperto = (tarjetas) => {
  const activas = tarjetas.filter(t => !t.esta_vacia);
  if (activas.length === 0) return null;
  const recomendaciones = [];
  const alertas = [];
  const ordenadas = [...activas].sort((a, b) => parseFloat(b.tasa_interes || 0) - parseFloat(a.tasa_interes || 0));
  const totalDeuda = activas.reduce((s, t) => s + parseFloat(t.deuda_actual || 0), 0);
  const totalLinea = activas.reduce((s, t) => s + parseFloat(t.linea_credito || 0), 0);
  const usoPromedio = totalLinea > 0 ? Math.round((totalDeuda / totalLinea) * 100) : 0;

  ordenadas.forEach(tarjeta => {
    const deuda = parseFloat(tarjeta.deuda_actual || 0);
    const linea = parseFloat(tarjeta.linea_credito || 1);
    const tea = parseFloat(tarjeta.tasa_interes || 85);
    const tasaMensual = Math.pow(1 + tea / 100, 1 / 12) - 1;
    const interesMensual = deuda * tasaMensual;
    const uso = Math.round((deuda / linea) * 100);
    const nombre = tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco';
    const simbolo = tarjeta.simbolo_moneda || 'S/';
    if (uso >= 70) alertas.push({ tipo: 'danger', mensaje: `${nombre}: uso al ${uso}%. Afecta negativamente tu historial.`, accion: `Paga ${simbolo} ${Math.ceil(deuda - linea * 0.3).toLocaleString('es-PE')} para bajar al 30%.` });
    else if (uso >= 50) alertas.push({ tipo: 'warning', mensaje: `${nombre}: uso al ${uso}%. Zona de riesgo.`, accion: `Paga ${simbolo} ${Math.ceil(deuda - linea * 0.3).toLocaleString('es-PE')} para alcanzar el rango ideal.` });
    if (interesMensual > 10) {
      recomendaciones.push({
        prioridad: tea >= 80 ? 'alta' : 'media', tarjeta: nombre, simbolo, tea,
        interesMensual: interesMensual.toFixed(2), deuda: deuda.toFixed(2),
        pagoSugerido: Math.ceil(interesMensual + deuda * 0.1),
        mesesSinExtra: deuda > 0 ? Math.ceil(deuda / (interesMensual + deuda * 0.05)) : 0,
        mesesConExtra: deuda > 0 ? Math.ceil(deuda / (interesMensual + deuda * 0.15)) : 0,
        ahorroPagandoMas: ((interesMensual * Math.ceil(deuda / (interesMensual + deuda * 0.05))) - (interesMensual * Math.ceil(deuda / (interesMensual + deuda * 0.15)))).toFixed(2),
      });
    }
    if (tarjeta.dias_al_pago !== undefined && tarjeta.dias_al_pago <= 5 && deuda > 0)
      alertas.push({ tipo: 'urgente', mensaje: `${nombre}: pago vence en ${tarjeta.dias_al_pago === 0 ? 'HOY' : `${tarjeta.dias_al_pago} días`}.`, accion: `Paga al menos ${simbolo} ${Math.ceil(interesMensual + deuda * 0.05).toLocaleString('es-PE')} para evitar mora.` });
  });

  const estrategia = [];
  if (totalDeuda === 0) { estrategia.push({ icono: 'Sin deuda', texto: '¡Sin deuda! Eres un usuario totalero. Sigue así.' }); }
  else {
    if (ordenadas.length > 1) estrategia.push({ icono: 'Prioridad', texto: `Prioriza pagar ${ordenadas[0].banco_nombre || 'tu tarjeta más cara'} primero — TEA más alta (${ordenadas[0].tasa_interes}%).` });
    if (usoPromedio > 30) estrategia.push({ icono: 'Meta 30%', texto: `Necesitas pagar S/ ${Math.ceil(totalDeuda - totalLinea * 0.3).toLocaleString('es-PE')} en total para llegar al 30% de uso ideal.` });
    estrategia.push({ icono: 'Consejo', texto: 'Paga antes del cierre de ciclo, no del vencimiento. Así reduces el saldo reportado a centrales de riesgo.' });
    if (activas.length > 1) estrategia.push({ icono: 'Balance', texto: 'Mantén cada tarjeta bajo 30% individualmente, no solo el promedio total.' });
  }
  return { recomendaciones, alertas, estrategia, totalDeuda, usoPromedio };
};

function Goals() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // ==========================================
  // ESTADO
  // ==========================================
  const [tarjetas, setTarjetas] = useState([]);
  const [goals, setGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMode, setActiveMode] = useState('basico');
  const [plan, setPlan] = useState(null);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedTarjeta, setSelectedTarjeta] = useState(null);
  const [metaValor, setMetaValor] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const autoCompletandoRef = useRef(false);

  // Variables derivadas
  const tarjetasActivas = tarjetas.filter(t => !t.esta_vacia);
  const tarjetaSeleccionada = tarjetasActivas.find(t => t.id === selectedTarjeta);
  const deudaTarjeta = parseFloat(tarjetaSeleccionada?.deuda_actual || 0);
  const lineaTarjeta = parseFloat(tarjetaSeleccionada?.linea_credito || 1);
  const usoTarjeta = lineaTarjeta > 0 ? Math.round((deudaTarjeta / lineaTarjeta) * 100) : 0;
  const simboloTarjeta = tarjetaSeleccionada?.simbolo_moneda || 'S/';

  // ==========================================
  // FUNCIONES
  // ==========================================
  const cargarDatos = async (userId) => {
    try {
      setLoading(true);
      const [dataCards, dataGoals] = await Promise.all([
        cardsApi.getUserCards(userId),
        goalsApi.getByUser(userId)
      ]);
      if (dataCards.success) { setTarjetas(dataCards.tarjetas); setPlan(generarPlanExperto(dataCards.tarjetas)); }
      if (dataGoals.success) { setGoals(dataGoals.objetivos); setCompletedGoals(dataGoals.completados); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleCreateGoal = async () => {
    if (!selectedType) return;
    const config = GOAL_TYPES.find(g => g.tipo === selectedType);
    if (config.necesitaMeta && !metaValor) return;
    if (config.necesitaTarjeta && !selectedTarjeta) return;
    const tarjeta = tarjetasActivas.find(t => t.id === selectedTarjeta);
    const nombreTarjeta = tarjeta ? `${tarjeta.banco_nombre || tarjeta.banco_nombre_custom || 'Banco'} — ${tarjeta.nombre_tarjeta || ''}` : null;
    try {
      setSaving(true);
      const data = await goalsApi.create({ usuario_id: user.id, tipo: selectedType, descripcion: config.titulo, meta_valor: metaValor || null, fecha_limite: fechaLimite || null, tarjeta_id: selectedTarjeta || null, tarjeta_nombre: nombreTarjeta || null });
      if (data.success) {
        showMessage('¡Objetivo creado!', 'success');
        setShowNewGoal(false); setSelectedType(null); setSelectedTarjeta(null); setMetaValor(''); setFechaLimite('');
        cargarDatos(user.id);
      } else { showMessage(data.message, 'error'); }
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleDelete = async (goalId) => {
    try {
      await goalsApi.delete({ objetivo_id: goalId, usuario_id: user.id });
      setDeleteConfirm(null); cargarDatos(user.id);
    } catch (e) { console.error(e); }
  };

  const handleComplete = async (goalId) => {
    try {
      await goalsApi.complete({ objetivo_id: goalId, usuario_id: user.id });
      cargarDatos(user.id);
    } catch (e) { console.error(e); }
  };

  const showMessage = (msg, type) => { setMessage({ text: msg, type }); setTimeout(() => setMessage(null), 4000); };
  const getGoalConfig = (tipo) => GOAL_TYPES.find(g => g.tipo === tipo) || GOAL_TYPES[0];

  const calcularProgreso = (goal) => {
    const t = tarjetasActivas.find(x => x.id === goal.tarjeta_id);
    const deuda = t ? parseFloat(t.deuda_actual || 0) : 0;
    const linea = t ? parseFloat(t.linea_credito || 1) : 1;
    const uso = linea > 0 ? Math.round((deuda / linea) * 100) : 0;

    if (goal.tipo === 'reducir_uso') {
      if (uso <= parseFloat(goal.meta_valor)) return 100;
      const inicio = parseFloat(goal.progreso_actual) || uso;
      const rango = inicio - parseFloat(goal.meta_valor);
      return rango <= 0 ? 0 : Math.max(0, Math.min(99, Math.round(((inicio - uso) / rango) * 100)));
    }
    if (goal.tipo === 'reducir_deuda') {
      if (deuda <= parseFloat(goal.meta_valor)) return 100;
      const inicio = parseFloat(goal.progreso_actual) || deuda;
      const rango = inicio - parseFloat(goal.meta_valor);
      return rango <= 0 ? 0 : Math.max(0, Math.min(99, Math.round(((inicio - deuda) / rango) * 100)));
    }
    if (goal.tipo === 'pago_total') {
      if (deuda === 0) return 100;
      const inicio = parseFloat(goal.progreso_actual) || 1;
      return Math.max(0, Math.min(99, Math.round(((inicio - deuda) / inicio) * 100)));
    }
    if (goal.tipo === 'mantener_uso') {
      if (!t) return 0;
      if (uso > 30) return uso > 50 ? 10 : 25;
      if (!goal.fecha_limite) return 60;
      const inicio = new Date(goal.fecha_inicio);
      const fin = new Date(goal.fecha_limite);
      const ahora = new Date();
      return Math.max(0, Math.min(100, Math.round(((ahora - inicio) / (fin - inicio)) * 100)));
    }
    if (goal.tipo === 'no_atrasar') {
    const t = tarjetasActivas.find(x => x.id === goal.tarjeta_id);
    if (!t) return 0;
    if (t.dias_al_pago < 0) return 5; // atrasado
    const inicio = new Date(goal.fecha_inicio);
    const meta = new Date(inicio);
    meta.setMonth(meta.getMonth() + 3);
    const ahora = new Date();
    return Math.max(0, Math.min(100, Math.round(((ahora - inicio) / (meta - inicio)) * 100)));
  }
    return 0;
  };

  const formatFecha = (iso) => { if (!iso) return null; const f = new Date(iso); const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']; return `${f.getDate()} ${m[f.getMonth()]} ${f.getFullYear()}`; };
  const diasRestantes = (iso) => { if (!iso) return null; const d = Math.ceil((new Date(iso) - new Date()) / 86400000); if (d < 0) return { texto: 'Vencido', color: 'danger' }; if (d === 0) return { texto: 'Hoy', color: 'urgente' }; if (d <= 7) return { texto: `${d} días`, color: 'urgente' }; return { texto: `${d} días`, color: '' }; };
  const handleLogout = () => logout();
  const getDatosTarjetaGoal = (goal) => { const t = tarjetasActivas.find(x => x.id === goal.tarjeta_id); if (!t) return null; const deuda = parseFloat(t.deuda_actual || 0); const linea = parseFloat(t.linea_credito || 1); return { deuda, uso: Math.round((deuda / linea) * 100), simbolo: t.simbolo_moneda || 'S/' }; };

  const RING_COLORS = { cyan: '#0891b2', gold: '#c49a3c', green: '#16a34a', purple: '#7c3aed', orange: '#d97706' };

  const calcularProyeccion = (goal, pct) => {
    if (pct >= 100 || pct <= 0) return null;
    const inicio = new Date(goal.fecha_inicio);
    const diasTranscurridos = Math.max(1, Math.floor((new Date() - inicio) / 86400000));
    const diasTotal = Math.ceil(diasTranscurridos / (pct / 100));
    const diasRest = diasTotal - diasTranscurridos;
    if (diasRest <= 0) return 'Muy pronto';
    if (diasRest < 14) return `${diasRest} días`;
    if (diasRest < 60) return `~${Math.ceil(diasRest / 7)} semanas`;
    return `~${Math.ceil(diasRest / 30)} mes${Math.ceil(diasRest / 30) !== 1 ? 'es' : ''}`;
  };

  // ==========================================
  // EFFECTS — siempre después de las funciones
  // ==========================================

  // 1. Carga inicial
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatos(user.id);
  }, [user, navigate]);

  // 2. Auto-completar objetivos al 100%
  useEffect(() => {
    if (goals.length === 0 || tarjetasActivas.length === 0) return;
    if (autoCompletandoRef.current) return;

    const activos = goals.filter(g => !g.completado);
    const paraCompletar = activos.filter(goal => calcularProgreso(goal) >= 100);
    if (paraCompletar.length === 0) return;

    autoCompletandoRef.current = true;
    Promise.all(
      paraCompletar.map(goal => goalsApi.complete({ objetivo_id: goal.id, usuario_id: user?.id }))
    ).then(() => {
      autoCompletandoRef.current = false;
      if (user?.id) cargarDatos(user.id);
    }).catch(() => {
      autoCompletandoRef.current = false;
    });
  }, [goals, tarjetas]);

  // ==========================================
  // RENDER GUARD
  // ==========================================
  if (!user || loading) return (
    <div className="goals-page-loading">
      <div className="goals-page-spinner"></div>
      <p>Cargando...</p>
    </div>
  );

  const goalsActivos = goals.filter(g => !g.completado);

  const filteredGoals = goalsActivos.filter(g => {
    const q = searchQuery.toLowerCase();
    return !q || g.descripcion?.toLowerCase().includes(q) || g.tarjeta_nombre?.toLowerCase().includes(q);
  });

  const healthScore = (() => {
    if (tarjetasActivas.length === 0) return null;
    let score = 70;
    tarjetasActivas.forEach(t => {
      const uso = parseFloat(t.linea_credito) > 0 ? (parseFloat(t.deuda_actual) / parseFloat(t.linea_credito)) * 100 : 0;
      if (uso <= 30) score += 5;
      else if (uso <= 50) score -= 0;
      else if (uso <= 70) score -= 6;
      else score -= 14;
      if (t.dias_al_pago < 0) score -= 15;
      else if (t.dias_al_pago <= 3) score -= 4;
    });
    score += Math.min(completedGoals.length * 5, 20);
    score += Math.min(goalsActivos.length * 3, 12);
    return Math.max(5, Math.min(100, Math.round(score)));
  })();

  // ==========================================
  // JSX
  // ==========================================
  return (
    <div className="goals-page">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* ── Brand header ── */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="3"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
                <line x1="5" y1="15" x2="9" y2="15"/>
                <line x1="12" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <h2>Fintú &amp; Co.</h2>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* ── User pill ── */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.nombre?.charAt(0).toUpperCase()}{user.apellido?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.nombre} {user.apellido}</span>
            <span className="sidebar-user-plan">Acceso completo</span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <button className="nav-item" onClick={() => { navigate('/dashboard'); setSidebarOpen(false); }}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span className="nav-label">Dashboard</span>
          </button>

          <button className="nav-item active">
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
            <span className="nav-label">Mis Objetivos</span>
          </button>

          {/* ── Cuenta ── */}
          <div className="nav-divider"><span>Cuenta</span></div>

          <button className="nav-item" onClick={() => { navigate('/perfil'); setSidebarOpen(false); }}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="nav-label">Mi Perfil</span>
          </button>

          <button className="nav-item nav-item--logout" onClick={handleLogout}>
            <svg className="nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="nav-label">Cerrar sesión</span>
          </button>

        </nav>

        {/* ── Footer del sidebar ── */}
        <div className="sidebar-footer">
          <span>© {new Date().getFullYear()} Fintú &amp; Co.</span>
          <span className="sidebar-footer-dot" />
          <span>Perú 🇵🇪</span>
        </div>

      </aside>

      <div className="goals-layout">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Abrir menú">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="15" y2="18"/>
            </svg>
          </button>
          <h1 className="header-title">Fintú & Co.</h1>
        </div>
        <div className="header-right">
          <div className="header-avatar" onClick={() => navigate('/perfil')} title="Mi Perfil">
            {(user.nombre?.charAt(0) || '').toUpperCase()}{(user.apellido?.charAt(0) || '').toUpperCase()}
          </div>
          <button className="btn-logout-header" onClick={handleLogout} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </header>

      <main className="goals-main">

        {/* HERO */}
        <div className="goals-hero">
          <div className="goals-hero-bg">
            <div className="goals-hero-overlay">
              <div className="goals-hero-content">
                <div className="goals-hero-left">
                  <span className="goals-hero-eyebrow">Mis Objetivos Financieros</span>
                  <h1>
                    {completedGoals.length > 0 ? (
                      <>
                        {completedGoals.length} meta{completedGoals.length > 1 ? 's' : ''} cumplida{completedGoals.length > 1 ? 's' : ''}&nbsp;
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c8a870" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginBottom: '2px' }}>
                          <path d="M6 9H3V4h18v5h-3"/>
                          <path d="M6 4v9a6 6 0 0012 0V4"/>
                          <path d="M12 19v3"/>
                          <path d="M8 22h8"/>
                        </svg>
                      </>
                    ) : 'Define tus metas,'}
                  </h1>
                  <p>{goalsActivos.length > 0 ? `${goalsActivos.length} objetivo${goalsActivos.length > 1 ? 's' : ''} activo${goalsActivos.length > 1 ? 's' : ''}. Sigue el ritmo.` : 'alcanza tu libertad financiera.'}</p>
                </div>
                {healthScore !== null && (() => {
                  const R = 34; const circ = +(2 * Math.PI * R).toFixed(2);
                  const offset = +(circ * (1 - healthScore / 100)).toFixed(2);
                  const color = healthScore >= 75 ? '#22c55e' : healthScore >= 50 ? '#c49a3c' : '#ef4444';
                  const label = healthScore >= 75 ? 'Excelente' : healthScore >= 50 ? 'En progreso' : 'Mejorar';
                  return (
                    <div className="goals-hero-score">
                      <div className="ghs-ring-wrap">
                        <svg width="88" height="88" viewBox="0 0 88 88">
                          <circle cx="44" cy="44" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5.5"/>
                          <circle cx="44" cy="44" r={R} fill="none" stroke={color} strokeWidth="5.5"
                            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                            transform="rotate(-90 44 44)"
                            style={{transition:'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)'}}
                          />
                        </svg>
                        <div className="ghs-ring-center">
                          <span className="ghs-score-num" style={{color}}>{healthScore}</span>
                          <span className="ghs-score-label">{label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="goals-content-wrapper">

          {/* NOTIFICACIÓN */}
          {message && (
            <div className={`goals-notification ${message.type}`}>
              {message.type === 'success'
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
              }
              {message.text}
            </div>
          )}

          {/* MODE SELECTOR */}
          <div className="goals-mode-selector">
            <button className={`goals-mode-btn ${activeMode === 'basico' ? 'active' : ''}`} onClick={() => setActiveMode('basico')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <div><span>Modo Básico</span><small>Objetivos por tarjeta</small></div>
            </button>
            <button className={`goals-mode-btn ${activeMode === 'experto' ? 'active' : ''}`} onClick={() => setActiveMode('experto')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <div><span>Modo Experto</span><small>Análisis personalizado</small></div>
            </button>
          </div>

          {/* ===== MODO BÁSICO ===== */}
          {activeMode === 'basico' && (
            <div className="goals-basico">

              {/* KPI STRIP */}
              <div className="goals-kpi-strip">
                {[
                  { val: goalsActivos.length, label: 'Activos', cls: 'gkc-active' },
                  { val: completedGoals.length, label: 'Logrados', cls: 'gkc-done' },
                  { val: goalsActivos.filter(g => { const d = diasRestantes(g.fecha_limite); return d?.color === 'urgente' || d?.color === 'danger'; }).length, label: 'Urgentes', cls: 'gkc-urgent' },
                  { val: 3 - goalsActivos.length, label: 'Disponibles', cls: 'gkc-free' },
                ].map(({ val, label, cls }) => (
                  <div key={label} className={`goals-kpi-chip ${cls}`}>
                    <span>{val}</span><small>{label}</small>
                  </div>
                ))}
              </div>

              {/* TOOLBAR */}
              <div className="goals-toolbar">
                <div className="goals-search-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" className="goals-search-input" placeholder="Buscar objetivo o tarjeta..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                  {searchQuery && <button className="goals-search-clear" onClick={() => setSearchQuery('')}>×</button>}
                </div>
                {goalsActivos.length < 3 && (
                  <button className="goals-btn-new" onClick={() => setShowNewGoal(!showNewGoal)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nuevo objetivo
                  </button>
                )}
              </div>

              {/* FORMULARIO NUEVO OBJETIVO */}
              {showNewGoal && (
                <div className="goals-new-form">
                  <div className="goals-new-form-header">
                    <div className="goals-new-form-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                    </div>
                    <div>
                      <h3>¿Qué quieres lograr?</h3>
                      <p>Elige un tipo de objetivo y configúralo por tarjeta</p>
                    </div>
                  </div>

                  <div className="goals-types-divider" />
                  <div className="goals-types-grid">
                    {GOAL_TYPES.map(type => (
                      <div
                        key={type.tipo}
                        className={`goals-type-card ${type.color} ${selectedType === type.tipo ? 'selected' : ''}`}
                        onClick={() => { setSelectedType(type.tipo); setSelectedTarjeta(null); setMetaValor(''); setFechaLimite(''); }}
                      >
                        <div className={`goals-type-icon ${type.color}`}>{type.icono}</div>
                        <div><h4>{type.titulo}</h4><p>{type.descripcion}</p></div>
                        {selectedType === type.tipo && (
                          <div className="goals-type-check">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedType && (() => {
                    const config = GOAL_TYPES.find(g => g.tipo === selectedType);
                    return (
                      <div className="goals-config-box">

                        {/* SELECTOR DE TARJETA */}
                        {config.necesitaTarjeta && (
                          <div className="goals-tarjeta-selector">
                            <label className="goals-config-label">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                              ¿A qué tarjeta aplica este objetivo?
                            </label>
                            <div className="goals-tarjeta-options">
                              {tarjetasActivas.map(t => {
                                const uso = t.linea_credito > 0 ? Math.round((t.deuda_actual / t.linea_credito) * 100) : 0;
                                const deuda = parseFloat(t.deuda_actual || 0);
                                const simbolo = t.simbolo_moneda || 'S/';
                                return (
                                  <div
                                    key={t.id}
                                    className={`goals-tarjeta-option ${selectedTarjeta === t.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedTarjeta(t.id)}
                                  >
                                    <div className="gto-left">
                                      <div className="gto-banco">{t.banco_nombre || t.banco_nombre_custom || 'Banco'}</div>
                                      <div className="gto-nombre">{t.nombre_tarjeta || t.categoria_principal || 'Tarjeta'}</div>
                                    </div>
                                    <div className="gto-right">
                                      <div className="gto-deuda">{simbolo} {deuda.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
                                      <div className={`gto-uso ${uso >= 70 ? 'danger' : uso >= 30 ? 'warning' : 'good'}`}>{uso}% uso</div>
                                    </div>
                                    {selectedTarjeta === t.id && (
                                      <div className="gto-check">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* CONTEXTO */}
                        {(selectedTarjeta || !config.necesitaTarjeta) && (
                          <div className="goals-config-context">
                            {selectedType === 'reducir_uso' && tarjetaSeleccionada && (
                              <p><strong>{tarjetaSeleccionada.banco_nombre || tarjetaSeleccionada.banco_nombre_custom}</strong> tiene uso actual de <strong>{usoTarjeta}%</strong>. {usoTarjeta > 30 ? `Para llegar al 30% ideal, paga ${simboloTarjeta} ${Math.ceil(deudaTarjeta - lineaTarjeta * 0.3).toLocaleString('es-PE')}.` : '¡Ya estás en el rango ideal!'}</p>
                            )}
                            {selectedType === 'reducir_deuda' && tarjetaSeleccionada && (
                              <p><strong>{tarjetaSeleccionada.banco_nombre || tarjetaSeleccionada.banco_nombre_custom}</strong> tiene deuda de <strong>{simboloTarjeta} {deudaTarjeta.toLocaleString('es-PE')}</strong>. Define a cuánto quieres reducirla.</p>
                            )}
                            {selectedType === 'pago_total' && tarjetaSeleccionada && (
                              <p><strong>{tarjetaSeleccionada.banco_nombre || tarjetaSeleccionada.banco_nombre_custom}</strong>: <strong>{simboloTarjeta} {deudaTarjeta.toLocaleString('es-PE')}</strong> de deuda. ¿Puedes pagarlo todo este mes?</p>
                            )}
                            {selectedType === 'mantener_uso' && tarjetaSeleccionada && (
                              <p><strong>{tarjetaSeleccionada.banco_nombre || tarjetaSeleccionada.banco_nombre_custom}</strong> tiene {usoTarjeta}% de uso. Mantenerla bajo 30% mejora tu historial.</p>
                            )}
                            {selectedType === 'no_atrasar' && (
                              <p>Pagar a tiempo por 3 meses seguidos construye un historial crediticio sólido.</p>
                            )}
                          </div>
                        )}

                        {/* INPUTS */}
                        {(selectedTarjeta || !config.necesitaTarjeta) && (
                          <div className="goals-config-fields">
                            {config.necesitaMeta && (
                              <div className="goals-config-field">
                                <label>{config.metaLabel}</label>
                                <div className="goals-input-wrap">
                                  {config.metaSufijo !== '%' && <span className="goals-input-prefix">{simboloTarjeta}</span>}
                                  <input type="number" placeholder={config.metaPlaceholder} value={metaValor} onChange={e => setMetaValor(e.target.value)} min="0"/>
                                  {config.metaSufijo === '%' && <span className="goals-input-suffix">%</span>}
                                </div>
                              </div>
                            )}
                            {config.necesitaFecha && (
                              <div className="goals-config-field">
                                <label>Fecha límite (opcional)</label>
                                <input type="date" value={fechaLimite} onChange={e => setFechaLimite(e.target.value)} min={new Date().toISOString().split('T')[0]} className="goals-date-input"/>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="goals-config-actions">
                          <button className="goals-btn-cancel" onClick={() => { setShowNewGoal(false); setSelectedType(null); setSelectedTarjeta(null); }}>Cancelar</button>
                          <button
                            className="goals-btn-create"
                            onClick={handleCreateGoal}
                            disabled={saving || (config.necesitaMeta && !metaValor) || (config.necesitaTarjeta && !selectedTarjeta)}
                          >
                            {saving ? <div className="goals-spinner-sm"></div> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
                            {saving ? 'Guardando...' : 'Crear objetivo'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* LISTA OBJETIVOS — table view */}
              {goalsActivos.length === 0 && !showNewGoal ? (
                <div className="goals-empty-state">
                  <div className="goals-empty-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  </div>
                  <h3>Sin objetivos activos</h3>
                  <p>Define una meta por tarjeta — reducir deuda, bajar el uso o pagar en fecha — y la app hará el seguimiento automático.</p>
                  <button className="goals-btn-create-first" onClick={() => setShowNewGoal(true)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Crear mi primer objetivo
                  </button>
                </div>
              ) : (
                <div className="goals-list-table">
                  {/* Cabecera */}
                  <div className="glt-header">
                    <div className="glt-col-objetivo">Objetivo</div>
                    <div className="glt-col-meta">Meta</div>
                    <div className="glt-col-progreso">Progreso</div>
                    <div className="glt-col-vence">Vence</div>
                    <div className="glt-col-estado">Estado</div>
                    <div className="glt-col-acciones"></div>
                  </div>

                  {/* Filas */}
                  {filteredGoals.map((goal, idx) => {
                    const config = getGoalConfig(goal.tipo);
                    const pct = calcularProgreso(goal);
                    const dias = diasRestantes(goal.fecha_limite);
                    const dt = getDatosTarjetaGoal(goal);
                    const proj = calcularProyeccion(goal, pct);
                    const R = 18; const circ = +(2 * Math.PI * R).toFixed(2);
                    const offset = +(circ * (1 - Math.min(pct, 100) / 100)).toFixed(2);
                    const stroke = pct >= 100 ? '#16a34a' : (RING_COLORS[config.color] || '#c49a3c');
                    const statusLabel = pct >= 100 ? 'Completado' : dias?.color === 'danger' ? 'Vencido' : dias?.color === 'urgente' ? 'Urgente' : 'En curso';
                    const statusClass = pct >= 100 ? 'complete' : dias?.color === 'danger' ? 'danger' : dias?.color === 'urgente' ? 'urgent' : 'active';
                    return (
                      <div key={goal.id} className={`glt-row${deleteConfirm === goal.id ? ' confirming' : ''}`} style={{ animationDelay: `${idx * 0.07}s` }}>
                        {/* Objetivo */}
                        <div className="glt-col-objetivo">
                          <div className={`glt-icon ${config.color}`}>{config.icono}</div>
                          <div className="glt-info">
                            <span className="glt-title">{goal.descripcion}</span>
                            {goal.tarjeta_nombre && (
                              <span className="glt-card">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                                {goal.tarjeta_nombre.split('—')[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Meta */}
                        <div className="glt-col-meta">
                          {goal.meta_valor
                            ? <span className="glt-meta-val">{config.metaSufijo === '%' ? `${goal.meta_valor}%` : `${dt?.simbolo || 'S/'} ${parseFloat(goal.meta_valor).toLocaleString('es-PE')}`}</span>
                            : <span className="glt-muted">—</span>}
                        </div>
                        {/* Progreso ring */}
                        <div className="glt-col-progreso">
                          <div className="glt-ring-wrap">
                            <svg width="44" height="44" viewBox="0 0 44 44">
                              <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(30,45,100,0.09)" strokeWidth="4"/>
                              <circle cx="22" cy="22" r={R} fill="none" stroke={stroke} strokeWidth="4"
                                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
                                transform="rotate(-90 22 22)"
                                style={{transition:'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)'}}/>
                            </svg>
                            <span className="glt-ring-pct" style={{color: stroke}}>{Math.min(pct,100)}%</span>
                          </div>
                          {proj && <span className="glt-proj">{proj}</span>}
                        </div>
                        {/* Vence */}
                        <div className="glt-col-vence">
                          {dias
                            ? <span className={`glt-badge glt-badge-${dias.color || 'normal'}`}>{dias.texto}</span>
                            : <span className="glt-muted">Sin fecha</span>}
                        </div>
                        {/* Estado */}
                        <div className="glt-col-estado">
                          <span className={`glt-status glt-status-${statusClass}`}>{statusLabel}</span>
                        </div>
                        {/* Acciones */}
                        <div className="glt-col-acciones">
                          {goal.tarjeta_id && (() => {
                            const tarjeta = tarjetasActivas.find(t => t.id === goal.tarjeta_id);
                            return tarjeta ? (
                              <button className="glt-action-btn" title="Ver tarjeta"
                                onClick={() => navigate(`/tarjeta/${tarjeta.slot_numero}`)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                              </button>
                            ) : null;
                          })()}
                          <button className="glt-action-btn glt-action-danger" title="Abandonar"
                            onClick={() => setDeleteConfirm(deleteConfirm === goal.id ? null : goal.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                          </button>
                        </div>
                        {/* Confirmar abandon */}
                        {deleteConfirm === goal.id && (
                          <div className="glt-confirm-bar">
                            <span>¿Abandonar "<strong>{goal.descripcion}</strong>"?</span>
                            <div className="glt-confirm-btns">
                              <button onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                              <button className="danger" onClick={() => handleDelete(goal.id)}>Sí, abandonar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredGoals.length === 0 && searchQuery && (
                    <div className="glt-no-results">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <span>Sin resultados para "<strong>{searchQuery}</strong>"</span>
                    </div>
                  )}
                </div>
              )}

              {/* HISTORIAL */}
              {completedGoals.length > 0 && (
                <div className="goals-history-section">
                  <h3>Objetivos Cumplidos 🏆</h3>
                  <div className="goals-history-list">
                    {completedGoals.slice(0, 10).map(goal => {
                      const config = getGoalConfig(goal.tipo);
                      return (
                        <div key={goal.id} className="goals-history-item">
                          <div className={`gcf-icon small ${config.color}`}>{config.icono}</div>
                          <div className="goals-history-text">
                            <span>{goal.descripcion}</span>
                            {goal.tarjeta_nombre && <small className="goals-history-tarjeta">{goal.tarjeta_nombre.split('—')[0].trim()}</small>}
                            <small>Completado: {formatFecha(goal.fecha_completado)}</small>
                          </div>
                          <div className="goals-history-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                            Logrado
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== MODO EXPERTO ===== */}
          {activeMode === 'experto' && (
            <div className="goals-experto">
              {!plan || tarjetasActivas.length === 0 ? (
                <div className="goals-empty-state">
                  <div className="goals-empty-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <h3>Agrega tarjetas primero</h3>
                  <p>El plan experto analiza tus tarjetas reales.</p>
                  <button className="goals-btn-create-first" onClick={() => navigate('/dashboard')}>Ir al Dashboard</button>
                </div>
              ) : (
                <>
                  {plan.alertas.length > 0 && (
                    <div className="experto-section">
                      <div className="experto-section-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                        <h2>Alertas de tus tarjetas</h2>
                      </div>
                      <div className="experto-alerts">
                        {plan.alertas.map((a, i) => (
                          <div key={i} className={`experto-alert ${a.tipo}`}>
                            <div className="experto-alert-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                            </div>
                            <div><p className="experto-alert-msg">{a.mensaje}</p><p className="experto-alert-accion">{a.accion}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.recomendaciones.length > 0 && (
                    <div className="experto-section">
                      <div className="experto-section-header">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                        <h2>Análisis por tarjeta</h2>
                      </div>
                      <div className="experto-cards">
                        {plan.recomendaciones.map((rec, i) => (
                          <div key={i} className={`experto-card ${rec.prioridad}`}>
                            <div className="experto-card-header">
                              <div>
                                <h3>{rec.tarjeta}</h3>
                                <span className={`experto-priority-badge ${rec.prioridad}`}>{rec.prioridad === 'alta' ? '🔴 Prioridad alta' : '🟡 Prioridad media'}</span>
                              </div>
                              <div className="experto-tea-badge">TEA {rec.tea}%</div>
                            </div>
                            <div className="experto-stats-row">
                              <div className="experto-stat"><span>Deuda actual</span><strong>{rec.simbolo} {parseFloat(rec.deuda).toLocaleString('es-PE')}</strong></div>
                              <div className="experto-stat danger"><span>Interés este mes</span><strong>{rec.simbolo} {parseFloat(rec.interesMensual).toLocaleString('es-PE')}</strong></div>
                              <div className="experto-stat"><span>Pago sugerido</span><strong className="gold">{rec.simbolo} {rec.pagoSugerido.toLocaleString('es-PE')}</strong></div>
                            </div>
                            <div className="experto-comparison">
                              <div className="experto-comp-item bad"><span>Pagando mínimo</span><strong>{rec.mesesSinExtra} meses</strong><small>para saldar deuda</small></div>
                              <div className="experto-comp-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
                              <div className="experto-comp-item good"><span>Pagando más</span><strong>{rec.mesesConExtra} meses</strong><small>ahorras {rec.simbolo} {parseFloat(rec.ahorroPagandoMas).toLocaleString('es-PE')}</small></div>
                            </div>
                            <div className="experto-tip">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                              Cada mes pagando solo el mínimo, el banco cobra <strong>{rec.simbolo} {parseFloat(rec.interesMensual).toLocaleString('es-PE')}</strong> en intereses.
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="experto-section">
                    <div className="experto-section-header">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <h2>Tu plan de acción</h2>
                    </div>
                    <div className="experto-strategy">
                      {plan.estrategia.map((paso, i) => (
                        <div key={i} className="experto-step">
                          <div className="experto-step-num">{i + 1}</div>
                          <div className="experto-step-content">
                            <span className="experto-step-label">{paso.icono}</span>
                            <p>{paso.texto}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="experto-cta">
                    <div className="experto-cta-content">
                      <h3>¿Listo para tomar acción?</h3>
                      <p>Convierte este análisis en objetivos medibles por tarjeta.</p>
                    </div>
                    <button className="experto-cta-btn" onClick={() => setActiveMode('basico')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      Crear objetivos por tarjeta
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </main>
      </div>
    </div>
  );
}

export default Goals;