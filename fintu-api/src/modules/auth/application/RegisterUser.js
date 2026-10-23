/**
 * CASO DE USO: Registro de usuario (sin pago).
 */
const User = require('../domain/User');

class RegisterUser {
  constructor({ userRepository, passwordHasher }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ nombre, apellido, email, password }) {
    if (!User.emailValido(email)) {
      return { status: 'INVALID_EMAIL' };
    }
    if (!User.passwordValida(password)) {
      return { status: 'WEAK_PASSWORD' };
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return { status: 'EMAIL_TAKEN' };
    }

    const hashedPassword = await this.passwordHasher.hash(password);
    const userId = await this.userRepository.create({ nombre, apellido, email, password: hashedPassword });

    return { status: 'OK', userId };
  }
}

module.exports = RegisterUser;
