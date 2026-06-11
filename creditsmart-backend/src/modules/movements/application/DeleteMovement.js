/**
 * CASO DE USO: Eliminar un movimiento del usuario.
 */
class DeleteMovement {
  constructor({ movementRepository }) {
    this.movementRepository = movementRepository;
  }

  async execute({ movimientoId, userId }) {
    return this.movementRepository.delete(movimientoId, userId);
  }
}

module.exports = DeleteMovement;
