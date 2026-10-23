/**
 * CASO DE USO: Movimientos de una tarjeta (historial).
 * Acepta un límite opcional para no traer todo el historial cuando
 * la vista solo muestra los últimos N (ej. la tabla de "recientes").
 */
class GetMovementsByCard {
  constructor({ movementRepository }) {
    this.movementRepository = movementRepository;
  }

  async execute(tarjetaId, limite = null) {
    return this.movementRepository.findByCard(tarjetaId, limite);
  }
}

module.exports = GetMovementsByCard;
