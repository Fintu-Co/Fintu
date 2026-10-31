/**
 * CASO DE USO: Obtener el perfil del usuario (incluye su plan).
 */
const Plan = require('../domain/Plan');

class GetProfile {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    const user = await this.userRepository.getProfile(userId);
    if (!user) return user;
    return { ...user, ...Plan.resumen(user) };
  }
}

module.exports = GetProfile;
