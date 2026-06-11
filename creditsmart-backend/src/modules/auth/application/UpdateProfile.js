/**
 * CASO DE USO: Actualizar nombre y apellido del usuario.
 */
class UpdateProfile {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async execute({ userId, nombre, apellido }) {
    await this.userRepository.updateProfile(userId, nombre.trim(), apellido.trim());
    return this.userRepository.getProfile(userId);
  }
}

module.exports = UpdateProfile;
