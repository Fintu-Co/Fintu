/**
 * Plan para salir de deudas con TODAS las tarjetas.
 *
 * El usuario dice cuánto puede destinar al mes. Cada mes:
 *   1. a cada saldo se le suma el interés del mes (TEA → tasa mensual);
 *   2. cada tarjeta recibe su pago mínimo;
 *   3. lo que sobra va a la tarjeta con la TEA más alta, luego a la siguiente
 *      ("avalancha": es lo que menos intereses paga en total).
 * Cuando una tarjeta queda en cero, su mínimo se suma al extra de las demás.
 *
 * Si una tarjeta no tiene pago mínimo registrado, se usa el interés del mes
 * como mínimo (lo justo para que no crezca) y se avisa que es estimado.
 *
 * Supone que no se suman consumos nuevos: el plan es para la deuda de hoy.
 */

import { tasaMensual, simularPagos } from './intereses';
import { parseISODate } from './fecha';

const CERO = 0.01;

/** Normaliza las tarjetas de la API: { id, nombre, deuda, tea, minimo } */
export function tarjetasParaPlan(tarjetas, nombreDe = (t) => t.banco_nombre || t.banco_nombre_custom || t.nombre_tarjeta || 'Tarjeta') {
  return tarjetas
    .filter((t) => !t.esta_vacia)
    .map((t) => ({
      id: t.id,
      nombre: nombreDe(t),
      deuda: Math.max(0, parseFloat(t.deuda_actual || 0)),
      tea: Math.max(0, parseFloat(t.tasa_interes || 0)),
      minimo: Math.max(0, parseFloat(t.pago_minimo || 0)),
    }));
}

/**
 * @param {Array<{id, nombre, deuda, tea, minimo}>} tarjetas
 * @param {number} presupuesto  lo que puede pagar al mes entre todas
 * @returns {{
 *   estado: 'ok'|'sin_deuda'|'no_alcanza_minimos'|'no_baja',
 *   minimosTotal: number, meses: number, intereses: number,
 *   primerMes: Array<{id, nombre, pago, prioridad: boolean, minimoEstimado: boolean}>,
 *   terminaMes: Object<id, number>, saldos: number[]
 * }}
 *   `saldos[k]`: deuda total después de k meses (saldos[0] = hoy).
 */
export function planDeudas(tarjetas, presupuesto, maxMeses = 360) {
  const lista = tarjetas.filter((t) => t.deuda > CERO).map((t) => ({ ...t, i: tasaMensual(t.tea) }));
  const total0 = lista.reduce((s, t) => s + t.deuda, 0);
  const minimoDe = (t, saldoAntes) => (t.minimo > 0 ? t.minimo : saldoAntes * t.i);
  const minimosTotal = lista.reduce((s, t) => s + Math.min(minimoDe(t, t.deuda), t.deuda * (1 + t.i)), 0);
  const base = { minimosTotal, meses: 0, intereses: 0, primerMes: [], terminaMes: {}, saldos: [total0] };

  if (!lista.length) return { ...base, estado: 'sin_deuda' };
  const p = parseFloat(presupuesto) || 0;
  if (p + CERO < minimosTotal) return { ...base, estado: 'no_alcanza_minimos' };

  // Orden de prioridad: TEA más alta primero; a igual TEA, la de menos deuda
  const orden = [...lista].sort((a, b) => (b.tea - a.tea) || (a.deuda - b.deuda));

  // Si alcanza para todo, se paga el total antes de la fecha de pago: sin intereses
  // (igual que "Todo" en la calculadora).
  if (p + CERO >= total0) {
    return {
      estado: 'ok', minimosTotal, meses: 1, intereses: 0, saldos: [total0, 0],
      terminaMes: Object.fromEntries(orden.map((t) => [t.id, 1])),
      primerMes: orden.map((t) => ({ id: t.id, nombre: t.nombre, pago: t.deuda, prioridad: false, minimoEstimado: !(t.minimo > 0) })),
    };
  }
  const saldo = Object.fromEntries(lista.map((t) => [t.id, t.deuda]));
  const terminaMes = {};
  let intereses = 0, mes = 0, primerMes = [];
  const saldos = [total0];

  while (mes < maxMeses && Object.values(saldo).some((s) => s > CERO)) {
    mes++;
    const pagos = {};
    let resto = p;

    // 1 y 2: interés del mes y pago mínimo
    for (const t of orden) {
      const antes = saldo[t.id];
      if (antes <= CERO) continue;
      const interes = antes * t.i;
      intereses += interes;
      saldo[t.id] = antes + interes;
      const pago = Math.min(minimoDe(t, antes), saldo[t.id], resto);
      saldo[t.id] -= pago;
      pagos[t.id] = pago;
      resto -= pago;
    }

    // 3: el extra, a la TEA más alta
    for (const t of orden) {
      if (resto <= CERO) break;
      if (saldo[t.id] <= CERO) continue;
      const extra = Math.min(resto, saldo[t.id]);
      saldo[t.id] -= extra;
      pagos[t.id] = (pagos[t.id] || 0) + extra;
      resto -= extra;
    }

    for (const t of orden) {
      if (saldo[t.id] <= CERO && terminaMes[t.id] === undefined && t.deuda > CERO) terminaMes[t.id] = mes;
    }
    const total = Object.values(saldo).reduce((s, v) => s + Math.max(0, v), 0);
    saldos.push(total);

    if (mes === 1) {
      const prioridad = orden.find((t) => pagos[t.id] > minimoDe(t, t.deuda) + CERO)?.id;
      primerMes = orden.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        pago: pagos[t.id] || 0,
        prioridad: t.id === prioridad,
        minimoEstimado: !(t.minimo > 0),
      }));
      if (total >= total0 - CERO) return { ...base, estado: 'no_baja', primerMes };
    }
  }

  return { estado: 'ok', minimosTotal, meses: mes, intereses, primerMes, terminaMes, saldos };
}

/** Comparación: pagando solo el mínimo de cada tarjeta. null si falta algún mínimo o no alcanza. */
export function soloMinimos(tarjetas) {
  const conDeuda = tarjetas.filter((t) => t.deuda > CERO);
  if (!conDeuda.length || conDeuda.some((t) => !(t.minimo > 0))) return null;
  const rs = conDeuda.map((t) => simularPagos(t.deuda, t.tea, t.minimo));
  if (rs.some((r) => r.imposible)) return null;
  return { meses: Math.max(...rs.map((r) => r.meses)), intereses: rs.reduce((s, r) => s + r.intereses, 0) };
}

/** Meses completos desde `inicio` hasta `hoy` (el 10/03 → 09/04 es 0; el 10/04 es 1). */
export function mesesDesde(inicio, hoy = new Date()) {
  const a = parseISODate(inicio);
  let m = (hoy.getFullYear() - a.getFullYear()) * 12 + (hoy.getMonth() - a.getMonth());
  if (hoy.getDate() < a.getDate()) m--;
  return Math.max(0, m);
}

/** Fecha en la que se termina, contando `meses` desde `desde`: "agosto 2027". */
export function mesFin(meses, desde = new Date()) {
  const f = new Date(desde.getFullYear(), desde.getMonth() + meses, 1);
  return f.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
}
