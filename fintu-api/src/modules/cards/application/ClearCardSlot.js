/**
 * CASO DE USO: Vaciar un slot de tarjeta (borra también sus movimientos).
 */
class ClearCardSlot {
  constructor({ cardRepository }) {
    this.cardRepository = cardRepository;
  }

  async execute({ userId, slotNumero }) {
    return this.cardRepository.clearSlot(userId, slotNumero);
  }
}

module.exports = ClearCardSlot;
