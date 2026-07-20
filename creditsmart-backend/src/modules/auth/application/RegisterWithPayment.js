/**
 * CASO DE USO: Registro + pago PayPal en un solo paso.
 * El pago se verifica server-side contra la API de PayPal
 * antes de crear la cuenta — nunca se confía en el cliente.
 */
const User = require('../domain/User');

class RegisterWithPayment {
  static MONTO_DEFAULT = 4.0;

  constructor({ userRepository, passwordHasher, tokenService, paymentVerifier }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.paymentVerifier = paymentVerifier;
  }

  async execute({ nombre, apellido, email, password, paymentId }) {
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

    /* Verificación real del pago contra PayPal */
    const pago = await this.paymentVerifier.verifyOrder(paymentId);
    if (!pago.valid) {
      return { status: 'PAYMENT_INVALID', reason: pago.reason };
    }

    /* Evitar reutilizar la misma orden en dos cuentas */
    if (typeof this.userRepository.findByPaymentId === 'function') {
      const yaUsado = await this.userRepository.findByPaymentId(paymentId);
      if (yaUsado) {
        return { status: 'PAYMENT_ALREADY_USED' };
      }
    }

    const hashedPassword = await this.passwordHasher.hash(password);

    const userId = await this.userRepository.create({
      nombre,
      apellido,
      email,
      password: hashedPassword,
      ha_pagado: true,
      paypal_payment_id: paymentId,
      monto_pagado: pago.amount || RegisterWithPayment.MONTO_DEFAULT,
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
