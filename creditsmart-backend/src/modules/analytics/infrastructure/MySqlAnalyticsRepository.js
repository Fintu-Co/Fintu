/**
 * ADAPTADOR: implementación MySQL del puerto AnalyticsRepository.
 * Consultas idénticas a las del antiguo analyticsController.
 */
const AnalyticsRepository = require('../domain/AnalyticsRepository');
const db = require('../../../shared/infrastructure/database');

class MySqlAnalyticsRepository extends AnalyticsRepository {
  async getCardSnapshot(tarjetaId) {
    const [rows] = await db.execute(
      'SELECT linea_credito, deuda_actual FROM tarjetas WHERE id = ?',
      [tarjetaId]
    );
    return rows[0];
  }

  async getPreviousCycleSpending(tarjetaId) {
    const [rows] = await db.execute(
      `
      SELECT
        SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos_anterior,
        SUM(CASE WHEN tipo = 'pago' THEN monto ELSE 0 END) as total_pagos_anterior
      FROM movimientos
      WHERE tarjeta_id = ?
      AND fecha_movimiento BETWEEN DATE_SUB(NOW(), INTERVAL 60 DAY) AND DATE_SUB(NOW(), INTERVAL 30 DAY)
    `,
      [tarjetaId]
    );
    return parseFloat(rows[0].total_gastos_anterior || 0);
  }

  async getCurrentCycleActivity(tarjetaId) {
    const [rows] = await db.execute(
      `
      SELECT
        SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos_actual,
        SUM(CASE WHEN tipo = 'pago' THEN monto ELSE 0 END) as total_pagos_actual,
        COUNT(CASE WHEN tipo = 'gasto' THEN 1 END) as num_gastos,
        COUNT(CASE WHEN tipo = 'pago' THEN 1 END) as num_pagos
      FROM movimientos
      WHERE tarjeta_id = ?
      AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `,
      [tarjetaId]
    );

    return {
      gastosActual: parseFloat(rows[0].total_gastos_actual || 0),
      pagosActual: parseFloat(rows[0].total_pagos_actual || 0),
      numGastos: parseInt(rows[0].num_gastos || 0),
      numPagos: parseInt(rows[0].num_pagos || 0),
    };
  }
}

module.exports = MySqlAnalyticsRepository;
