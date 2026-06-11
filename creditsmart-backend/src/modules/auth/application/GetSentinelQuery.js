/**
 * CASO DE USO: Obtener la fecha de la última consulta a Sentinel.
 */
class GetSentinelQuery {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    const data = await this.userRepository.getSentinelConsulta(userId);
    return data?.ultima_consulta_sentinel || null;
  }
}

module.exports = GetSentinelQuery;
