/**
 * CASO DE USO: Inicio de sesión.
 * Regla de negocio: solo entran quienes tienen acceso vigente
 * (pagaron y, si su plan es anual, no ha vencido).
 */
const Plan = require('../domain/Plan');

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

    const resumen = Plan.resumen(user);

    if (!Plan.accesoVigente(user)) {
      const motivo = Plan.motivoPago(user);
      // Cuánto le toca pagar: la renovación anual, o la oferta vigente si nunca pagó
      const precio = motivo === 'RENOVAR'
        ? Plan.config().precioAnual
        : Plan.ofertaVigente(await this.userRepository.countFundadoresPagados()).precio;
      return {
        status: 'PAYMENT_REQUIRED',
        userId: user.id,
        motivo,
        precio,
        acceso_hasta: resumen.acceso_hasta,
      };
    }

    // La sesión de un plan anual no dura más allá del vencimiento
    const token = this.tokenService.sign({ userId: user.id, email: user.email }, { hasta: resumen.acceso_hasta });

    return {
      status: 'OK',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        ...resumen,
      },
    };
  }
}

module.exports = LoginUser;
