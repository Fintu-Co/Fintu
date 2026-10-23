/**
 * ADAPTADOR: implementación MySQL del puerto CardRepository.
 * SQL idéntico al del antiguo models/Card.js.
 */
const CardRepository = require('../domain/CardRepository');
const db = require('../../../shared/infrastructure/database');

class MySqlCardRepository extends CardRepository {
  async findByUserId(userId) {
    const query = `
      SELECT
        t.*,
        b.nombre as banco_nombre,
        b.tea_promedio as banco_tea
      FROM tarjetas t
      LEFT JOIN bancos b ON t.banco_id = b.id
      WHERE t.usuario_id = ?
      ORDER BY t.slot_numero ASC
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows;
  }

  async findById(cardId) {
    const [rows] = await db.execute('SELECT * FROM tarjetas WHERE id = ?', [cardId]);
    return rows[0];
  }

  async updateSlot(userId, slotNumero, cardData) {
    const query = `
      UPDATE tarjetas
      SET
        banco_id = ?,
        banco_nombre_custom = ?,
        nombre_tarjeta = ?,
        linea_credito = ?,
        deuda_actual = ?,
        pago_minimo = ?,
        moneda = ?,
        simbolo_moneda = ?,
        dia_inicio_ciclo = ?,
        dia_cierre_ciclo = ?,
        dia_pago = ?,
        tasa_interes = ?,
        comision_mantenimiento = ?,
        categoria_principal = ?,
        notificar_dias_antes_cierre = ?,
        notificar_dias_antes_pago = ?,
        esta_vacia = FALSE,
        fecha_actualizacion = NOW()
      WHERE usuario_id = ? AND slot_numero = ?
    `;

    const [result] = await db.execute(query, [
      cardData.banco_id || null,
      cardData.banco_nombre_custom || null,
      cardData.nombre_tarjeta || null,
      cardData.linea_credito,
      cardData.deuda_actual || 0,
      cardData.pago_minimo || 0,
      cardData.moneda || 'Soles',
      cardData.simbolo_moneda || 'S/',
      cardData.dia_inicio_ciclo,
      cardData.dia_cierre_ciclo,
      cardData.dia_pago,
      cardData.tasa_interes || null,
      cardData.comision_mantenimiento || null,
      cardData.categoria_principal || null,
      cardData.notificar_dias_antes_cierre || 3,
      cardData.notificar_dias_antes_pago || 5,
      userId,
      slotNumero,
    ]);

    return result.affectedRows > 0;
  }

  async clearSlot(userId, slotNumero) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Obtener el ID de la tarjeta antes de limpiarla
      const [tarjetas] = await connection.execute(
        'SELECT id FROM tarjetas WHERE usuario_id = ? AND slot_numero = ?',
        [userId, slotNumero]
      );

      if (tarjetas.length === 0) {
        await connection.rollback();
        return false;
      }

      const tarjetaId = tarjetas[0].id;

      // 2. Eliminar todos los movimientos de esta tarjeta
      await connection.execute('DELETE FROM movimientos WHERE tarjeta_id = ?', [tarjetaId]);

      // 3. Limpiar los datos de la tarjeta
      const query = `
        UPDATE tarjetas
        SET
          banco_id = NULL,
          nombre_tarjeta = NULL,
          linea_credito = NULL,
          deuda_actual = 0,
          pago_minimo = 0,
          moneda = 'PEN',
          dia_inicio_ciclo = NULL,
          dia_cierre_ciclo = NULL,
          dia_pago = NULL,
          tasa_interes = NULL,
          comision_mantenimiento = NULL,
          categoria_principal = NULL,
          notificar_dias_antes_cierre = 3,
          notificar_dias_antes_pago = 5,
          esta_vacia = TRUE,
          fecha_actualizacion = NOW()
        WHERE usuario_id = ? AND slot_numero = ?
      `;

      const [result] = await connection.execute(query, [userId, slotNumero]);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al limpiar tarjeta:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateDebt(userId, slotNumero, nuevaDeuda) {
    const query = `
      UPDATE tarjetas
      SET deuda_actual = ?, fecha_actualizacion = NOW()
      WHERE usuario_id = ? AND slot_numero = ?
    `;
    const [result] = await db.execute(query, [nuevaDeuda, userId, slotNumero]);
    return result.affectedRows > 0;
  }

  async countFilledByUserId(userId) {
    const query = `
      SELECT COUNT(*) as total
      FROM tarjetas
      WHERE usuario_id = ? AND esta_vacia = FALSE
    `;
    const [rows] = await db.execute(query, [userId]);
    return rows[0].total;
  }
}

module.exports = MySqlCardRepository;
