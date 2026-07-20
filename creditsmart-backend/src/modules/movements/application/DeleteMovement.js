/**
 * CASO DE USO: Eliminar un movimiento del usuario.
 *
 * Orquesta dos efectos (espejo de CreateMovement):
 *   1. Borrar el movimiento.
 *   2. Revertir su efecto sobre la deuda de la tarjeta:
 *      - si era gasto → se resta (deshace la suma que hizo al crearse)
 *      - si era pago  → se suma  (deshace la resta que hizo al crearse)
 *
 * Sin esto, borrar un movimiento dejaba la deuda de la tarjeta descuadrada.
 */
const Movement = require('../domain/Movement');

class DeleteMovement {
  constructor({ movementRepository, cardDebtPort }) {
    this.movementRepository = movementRepository;
    this.cardDebtPort = cardDebtPort;
  }

  async execute({ movimientoId, userId }) {
    // Leemos el movimiento ANTES de borrarlo: necesitamos tipo, monto y tarjeta.
    const movimiento = await this.movementRepository.findById(movimientoId, userId);
    if (!movimiento) return false;

    const eliminado = await this.movementRepository.delete(movimientoId, userId);
    if (!eliminado) return false;

    if (movimiento.tipo === Movement.TIPOS.GASTO) {
      await this.cardDebtPort.decreaseDebt(movimiento.tarjeta_id, movimiento.monto);
    } else {
      await this.cardDebtPort.increaseDebt(movimiento.tarjeta_id, movimiento.monto);
    }

    return true;
  }
}

module.exports = DeleteMovement;
