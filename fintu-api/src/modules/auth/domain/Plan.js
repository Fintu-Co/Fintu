/**
 * DOMINIO: planes de acceso.
 *
 *   fundador → los primeros N usuarios (100 por defecto) pagan una vez y
 *              tienen acceso de por vida. acceso_hasta = NULL.
 *   anual    → a partir del usuario N+1. Cada pago da un año de acceso;
 *              renovar suma un año desde el vencimiento (o desde hoy, si ya venció).
 *
 * Los usuarios que pagaron antes de existir los planes (plan = NULL) cuentan
 * como fundadores.
 *
 * Config por env:
 *   FUNDADORES_LIMITE       (default 100)
 *   PRECIO_FUNDADOR_USD     (default 5.00; PAYPAL_EXPECTED_USD sigue valiendo como alias)
 *   PRECIO_ANUAL_USD        (default 10.00)
 */
class Plan {
  static FUNDADOR = 'fundador';
  static ANUAL = 'anual';

  static config(env = process.env) {
    return {
      limite: parseInt(env.FUNDADORES_LIMITE, 10) || 100,
      precioFundador: parseFloat(env.PRECIO_FUNDADOR_USD || env.PAYPAL_EXPECTED_USD) || 5,
      precioAnual: parseFloat(env.PRECIO_ANUAL_USD) || 10,
    };
  }

  /** Lo que se le ofrece hoy a alguien que se registra. */
  static ofertaVigente(fundadoresPagados, cfg = Plan.config()) {
    const quedan = Math.max(0, cfg.limite - fundadoresPagados);
    return quedan > 0
      ? { plan: Plan.FUNDADOR, precio: cfg.precioFundador, quedan, limite: cfg.limite }
      : { plan: Plan.ANUAL, precio: cfg.precioAnual, quedan: 0, limite: cfg.limite };
  }

  /** ¿El monto pagado alcanza para esa oferta? (tolerancia de un milésimo) */
  static montoValido(monto, precio) {
    return Number.isFinite(monto) && monto + 0.001 >= precio;
  }

  /**
   * Nueva fecha de vencimiento al pagar.
   * fundador → null (de por vida). anual → un año desde el vencimiento vigente, o desde hoy.
   */
  static accesoHasta(plan, hoy = new Date(), accesoActual = null) {
    if (plan !== Plan.ANUAL) return null;
    const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const actual = accesoActual ? Plan.#soloDia(accesoActual) : null;
    const desde = actual && actual > base ? actual : base;
    return new Date(desde.getFullYear() + 1, desde.getMonth(), desde.getDate());
  }

  /** ¿Puede entrar hoy? */
  static accesoVigente(user, hoy = new Date()) {
    if (!user || !user.ha_pagado) return false;
    if (user.plan !== Plan.ANUAL) return true;              // fundador o anterior a los planes
    if (!user.acceso_hasta) return false;
    return Plan.#soloDia(user.acceso_hasta) >= new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  }

  /** Motivo por el que se pide pagar: nunca pagó, o su plan anual venció. */
  static motivoPago(user) {
    return user?.ha_pagado && user.plan === Plan.ANUAL ? 'RENOVAR' : 'PAGO_PENDIENTE';
  }

  /** Date → 'YYYY-MM-DD' en hora local (para guardar en una columna DATE). */
  static aISO(d) {
    if (!d) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Lo que la app necesita saber del plan de un usuario. */
  static resumen(user, cfg = Plan.config()) {
    const plan = user?.plan === Plan.ANUAL ? Plan.ANUAL : Plan.FUNDADOR;
    return {
      plan,
      acceso_hasta: plan === Plan.ANUAL && user.acceso_hasta ? Plan.aISO(Plan.#soloDia(user.acceso_hasta)) : null,
      precio_renovacion: plan === Plan.ANUAL ? cfg.precioAnual : null,
    };
  }

  /** "YYYY-MM-DD" o Date → Date local a medianoche */
  static #soloDia(v) {
    if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const d = new Date(v);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
}

module.exports = Plan;
