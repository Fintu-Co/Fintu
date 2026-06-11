/**
 * CASO DE USO: Obtener objetivos del usuario (activos + completados).
 */
class GetUserGoals {
  constructor({ goalRepository }) {
    this.goalRepository = goalRepository;
  }

  async execute(userId) {
    const objetivos = await this.goalRepository.findActiveByUserId(userId);
    const completados = await this.goalRepository.findCompletedByUserId(userId);
    return { objetivos, completados };
  }
}

module.exports = GetUserGoals;
