/**
 * PUERTO: persistencia de movimientos.
 */

/* eslint-disable no-unused-vars */
class MovementRepository {
  /** Movimientos de una tarjeta (más recientes primero). */
  async findByCard(tarjetaId) {
    throw new Error('MovementRepository.findByCard no implementado');
  }

  /** Movimientos de un ciclo concreto (mes/año). */
  async findByCycle(tarjetaId, mes, anio) {
    throw new Error('MovementRepository.findByCycle no implementado');
  }

  /** Movimientos de los últimos N días, ASC (para timeline). */
  async findRecentByCard(tarjetaId, dias) {
    throw new Error('MovementRepository.findRecentByCard no implementado');
  }

  /** Inserta un movimiento. Devuelve el id. */
  async create(movementData) {
    throw new Error('MovementRepository.create no implementado');
  }

  /** Totales y conteos de gastos/pagos de un ciclo. */
  async statsForCycle(tarjetaId, mes, anio) {
    throw new Error('MovementRepository.statsForCycle no implementado');
  }

  /** Gastos/pagos agregados por día (últimos N días). */
  async chartData(tarjetaId, dias) {
    throw new Error('MovementRepository.chartData no implementado');
  }

  /** Borra un movimiento del usuario. */
  async delete(movimientoId, userId) {
    throw new Error('MovementRepository.delete no implementado');
  }

  /** Borra movimientos con más de N meses. Devuelve filas afectadas. */
  async deleteOlderThanMonths(meses) {
    throw new Error('MovementRepository.deleteOlderThanMonths no implementado');
  }
}

module.exports = MovementRepository;
