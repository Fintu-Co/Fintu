/**
 * CASO DE USO: Confirmar pago PayPal de un usuario ya registrado.
 * La orden se verifica server-side contra la API de PayPal
 * antes de desbloquear el acceso.
 */
class ConfirmPayment {
  constructor({ userRepository, tokenService, paymentVerifier }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.paymentVerifier = paymentVerifier;
  }

  async execute({ userId, paymentId }) {
    /* Verificación real del pago contra PayPal */
    const pago = await this.paymentVerifier.verifyOrder(paymentId);
    if (!pago.valid) {
      return { status: 'PAYMENT_INVALID', reason: pago.reason };
    }

    /* Evitar reutilizar la misma orden en dos cuentas */
    if (typeof this.userRepository.findByPaymentId === 'function') {
      const yaUsado = await this.userRepository.findByPaymentId(paymentId);
      if (yaUsado && yaUsado.id !== userId) {
        return { status: 'PAYMENT_ALREADY_USED' };
      }
    }

    const updated = await this.userRepository.updatePaymentStatus(userId, paymentId);
    if (!updated) {
      return { status: 'NOT_UPDATED' };
    }

    const user = await this.userRepository.findById(userId);
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

module.exports = ConfirmPayment;
