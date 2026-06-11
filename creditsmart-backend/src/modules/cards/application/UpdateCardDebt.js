/**
 * CASO DE USO: Actualizar solo la deuda actual de una tarjeta.
 */
class UpdateCardDebt {
  constructor({ cardRepository }) {
    this.cardRepository = cardRepository;
  }

  async execute({ userId, slotNumero, nuevaDeuda }) {
    return this.cardRepository.updateDebt(userId, slotNumero, nuevaDeuda);
  }
}

module.exports = UpdateCardDebt;
