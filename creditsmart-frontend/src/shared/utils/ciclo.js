/**
 * Ciclo de facturación de una tarjeta.
 *
 * Semántica CONTINUA: el ciclo va del día siguiente al cierre anterior
 * hasta el día de cierre (p. ej. cierre 24 → 25/06 al 24/07). Así ningún
 * movimiento queda huérfano entre dos estados de cuenta, que es como
 * funcionan las tarjetas reales.
 *
 * `dia_inicio_ciclo` queda como dato informativo de la tarjeta: el inicio
 * se deriva del cierre para que ambos no puedan contradecirse.
 *
 * Ojo con los días 29-31: no existen en todos los meses, así que siempre
 * se recortan al último día real (si no, JS los desborda al mes siguiente).
 */

import { parseISODate } from './fecha';

const num = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
};

const ultimoDiaDelMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate();

/** Fecha con el día recortado al último real del mes. Admite meses fuera de rango. */
export function diaDelMes(anio, mes, dia) {
  const ref = new Date(anio, mes, 1);
  const a = ref.getFullYear();
  const m = ref.getMonth();
  return new Date(a, m, Math.min(Math.max(dia, 1), ultimoDiaDelMes(a, m)));
}

/** 'YYYY-MM-DD' en hora local (toISOString convierte a UTC y corre el día). */
export function aISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Ciclo de la tarjeta. Por defecto el vigente (el que acumula consumos hoy).
 *
 * @param {Object} tarjeta
 * @param {Date}   hoy
 * @param {number} offsetCiclos  0 = vigente, -1 = anterior, +1 = siguiente
 * @returns {{ inicio: Date, cierre: Date, pago: Date, diasParaPago: number }}
 */
export function calcularCiclo(tarjeta, hoy = new Date(), offsetCiclos = 0) {
  const dC = num(tarjeta?.dia_cierre_ciclo) || num(tarjeta?.dia_inicio_ciclo) || ultimoDiaDelMes(hoy.getFullYear(), hoy.getMonth());
  const dP = num(tarjeta?.dia_pago) || dC;

  /* Si hoy aún no pasa el día de cierre, el ciclo cierra este mes; si ya
     pasó, cierra el mes siguiente. El offset desplaza el ciclo entero,
     porque todo lo demás se deriva del cierre. */
  const cierraEsteMes = hoy.getDate() <= Math.min(dC, ultimoDiaDelMes(hoy.getFullYear(), hoy.getMonth()));
  const cierre = diaDelMes(hoy.getFullYear(), hoy.getMonth() + (cierraEsteMes ? 0 : 1) + offsetCiclos, dC);

  /* El inicio es el día siguiente al cierre anterior. */
  const cierreAnterior = diaDelMes(cierre.getFullYear(), cierre.getMonth() - 1, dC);
  const inicio = new Date(cierreAnterior);
  inicio.setDate(inicio.getDate() + 1);

  /* El pago vence después del cierre: mismo mes si el día es posterior,
     el siguiente si no. */
  const pago = diaDelMes(cierre.getFullYear(), cierre.getMonth() + (dP >= dC ? 0 : 1), dP);

  const diasParaPago = Math.round((soloDia(pago) - soloDia(hoy)) / 86400000);

  return { inicio, cierre, pago, diasParaPago };
}

const soloDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * El ciclo al que pertenece una fecha cualquiera.
 *
 * Es `calcularCiclo` leído al revés: esa función devuelve el ciclo que
 * contiene la fecha de referencia, así que pasarle la fecha de un consumo
 * da el ciclo —y por tanto el vencimiento— en el que va a caer.
 *
 * Sirve para responder "si lo fecho el 10 de junio, ¿cuándo se paga?"
 * antes de guardar el movimiento.
 */
export function cicloDeFecha(tarjeta, fecha) {
  return calcularCiclo(tarjeta, fecha);
}

/**
 * El pago realmente vigente hoy.
 *
 * Cuando un ciclo cierra pasan dos cosas a la vez: empiezas a acumular el
 * ciclo siguiente Y te queda una deuda por pagar del que acaba de cerrar.
 * `calcularCiclo` devuelve el que acumula, cuyo pago vence un mes más tarde
 * — usarlo como cuenta regresiva le dice al usuario "te quedan 32 días"
 * el día antes de que le cobren intereses.
 *
 * Esta función devuelve el vencimiento que de verdad tiene encima: el del
 * ciclo anterior mientras no haya vencido, y si no el del actual.
 *
 * @returns {{ vence: Date, dias: number, cicloInicio: Date, cicloCierre: Date,
 *             cerrado: boolean, esDelCicloAnterior: boolean }}
 *   `cerrado` indica que el ciclo de ese pago ya cerró, es decir que el monto
 *   adeudado ya está definido y no va a crecer con nuevos consumos.
 */
export function proximoPago(tarjeta, hoy = new Date()) {
  const anterior = calcularCiclo(tarjeta, hoy, -1);
  const actual = calcularCiclo(tarjeta, hoy, 0);
  const hoyDia = soloDia(hoy);

  /* Si el pago del ciclo anterior todavía no vence, ese es el pendiente. */
  const esDelCicloAnterior = soloDia(anterior.pago) >= hoyDia;
  const ciclo = esDelCicloAnterior ? anterior : actual;

  return {
    vence: ciclo.pago,
    dias: Math.round((soloDia(ciclo.pago) - hoyDia) / 86400000),
    cicloInicio: ciclo.inicio,
    cicloCierre: ciclo.cierre,
    cerrado: soloDia(ciclo.cierre) < hoyDia,
    esDelCicloAnterior,
  };
}

/**
 * Saldo que realmente vence en un pago.
 *
 * `deuda_actual` de la tarjeta es un saldo corriente: mezcla lo consumido en
 * el ciclo que ya cerró con lo que llevas gastado del que está acumulando.
 * Para "cuánto tengo que pagar el día 20" solo cuenta lo primero.
 *
 * Los pagos se aplican al saldo más antiguo, así que se restan todos los
 * registrados hasta hoy: un consumo posterior al cierre pertenece al ciclo
 * siguiente y no entra en este vencimiento.
 *
 * @param {Array} movimientos  con { tipo, monto, fecha_movimiento }
 * @param {Date}  cierre       cierre del ciclo cuyo pago vence
 * @param {Date}  hoy
 * @returns {{ saldo: number, cargos: number, abonos: number, pagosDesdeCierre: number }}
 */
export function saldoPendiente(movimientos = [], cierre, hoy = new Date()) {
  const finCierre = new Date(cierre.getFullYear(), cierre.getMonth(), cierre.getDate(), 23, 59, 59, 999);
  const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

  let cargos = 0, abonos = 0, pagosDesdeCierre = 0;

  for (const m of movimientos) {
    const f = parseISODate(m.fecha_movimiento);
    if (!f || isNaN(f)) continue;
    const monto = parseFloat(m.monto);
    if (!Number.isFinite(monto)) continue;

    if (m.tipo === 'gasto') {
      /* Solo los consumos hasta el cierre forman parte de este vencimiento. */
      if (f <= finCierre) cargos += monto;
    } else if (m.tipo === 'pago') {
      if (f <= finHoy) abonos += monto;
      if (f > finCierre) pagosDesdeCierre += 1;
    }
  }

  return { saldo: Math.max(0, cargos - abonos), cargos, abonos, pagosDesdeCierre };
}

export default calcularCiclo;
