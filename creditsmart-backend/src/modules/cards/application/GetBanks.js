/**
 * CASO DE USO: Catálogo de bancos (público, para el selector del frontend).
 */
class GetBanks {
  constructor({ bankRepository }) {
    this.bankRepository = bankRepository;
  }

  async execute() {
    return this.bankRepository.findAll();
  }
}

module.exports = GetBanks;
