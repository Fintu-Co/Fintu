/**
 * CASO DE USO: Movimientos de una tarjeta (historial).
 */
class GetMovementsByCard {
  constructor({ movementRepository }) {
    this.movementRepository = movementRepository;
  }

  async execute(tarjetaId) {
    return this.movementRepository.findByCard(tarjetaId);
  }
}

module.exports = GetMovementsByCard;
