/**
 * CASO DE USO: Registro + pago PayPal en un solo paso.
 * El pago se verifica server-side contra la API de PayPal
 * antes de crear la cuenta — nunca se confía en el cliente.
 *
 * El plan lo decide el servidor con la oferta vigente al confirmar:
 * fundador ($5, de por vida) mientras queden cupos; si no, anual.
 * Así nadie puede pagar el precio de fundador cuando ya se acabaron.
 */
const User = require('../domain/User');
const Plan = require('../domain/Plan');

class RegisterWithPayment {
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

    /* Oferta vigente: define el plan y el monto que debe tener el pago */
    const oferta = Plan.ofertaVigente(await this.userRepository.countFundadoresPagados());

    /* Verificación real del pago contra PayPal */
    const pago = await this.paymentVerifier.verifyOrder(paymentId, oferta.precio);
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
    const accesoHasta = Plan.accesoHasta(oferta.plan);

    const userId = await this.userRepository.create({
      nombre,
      apellido,
      email,
      password: hashedPassword,
      ha_pagado: true,
      paypal_payment_id: paymentId,
      monto_pagado: pago.amount || oferta.precio,
      fecha_pago: new Date(),
      plan: oferta.plan,
      acceso_hasta: Plan.aISO(accesoHasta),
    });

    const resumen = Plan.resumen({ plan: oferta.plan, acceso_hasta: accesoHasta });
    const token = this.tokenService.sign({ userId, email }, { hasta: resumen.acceso_hasta });

    return {
      status: 'OK',
      token,
      user: { id: userId, nombre, apellido, email, ...resumen },
    };
  }
}

module.exports = RegisterWithPayment;
