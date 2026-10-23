/**
 * SERVICIO DE DOMINIO: línea de tiempo de deuda.
 *
 * Cálculo puro (sin BD) extraído de Movement.getDetailedChartData:
 * a partir de los movimientos de un período y la deuda actual,
 * reconstruye la deuda inicial, la evolución punto a punto y los
 * insights del período. Comportamiento idéntico al original.
 */
class DebtTimeline {
  /**
   * @param {Array}  movimientos      filas { id, tipo, monto, fecha_movimiento } ASC
   * @param {number} deudaActualTotal deuda actual de la tarjeta
   * @param {number} lineaCredito     línea de crédito de la tarjeta
   * @param {number} dias             tamaño del período analizado
   */
  static build(movimientos, deudaActualTotal, lineaCredito, dias) {
    if (movimientos.length === 0) {
      return { chartData: [], insights: null };
    }

    // Reconstruir la deuda al inicio del período
    let sumaGastosPeriodo = 0;
    let sumaPagosPeriodo = 0;

    movimientos.forEach((mov) => {
      if (mov.tipo === 'gasto') {
        sumaGastosPeriodo += parseFloat(mov.monto);
      } else if (mov.tipo === 'pago') {
        sumaPagosPeriodo += parseFloat(mov.monto);
      }
    });

    const deudaInicioPeriodo = deudaActualTotal - sumaGastosPeriodo + sumaPagosPeriodo;

    let deudaAcumulada = deudaInicioPeriodo;
    const chartData = [];

    // Punto inicial (un día antes del primer movimiento)
    const primeraFecha = new Date(movimientos[0].fecha_movimiento);
    primeraFecha.setDate(primeraFecha.getDate() - 1);

    chartData.push({
      fecha: primeraFecha,
      tipo: 'inicial',
      gasto: 0,
      pago: 0,
      deuda_acumulada: deudaInicioPeriodo,
    });

    // Procesar movimientos
    let maxGasto = 0;
    let maxGastoFecha = null;
    let maxPago = 0;
    let maxPagoFecha = null;

    movimientos.forEach((mov) => {
      const monto = parseFloat(mov.monto);

      if (mov.tipo === 'gasto') {
        deudaAcumulada += monto;
        chartData.push({
          fecha: mov.fecha_movimiento,
          tipo: 'gasto',
          gasto: monto,
          pago: 0,
          deuda_acumulada: deudaAcumulada,
        });

        if (monto > maxGasto) {
          maxGasto = monto;
          maxGastoFecha = mov.fecha_movimiento;
        }
      } else if (mov.tipo === 'pago') {
        deudaAcumulada = Math.max(0, deudaAcumulada - monto);
        chartData.push({
          fecha: mov.fecha_movimiento,
          tipo: 'pago',
          gasto: 0,
          pago: monto,
          deuda_acumulada: deudaAcumulada,
        });

        if (monto > maxPago) {
          maxPago = monto;
          maxPagoFecha = mov.fecha_movimiento;
        }
      }
    });

    const insights = {
      pico_gasto: maxGasto > 0 ? { monto: maxGasto, fecha: maxGastoFecha } : null,
      mejor_pago: maxPago > 0 ? { monto: maxPago, fecha: maxPagoFecha } : null,
      total_gastos: sumaGastosPeriodo,
      total_pagos: sumaPagosPeriodo,
      num_gastos: movimientos.filter((m) => m.tipo === 'gasto').length,
      num_pagos: movimientos.filter((m) => m.tipo === 'pago').length,
      promedio_gasto_diario: sumaGastosPeriodo / dias,
      deuda_inicial: deudaInicioPeriodo,
      deuda_final: deudaActualTotal,
      variacion_deuda: deudaActualTotal - deudaInicioPeriodo,
      linea_credito: lineaCredito,
      uso_30_porciento: lineaCredito * 0.3,
      uso_70_porciento: lineaCredito * 0.7,
    };

    return { chartData, insights };
  }
}

module.exports = DebtTimeline;
