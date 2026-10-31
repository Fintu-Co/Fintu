/**
 * CASO DE USO: ¿Qué se le ofrece hoy a quien se registra?
 * Precio de fundador mientras queden cupos; después, plan anual.
 * Público: lo usan el registro y el landing (contador de cupos).
 */
const Plan = require('../domain/Plan');

class GetOffer {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute() {
    const fundadores = await this.userRepository.countFundadoresPagados();
    return Plan.ofertaVigente(fundadores);
  }
}

module.exports = GetOffer;
