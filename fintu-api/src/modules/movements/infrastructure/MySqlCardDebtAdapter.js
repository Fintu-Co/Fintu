/**
 * ADAPTADOR: implementación MySQL del puerto CardDebtPort.
 * SQL idéntico al que vivía inline en movementController.createMovement
 * y en Movement.getDetailedChartData.
 */
const CardDebtPort = require('../domain/CardDebtPort');
const db = require('../../../shared/infrastructure/database');

class MySqlCardDebtAdapter extends CardDebtPort {
  async increaseDebt(tarjetaId, monto) {
    await db.execute(
      'UPDATE tarjetas SET deuda_actual = deuda_actual + ? WHERE id = ?',
      [monto, tarjetaId]
    );
  }

  async decreaseDebt(tarjetaId, monto) {
    await db.execute(
      'UPDATE tarjetas SET deuda_actual = GREATEST(deuda_actual - ?, 0) WHERE id = ?',
      [monto, tarjetaId]
    );
  }

  async getDebtAndLimit(tarjetaId) {
    const [rows] = await db.execute(
      'SELECT deuda_actual, linea_credito FROM tarjetas WHERE id = ?',
      [tarjetaId]
    );
    return rows[0];
  }
}

module.exports = MySqlCardDebtAdapter;
