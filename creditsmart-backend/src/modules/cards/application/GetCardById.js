/**
 * CASO DE USO: Obtener una tarjeta puntual por su id.
 */
class GetCardById {
  constructor({ cardRepository }) {
    this.cardRepository = cardRepository;
  }

  async execute(cardId) {
    return this.cardRepository.findById(cardId);
  }
}

module.exports = GetCardById;
