/**
 * CASO DE USO: Restablecer contraseña con código de recuperación.
 */
const User = require('../domain/User');

class ResetPassword {
  constructor({ userRepository, passwordHasher }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ email, code, newPassword }) {
    if (!User.passwordValida(newPassword)) {
      return { status: 'WEAK_PASSWORD' };
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.reset_token || !user.reset_token_expiry) {
      return { status: 'INVALID_CODE' };
    }

    if (new Date() > new Date(user.reset_token_expiry)) {
      return { status: 'EXPIRED' };
    }

    if (code.trim() !== user.reset_token) {
      return { status: 'WRONG_CODE' };
    }

    const hashedPassword = await this.passwordHasher.hash(newPassword);
    await this.userRepository.updatePassword(email, hashedPassword);

    return { status: 'OK' };
  }
}

module.exports = ResetPassword;
