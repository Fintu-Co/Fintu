import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import { goalsApi } from '@/modules/goals/services/goalsApi';
import { movementsApi } from '@/modules/movements/services/movementsApi';
import { planDeudas, soloMinimos, tarjetasParaPlan, mesesDesde, mesFin } from '@/shared/utils/planDeudas';
import { textoMeses } from '@/shared/utils/intereses';
import { puntualidad, aISO } from '@/shared/utils/ciclo';
import Sidebar from '@/shared/components/Sidebar';
/* Armazón compartido (layout + sidebar) — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './Goals.css';

/*
  "Tu plan para salir de deudas"

  Responde lo que ninguna otra pantalla responde: con lo que puedo pagar al
  mes, ¿cuándo quedo en cero con TODAS mis tarjetas y cuánto pago a cada una?
  El cálculo vive en shared/utils/planDeudas.js (con tests).

  El plan se guarda como un objetivo de tipo `plan_deudas`:
    meta_valor   → lo que el usuario destina al mes
    descripcion  → JSON con la deuda de cada tarjeta al empezar ({ d: { id: deuda } }),
                   para comparar lo que debería deber hoy con lo que debe.
  Los tipos de meta anteriores quedaron retirados: al guardar un plan se
  desactivan los que sigan activos.
*/
const TIPO_PLAN = 'plan_deudas';

const fmt0 = (n) => Math.round(parseFloat(n || 0)).toLocaleString('es-PE');
const redondear10 = (n) => Math.ceil(n / 10) * 10;
const leerInicio = (goal) => {
  try { return JSON.parse(goal.descripcion)?.d || null; } catch { return null; }
};

/* ── Íconos ── */
const IcMenu  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>);
const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);

function Goals() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tarjetas, setTarjetas] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [monto, setMonto] = useState('');
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [racha, setRacha] = useState(null);

  const cargarDatos = async (userId) => {
    try {
      setLoading(true);
      const [dataCards, dataGoals] = await Promise.all([cardsApi.getUserCards(userId), goalsApi.getByUser(userId)]);
      if (dataCards.success) setTarjetas(dataCards.tarjetas.filter(t => !t.esta_vacia));
      if (dataGoals.success) setGoals(dataGoals.objetivos || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    cargarDatos(user.id);
  }, [user, navigate]);

  const lista = tarjetasParaPlan(tarjetas);
  const conDeuda = lista.filter(t => t.deuda > 0);
  const totalDeuda = lista.reduce((s, t) => s + t.deuda, 0);
  const plan = goals.find(g => g.tipo === TIPO_PLAN);
  const presupuestoGuardado = plan ? parseFloat(plan.meta_valor) || 0 : 0;
  const base = planDeudas(lista, 0);   // solo para los mínimos
  const desde = Math.max(10, redondear10(base.minimosTotal));
  const hasta = Math.max(desde, redondear10(totalDeuda));

  /* Monto inicial del editor: el guardado, o el doble de los mínimos */
  useEffect(() => {
    if (loading || monto !== '') return;
    setMonto(String(plan ? Math.round(presupuestoGuardado) : Math.min(hasta, redondear10(base.minimosTotal * 2) || desde)));
  }, [loading]);

  /* Sin deudas: racha de pagos completos a tiempo, con los movimientos reales */
  useEffect(() => {
    if (loading || totalDeuda > 0 || !tarjetas.length) return;
    let cancelado = false;
    (async () => {
      const hastaF = new Date();
      const desdeF = new Date(hastaF); desdeF.setMonth(desdeF.getMonth() - 12);
      const res = await Promise.all(tarjetas.map(async (t) => {
        try {
          const data = await movementsApi.getByRange({ tarjetaId: t.id, desde: aISO(desdeF), hasta: aISO(hastaF) });
          return puntualidad(t, data?.movimientos || []);
        } catch { return { evaluados: 0, aTiempo: 0 }; }
      }));
      if (!cancelado) setRacha(res.reduce((a, r) => ({ evaluados: a.evaluados + r.evaluados, aTiempo: a.aTiempo + r.aTiempo }), { evaluados: 0, aTiempo: 0 }));
    })();
    return () => { cancelado = true; };
  }, [loading, totalDeuda, tarjetas]);

  const showMessage = (text, type) => { setMessage({ text, type }); setTimeout(() => setMessage(null), 4500); };

  const guardarPlan = async () => {
    const presupuesto = parseFloat(monto) || 0;
    if (planDeudas(lista, presupuesto).estado !== 'ok') return;
    try {
      setSaving(true);
      // Un solo plan activo: se desactiva el anterior y las metas antiguas
      await Promise.all(goals.map(g => goalsApi.delete({ objetivo_id: g.id, usuario_id: user.id })));
      const inicio = Object.fromEntries(lista.filter(t => t.deuda > 0).map(t => [t.id, Math.round(t.deuda * 100) / 100]));
      const data = await goalsApi.create({
        usuario_id: user.id, tipo: TIPO_PLAN,
        descripcion: JSON.stringify({ d: inicio }),
        meta_valor: presupuesto,
      });
      if (data.success) {
        showMessage('Plan guardado. Cada mes te diremos cómo vas.', 'success');
        setEditando(false);
        cargarDatos(user.id);
      } else { showMessage(data.message, 'error'); }
    } catch (e) { console.error(e); showMessage('No se pudo guardar el plan.', 'error'); } finally { setSaving(false); }
  };

  if (!user || loading) return (
    <div className="loading-screen"><div className="spinner"></div></div>
  );

  const s = tarjetas[0]?.simbolo_moneda || 'S/';
  const mostrarEditor = !plan || editando;
  const presupuesto = mostrarEditor ? (parseFloat(monto) || 0) : presupuestoGuardado;
  const r = planDeudas(lista, presupuesto);
  const rMin = soloMinimos(lista);

  /* ── ¿Cómo vas? (plan guardado): deuda de hoy vs la que el plan esperaba ── */
  let avance = null;
  if (plan && !editando) {
    const inicio = leerInicio(plan) || {};
    const ids = Object.keys(inicio).map(Number);
    const deudaInicial = ids.reduce((acc, id) => acc + (inicio[id] || 0), 0);
    const deudaHoy = ids.reduce((acc, id) => acc + (lista.find(t => t.id === id)?.deuda || 0), 0);
    const meses = mesesDesde(plan.fecha_inicio);
    let esperado = null;
    if (meses >= 1) {
      const delPlan = planDeudas(lista.filter(t => ids.includes(t.id)).map(t => ({ ...t, deuda: inicio[t.id] })), presupuestoGuardado);
      esperado = delPlan.saldos[Math.min(meses, delPlan.saldos.length - 1)] ?? 0;
    }
    avance = {
      deudaInicial, deudaHoy, meses, esperado,
      pagado: Math.max(0, deudaInicial - deudaHoy),
      pct: deudaInicial > 0 ? Math.max(0, Math.min(100, Math.round(((deudaInicial - deudaHoy) / deudaInicial) * 100))) : 0,
    };
  }

  const chips = [
    { tag: 'Solo los mínimos', val: desde },
    { tag: 'El doble', val: Math.min(hasta, redondear10(base.minimosTotal * 2)) },
    { tag: 'Todo', val: hasta },
  ].filter((c, i, arr) => arr.findIndex(x => x.val === c.val) === i);

  const pagoNum = parseFloat(monto) || 0;
  const pctSlider = ((Math.min(hasta, Math.max(desde, pagoNum)) - desde) / Math.max(1, hasta - desde)) * 100;

  /* ── Bloques ── */
  const resultadoEditor = r.estado === 'ok' ? (
    <div className="gl-res">
      <p className="gl-res-big">Terminas en {mesFin(r.meses)}</p>
      <p className="gl-res-sub">
        {r.meses === 1 ? 'Este mismo mes' : `En ${textoMeses(r.meses)}`}, pagando <b>{s} {fmt0(r.intereses)} de intereses</b>.
      </p>
      {rMin && rMin.intereses - r.intereses >= 1 && (
        <p className="gl-res-ahorro">
          Solo con los mínimos serían {textoMeses(rMin.meses)} y {s} {fmt0(rMin.intereses)}: <b>ahorras {s} {fmt0(rMin.intereses - r.intereses)}</b>.
        </p>
      )}
    </div>
  ) : r.estado === 'no_alcanza_minimos' ? (
    <div className="gl-res is-bad">
      <p className="gl-res-big">No alcanza para los mínimos</p>
      <p className="gl-res-sub">Tus pagos mínimos suman {s} {fmt0(r.minimosTotal)}. Con menos, caes en mora.</p>
    </div>
  ) : r.estado === 'no_baja' ? (
    <div className="gl-res is-bad">
      <p className="gl-res-big">Tu deuda no bajaría</p>
      <p className="gl-res-sub">Con {s} {fmt0(presupuesto)} los intereses se comen el pago. Sube el monto.</p>
    </div>
  ) : null;

  const editor = (
    <div className="gl-editor">
      <label className="gl-editor-label" htmlFor="gl-monto">¿Cuánto puedes pagar al mes entre todas tus tarjetas?</label>
      <div className="gl-monto">
        <span>{s}</span>
        <input id="gl-monto" type="number" inputMode="decimal" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      <input
        className="gl-slider" type="range" min={desde} max={hasta} step="10"
        value={Math.min(hasta, Math.max(desde, pagoNum))}
        onChange={(e) => setMonto(e.target.value)}
        aria-label="Monto mensual"
        style={{ '--p': `${pctSlider}%` }}
      />
      <div className="gl-chips">
        {chips.map(c => (
          <button key={c.tag} type="button" className={`gl-chip${Math.abs(pagoNum - c.val) < 1 ? ' is-on' : ''}`} onClick={() => setMonto(String(c.val))}>
            {c.tag} <b>{s} {fmt0(c.val)}</b>
          </button>
        ))}
      </div>
      {resultadoEditor}
      <div className="gl-editor-actions">
        {plan && <button type="button" className="gl-btn gl-btn--ghost-dark" onClick={() => { setEditando(false); setMonto(String(Math.round(presupuestoGuardado))); }}>Cancelar</button>}
        <button type="button" className="gl-btn gl-btn--peach" disabled={saving || r.estado !== 'ok'} onClick={guardarPlan}>
          {saving ? 'Guardando…' : plan ? 'Guardar nuevo monto' : 'Guardar mi plan'} <IcArrow />
        </button>
      </div>
    </div>
  );

  let hero;
  if (lista.length === 0) {
    hero = (
      <section className="gl-hero gl-hero--solo">
        <div className="gl-hero-msg">
          <span className="gl-hero-tag">Empieza aquí</span>
          <h2>Primero agrega una tarjeta.</h2>
          <p>El plan se arma con la deuda, la TEA y el pago mínimo de tus tarjetas.</p>
          <button className="gl-btn gl-btn--peach" onClick={() => navigate('/dashboard')}>Ir a mis tarjetas <IcArrow /></button>
        </div>
      </section>
    );
  } else if (totalDeuda <= 0) {
    hero = (
      <section className="gl-hero gl-hero--solo">
        <div className="gl-hero-msg">
          <span className="gl-hero-tag">Sin deudas</span>
          <h2>No tienes deudas en tus tarjetas.</h2>
          <p>
            {racha === null ? 'Revisando tus pagos…'
              : racha.evaluados === 0 ? 'Cuando venza tu próximo pago, verás aquí tu racha de pagos completos a tiempo.'
              : `Pagaste el total a tiempo en ${racha.aTiempo} de tus últimos ${racha.evaluados} ${racha.evaluados === 1 ? 'pago' : 'pagos'}. `}
            {racha?.evaluados > 0 && 'Sigue pagando el total antes de cada fecha de pago: así no pagas intereses y tu historial mejora.'}
          </p>
        </div>
      </section>
    );
  } else if (mostrarEditor) {
    hero = (
      <section className="gl-hero">
        <div className="gl-hero-msg">
          <span className="gl-hero-tag">{plan ? 'Cambiar monto' : 'Arma tu plan'}</span>
          <h2>Debes {s}&nbsp;{fmt0(totalDeuda)} {conDeuda.length === 1 ? `en tu ${conDeuda[0].nombre}` : `entre tus ${conDeuda.length} tarjetas`}.</h2>
          <p>
            Dinos cuánto puedes pagar al mes y te decimos cuándo terminas, cuánto pagas de intereses y cuánto darle a cada tarjeta.
            El extra va primero a la que más te cobra.
          </p>
        </div>
        {editor}
      </section>
    );
  } else {
    hero = (
      <section className="gl-hero">
        <div className="gl-hero-msg">
          <span className="gl-hero-tag">Tu plan</span>
          <h2>{r.estado === 'ok' ? `Sales de deudas en ${mesFin(r.meses)}.` : 'Tu plan necesita un ajuste.'}</h2>
          <p>
            {r.estado === 'ok'
              ? <>Pagando {s} {fmt0(presupuestoGuardado)} al mes{conDeuda.length > 1 ? ' entre tus tarjetas' : ''}: {r.meses === 1 ? 'este mes terminas' : `te faltan ${textoMeses(r.meses)}`} y {s} {fmt0(r.intereses)} de intereses.</>
              : <>Con {s} {fmt0(presupuestoGuardado)} al mes ya no alcanza: {r.estado === 'no_alcanza_minimos' ? `tus mínimos suman ${s} ${fmt0(r.minimosTotal)}` : 'los intereses se comen el pago'}. Cambia el monto.</>}
          </p>
          <button className="gl-btn gl-btn--ghost-dark" onClick={() => { setEditando(true); setMonto(String(Math.round(presupuestoGuardado))); }}>Cambiar monto</button>
        </div>
        {avance && (
          <div className="gl-avance">
            <span className="gl-editor-label">¿Cómo vas?</span>
            <b className="gl-avance-num">{avance.pct}%</b>
            <div className="gl-avance-bar"><div style={{ width: `${avance.pct}%` }} /></div>
            <p>Ya bajaste {s} {fmt0(avance.pagado)} de {s} {fmt0(avance.deudaInicial)}.</p>
            {avance.esperado === null ? (
              <p className="gl-avance-nota">Empezaste el plan este mes. En un mes te diremos si vas al día.</p>
            ) : avance.deudaHoy <= avance.esperado + 1 ? (
              <p className="gl-avance-nota is-good">
                {avance.esperado - avance.deudaHoy >= 1 ? `Vas adelantado: debes ${s} ${fmt0(avance.esperado - avance.deudaHoy)} menos de lo planeado.` : 'Vas al día con tu plan.'}
              </p>
            ) : (
              <p className="gl-avance-nota is-bad">
                Vas {s} {fmt0(avance.deudaHoy - avance.esperado)} atrás del plan. Si puedes, súmalo a tu pago de este mes.
              </p>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="dashboard-dark">
      <Sidebar active="objetivos" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout">
        <main className="gl">

          <header className="gl-top">
            <button className="gl-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><IcMenu /></button>
            <div className="gl-title">
              <h1>Tu plan para salir de deudas</h1>
              <p>Cuánto pagar cada mes, a qué tarjeta primero y cuándo quedas en cero.</p>
            </div>
            <button className="gl-avatar" onClick={() => navigate('/perfil')} aria-label="Mi perfil">
              {(user.nombre?.charAt(0) || '').toUpperCase()}{(user.apellido?.charAt(0) || '').toUpperCase()}
            </button>
          </header>

          {hero}

          {message && <div className={`gl-msg is-${message.type}`} role="status">{message.text}</div>}

          {/* ── ESTE MES ── */}
          {totalDeuda > 0 && r.primerMes.length > 0 && (
            <section className="gl-sec" aria-labelledby="gl-mes-t">
              <div className="gl-sec-head">
                <div>
                  <span className="gl-tag">Este mes</span>
                  <h2 id="gl-mes-t">¿Cuánto pagar a cada tarjeta?</h2>
                  <p>{s} {fmt0(presupuesto)} repartidos así. Paga antes de la fecha de pago de cada una.</p>
                </div>
              </div>
              <ul className="gl-reparto">
                {r.primerMes.filter(p => p.pago > 0.5).map(p => (
                  <li key={p.id} className={p.prioridad ? 'is-prioridad' : ''}>
                    <div className="gl-reparto-txt">
                      <b>{p.nombre}</b>
                      <small>
                        {conDeuda.length === 1 ? 'Todo tu monto va aquí'
                          : p.prioridad ? 'Primero esta: es la que más te cobra'
                          : p.minimoEstimado ? 'Mínimo estimado (registra tu pago mínimo)' : 'El pago mínimo'}
                        {r.terminaMes[p.id] && r.estado === 'ok' ? ` · queda en cero en ${mesFin(r.terminaMes[p.id])}` : ''}
                      </small>
                    </div>
                    <strong>{s} {fmt0(p.pago)}</strong>
                  </li>
                ))}
              </ul>
              <p className="gl-nota">
                El plan es para la deuda de hoy. Si sigues usando tus tarjetas, paga esos consumos completos aparte; si no, el plan se alarga.
              </p>
            </section>
          )}

          {/* ── POR QUÉ ESTE ORDEN ── */}
          {conDeuda.length > 1 && (
            <section className="gl-sec" aria-labelledby="gl-orden-t">
              <div className="gl-sec-head">
                <div>
                  <span className="gl-tag">Por qué</span>
                  <h2 id="gl-orden-t">¿Por qué este orden?</h2>
                </div>
              </div>
              <div className="gl-porque">
                <p>
                  A todas les pagas al menos el mínimo para no caer en mora. Lo que sobra va a la tarjeta con la <b>TEA más alta</b>,
                  porque cada sol que le bajas deja de generar el interés más caro. Cuando queda en cero, ese dinero pasa a la siguiente.
                  Es la forma de pagar menos intereses en total.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default Goals;
