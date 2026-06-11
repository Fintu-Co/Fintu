/**
 * CASO DE USO: Datos agregados por día para el gráfico simple.
 */
class GetChartData {
  constructor({ movementRepository }) {
    this.movementRepository = movementRepository;
  }

  async execute({ tarjetaId, dias }) {
    return this.movementRepository.chartData(tarjetaId, dias);
  }
}

module.exports = GetChartData;
