/**
 * CASO DE USO: Registro + pago PayPal en un solo paso.
 */
const User = require('../domain/User');

class RegisterWithPayment {
  static MONTO_DEFAULT = 4.0;

  constructor({ userRepository, passwordHasher, tokenService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ nombre, apellido, email, password, paymentId, montoPagado }) {
    if (!User.emailValido(email)) {
      return { status: 'INVALID_EMAIL' };
    }
    if (!User.passwordValida(password)) {
      return { status: 'WEAK_PASSWORD' };
    }

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      return { status: 'EMAIL_TAKEN' };
    }

    const hashedPassword = await this.passwordHasher.hash(password);

    const userId = await this.userRepository.create({
      nombre,
      apellido,
      email,
      password: hashedPassword,
      ha_pagado: true,
      paypal_payment_id: paymentId,
      monto_pagado: montoPagado || RegisterWithPayment.MONTO_DEFAULT,
      fecha_pago: new Date(),
    });

    const token = this.tokenService.sign({ userId, email });

    return {
      status: 'OK',
      token,
      user: { id: userId, nombre, apellido, email },
    };
  }
}

module.exports = RegisterWithPayment;
