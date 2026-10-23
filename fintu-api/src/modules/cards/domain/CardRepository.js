/**
 * PUERTO: persistencia de tarjetas.
 */

/* eslint-disable no-unused-vars */
class CardRepository {
  /** Filas crudas de las 4 tarjetas del usuario (con datos del banco). */
  async findByUserId(userId) {
    throw new Error('CardRepository.findByUserId no implementado');
  }

  /** Una tarjeta por su id. Devuelve la fila o undefined. */
  async findById(cardId) {
    throw new Error('CardRepository.findById no implementado');
  }

  /** Rellena un slot vacío. Devuelve true si afectó una fila. */
  async updateSlot(userId, slotNumero, cardData) {
    throw new Error('CardRepository.updateSlot no implementado');
  }

  /** Vacía un slot y borra sus movimientos (transacción). */
  async clearSlot(userId, slotNumero) {
    throw new Error('CardRepository.clearSlot no implementado');
  }

  /** Actualiza solo la deuda actual. */
  async updateDebt(userId, slotNumero, nuevaDeuda) {
    throw new Error('CardRepository.updateDebt no implementado');
  }

  /** Cantidad de tarjetas con datos (no vacías). */
  async countFilledByUserId(userId) {
    throw new Error('CardRepository.countFilledByUserId no implementado');
  }
}

module.exports = CardRepository;
