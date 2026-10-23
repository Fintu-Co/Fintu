/**
 * CASO DE USO: Timeline detallado de deuda + insights del período.
 * Carga datos (repos/puertos) y delega el cálculo al servicio de
 * dominio DebtTimeline.
 */
const DebtTimeline = require('../domain/DebtTimeline');

class GetDetailedChartData {
  constructor({ movementRepository, cardDebtPort }) {
    this.movementRepository = movementRepository;
    this.cardDebtPort = cardDebtPort;
  }

  async execute({ tarjetaId, dias }) {
    const tarjeta = await this.cardDebtPort.getDebtAndLimit(tarjetaId);
    if (!tarjeta) {
      return { chartData: [], insights: null };
    }

    const deudaActualTotal = parseFloat(tarjeta.deuda_actual || 0);
    const lineaCredito = parseFloat(tarjeta.linea_credito || 0);

    const movimientos = await this.movementRepository.findRecentByCard(tarjetaId, dias);

    return DebtTimeline.build(movimientos, deudaActualTotal, lineaCredito, dias);
  }
}

module.exports = GetDetailedChartData;
