import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';import { goalsApi } from '@/modules/goals/services/goalsApi';
import Sidebar from '@/shared/components/Sidebar';
import AppFooter from '@/shared/components/AppFooter';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
/* Armazón compartido — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './Goals.css';

const GOAL_TYPES = [
  {
    tipo: 'reducir_uso',
    titulo: 'Reducir uso de línea',
    descripcion: 'Baja el % de uso de una tarjeta específica',
    beneficio: 'Es la forma más rápida de mejorar tu score: las centrales de riesgo revisan tu % de uso cada mes.',
    porque: 'El uso de línea pesa cerca del 30% de tu perfil crediticio; bajo 30% los bancos te ven como cliente sano.',
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
    beneficio: 'Cada sol que bajas deja de generar intereses desde el mismo mes.',
    porque: 'Con TEAs de 60–100% en Perú, reducir capital es el ahorro más directo: pagas menos interés y sales antes de la deuda.',
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
    beneficio: 'Pagar el total antes del cierre te vuelve "totalero": usas la tarjeta sin pagar un sol de intereses.',
    porque: 'El banco solo cobra interés sobre el saldo que dejas al corte. Si dejas saldo 0, tu crédito es gratis.',
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
    beneficio: 'Construye historial positivo y evita moras, penalidades y llamadas de cobranza.',
    porque: 'El historial de pagos es el factor nº 1 del score: un atraso se reporta por años, la puntualidad lo repara.',
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
    beneficio: 'Sostiene tu score estable y deja línea libre para una emergencia real.',
    porque: 'Las centrales reportan tu uso cada mes: no basta bajarlo una vez, lo que puntúa es mantenerlo en el tiempo.',
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
  if (totalDeuda === 0) {
    estrategia.push({ icono: 'Sin deuda', texto: '¡Sin deuda! Eres un usuario totalero. Sigue así y la TEA nunca te tocará.' });
  } else {
    const top   = ordenadas.find(t => parseFloat(t.deuda_actual || 0) > 0) || ordenadas[0];
    const tNom  = top.banco_nombre || top.banco_nombre_custom || 'tu tarjeta';
    const tSim  = top.simbolo_moneda || 'S/';
    const tDeuda = parseFloat(top.deuda_actual || 0);
    const tTea  = parseFloat(top.tasa_interes || 0);
    const tInteresMes = Math.round(tDeuda * (Math.pow(1 + tTea / 100, 1 / 12) - 1));

    // La tarjeta más cara, con lo que te cuesta AHORA en soles
    if (tInteresMes >= 1 && tTea > 0) {
      estrategia.push({
        icono: activas.length > 1 ? 'La más cara' : 'Tu costo',
        texto: `${tNom} te cuesta ~${tSim} ${tInteresMes.toLocaleString('es-PE')} al mes solo en intereses (TEA ${tTea}%). ${activas.length > 1 ? 'Es la más cara de tus tarjetas: págala primero.' : 'Bájala cuanto antes.'}`,
      });
    }

    // Cuánto pagar exactamente para llegar al 30% de uso
    if (usoPromedio > 30) {
      estrategia.push({
        icono: 'Meta 30%',
        texto: `Tu uso está en ${usoPromedio}%. Paga S/ ${Math.ceil(totalDeuda - totalLinea * 0.3).toLocaleString('es-PE')} en total para bajar al 30%, el rango que cuida tu score.`,
      });
    }

    // Cuándo pagar, con los días y la fecha reales de tu cierre
    if (top.dias_al_cierre !== undefined && top.dias_al_cierre >= 0) {
      estrategia.push({
        icono: 'Cuándo pagar',
        texto: `A ${tNom} le quedan ${top.dias_al_cierre} día${top.dias_al_cierre === 1 ? '' : 's'} para cerrar${top.fecha_cierre_formateada ? ` (${top.fecha_cierre_formateada})` : ''}. Paga antes de ese día: ese saldo es el que ven las centrales de riesgo, no el del vencimiento.`,
      });
    } else {
      estrategia.push({
        icono: 'Cuándo pagar',
        texto: 'Paga antes del cierre de tu ciclo, no del vencimiento. El saldo de ese día es el que reportan a las centrales de riesgo.',
      });
    }

    // El objetivo real: cero intereses pagando el total
    estrategia.push({
      icono: 'Lo ideal',
      texto: `Si pagas el total (${tSim} ${Math.round(totalDeuda).toLocaleString('es-PE')}) antes de cada cierre, no pagas ni un sol de intereses. Ese es el objetivo.`,
    });
  }
  return { recomendaciones, alertas, estrategia, totalDeuda, usoPromedio };
};

// Columnas del tablero Kanban (por % de progreso)
//  · Por empezar → aún sin avance (0%)
//  · En progreso → apenas empieza a moverse y hasta el tramo final
//  · Casi ahí    → recta final (≥ 75%)
const KANBAN_COLS = [
  { id: 'empezar',  label: 'Por empezar', color: 'cyan', match: (p) => p <= 0 },
  { id: 'progreso', label: 'En progreso', color: 'blue', match: (p) => p > 0 && p < 75 },
  { id: 'casi',     label: 'Casi ahí',    color: 'gold', match: (p) => p >= 75 },
];

function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [historyMenu, setHistoryMenu] = useState(null);
  // Objetivo pendiente de eliminar: { id, done } (done = ya cumplido / del historial)
  const [goalToDelete, setGoalToDelete] = useState(null);
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

    // ── Validaciones de sentido: el objetivo solo se crea si de verdad ayuda ──
    const meta = parseFloat(metaValor);
    if (selectedType === 'reducir_uso') {
      if (!(meta > 0 && meta < 100)) { showMessage('La meta de uso debe estar entre 1% y 99%.', 'error'); return; }
      if (usoTarjeta <= meta) { showMessage(`Tu uso ya está en ${usoTarjeta}%. Elige una meta menor a tu uso actual.`, 'error'); return; }
    }
    if (selectedType === 'reducir_deuda') {
      if (!(meta >= 0)) { showMessage('Ingresa un monto válido.', 'error'); return; }
      if (deudaTarjeta <= meta) { showMessage(`Tu deuda ya es ${simboloTarjeta} ${deudaTarjeta.toLocaleString('es-PE')}. Elige un monto menor para que la meta tenga sentido.`, 'error'); return; }
    }
    if (selectedType === 'pago_total') {
      if (deudaTarjeta <= 0) { showMessage('Esta tarjeta ya no tiene deuda; no hay nada que liquidar.', 'error'); return; }
    }
    if (selectedType === 'mantener_uso') {
      if (usoTarjeta > 30) { showMessage(`Tu uso está en ${usoTarjeta}%. Primero bájalo con "Reducir uso de línea"; este objetivo es para mantenerlo una vez que ya estás bajo 30%.`, 'error'); return; }
      if (!fechaLimite) { showMessage('Elige una fecha límite: hasta cuándo quieres mantenerlo bajo 30%.', 'error'); return; }
    }

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
      setGoalToDelete(null); cargarDatos(user.id);
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
      // Si te pasaste del 30%, rompiste el "mantener" → progreso bajo
      if (uso > 30) return uso > 50 ? 10 : 25;
      // Bajo 30%: avanza con el tiempo hasta la fecha límite (o 3 meses por defecto).
      // Se completa (100%) cuando termina el período manteniéndolo bajo 30%.
      const inicio = new Date(goal.fecha_inicio);
      let fin;
      if (goal.fecha_limite) fin = new Date(goal.fecha_limite);
      else { fin = new Date(inicio); fin.setMonth(fin.getMonth() + 3); }
      if (fin <= inicio) return 100;
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
  const getDatosTarjetaGoal = (goal) => { const t = tarjetasActivas.find(x => x.id === goal.tarjeta_id); if (!t) return null; const deuda = parseFloat(t.deuda_actual || 0); const linea = parseFloat(t.linea_credito || 1); return { deuda, uso: Math.round((deuda / linea) * 100), simbolo: t.simbolo_moneda || 'S/' }; };

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

  // 3. Cerrar el menú de "Logrados" al hacer click fuera
  useEffect(() => {
    if (!historyMenu) return;
    const close = () => setHistoryMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [historyMenu]);

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

  // Tarjeta compacta de objetivo (para el tablero Kanban)
  const renderGoalCard = (goal) => {
    const config = getGoalConfig(goal.tipo);
    const pct = calcularProgreso(goal);
    const dias = diasRestantes(goal.fecha_limite);
    const dt = getDatosTarjetaGoal(goal);
    const proj = calcularProyeccion(goal, pct);
    const completo = pct >= 100;
    const statusClass = completo ? 'done' : dias?.color === 'danger' ? 'danger' : dias?.color === 'urgente' ? 'urgente' : 'curso';
    const statusLabel = completo ? 'Completado' : dias?.color === 'danger' ? 'Vencido' : dias?.color === 'urgente' ? 'Por vencer' : 'En curso';
    const tarjeta = goal.tarjeta_id ? tarjetasActivas.find(t => t.id === goal.tarjeta_id) : null;
    const metaTexto = goal.meta_valor
      ? (config.metaSufijo === '%' ? `${goal.meta_valor}%` : `${dt?.simbolo || 'S/'} ${parseFloat(goal.meta_valor).toLocaleString('es-PE')}`)
      : goal.tipo === 'pago_total' ? 'Deuda en 0'
      : goal.tipo === 'no_atrasar' ? '3 meses al día'
      : goal.tipo === 'mantener_uso' ? 'Uso < 30%'
      : '—';
    let venceTexto = 'Sin fecha';
    if (dias) venceTexto = dias.texto;
    else if (goal.tipo === 'no_atrasar' && goal.fecha_inicio) {
      const fin3m = new Date(goal.fecha_inicio); fin3m.setMonth(fin3m.getMonth() + 3);
      venceTexto = formatFecha(fin3m.toISOString());
    }
    return (
      <div className={`gk-card ${statusClass}`} key={goal.id}>
        <div className="gk-card-top">
          <span className={`gk-status ${statusClass}`}>{statusLabel}</span>
          <span className="gk-pct">{Math.min(pct, 100)}%</span>
        </div>
        <div className="gk-card-title">
          <span className={`gk-card-ico ${config.color}`}>{config.icono}</span>
          <span>{goal.descripcion}</span>
        </div>
        {goal.tarjeta_nombre && (
          <span className="gk-card-tag">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            {goal.tarjeta_nombre.split('—')[0].trim()}
          </span>
        )}
        <div className="gk-bar"><div className="gk-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
        <div className="gk-meta">
          <span>Meta <strong>{metaTexto}</strong></span>
          <span>Vence <strong>{venceTexto}</strong></span>
        </div>
        {proj && <div className="gk-proj">Listo aprox. en <strong>{proj}</strong></div>}
        <div className="gk-card-actions">
          {tarjeta ? (
            <button className="gk-link" onClick={() => navigate(`/tarjeta/${tarjeta.slot_numero}`)}>Ver tarjeta</button>
          ) : <span />}
          <button
            className="gk-del"
            onClick={() => setGoalToDelete({ id: goal.id, done: false })}
            title="Abandonar objetivo"
            aria-label="Abandonar objetivo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    );
  };

  // ==========================================
  // JSX
  // ==========================================
  return (
    <div className="goals-page">
      {/* SIDEBAR */}
      <Sidebar active="objetivos" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MODAL — confirmar eliminar / abandonar objetivo */}
      <ConfirmDialog
        open={!!goalToDelete}
        title={goalToDelete?.done ? '¿Eliminar del historial?' : '¿Abandonar este objetivo?'}
        message={goalToDelete?.done
          ? 'Este objetivo cumplido se quitará de tus logros. No se puede deshacer.'
          : 'Dejarás de hacerle seguimiento y saldrá de tu tablero. No se puede deshacer.'}
        confirmText={goalToDelete?.done ? 'Eliminar' : 'Abandonar'}
        onConfirm={() => { const id = goalToDelete.id; setGoalToDelete(null); handleDelete(id); }}
        onCancel={() => setGoalToDelete(null)}
      />

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
          <h1 className="header-title">Mis Objetivos</h1>
        </div>
        <div className="header-right">
          <button className="goals-help-btn" onClick={() => setShowHelp(true)} title="¿Por qué usar objetivos?" aria-label="Ayuda">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </button>
          <div className="header-avatar" onClick={() => navigate('/perfil')} role="button" tabIndex={0} title="Mi Perfil">
            {(user.nombre?.charAt(0) || '').toUpperCase()}{(user.apellido?.charAt(0) || '').toUpperCase()}
          </div>
        </div>
      </header>

      {/* MODAL AYUDA — por qué usar objetivos */}
      {showHelp && (
        <div className="goals-help-overlay" onClick={() => setShowHelp(false)}>
          <div className="goals-help-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Por qué usar objetivos">
            <div className="ghm-header">
              <div className="ghm-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div className="ghm-title">
                <h3>¿Por qué usar Mis Objetivos?</h3>
                <p>Lo esencial, en 30 segundos</p>
              </div>
              <button className="ghm-close" onClick={() => setShowHelp(false)} aria-label="Cerrar">×</button>
            </div>
            <div className="ghm-items">
              <div className="ghm-item">
                <div className="ghm-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
                <div><strong>Convierte tu deuda en un plan</strong><p>En vez de "debo mucho", tienes una meta con monto y fecha: sabes cuánto pagar y cuándo.</p></div>
              </div>
              <div className="ghm-item">
                <div className="ghm-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg></div>
                <div><strong>Seguimiento automático</strong><p>La app mide tu avance con la deuda real de tus tarjetas. No registras nada a mano.</p></div>
              </div>
              <div className="ghm-item">
                <div className="ghm-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
                <div><strong>Mejora tu score crediticio</strong><p>Uso de línea + pagos puntuales pesan ~65% de tu perfil. Cada objetivo ataca uno de esos factores.</p></div>
              </div>
              <div className="ghm-item">
                <div className="ghm-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
                <div><strong>Ahorras intereses reales</strong><p>Bajar deuda con TEA de 60–100% es el "rendimiento" más alto que puedes lograr con tu dinero.</p></div>
              </div>
            </div>
            <button className="ghm-ok" onClick={() => setShowHelp(false)}>Entendido</button>
          </div>
        </div>
      )}

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
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7fa8d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginBottom: '2px' }}>
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
                  const color = '#7fa8d9';
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
            <button className={`goals-mode-btn ${activeMode === 'logrados' ? 'active' : ''}`} onClick={() => setActiveMode('logrados')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H3V4h18v5h-3"/><path d="M6 4v9a6 6 0 0012 0V4"/><path d="M12 19v3"/><path d="M8 22h8"/></svg>
              <div><span>Logrados{completedGoals.length > 0 && <em className="gmb-count">{completedGoals.length}</em>}</span><small>Historial de metas</small></div>
            </button>
          </div>

          {/* ===== MODO BÁSICO ===== */}
          {activeMode === 'basico' && (
            <div className="goals-basico">

              {/* TOOLBAR — solo cuando hay objetivos */}
              {goalsActivos.length > 0 && (
              <div className="goals-toolbar">
                <div className="goals-search-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" className="goals-search-input" placeholder="Buscar objetivo o tarjeta..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}/>
                  {searchQuery && <button className="goals-search-clear" onClick={() => setSearchQuery('')}>×</button>}
                </div>
                <span className="goals-count-pill">{goalsActivos.length} objetivo{goalsActivos.length !== 1 ? 's' : ''}</span>
                {goalsActivos.length < 3 && (
                  <button className="goals-btn-new" onClick={() => setShowNewGoal(!showNewGoal)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Nuevo objetivo
                  </button>
                )}
              </div>
              )}

              {/* FORMULARIO NUEVO OBJETIVO — visible también cuando aún no hay objetivos */}
              {(showNewGoal || goalsActivos.length === 0) && (
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

                        {/* POR QUÉ AYUDA */}
                        <div className="goals-benefit-note">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          <p><strong>¿Cómo ayuda?</strong> {config.beneficio} <span>{config.porque}</span></p>
                        </div>

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
                                <label>{selectedType === 'mantener_uso' ? '¿Hasta cuándo mantenerlo? (obligatorio)' : 'Fecha límite (opcional)'}</label>
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
                            disabled={saving || (config.necesitaMeta && !metaValor) || (config.necesitaTarjeta && !selectedTarjeta) || (selectedType === 'mantener_uso' && !fechaLimite)}
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
              <div className="goals-kanban">
                {KANBAN_COLS.map((col) => {
                  const items = filteredGoals.filter((g) => col.match(calcularProgreso(g)));
                  return (
                    <div className="gk-col" key={col.id}>
                      <div className={`gk-col-head ${col.color}`}>
                        <span className="gk-col-dot" />
                        <span className="gk-col-title">{col.label}</span>
                        <span className="gk-col-count">{items.length}</span>
                      </div>
                      <div className="gk-col-body">
                        {items.map((goal) => renderGoalCard(goal))}
                        {items.length === 0 && <div className="gk-col-empty">Sin objetivos</div>}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ===== LOGRADOS — historial de metas ===== */}
          {activeMode === 'logrados' && (
            <div className="goals-logrados">
              {completedGoals.length === 0 ? (
                <div className="goals-empty-state">
                  <div className="goals-empty-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9H3V4h18v5h-3"/><path d="M6 4v9a6 6 0 0012 0V4"/><path d="M12 19v3"/><path d="M8 22h8"/></svg>
                  </div>
                  <h3>Aún no hay metas logradas</h3>
                  <p>Cuando completes un objetivo aparecerá aquí con su tarjeta y fecha. Empieza con una meta pequeña: es la forma más segura de llegar.</p>
                  <button className="goals-btn-create-first" onClick={() => setActiveMode('basico')}>Ir a mis objetivos</button>
                </div>
              ) : (
                <div className="goals-history-section">
                  <div className="goals-history-header">
                    <h3>Objetivos Cumplidos 🏆</h3>
                    <span className="goals-history-count">{completedGoals.length} meta{completedGoals.length !== 1 ? 's' : ''}</span>
                  </div>
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
                          <div className="ghi-menu-wrap">
                            <button
                              className={`ghi-dots${historyMenu === goal.id ? ' active' : ''}`}
                              onClick={(e) => { e.stopPropagation(); setHistoryMenu(historyMenu === goal.id ? null : goal.id); }}
                              aria-label="Opciones del objetivo"
                              title="Opciones"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
                            </button>
                            {historyMenu === goal.id && (
                              <div className="ghi-menu" onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="ghi-menu-item danger"
                                  onClick={() => { setHistoryMenu(null); setGoalToDelete({ id: goal.id, done: true }); }}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                  Eliminar
                                </button>
                              </div>
                            )}
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

          <AppFooter variant="light" />

        </div>
      </main>
      </div>
    </div>
  );
}

export default Goals;