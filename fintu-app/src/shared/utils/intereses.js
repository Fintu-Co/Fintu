/**
 * Intereses de una deuda de tarjeta pagada con una cuota fija.
 *
 * Una sola implementación para "¿Cuánto pagar este ciclo?" y la calculadora,
 * así ambos dicen lo mismo: cada mes el saldo crece con la tasa mensual
 * equivalente a la TEA y luego se resta el pago (el último es parcial).
 */

/** TEA (%) → tasa mensual efectiva (fracción). */
export function tasaMensual(tea) {
  const t = parseFloat(tea || 0);
  return t > 0 ? Math.pow(1 + t / 100, 1 / 12) - 1 : 0;
}

/**
 * @param {number} deuda
 * @param {number} tea   TEA en %
 * @param {number} pago  cuota mensual
 * @param {number} maxMeses
 * @returns {{ imposible: boolean, meses: number, intereses: number, totalPagado: number,
 *             interesMes: number, saldos: number[] }}
 *   `imposible`: el pago no cubre ni los intereses del primer mes, la deuda no baja.
 *   `saldos`: saldo al inicio y después de cada pago (para graficar).
 */
export function simularPagos(deuda, tea, pago, maxMeses = 600) {
  const d = parseFloat(deuda || 0);
  const p = parseFloat(pago || 0);
  const i = tasaMensual(tea);
  const interesMes = d * i;

  if (!(d > 0)) return { imposible: false, meses: 0, intereses: 0, totalPagado: 0, interesMes: 0, saldos: [0] };
  if (!(p > interesMes)) return { imposible: true, meses: Infinity, intereses: Infinity, totalPagado: Infinity, interesMes, saldos: [d] };

  let saldo = d, meses = 0, pagado = 0;
  const saldos = [d];
  while (saldo > 0.01 && meses < maxMeses) {
    saldo = saldo * (1 + i);
    const cuota = Math.min(p, saldo);
    saldo -= cuota;
    pagado += cuota;
    meses++;
    saldos.push(Math.max(0, saldo));
  }

  return { imposible: false, meses, intereses: Math.max(0, pagado - d), totalPagado: pagado, interesMes, saldos };
}

/** "1 año y 3 meses", "8 meses", "1 mes". */
export function textoMeses(meses) {
  if (!Number.isFinite(meses)) return 'nunca';
  const a = Math.floor(meses / 12), m = meses % 12;
  const mm = (n) => `${n} ${n === 1 ? 'mes' : 'meses'}`;
  if (a === 0) return mm(meses);
  return `${a} ${a === 1 ? 'año' : 'años'}${m ? ` y ${mm(m)}` : ''}`;
}
