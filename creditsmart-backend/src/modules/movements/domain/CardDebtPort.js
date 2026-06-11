/**
 * PUERTO: ajuste de deuda de la tarjeta al registrar movimientos.
 *
 * Registrar un gasto/pago afecta a la tarjeta (otro agregado).
 * El módulo movements no toca la tabla de tarjetas directamente:
 * declara este puerto y la infraestructura lo implementa.
 */

/* eslint-disable no-unused-vars */
class CardDebtPort {
  /** Suma el monto a la deuda actual de la tarjeta. */
  async increaseDebt(tarjetaId, monto) {
    throw new Error('CardDebtPort.increaseDebt no implementado');
  }

  /** Resta el monto (la deuda nunca baja de 0). */
  async decreaseDebt(tarjetaId, monto) {
    throw new Error('CardDebtPort.decreaseDebt no implementado');
  }

  /** Datos mínimos de la tarjeta para el análisis de timeline. */
  async getDebtAndLimit(tarjetaId) {
    throw new Error('CardDebtPort.getDebtAndLimit no implementado');
  }
}

module.exports = CardDebtPort;
