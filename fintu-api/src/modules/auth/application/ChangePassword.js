/**
 * CASO DE USO: Cambiar contraseña verificando la actual.
 */
const User = require('../domain/User');

class ChangePassword {
  constructor({ userRepository, passwordHasher }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ userId, currentPassword, newPassword }) {
    if (!User.passwordValida(newPassword)) {
      return { status: 'WEAK_PASSWORD' };
    }

    const hash = await this.userRepository.getPasswordById(userId);
    if (!hash) {
      return { status: 'NOT_FOUND' };
    }

    const match = await this.passwordHasher.compare(currentPassword, hash);
    if (!match) {
      return { status: 'WRONG_PASSWORD' };
    }

    const newHash = await this.passwordHasher.hash(newPassword);
    await this.userRepository.changePassword(userId, newHash);

    return { status: 'OK' };
  }
}

module.exports = ChangePassword;
