/**
 * CASO DE USO: Inicio de sesión.
 * Regla de negocio: solo usuarios que pagaron acceden a la app.
 */
class LoginUser {
  constructor({ userRepository, passwordHasher, tokenService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { status: 'INVALID_CREDENTIALS' };
    }

    const isValidPassword = await this.passwordHasher.compare(password, user.password);
    if (!isValidPassword) {
      return { status: 'INVALID_CREDENTIALS' };
    }

    if (!user.ha_pagado) {
      return { status: 'PAYMENT_REQUIRED', userId: user.id };
    }

    const token = this.tokenService.sign({ userId: user.id, email: user.email });

    return {
      status: 'OK',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
      },
    };
  }
}

module.exports = LoginUser;
