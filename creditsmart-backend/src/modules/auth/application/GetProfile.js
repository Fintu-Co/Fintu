/**
 * CASO DE USO: Obtener el perfil del usuario.
 */
class GetProfile {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    return this.userRepository.getProfile(userId);
  }
}

module.exports = GetProfile;
