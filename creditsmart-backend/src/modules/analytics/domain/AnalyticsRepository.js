/**
 * PUERTO: datos agregados para el análisis de uso.
 */

/* eslint-disable no-unused-vars */
class AnalyticsRepository {
  /** Línea de crédito y deuda actual de la tarjeta (o undefined). */
  async getCardSnapshot(tarjetaId) {
    throw new Error('AnalyticsRepository.getCardSnapshot no implementado');
  }

  /** Total de gastos del ciclo anterior (ventana 60→30 días). */
  async getPreviousCycleSpending(tarjetaId) {
    throw new Error('AnalyticsRepository.getPreviousCycleSpending no implementado');
  }

  /** Gastos, pagos y conteos del ciclo actual (últimos 30 días). */
  async getCurrentCycleActivity(tarjetaId) {
    throw new Error('AnalyticsRepository.getCurrentCycleActivity no implementado');
  }
}

module.exports = AnalyticsRepository;
