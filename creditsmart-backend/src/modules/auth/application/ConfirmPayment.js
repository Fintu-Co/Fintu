/**
 * CASO DE USO: Confirmar pago PayPal de un usuario ya registrado.
 */
class ConfirmPayment {
  constructor({ userRepository, tokenService }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  async execute({ userId, paymentId }) {
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
