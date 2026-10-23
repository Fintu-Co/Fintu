import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import { goalsApi } from '@/modules/goals/services/goalsApi';
import Sidebar from '@/shared/components/Sidebar';
import ConfirmDialog from '@/shared/components/ConfirmDialog';
/* Armazón compartido (layout + sidebar) — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './Goals.css';

const GOAL_TYPES = [
  {
    tipo: 'reducir_uso',
    titulo: 'Reducir uso de línea',
    descripcion: 'Baja el % de uso de una tarjeta',
    beneficio: 'Es lo más rápido para subir tu score: las centrales miran tu % de uso cada mes. Bajo 30% te ven como cliente sano.',
    color: 'slate',
    necesitaMeta: true,
    metaLabel: '¿A qué % quieres llegar?',
    metaPlaceholder: '30',
    metaSufijo: '%',
    necesitaFecha: true,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>),
  },
  {
    tipo: 'reducir_deuda',
    titulo: 'Reducir mi deuda',
    descripcion: 'Lleva una deuda a un monto objetivo',
    beneficio: 'Cada sol que bajas deja de generar intereses desde ese mismo mes. Con TEAs de 60–100%, es el ahorro más directo.',
    color: 'peach',
    necesitaMeta: true,
    metaLabel: '¿A cuánto quieres bajar la deuda?',
    metaPlaceholder: '500',
    metaSufijo: 'S/',
    necesitaFecha: true,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>),
  },
  {
    tipo: 'pago_total',
    titulo: 'Pagar el total de una tarjeta',
    descripcion: 'Deja una tarjeta en cero',
    beneficio: 'El banco solo cobra interés sobre lo que dejas al corte. Si dejas cero, usas la tarjeta gratis.',
    color: 'green',
    necesitaMeta: false,
    necesitaFecha: false,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>),
  },
  {
    tipo: 'no_atrasar',
    titulo: 'No atrasar pagos',
    descripcion: '3 meses seguidos al día',
    beneficio: 'Pagar a tiempo es lo que más pesa en tu score. Un atraso se reporta por años; la puntualidad lo repara.',
    color: 'mauve',
    necesitaMeta: false,
    necesitaFecha: false,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>),
  },
  {
    tipo: 'mantener_uso',
    titulo: 'Mantener uso bajo 30%',
    descripcion: 'Sostenerlo hasta una fecha',
    beneficio: 'Las centrales reportan tu uso cada mes: lo que suma es mantenerlo bajo en el tiempo, no bajarlo una vez.',
    color: 'terra',
    necesitaMeta: false,
    necesitaFecha: true,
    icono: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
  },
];

const MAX_ACTIVOS = 3;
const MESES_C = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fmt0 = (n) => Math.round(parseFloat(n || 0)).toLocaleString('es-PE');
const nombreBanco = (t) => t?.banco_nombre || t?.banco_nombre_custom || 'Banco';
const interesMensual = (t) => {
  const deuda = parseFloat(t.deuda_actual || 0);
  const tea = parseFloat(t.tasa_interes || 0);
  return tea > 0 ? deuda * (Math.pow(1 + tea / 100, 1 / 12) - 1) : 0;
};

/* ── Íconos ── */
const IcMenu  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>);
const IcPlus  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const IcCheck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>);
const IcTrash = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></svg>);

function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tarjetas, setTarjetas] = useState([]);
  const [goals, setGoals] = useState([]);
  const [completedGoals, setCompletedGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedTarjeta, setSelectedTarjeta] = useState(null);
  const [metaValor, setMetaValor] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  // Objetivo pendiente de eliminar: { id, done } (done = ya cumplido / del historial)
  const [goalToDelete, setGoalToDelete] = useState(null);
  const autoCompletandoRef = useRef(false);

  const tarjetasActivas = tarjetas.filter(t => !t.esta_vacia);
  const tarjetaSeleccionada = tarjetasActivas.find(t => t.id === selectedTarjeta);
  const deudaTarjeta = parseFloat(tarjetaSeleccionada?.deuda_actual || 0);
  const lineaTarjeta = parseFloat(tarjetaSeleccionada?.linea_credito || 1);
  const usoTarjeta = lineaTarjeta > 0 ? Math.round((deudaTarjeta / lineaTarjeta) * 100) : 0;
  const simboloTarjeta = tarjetaSeleccionada?.simbolo_moneda || 'S/';

  const cargarDatos = async (userId) => {
    try {
      setLoading(true);
      const [dataCards, dataGoals] = await Promise.all([cardsApi.getUserCards(userId), goalsApi.getByUser(userId)]);
      if (dataCards.success) setTarjetas(dataCards.tarjetas);
      if (dataGoals.success) { setGoals(dataGoals.objetivos); setCompletedGoals(dataGoals.completados); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const showMessage = (text, type) => { setMessage({ text, type }); setTimeout(() => setMessage(null), 4500); };
  const getGoalConfig = (tipo) => GOAL_TYPES.find(g => g.tipo === tipo) || GOAL_TYPES[0];

  const resetForm = () => { setSelectedType(null); setSelectedTarjeta(null); setMetaValor(''); setFechaLimite(''); };

  /* Abre el formulario con la meta ya armada (desde el "siguiente paso") */
  const prepararMeta = (tipo, tarjetaId) => {
    setSelectedType(tipo); setSelectedTarjeta(tarjetaId ?? null); setMetaValor(''); setFechaLimite('');
    setShowNewGoal(true);
    setTimeout(() => document.getElementById('nueva-meta')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const handleCreateGoal = async () => {
    if (!selectedType) return;
    const config = getGoalConfig(selectedType);
    if (config.necesitaMeta && !metaValor) return;
    if (!selectedTarjeta) return;

    // ── Validaciones de sentido: la meta solo se crea si de verdad ayuda ──
    const meta = parseFloat(metaValor);
    if (selectedType === 'reducir_uso') {
      if (!(meta > 0 && meta < 100)) { showMessage('La meta de uso debe estar entre 1% y 99%.', 'error'); return; }
      if (usoTarjeta <= meta) { showMessage(`Tu uso ya está en ${usoTarjeta}%. Elige una meta menor a tu uso actual.`, 'error'); return; }
    }
    if (selectedType === 'reducir_deuda') {
      if (!(meta >= 0)) { showMessage('Ingresa un monto válido.', 'error'); return; }
      if (deudaTarjeta <= meta) { showMessage(`Tu deuda ya es ${simboloTarjeta} ${deudaTarjeta.toLocaleString('es-PE')}. Elige un monto menor.`, 'error'); return; }
    }
    if (selectedType === 'pago_total' && deudaTarjeta <= 0) {
      showMessage('Esta tarjeta ya no tiene deuda; no hay nada que liquidar.', 'error'); return;
    }
    if (selectedType === 'mantener_uso') {
      if (usoTarjeta > 30) { showMessage(`Tu uso está en ${usoTarjeta}%. Primero bájalo con "Reducir uso de línea".`, 'error'); return; }
      if (!fechaLimite) { showMessage('Elige hasta cuándo quieres mantenerlo bajo 30%.', 'error'); return; }
    }

    const tarjeta = tarjetaSeleccionada;
    const nombreTarjeta = tarjeta ? `${nombreBanco(tarjeta)} — ${tarjeta.nombre_tarjeta || ''}` : null;
    try {
      setSaving(true);
      const data = await goalsApi.create({
        usuario_id: user.id, tipo: selectedType, descripcion: config.titulo,
        meta_valor: metaValor || null, fecha_limite: fechaLimite || null,
        tarjeta_id: selectedTarjeta || null, tarjeta_nombre: nombreTarjeta || null,
      });
      if (data.success) {
        showMessage('Meta creada. Su avance se actualiza solo.', 'success');
        setShowNewGoal(false); resetForm();
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
      // Pasarse del 30% rompe el "mantener": el avance cae
      if (uso > 30) return uso > 50 ? 10 : 25;
      // Bajo 30%: avanza con el tiempo hasta la fecha límite (o 3 meses por defecto)
      const inicio = new Date(goal.fecha_inicio);
      const fin = goal.fecha_limite ? new Date(goal.fecha_limite) : (() => { const f = new Date(inicio); f.setMonth(f.getMonth() + 3); return f; })();
      if (fin <= inicio) return 100;
      return Math.max(0, Math.min(100, Math.round(((new Date() - inicio) / (fin - inicio)) * 100)));
    }
    if (goal.tipo === 'no_atrasar') {
      if (!t) return 0;
      if (t.dias_al_pago < 0) return 5; // atrasado
      const inicio = new Date(goal.fecha_inicio);
      const meta = new Date(inicio); meta.setMonth(meta.getMonth() + 3);
      return Math.max(0, Math.min(100, Math.round(((new Date() - inicio) / (meta - inicio)) * 100)));
    }
    return 0;
  };

  const formatFecha = (iso) => { if (!iso) return null; const f = new Date(iso); return `${f.getDate()} ${MESES_C[f.getMonth()]} ${f.getFullYear()}`; };
  const diasRestantes = (iso) => {
    if (!iso) return null;
    const d = Math.ceil((new Date(iso) - new Date()) / 86400000);
    if (d < 0) return { texto: 'Venció', tono: 'danger' };
    if (d === 0) return { texto: 'Hoy', tono: 'urgente' };
    return { texto: d === 1 ? 'Mañana' : `En ${d} días`, tono: d <= 7 ? 'urgente' : '' };
  };
  const calcularProyeccion = (goal, pct) => {
    if (pct >= 100 || pct <= 0) return null;
    const diasTranscurridos = Math.max(1, Math.floor((new Date() - new Date(goal.fecha_inicio)) / 86400000));
    const diasRest = Math.ceil(diasTranscurridos / (pct / 100)) - diasTranscurridos;
    if (diasRest <= 0) return 'muy pronto';
    if (diasRest < 14) return `${diasRest} días`;
    if (diasRest < 60) return `unas ${Math.ceil(diasRest / 7)} semanas`;
    const m = Math.ceil(diasRest / 30);
    return `unos ${m} mes${m !== 1 ? 'es' : ''}`;
  };

  // Carga inicial
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatos(user.id);
  }, [user, navigate]);

  // Marca como logradas las metas que llegaron al 100%
  useEffect(() => {
    if (goals.length === 0 || tarjetasActivas.length === 0) return;
    if (autoCompletandoRef.current) return;
    const paraCompletar = goals.filter(g => !g.completado && calcularProgreso(g) >= 100);
    if (paraCompletar.length === 0) return;
    autoCompletandoRef.current = true;
    Promise.all(paraCompletar.map(goal => goalsApi.complete({ objetivo_id: goal.id, usuario_id: user?.id })))
      .then(() => { autoCompletandoRef.current = false; if (user?.id) cargarDatos(user.id); })
      .catch(() => { autoCompletandoRef.current = false; });
  }, [goals, tarjetas]);

  if (!user || loading) return (
    <div className="loading-screen"><div className="spinner"></div></div>
  );

  const goalsActivos = goals.filter(g => !g.completado);
  const puedeCrear = goalsActivos.length < MAX_ACTIVOS;
  const formVisible = puedeCrear && tarjetasActivas.length > 0 && (showNewGoal || goalsActivos.length === 0);

  /* ── Siguiente paso: la tarjeta que más cuesta (o la de más deuda) ── */
  const conDeuda = tarjetasActivas.filter(t => parseFloat(t.deuda_actual || 0) > 0);
  const masCara = [...conDeuda].sort((a, b) => (interesMensual(b) - interesMensual(a)) || (b.deuda_actual - a.deuda_actual))[0];
  const totalDeuda = tarjetasActivas.reduce((s, t) => s + parseFloat(t.deuda_actual || 0), 0);
  const totalLinea = tarjetasActivas.reduce((s, t) => s + parseFloat(t.linea_credito || 0), 0);
  const usoTotal = totalLinea > 0 ? Math.round((totalDeuda / totalLinea) * 100) : 0;
  const yaTieneMeta = (tipo, tarjetaId) => goalsActivos.some(g => g.tipo === tipo && g.tarjeta_id === tarjetaId);

  let paso;
  if (tarjetasActivas.length === 0) {
    paso = { titulo: 'Primero agrega una tarjeta.', texto: 'Las metas se miden con la deuda real de tus tarjetas.', boton: 'Ir a mis tarjetas', accion: () => navigate('/dashboard') };
  } else if (masCara) {
    const im = interesMensual(masCara);
    const s = masCara.simbolo_moneda || 'S/';
    const extra30 = usoTotal > 30 ? ` Y para bajar tu uso al 30%, paga S/ ${fmt0(totalDeuda - totalLinea * 0.3)} en total.` : '';
    paso = {
      titulo: `Baja primero tu ${nombreBanco(masCara)}.`,
      texto: (im >= 1
        ? `Te cuesta ~${s} ${fmt0(im)} al mes en intereses (TEA ${parseFloat(masCara.tasa_interes)}%)${conDeuda.length > 1 ? ', más que tus otras tarjetas' : ''}.`
        : `Es la tarjeta con más deuda: ${s} ${fmt0(masCara.deuda_actual)}.`) + extra30,
      boton: 'Crear meta para esta tarjeta',
      accion: () => prepararMeta('reducir_deuda', masCara.id),
      hecho: yaTieneMeta('reducir_deuda', masCara.id) || yaTieneMeta('pago_total', masCara.id),
    };
  } else {
    const t = tarjetasActivas[0];
    paso = {
      titulo: 'Estás sin deuda.',
      texto: 'Lo que sigue: mantener tu uso bajo 30% para que tu score siga subiendo.',
      boton: 'Crear meta: uso bajo 30%',
      accion: () => prepararMeta('mantener_uso', t.id),
      hecho: yaTieneMeta('mantener_uso', t.id),
    };
  }

  const renderGoal = (goal) => {
    const config = getGoalConfig(goal.tipo);
    const pct = Math.min(calcularProgreso(goal), 100);
    const dias = diasRestantes(goal.fecha_limite);
    const t = tarjetasActivas.find(x => x.id === goal.tarjeta_id);
    const s = t?.simbolo_moneda || 'S/';
    const deuda = t ? parseFloat(t.deuda_actual || 0) : 0;
    const uso = t && parseFloat(t.linea_credito) > 0 ? Math.round((deuda / parseFloat(t.linea_credito)) * 100) : 0;
    const proj = calcularProyeccion(goal, pct);
    const estado = pct >= 100 ? 'done' : dias?.tono === 'danger' ? 'danger' : dias?.tono === 'urgente' ? 'urgente' : 'curso';
    const estadoTxt = { done: 'Lograda', danger: 'Venció', urgente: 'Por vencer', curso: 'En curso' }[estado];

    const metaTxt = goal.meta_valor
      ? (config.metaSufijo === '%' ? `${goal.meta_valor}%` : `${s} ${fmt0(goal.meta_valor)}`)
      : { pago_total: `${s} 0`, no_atrasar: '3 meses al día', mantener_uso: 'Menos de 30%' }[goal.tipo] || '—';
    const ahoraTxt = !t ? '—'
      : ['reducir_uso', 'mantener_uso'].includes(goal.tipo) ? `${uso}%`
      : goal.tipo === 'no_atrasar' ? (t.dias_al_pago < 0 ? 'Atrasado' : 'Al día')
      : `${s} ${fmt0(deuda)}`;
    let venceTxt = dias ? dias.texto : 'Sin fecha';
    if (!dias && goal.tipo === 'no_atrasar' && goal.fecha_inicio) {
      const fin = new Date(goal.fecha_inicio); fin.setMonth(fin.getMonth() + 3);
      venceTxt = formatFecha(fin.toISOString());
    }

    return (
      <article className="gl-goal" key={goal.id}>
        <div className="gl-goal-head">
          <span className={`gl-ico is-${config.color}`}>{config.icono}</span>
          <div className="gl-goal-title">
            <h3>{goal.descripcion}</h3>
            {goal.tarjeta_nombre && <span>{goal.tarjeta_nombre.split('—')[0].trim()}</span>}
          </div>
          <span className={`gl-status is-${estado}`}>{estadoTxt}</span>
        </div>

        <div className="gl-progress">
          <div className="gl-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Avance de la meta">
            <div style={{ width: `${pct}%` }} />
          </div>
          <strong>{pct}%</strong>
        </div>

        <dl className="gl-facts">
          <div><dt>Ahora</dt><dd>{ahoraTxt}</dd></div>
          <div><dt>Meta</dt><dd>{metaTxt}</dd></div>
          <div><dt>Vence</dt><dd>{venceTxt}</dd></div>
        </dl>

        {proj && <p className="gl-proj">A este ritmo, la logras en {proj}.</p>}

        <div className="gl-goal-actions">
          {t ? <button className="gl-link" onClick={() => navigate(`/tarjeta/${t.slot_numero}`)}>Ver tarjeta <IcArrow /></button> : <span />}
          <button className="gl-icon-del" onClick={() => setGoalToDelete({ id: goal.id, done: false })} aria-label={`Abandonar ${goal.descripcion}`}>
            <IcTrash />
          </button>
        </div>
      </article>
    );
  };

  const config = selectedType ? getGoalConfig(selectedType) : null;

  return (
    <div className="dashboard-dark">
      <Sidebar active="objetivos" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <ConfirmDialog
        open={!!goalToDelete}
        title={goalToDelete?.done ? '¿Quitar del historial?' : '¿Abandonar esta meta?'}
        message={goalToDelete?.done
          ? 'Esta meta lograda se quitará de tu historial. No se puede deshacer.'
          : 'Dejarás de hacerle seguimiento. No se puede deshacer.'}
        confirmText={goalToDelete?.done ? 'Quitar' : 'Abandonar'}
        onConfirm={() => { const id = goalToDelete.id; setGoalToDelete(null); handleDelete(id); }}
        onCancel={() => setGoalToDelete(null)}
      />

      <div className="dashboard-layout">
        <main className="gl">

          {/* ── ENCABEZADO ── */}
          <header className="gl-top">
            <button className="gl-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><IcMenu /></button>
            <div className="gl-title">
              <h1>Mis objetivos</h1>
              <p>Metas concretas para pagar menos intereses y subir tu score.</p>
            </div>
            <button className="gl-avatar" onClick={() => navigate('/perfil')} aria-label="Mi perfil">
              {(user.nombre?.charAt(0) || '').toUpperCase()}{(user.apellido?.charAt(0) || '').toUpperCase()}
            </button>
          </header>

          {/* ── SIGUIENTE PASO ── */}
          <section className="gl-hero" aria-label="Tu siguiente paso">
            <div className="gl-hero-msg">
              <span className="gl-hero-tag">Tu siguiente paso</span>
              <h2>{paso.titulo}</h2>
              <p>{paso.texto}</p>
              {paso.hecho ? (
                <span className="gl-hero-done"><IcCheck /> Ya tienes una meta para esto</span>
              ) : (puedeCrear || tarjetasActivas.length === 0) ? (
                <button className="gl-btn gl-btn--peach" onClick={paso.accion}>{paso.boton} <IcArrow /></button>
              ) : (
                <span className="gl-hero-done">Ya tienes {MAX_ACTIVOS} metas activas: termina una para crear otra.</span>
              )}
            </div>
            <div className="gl-hero-stats">
              <div><strong>{goalsActivos.length}<small> de {MAX_ACTIVOS}</small></strong><span>Metas activas</span></div>
              <div><strong>{completedGoals.length}</strong><span>Logradas</span></div>
            </div>
          </section>

          {message && <div className={`gl-msg is-${message.type}`} role="status">{message.text}</div>}

          {/* ── METAS EN CURSO ── */}
          {goalsActivos.length > 0 && (
            <section className="gl-sec" aria-labelledby="gl-activas-t">
              <div className="gl-sec-head">
                <div>
                  <span className="gl-tag">En curso</span>
                  <h2 id="gl-activas-t">¿Cómo vas con tus metas?</h2>
                  <p>Se actualizan solas con la deuda real de tus tarjetas.</p>
                </div>
                {puedeCrear && !showNewGoal && (
                  <button className="gl-btn gl-btn--soft" onClick={() => { resetForm(); setShowNewGoal(true); }}>
                    <IcPlus /> Nueva meta
                  </button>
                )}
              </div>
              <div className="gl-goals">{goalsActivos.map(renderGoal)}</div>
            </section>
          )}

          {/* ── NUEVA META ── */}
          {formVisible && (
            <section className="gl-sec" id="nueva-meta" aria-labelledby="gl-nueva-t">
              <div className="gl-sec-head">
                <div>
                  <span className="gl-tag">Nueva meta</span>
                  <h2 id="gl-nueva-t">¿Qué quieres lograr?</h2>
                  <p>Elige una. Te decimos por qué ayuda y medimos el avance por ti.</p>
                </div>
              </div>

              <div className="gl-form">
                <div className="gl-types" role="radiogroup" aria-label="Tipo de meta">
                  {GOAL_TYPES.map(type => (
                    <button
                      key={type.tipo}
                      type="button"
                      role="radio"
                      aria-checked={selectedType === type.tipo}
                      aria-label={`${type.titulo}: ${type.descripcion}`}
                      className={`gl-type${selectedType === type.tipo ? ' is-on' : ''}`}
                      onClick={() => { setSelectedType(type.tipo); setSelectedTarjeta(null); setMetaValor(''); setFechaLimite(''); }}
                    >
                      <span className={`gl-ico is-${type.color}`}>{type.icono}</span>
                      <span className="gl-type-txt"><b>{type.titulo}</b><small>{type.descripcion}</small></span>
                    </button>
                  ))}
                </div>

                {config && (
                  <div className="gl-config">
                    <p className="gl-why"><b>Por qué ayuda:</b> {config.beneficio}</p>

                    <fieldset className="gl-field">
                      <legend>¿Para qué tarjeta?</legend>
                      <div className="gl-cards">
                        {tarjetasActivas.map(t => {
                          const u = t.linea_credito > 0 ? Math.round((t.deuda_actual / t.linea_credito) * 100) : 0;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className={`gl-card-opt${selectedTarjeta === t.id ? ' is-on' : ''}`}
                              aria-pressed={selectedTarjeta === t.id}
                              aria-label={`${nombreBanco(t)}, ${fmt0(t.deuda_actual)} de deuda, ${u}% de uso`}
                              onClick={() => setSelectedTarjeta(t.id)}
                            >
                              <b>{nombreBanco(t)}</b>
                              <small>{t.simbolo_moneda || 'S/'} {fmt0(t.deuda_actual)} · {u}% de uso</small>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    {tarjetaSeleccionada && (
                      <p className="gl-context">
                        {selectedType === 'reducir_uso' && (usoTarjeta > 30
                          ? <>Tu uso está en <b>{usoTarjeta}%</b>. Para llegar al 30%, paga <b>{simboloTarjeta} {fmt0(deudaTarjeta - lineaTarjeta * 0.3)}</b>.</>
                          : <>Tu uso ya está en <b>{usoTarjeta}%</b>, dentro del rango ideal.</>)}
                        {selectedType === 'reducir_deuda' && <>Hoy debes <b>{simboloTarjeta} {fmt0(deudaTarjeta)}</b>. ¿A cuánto quieres bajarla?</>}
                        {selectedType === 'pago_total' && <>Te falta pagar <b>{simboloTarjeta} {fmt0(deudaTarjeta)}</b> para dejarla en cero.</>}
                        {selectedType === 'mantener_uso' && <>Tu uso está en <b>{usoTarjeta}%</b>.{usoTarjeta > 30 ? ' Primero bájalo de 30%.' : ' Mantenlo así.'}</>}
                        {selectedType === 'no_atrasar' && <>Durante 3 meses, paga siempre antes de la fecha límite.</>}
                      </p>
                    )}

                    {tarjetaSeleccionada && (config.necesitaMeta || config.necesitaFecha) && (
                      <div className="gl-inputs">
                        {config.necesitaMeta && (
                          <label className="gl-input" htmlFor="gl-meta">
                            <span>{config.metaLabel}</span>
                            <span className="gl-input-box">
                              {config.metaSufijo !== '%' && <i>{simboloTarjeta}</i>}
                              <input id="gl-meta" aria-label={config.metaLabel} type="number" inputMode="decimal" min="0" placeholder={config.metaPlaceholder} value={metaValor} onChange={e => setMetaValor(e.target.value)} />
                              {config.metaSufijo === '%' && <i>%</i>}
                            </span>
                          </label>
                        )}
                        {config.necesitaFecha && (
                          <label className="gl-input">
                            <span>{selectedType === 'mantener_uso' ? '¿Hasta cuándo?' : 'Fecha límite (opcional)'}</span>
                            <span className="gl-input-box">
                              <input type="date" aria-label={selectedType === 'mantener_uso' ? 'Hasta cuándo' : 'Fecha límite'} value={fechaLimite} onChange={e => setFechaLimite(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                            </span>
                          </label>
                        )}
                      </div>
                    )}

                    <div className="gl-form-actions">
                      {goalsActivos.length > 0 && (
                        <button type="button" className="gl-btn gl-btn--ghost" onClick={() => { setShowNewGoal(false); resetForm(); }}>Cancelar</button>
                      )}
                      <button
                        type="button"
                        className="gl-btn gl-btn--green"
                        onClick={handleCreateGoal}
                        disabled={saving || !selectedTarjeta || (config.necesitaMeta && !metaValor) || (selectedType === 'mantener_uso' && !fechaLimite)}
                      >
                        {saving ? 'Guardando…' : <>Crear meta <IcCheck /></>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── LOGRADAS ── */}
          {completedGoals.length > 0 && (
            <section className="gl-sec" aria-labelledby="gl-logradas-t">
              <div className="gl-sec-head">
                <div>
                  <span className="gl-tag">Logradas</span>
                  <h2 id="gl-logradas-t">Lo que ya lograste</h2>
                </div>
              </div>
              <ul className="gl-done">
                {completedGoals.slice(0, 10).map(goal => {
                  const c = getGoalConfig(goal.tipo);
                  return (
                    <li key={goal.id}>
                      <span className={`gl-ico is-${c.color}`}>{c.icono}</span>
                      <span className="gl-done-txt">
                        <b>{goal.descripcion}</b>
                        <small>{goal.tarjeta_nombre ? `${goal.tarjeta_nombre.split('—')[0].trim()} · ` : ''}{formatFecha(goal.fecha_completado)}</small>
                      </span>
                      <span className="gl-status is-done"><IcCheck /> Lograda</span>
                      <button className="gl-icon-del" onClick={() => setGoalToDelete({ id: goal.id, done: true })} aria-label={`Quitar ${goal.descripcion} del historial`}>
                        <IcTrash />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default Goals;
