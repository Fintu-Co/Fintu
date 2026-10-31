/**
 * CASO DE USO: Confirmar un pago PayPal de un usuario ya registrado.
 *   · Nunca pagó      → se aplica la oferta vigente (fundador o anual).
 *   · Plan anual      → renovación: suma un año desde el vencimiento
 *                       (o desde hoy, si ya venció).
 *   · Fundador activo → no hay nada que pagar.
 * La orden se verifica server-side contra la API de PayPal, con el monto
 * que corresponde a cada caso.
 */
const Plan = require('../domain/Plan');

class ConfirmPayment {
  constructor({ userRepository, tokenService, paymentVerifier }) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
    this.paymentVerifier = paymentVerifier;
  }

  async execute({ userId, paymentId }) {
    const actual = await this.userRepository.findById(userId);
    if (!actual) {
      return { status: 'NOT_UPDATED' };
    }

    const cfg = Plan.config();
    let plan, precio;
    if (actual.ha_pagado && actual.plan === Plan.ANUAL) {
      plan = Plan.ANUAL;
      precio = cfg.precioAnual;
    } else if (actual.ha_pagado) {
      return { status: 'ALREADY_ACTIVE' };
    } else {
      const oferta = Plan.ofertaVigente(await this.userRepository.countFundadoresPagados(), cfg);
      plan = oferta.plan;
      precio = oferta.precio;
    }

    /* Verificación real del pago contra PayPal */
    const pago = await this.paymentVerifier.verifyOrder(paymentId, precio);
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

    const accesoHasta = Plan.accesoHasta(plan, new Date(), actual.acceso_hasta);
    const updated = await this.userRepository.updatePaymentStatus(userId, paymentId, {
      plan,
      acceso_hasta: Plan.aISO(accesoHasta),
      monto_pagado: pago.amount || precio,
    });
    if (!updated) {
      return { status: 'NOT_UPDATED' };
    }

    const user = await this.userRepository.findById(userId);
    const resumen = Plan.resumen(user);
    const token = this.tokenService.sign({ userId: user.id, email: user.email }, { hasta: resumen.acceso_hasta });

    return {
      status: 'OK',
      renovacion: Boolean(actual.ha_pagado),
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

module.exports = ConfirmPayment;
