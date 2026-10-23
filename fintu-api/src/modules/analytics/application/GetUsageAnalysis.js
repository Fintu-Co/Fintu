/**
 * CASO DE USO: Análisis de uso de una tarjeta.
 * Carga los agregados y delega la clasificación al dominio.
 */
const UsageBehavior = require('../domain/UsageBehavior');

class GetUsageAnalysis {
  constructor({ analyticsRepository }) {
    this.analyticsRepository = analyticsRepository;
  }

  async execute(tarjetaId) {
    const tarjeta = await this.analyticsRepository.getCardSnapshot(tarjetaId);
    if (!tarjeta) {
      return { ok: false };
    }

    const gastosAnterior = await this.analyticsRepository.getPreviousCycleSpending(tarjetaId);
    const actividad = await this.analyticsRepository.getCurrentCycleActivity(tarjetaId);

    const analysis = UsageBehavior.analizar({
      lineaCredito: parseFloat(tarjeta.linea_credito),
      deudaActual: parseFloat(tarjeta.deuda_actual || 0),
      gastosAnterior,
      gastosActual: actividad.gastosActual,
      pagosActual: actividad.pagosActual,
      numGastos: actividad.numGastos,
      numPagos: actividad.numPagos,
    });

    return { ok: true, analysis };
  }
}

module.exports = GetUsageAnalysis;
