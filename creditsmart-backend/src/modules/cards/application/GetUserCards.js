/**
 * CASO DE USO: Obtener las 4 tarjetas del usuario, enriquecidas con
 * su ciclo de facturación vigente y % de uso (lógica de dominio).
 */
const Card = require('../domain/Card');

class GetUserCards {
  constructor({ cardRepository }) {
    this.cardRepository = cardRepository;
  }

  async execute(userId) {
    const rows = await this.cardRepository.findByUserId(userId);
    return rows.map((tarjeta) => Card.enriquecerConCiclo(tarjeta));
  }
}

module.exports = GetUserCards;
