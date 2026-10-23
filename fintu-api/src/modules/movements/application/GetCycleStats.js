/**
 * CASO DE USO: Estadísticas (totales y conteos) de un ciclo.
 * Normaliza los agregados SQL a números y calcula el saldo neto.
 */
class GetCycleStats {
  constructor({ movementRepository }) {
    this.movementRepository = movementRepository;
  }

  async execute({ tarjetaId, mes, anio }) {
    const stats = await this.movementRepository.statsForCycle(tarjetaId, mes, anio);

    return {
      total_gastos: parseFloat(stats.total_gastos || 0),
      total_pagos: parseFloat(stats.total_pagos || 0),
      cantidad_gastos: parseInt(stats.cantidad_gastos || 0),
      cantidad_pagos: parseInt(stats.cantidad_pagos || 0),
      saldo_neto: parseFloat(stats.total_gastos || 0) - parseFloat(stats.total_pagos || 0),
    };
  }
}

module.exports = GetCycleStats;
