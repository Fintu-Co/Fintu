const db = require('../config/database');

exports.getUsageAnalysis = async (req, res) => {
  try {
    const { tarjetaId } = req.params;

    // Obtener datos de la tarjeta
    const [tarjetaData] = await db.execute(
      'SELECT linea_credito, deuda_actual FROM tarjetas WHERE id = ?',
      [tarjetaId]
    );

    if (tarjetaData.length === 0) {
      return res.json({ success: false, message: 'Tarjeta no encontrada' });
    }

    const tarjeta = tarjetaData[0];
    const lineaCredito = parseFloat(tarjeta.linea_credito);
    const deudaActual = parseFloat(tarjeta.deuda_actual || 0);
    const porcentajeUsoActual = Math.round((deudaActual / lineaCredito) * 100);

    // Calcular ciclo anterior (hace 30 días)
    const [movimientosCicloAnterior] = await db.execute(`
      SELECT 
        SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos_anterior,
        SUM(CASE WHEN tipo = 'pago' THEN monto ELSE 0 END) as total_pagos_anterior
      FROM movimientos 
      WHERE tarjeta_id = ? 
      AND fecha_movimiento BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [tarjetaId]);

    // Calcular ciclo actual (últimos 30 días)
    const [movimientosCicloActual] = await db.execute(`
      SELECT 
        SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos_actual,
        SUM(CASE WHEN tipo = 'pago' THEN monto ELSE 0 END) as total_pagos_actual,
        COUNT(CASE WHEN tipo = 'gasto' THEN 1 END) as num_gastos,
        COUNT(CASE WHEN tipo = 'pago' THEN 1 END) as num_pagos
      FROM movimientos 
      WHERE tarjeta_id = ? 
      AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [tarjetaId]);

    const gastosAnterior = parseFloat(movimientosCicloAnterior[0].total_gastos_anterior || 0);
    const gastosActual = parseFloat(movimientosCicloActual[0].total_gastos_actual || 0);
    const pagosActual = parseFloat(movimientosCicloActual[0].total_pagos_actual || 0);
    const numGastos = parseInt(movimientosCicloActual[0].num_gastos || 0);
    const numPagos = parseInt(movimientosCicloActual[0].num_pagos || 0);

    // Calcular variación porcentual
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
    let clasificacion = '';
    let descripcionClasificacion = '';
    
    const promedioGastoPorTransaccion = numGastos > 0 ? gastosActual / numGastos : 0;
    const ratioGastoPago = gastosActual > 0 ? pagosActual / gastosActual : 0;

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

    // Construir respuesta
    res.json({
      success: true,
      analysis: {
        porcentaje_uso_actual: porcentajeUsoActual,
        gastos_ciclo_anterior: gastosAnterior,
        gastos_ciclo_actual: gastosActual,
        variacion_porcentaje: variacionPorcentaje,
        tendencia: tendencia,
        clasificacion: clasificacion,
        descripcion_clasificacion: descripcionClasificacion,
        num_gastos: numGastos,
        num_pagos: numPagos,
        promedio_gasto_por_transaccion: promedioGastoPorTransaccion,
        ratio_gasto_pago: ratioGastoPago
      }
    });

  } catch (error) {
    console.error('Error al obtener análisis:', error);
    res.json({ success: false, message: 'Error al obtener análisis' });
  }
};