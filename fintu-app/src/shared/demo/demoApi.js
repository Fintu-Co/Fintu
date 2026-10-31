/**
 * MODO DEMO — la app funciona sin cuenta y sin backend.
 *
 * Mientras la demo está activa, `request()` (shared/services/http.js) no llama
 * al servidor: responde este simulador, con las mismas formas de respuesta que
 * el backend real. Los datos son DE EJEMPLO (no son de ninguna persona) y viven
 * solo en memoria: al recargar la página vuelven a su estado inicial y nada se
 * guarda en ningún lado.
 *
 * Las fechas se calculan desde hoy con el mismo ciclo de facturación que usa la
 * app, así la demo siempre se ve actual (un ciclo pagado a tiempo, uno por
 * vencer y el que está acumulando).
 */

import { calcularCiclo, aISO } from '@/shared/utils/ciclo';
import { parseISODate } from '@/shared/utils/fecha';

const CLAVE = 'fintu_demo';

export const DEMO_USER = { id: 0, nombre: 'Invitado', apellido: 'Demo', email: 'demo@fintu.app', ha_pagado: 1 };

export function demoActiva() {
  try { return localStorage.getItem(CLAVE) === '1'; } catch { return false; }
}

/** Entra a la demo: sesión de ejemplo (el token no sirve contra el backend). */
export function iniciarDemo() {
  localStorage.setItem(CLAVE, '1');
  localStorage.setItem('token', 'demo');
  localStorage.setItem('user', JSON.stringify(DEMO_USER));
  estado = null;   // datos frescos
}

export function salirDemo() {
  localStorage.removeItem(CLAVE);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  estado = null;
}

/* Catálogo de bancos: el mismo del backend (seed). */
const BANCOS = [
  { id: 1, nombre: 'BCP', tea_minima: '76.90', tea_maxima: '107.00', tea_promedio: '91.45' },
  { id: 2, nombre: 'Interbank', tea_minima: '70.00', tea_maxima: '191.71', tea_promedio: '85.00' },
  { id: 3, nombre: 'BBVA', tea_minima: '39.99', tea_maxima: '109.99', tea_promedio: '84.99' },
  { id: 4, nombre: 'Scotiabank', tea_minima: '19.99', tea_maxima: '112.98', tea_promedio: '75.00' },
  { id: 5, nombre: 'BanBif', tea_minima: '63.00', tea_maxima: '82.00', tea_promedio: '72.50' },
  { id: 6, nombre: 'Banco Ripley', tea_minima: '15.94', tea_maxima: '109.83', tea_promedio: '62.89' },
  { id: 7, nombre: 'Banco Falabella', tea_minima: '34.20', tea_maxima: '95.99', tea_promedio: '65.10' },
  { id: 8, nombre: 'Diners Club', tea_minima: '12.00', tea_maxima: '79.00', tea_promedio: '45.50' },
  { id: 9, nombre: 'Tarjeta Cencosud', tea_minima: '34.90', tea_maxima: '116.00', tea_promedio: '75.45' },
  { id: 10, nombre: 'Financiera Oh!', tea_minima: '54.92', tea_maxima: '109.83', tea_promedio: '82.38' },
];

/* ── Datos de ejemplo ── */
let estado = null;
let siguienteId = 1000;

const dinero = (n) => (Math.round(n * 100) / 100).toFixed(2);
const sumarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const conHora = (d) => `${aISO(d)} 12:00:00`;

function tarjetaVacia(slot) {
  return {
    id: 900 + slot, usuario_id: 0, slot_numero: slot, esta_vacia: 1, banco_id: null, banco_nombre_custom: null,
    nombre_tarjeta: null, linea_credito: null, deuda_actual: '0.00', pago_minimo: '0.00', moneda: 'Soles',
    simbolo_moneda: 'S/', dia_inicio_ciclo: null, dia_cierre_ciclo: null, dia_pago: null, tasa_interes: null,
    comision_mantenimiento: null, categoria_principal: null, notificar_dias_antes_cierre: 3, notificar_dias_antes_pago: 5,
    banco_nombre: null, banco_tea: null,
  };
}

function nuevaTarjeta(slot, banco, datos) {
  return {
    ...tarjetaVacia(slot), id: 100 + slot, esta_vacia: 0, banco_id: banco.id, banco_nombre: banco.nombre,
    banco_tea: banco.tea_promedio, ...datos,
  };
}

/** Movimientos de un ciclo: consumos dentro del ciclo y, opcional, un pago. */
function movimientosDeCiclo(t, offset, consumos, pagoPct, hoy) {
  const c = calcularCiclo(t, hoy, offset);
  const movs = [];
  consumos.forEach(([dia, monto, desc]) => {
    const f = sumarDias(c.inicio, dia);
    if (f <= hoy) movs.push({ tipo: 'gasto', monto, descripcion: desc, fecha: f });
  });
  const total = movs.reduce((s, m) => s + m.monto, 0);
  const fechaPago = sumarDias(c.pago, -3);
  if (pagoPct > 0 && total > 0 && fechaPago <= hoy) {
    movs.push({ tipo: 'pago', monto: Math.round(total * pagoPct * 100) / 100, descripcion: 'Pago de tarjeta', fecha: fechaPago });
  }
  return movs;
}

function crearEstado() {
  const hoy = new Date();
  const bcp = nuevaTarjeta(1, BANCOS[0], {
    linea_credito: '6000.00', pago_minimo: '150.00', tasa_interes: '92.50',
    dia_inicio_ciclo: 16, dia_cierre_ciclo: 15, dia_pago: 10,
  });
  const ibk = nuevaTarjeta(2, BANCOS[1], {
    linea_credito: '4000.00', pago_minimo: '80.00', tasa_interes: '87.50',
    dia_inicio_ciclo: 26, dia_cierre_ciclo: 25, dia_pago: 20,
  });

  const movs = [];
  const agregar = (t, lista) => lista.forEach((m) => movs.push({
    id: siguienteId++, tarjeta_id: t.id, usuario_id: 0, tipo: m.tipo, monto: m.monto, descripcion: m.descripcion,
    fecha_movimiento: conHora(m.fecha),
  }));

  // BCP: pagó completo a tiempo los dos ciclos anteriores; el actual acumula
  agregar(bcp, movimientosDeCiclo(bcp, -2, [[2, 340, 'Ropa'], [9, 86.5, 'Farmacia'], [18, 210, 'Restaurante']], 1, hoy));
  agregar(bcp, movimientosDeCiclo(bcp, -1, [[1, 520, 'Supermercado'], [6, 139.9, 'Streaming y música'], [14, 1200, 'Pasajes'], [22, 95, 'Gasolina']], 0.45, hoy));
  agregar(bcp, movimientosDeCiclo(bcp, 0, [[1, 260, 'Supermercado'], [4, 79.9, 'Delivery'], [8, 180, 'Regalo']], 0, hoy));

  // Interbank: un ciclo pagado a tiempo y uno con saldo pendiente
  agregar(ibk, movimientosDeCiclo(ibk, -2, [[3, 150, 'Cine'], [12, 420, 'Electrodoméstico']], 1, hoy));
  agregar(ibk, movimientosDeCiclo(ibk, -1, [[2, 230, 'Supermercado'], [10, 65, 'Taxi'], [19, 310, 'Zapatillas']], 0.3, hoy));
  agregar(ibk, movimientosDeCiclo(ibk, 0, [[1, 120, 'Restaurante'], [5, 49.9, 'Suscripción']], 0, hoy));

  const s = { tarjetas: [bcp, ibk, tarjetaVacia(3), tarjetaVacia(4)], movimientos: movs, objetivos: [], sentinel: null };
  [bcp, ibk].forEach((t) => recalcularDeuda(s, t.id));
  return s;
}

function datos() {
  if (!estado) estado = crearEstado();
  return estado;
}

function recalcularDeuda(s, tarjetaId) {
  const t = s.tarjetas.find((x) => x.id === tarjetaId);
  if (!t) return;
  const neto = s.movimientos
    .filter((m) => m.tarjeta_id === tarjetaId)
    .reduce((acc, m) => acc + (m.tipo === 'gasto' ? m.monto : -m.monto), 0);
  t.deuda_actual = dinero(Math.max(0, neto));
}

/* ── Formas de respuesta del backend ── */
function movParaApi(m) {
  const f = parseISODate(m.fecha_movimiento);
  const dd = String(f.getDate()).padStart(2, '0');
  const mm = String(f.getMonth() + 1).padStart(2, '0');
  return {
    ...m, monto: dinero(m.monto), ciclo_mes: f.getMonth() + 1, ciclo_anio: f.getFullYear(),
    fecha_formateada: `${dd}/${mm}/${f.getFullYear()} 12:00`,
  };
}

const ordenDesc = (a, b) => parseISODate(b.fecha_movimiento) - parseISODate(a.fecha_movimiento) || b.id - a.id;
const deTarjeta = (s, id) => s.movimientos.filter((m) => m.tarjeta_id === Number(id));

function chartDetallado(s, id, dias) {
  const t = s.tarjetas.find((x) => x.id === Number(id));
  if (!t) return { success: false };
  const hoy = new Date();
  const desde = sumarDias(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()), -(dias - 1));
  const enVentana = deTarjeta(s, id).filter((m) => parseISODate(m.fecha_movimiento) >= desde)
    .sort((a, b) => parseISODate(a.fecha_movimiento) - parseISODate(b.fecha_movimiento));

  const deudaFinal = parseFloat(t.deuda_actual);
  const neto = enVentana.reduce((acc, m) => acc + (m.tipo === 'gasto' ? m.monto : -m.monto), 0);
  const deudaInicial = deudaFinal - neto;

  // Un punto por día con movimientos (más el punto inicial)
  const porDia = new Map();
  enVentana.forEach((m) => {
    const k = m.fecha_movimiento.slice(0, 10);
    const d = porDia.get(k) || { gasto: 0, pago: 0 };
    d[m.tipo === 'gasto' ? 'gasto' : 'pago'] += m.monto;
    porDia.set(k, d);
  });
  let acumulada = deudaInicial;
  const chartData = [{ fecha: `${aISO(desde)}T12:00:00`, tipo: 'inicial', gasto: 0, pago: 0, deuda_acumulada: deudaInicial }];
  [...porDia.entries()].forEach(([k, d]) => {
    acumulada += d.gasto - d.pago;
    chartData.push({ fecha: `${k}T12:00:00`, tipo: d.gasto ? 'gasto' : 'pago', gasto: d.gasto, pago: d.pago, deuda_acumulada: acumulada });
  });

  const gastos = chartData.filter((p) => p.gasto > 0);
  const pagos = chartData.filter((p) => p.pago > 0);
  const pico = gastos.sort((a, b) => b.gasto - a.gasto)[0];
  const mejor = pagos.sort((a, b) => b.pago - a.pago)[0];
  const linea = parseFloat(t.linea_credito);
  const totalGastos = enVentana.filter((m) => m.tipo === 'gasto').reduce((a, m) => a + m.monto, 0);
  const totalPagos = enVentana.filter((m) => m.tipo === 'pago').reduce((a, m) => a + m.monto, 0);

  return {
    success: true,
    chartData,
    insights: {
      pico_gasto: pico ? { monto: pico.gasto, fecha: pico.fecha } : null,
      mejor_pago: mejor ? { monto: mejor.pago, fecha: mejor.fecha } : null,
      total_gastos: totalGastos, total_pagos: totalPagos,
      num_gastos: enVentana.filter((m) => m.tipo === 'gasto').length,
      num_pagos: enVentana.filter((m) => m.tipo === 'pago').length,
      promedio_gasto_diario: totalGastos / dias,
      deuda_inicial: deudaInicial, deuda_final: deudaFinal, variacion_deuda: deudaFinal - deudaInicial,
      linea_credito: linea, uso_30_porciento: linea * 0.3, uso_70_porciento: linea * 0.7,
    },
  };
}

/* Misma clasificación que el backend (analytics/domain/UsageBehavior.js) */
function analisisUso(s, id) {
  const t = s.tarjetas.find((x) => x.id === Number(id));
  if (!t) return { success: false };
  const hoy = new Date();
  const actual = calcularCiclo(t, hoy, 0);
  const anterior = calcularCiclo(t, hoy, -1);
  const dentro = (m, c) => { const f = parseISODate(m.fecha_movimiento); return f >= c.inicio && f <= sumarDias(c.cierre, 1); };
  const movs = deTarjeta(s, id);
  const gastosAnterior = movs.filter((m) => m.tipo === 'gasto' && dentro(m, anterior)).reduce((a, m) => a + m.monto, 0);
  const delActual = movs.filter((m) => dentro(m, actual));
  const gastosActual = delActual.filter((m) => m.tipo === 'gasto').reduce((a, m) => a + m.monto, 0);
  const pagosActual = delActual.filter((m) => m.tipo === 'pago').reduce((a, m) => a + m.monto, 0);
  const numGastos = delActual.filter((m) => m.tipo === 'gasto').length;
  const numPagos = delActual.filter((m) => m.tipo === 'pago').length;
  const linea = parseFloat(t.linea_credito);
  const uso = Math.round((parseFloat(t.deuda_actual) / linea) * 100);

  let variacion = 0, tendencia = 'neutral';
  if (gastosAnterior > 0) {
    variacion = Math.round(((gastosActual - gastosAnterior) / gastosAnterior) * 100);
    tendencia = variacion > 0 ? 'up' : variacion < 0 ? 'down' : 'neutral';
  } else if (gastosActual > 0) { variacion = 100; tendencia = 'up'; }

  const promedio = numGastos > 0 ? gastosActual / numGastos : 0;
  const ratio = gastosActual > 0 ? pagosActual / gastosActual : 0;
  let clasificacion, descripcion;
  if (uso <= 20 && ratio > 0.8) { clasificacion = 'Conservador'; descripcion = 'Usas poco tu línea y pagas regularmente. Mantén este hábito.'; }
  else if (uso <= 40 && ratio > 0.6 && numPagos >= 2) { clasificacion = 'Estratégico'; descripcion = 'Usas tu crédito inteligentemente y pagas a tiempo.'; }
  else if (uso > 70 || ratio < 0.3) { clasificacion = 'En Riesgo'; descripcion = 'Tu nivel de uso es alto. Prioriza pagar tu deuda pronto.'; }
  else if (numGastos > 10 && promedio < linea * 0.05) { clasificacion = 'Impulsivo'; descripcion = 'Haces muchas compras pequeñas. Intenta planificar mejor.'; }
  else { clasificacion = 'Moderado'; descripcion = 'Tu uso es normal. Mantén tus pagos al día.'; }

  return {
    success: true,
    analysis: {
      porcentaje_uso_actual: uso, gastos_ciclo_anterior: gastosAnterior, gastos_ciclo_actual: gastosActual,
      variacion_porcentaje: variacion, tendencia, clasificacion, descripcion_clasificacion: descripcion,
      num_gastos: numGastos, num_pagos: numPagos, promedio_gasto_por_transaccion: promedio, ratio_gasto_pago: ratio,
    },
  };
}

const NO_DISPONIBLE = { success: false, message: 'Esto no está disponible en la demo. Crea tu cuenta para usarlo.' };

/**
 * Responde como el backend. `path` incluye la query (p. ej. "/api/movements/card/101?limite=6").
 */
export async function demoRequest(path, options = {}) {
  const s = datos();
  const metodo = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const url = new URL(path, 'http://demo.local');
  const ruta = url.pathname;
  const q = url.searchParams;
  let m;

  /* ── Tarjetas ── */
  if (ruta === '/api/cards/user') return { success: true, tarjetas: s.tarjetas.map((t) => ({ ...t })) };
  if (ruta === '/api/cards/bancos') return { success: true, bancos: BANCOS };
  if (ruta === '/api/cards/update' && metodo === 'PUT') {
    const t = s.tarjetas.find((x) => x.slot_numero === Number(body.slot_numero));
    if (!t) return { success: false, message: 'Tarjeta no encontrada' };
    const banco = BANCOS.find((b) => b.id === Number(body.banco_id));
    Object.assign(t, {
      ...body, id: t.esta_vacia ? 100 + t.slot_numero : t.id, esta_vacia: 0,
      banco_id: banco ? banco.id : null, banco_nombre: banco ? banco.nombre : null, banco_tea: banco ? banco.tea_promedio : null,
      linea_credito: dinero(parseFloat(body.linea_credito) || 0), deuda_actual: dinero(parseFloat(body.deuda_actual) || 0),
      pago_minimo: dinero(parseFloat(body.pago_minimo) || 0), tasa_interes: body.tasa_interes != null ? dinero(parseFloat(body.tasa_interes)) : null,
    });
    return { success: true, message: 'Tarjeta guardada (solo en esta demo)' };
  }
  if (ruta === '/api/cards/clear' && metodo === 'PUT') {
    const i = s.tarjetas.findIndex((x) => x.slot_numero === Number(body.slotNumero ?? body.slot_numero));
    if (i >= 0) {
      s.movimientos = s.movimientos.filter((mv) => mv.tarjeta_id !== s.tarjetas[i].id);
      s.tarjetas[i] = tarjetaVacia(s.tarjetas[i].slot_numero);
    }
    return { success: true };
  }
  if (ruta === '/api/cards/update-deuda' && metodo === 'PUT') {
    const t = s.tarjetas.find((x) => x.id === Number(body.tarjeta_id ?? body.tarjetaId));
    if (t) t.deuda_actual = dinero(parseFloat(body.deuda_actual ?? body.deuda) || 0);
    return { success: true };
  }
  if ((m = ruta.match(/^\/api\/cards\/(\d+)$/))) {
    const t = s.tarjetas.find((x) => x.id === Number(m[1]));
    return t ? { success: true, tarjeta: { ...t } } : { success: false, message: 'Tarjeta no encontrada' };
  }

  /* ── Movimientos ── */
  if ((m = ruta.match(/^\/api\/movements\/card\/(\d+)$/))) {
    const limite = Number(q.get('limite')) || 50;
    return { success: true, movimientos: deTarjeta(s, m[1]).sort(ordenDesc).slice(0, limite).map(movParaApi) };
  }
  if (ruta === '/api/movements/range') {
    const desde = parseISODate(q.get('desde')), hasta = sumarDias(parseISODate(q.get('hasta')), 1);
    const lista = deTarjeta(s, q.get('tarjetaId')).filter((mv) => {
      const f = parseISODate(mv.fecha_movimiento); return f >= desde && f < hasta;
    });
    return { success: true, movimientos: lista.sort(ordenDesc).map(movParaApi) };
  }
  if ((m = ruta.match(/^\/api\/movements\/chart-detailed\/(\d+)$/))) return chartDetallado(s, m[1], Number(q.get('dias')) || 14);
  if ((m = ruta.match(/^\/api\/movements\/stats\/(\d+)$/))) {
    const lista = deTarjeta(s, m[1]);
    const g = lista.filter((mv) => mv.tipo === 'gasto'), p = lista.filter((mv) => mv.tipo === 'pago');
    const tg = g.reduce((a, mv) => a + mv.monto, 0), tp = p.reduce((a, mv) => a + mv.monto, 0);
    return { success: true, stats: { total_gastos: tg, total_pagos: tp, cantidad_gastos: g.length, cantidad_pagos: p.length, saldo_neto: tg - tp } };
  }
  if (ruta === '/api/movements/create' && metodo === 'POST') {
    const tarjetaId = Number(body.tarjeta_id);
    s.movimientos.push({
      id: siguienteId++, tarjeta_id: tarjetaId, usuario_id: 0, tipo: body.tipo, monto: parseFloat(body.monto) || 0,
      descripcion: body.descripcion || null, fecha_movimiento: `${(body.fecha_movimiento || aISO(new Date())).slice(0, 10)} 12:00:00`,
    });
    recalcularDeuda(s, tarjetaId);
    return { success: true, message: 'Movimiento registrado (solo en esta demo)' };
  }
  if (ruta === '/api/movements/delete' && metodo === 'DELETE') {
    const mv = s.movimientos.find((x) => x.id === Number(body.movimientoId ?? body.movimiento_id ?? body.id));
    if (mv) { s.movimientos = s.movimientos.filter((x) => x !== mv); recalcularDeuda(s, mv.tarjeta_id); }
    return { success: true };
  }
  if ((m = ruta.match(/^\/api\/analytics\/usage-analysis\/(\d+)$/))) return analisisUso(s, m[1]);

  /* ── Plan (objetivos) ── */
  if (ruta === '/api/goals/user') return { success: true, objetivos: s.objetivos.filter((g) => g.activo), completados: [] };
  if (ruta === '/api/goals/create' && metodo === 'POST') {
    s.objetivos.push({
      id: siguienteId++, usuario_id: 0, tarjeta_id: body.tarjeta_id || null, tarjeta_nombre: body.tarjeta_nombre || null,
      tipo: body.tipo, descripcion: body.descripcion || null, meta_valor: body.meta_valor != null ? dinero(parseFloat(body.meta_valor)) : null,
      progreso_actual: '0.00', fecha_inicio: aISO(new Date()), fecha_limite: body.fecha_limite || null, completado: 0, activo: 1,
    });
    return { success: true, message: 'Plan guardado (solo en esta demo)' };
  }
  if (ruta === '/api/goals/eliminar' && metodo === 'DELETE') {
    const g = s.objetivos.find((x) => x.id === Number(body.objetivo_id));
    if (g) g.activo = 0;
    return { success: true };
  }
  if (ruta.startsWith('/api/goals/')) return { success: true };

  /* ── Cuenta ── */
  if ((m = ruta.match(/^\/api\/auth\/profile\/(\d+)$/))) return { success: true, user: { ...DEMO_USER, fecha_registro: aISO(new Date()), paypal_payment_id: null, monto_pagado: null } };
  if ((m = ruta.match(/^\/api\/auth\/sentinel\/(\d+)$/))) return { success: true, ultima_consulta_sentinel: s.sentinel };
  if (ruta === '/api/auth/sentinel' && metodo === 'PUT') { s.sentinel = new Date().toISOString(); return { success: true }; }

  return NO_DISPONIBLE;
}
