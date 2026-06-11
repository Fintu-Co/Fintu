/**
 * CASO DE USO: Movimientos de un ciclo concreto (mes/año).
 */
class GetMovementsByCycle {
  constructor({ movementRepository }) {
    this.movementRepository = movementRepository;
  }

  async execute({ tarjetaId, mes, anio }) {
    return this.movementRepository.findByCycle(tarjetaId, mes, anio);
  }
}

module.exports = GetMovementsByCycle;
