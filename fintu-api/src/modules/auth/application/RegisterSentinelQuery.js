/**
 * CASO DE USO: Registrar que el usuario consultó Sentinel
 * (centrales de riesgo) hoy.
 */
class RegisterSentinelQuery {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    return this.userRepository.updateSentinelConsulta(userId);
  }
}

module.exports = RegisterSentinelQuery;
