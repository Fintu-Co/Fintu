/**
 * ENTIDAD DE DOMINIO: Card (tarjeta de crédito).
 *
 * Reglas de negocio puras:
 *   - Enriquecer una tarjeta con su ciclo vigente, % de uso y nivel de alerta.
 *   - Validar los días del ciclo (1..31).
 */
const BillingCycle = require('./BillingCycle');

class Card {
  /** Umbral de uso saludable / alto, en % de la línea. */
  static UMBRAL_USO_MEDIO = 30;
  static UMBRAL_USO_ALTO = 70;

  /**
   * Valida que los tres días del ciclo estén en rango calendario.
   */
  static diasCicloValidos(diaInicio, diaCierre, diaPago) {
    const enRango = (d) => d >= 1 && d <= 31;
    return enRango(diaInicio) && enRango(diaCierre) && enRango(diaPago);
  }

  /**
   * Devuelve la tarjeta enriquecida con ciclo + uso, igual que hacía
   * el antiguo Card.getByUserId. Si está vacía o sin días configurados,
   * se devuelve tal cual.
   */
  static enriquecerConCiclo(tarjeta) {
    if (
      !tarjeta.esta_vacia &&
      tarjeta.dia_inicio_ciclo &&
      tarjeta.dia_cierre_ciclo &&
      tarjeta.dia_pago
    ) {
      const ciclo = BillingCycle.calcularActual(
        tarjeta.dia_inicio_ciclo,
        tarjeta.dia_cierre_ciclo,
        tarjeta.dia_pago
      );

      const porcentajeUso =
        tarjeta.linea_credito > 0
          ? Math.round((tarjeta.deuda_actual / tarjeta.linea_credito) * 100)
          : 0;

      return {
        ...tarjeta,
        ...ciclo,
        porcentaje_uso: porcentajeUso,
        alerta_uso:
          porcentajeUso > Card.UMBRAL_USO_ALTO
            ? 'alta'
            : porcentajeUso > Card.UMBRAL_USO_MEDIO
            ? 'media'
            : 'baja',
      };
    }

    return tarjeta;
  }
}

module.exports = Card;
