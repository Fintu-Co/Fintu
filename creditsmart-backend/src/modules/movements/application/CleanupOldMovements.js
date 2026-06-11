/**
 * CASO DE USO: Limpieza de movimientos antiguos (mantenimiento).
 */
class CleanupOldMovements {
  static MESES_RETENCION = 12;

  constructor({ movementRepository }) {
    this.movementRepository = movementRepository;
  }

  async execute() {
    return this.movementRepository.deleteOlderThanMonths(CleanupOldMovements.MESES_RETENCION);
  }
}

module.exports = CleanupOldMovements;
