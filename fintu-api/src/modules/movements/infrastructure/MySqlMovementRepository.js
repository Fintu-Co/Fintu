/**
 * ADAPTADOR: implementación MySQL del puerto MovementRepository.
 * SQL idéntico al del antiguo models/Movement.js.
 */
const MovementRepository = require('../domain/MovementRepository');
const db = require('../../../shared/infrastructure/database');

class MySqlMovementRepository extends MovementRepository {
  async findByCard(tarjetaId, limite = null) {
    // MySQL no acepta placeholders (?) en LIMIT con prepared statements, así que
    // se interpola — es seguro porque solo se usa tras validar que es un entero > 0.
    const tope = Number.isInteger(limite) && limite > 0 ? ` LIMIT ${limite}` : '';
    const query = `
      SELECT
        m.*,
        DATE_FORMAT(m.fecha_movimiento, '%d/%m/%Y %H:%i') as fecha_formateada
      FROM movimientos m
      WHERE m.tarjeta_id = ?
      ORDER BY m.fecha_movimiento DESC, m.id DESC${tope}
    `;
    const [rows] = await db.execute(query, [tarjetaId]);
    return rows;
  }

  async findByCycle(tarjetaId, mes, anio) {
    const query = `
      SELECT
        m.*,
        DATE_FORMAT(m.fecha_movimiento, '%d/%m/%Y %H:%i') as fecha_formateada
      FROM movimientos m
      WHERE m.tarjeta_id = ?
        AND m.ciclo_mes = ?
        AND m.ciclo_anio = ?
      ORDER BY m.fecha_movimiento DESC
    `;
    const [rows] = await db.execute(query, [tarjetaId, mes, anio]);
    return rows;
  }

  async findByDateRange(tarjetaId, desde, hasta) {
    /* `hasta` es inclusive: se compara contra el día siguiente a medianoche
       para no perder los movimientos con hora del propio día de cierre. */
    const query = `
      SELECT m.*
      FROM movimientos m
      WHERE m.tarjeta_id = ?
        AND m.fecha_movimiento >= ?
        AND m.fecha_movimiento <  DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY m.fecha_movimiento DESC
    `;
    const [rows] = await db.execute(query, [tarjetaId, desde, hasta]);
    return rows;
  }

  async findRecentByCard(tarjetaId, dias) {
    const query = `
      SELECT id, tipo, monto, fecha_movimiento
      FROM movimientos
      WHERE tarjeta_id = ?
      AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY fecha_movimiento ASC, id ASC
    `;
    const [rows] = await db.execute(query, [tarjetaId, dias]);
    return rows;
  }

  async create(movementData) {
    const query = `
      INSERT INTO movimientos (
        tarjeta_id,
        usuario_id,
        tipo,
        monto,
        descripcion,
        fecha_movimiento,
        ciclo_mes,
        ciclo_anio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      movementData.tarjeta_id,
      movementData.usuario_id,
      movementData.tipo,
      movementData.monto,
      movementData.descripcion || null,
      movementData.fecha_movimiento,
      movementData.ciclo_mes,
      movementData.ciclo_anio,
    ]);

    return result.insertId;
  }

  async statsForCycle(tarjetaId, mes, anio) {
    const query = `
      SELECT
        SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos,
        SUM(CASE WHEN tipo = 'pago' THEN monto ELSE 0 END) as total_pagos,
        COUNT(CASE WHEN tipo = 'gasto' THEN 1 END) as cantidad_gastos,
        COUNT(CASE WHEN tipo = 'pago' THEN 1 END) as cantidad_pagos
      FROM movimientos
      WHERE tarjeta_id = ?
        AND ciclo_mes = ?
        AND ciclo_anio = ?
    `;
    const [rows] = await db.execute(query, [tarjetaId, mes, anio]);
    return rows[0];
  }

  async chartData(tarjetaId, dias) {
    const query = `
      SELECT
        DATE(fecha_movimiento) as fecha,
        SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
        SUM(CASE WHEN tipo = 'pago' THEN monto ELSE 0 END) as pagos
      FROM movimientos
      WHERE tarjeta_id = ?
        AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(fecha_movimiento)
      ORDER BY fecha ASC
    `;
    const [rows] = await db.execute(query, [tarjetaId, dias]);
    return rows;
  }

  async findById(movimientoId, userId) {
    const query = `
      SELECT * FROM movimientos
      WHERE id = ? AND usuario_id = ?
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [movimientoId, userId]);
    return rows[0] || null;
  }

  async delete(movimientoId, userId) {
    const query = `
      DELETE FROM movimientos
      WHERE id = ? AND usuario_id = ?
    `;
    const [result] = await db.execute(query, [movimientoId, userId]);
    return result.affectedRows > 0;
  }

  async deleteOlderThanMonths(meses) {
    const query = `
      DELETE FROM movimientos
      WHERE fecha_movimiento < DATE_SUB(NOW(), INTERVAL ? MONTH)
    `;
    const [result] = await db.execute(query, [meses]);
    return result.affectedRows;
  }
}

module.exports = MySqlMovementRepository;
