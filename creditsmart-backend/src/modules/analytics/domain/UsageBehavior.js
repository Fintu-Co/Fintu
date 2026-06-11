/**
 * SERVICIO DE DOMINIO: análisis de comportamiento de uso de tarjeta.
 *
 * Cálculo puro (sin BD) extraído de analyticsController:
 * tendencia de gasto entre ciclos y clasificación del usuario
 * (Conservador / Estratégico / En Riesgo / Impulsivo / Moderado).
 */
class UsageBehavior {
  /**
   * @param {object} datos
   *   - lineaCredito, deudaActual
   *   - gastosAnterior  (total gastos del ciclo previo)
   *   - gastosActual, pagosActual, numGastos, numPagos (ciclo actual)
   */
  static analizar({ lineaCredito, deudaActual, gastosAnterior, gastosActual, pagosActual, numGastos, numPagos }) {
    const porcentajeUsoActual = Math.round((deudaActual / lineaCredito) * 100);

    // Variación porcentual de gasto entre ciclos
    let variacionPorcentaje = 0;
    let tendencia = 'neutral';

    if (gastosAnterior > 0) {
      variacionPorcentaje = Math.round(((gastosActual - gastosAnterior) / gastosAnterior) * 100);
      tendencia = variacionPorcentaje > 0 ? 'up' : variacionPorcentaje < 0 ? 'down' : 'neutral';
    } else if (gastosActual > 0) {
      variacionPorcentaje = 100;
      tendencia = 'up';
    }

    // Clasificación de comportamiento
    const promedioGastoPorTransaccion = numGastos > 0 ? gastosActual / numGastos : 0;
    const ratioGastoPago = gastosActual > 0 ? pagosActual / gastosActual : 0;

    let clasificacion = '';
    let descripcionClasificacion = '';

    if (porcentajeUsoActual <= 20 && ratioGastoPago > 0.8) {
      clasificacion = 'Conservador';
      descripcionClasificacion = 'Usas poco tu línea y pagas regularmente. Mantén este hábito.';
    } else if (porcentajeUsoActual <= 40 && ratioGastoPago > 0.6 && numPagos >= 2) {
      clasificacion = 'Estratégico';
      descripcionClasificacion = 'Usas tu crédito inteligentemente y pagas a tiempo.';
    } else if (porcentajeUsoActual > 70 || ratioGastoPago < 0.3) {
      clasificacion = 'En Riesgo';
      descripcionClasificacion = 'Tu nivel de uso es alto. Prioriza pagar tu deuda pronto.';
    } else if (numGastos > 10 && promedioGastoPorTransaccion < lineaCredito * 0.05) {
      clasificacion = 'Impulsivo';
      descripcionClasificacion = 'Haces muchas compras pequeñas. Intenta planificar mejor.';
    } else {
      clasificacion = 'Moderado';
      descripcionClasificacion = 'Tu uso es normal. Mantén tus pagos al día.';
    }

    return {
      porcentaje_uso_actual: porcentajeUsoActual,
      gastos_ciclo_anterior: gastosAnterior,
      gastos_ciclo_actual: gastosActual,
      variacion_porcentaje: variacionPorcentaje,
      tendencia,
      clasificacion,
      descripcion_clasificacion: descripcionClasificacion,
      num_gastos: numGastos,
      num_pagos: numPagos,
      promedio_gasto_por_transaccion: promedioGastoPorTransaccion,
      ratio_gasto_pago: ratioGastoPago,
    };
  }
}

module.exports = UsageBehavior;
