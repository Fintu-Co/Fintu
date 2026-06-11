/**
 * ADAPTADOR: implementación MySQL del puerto GoalRepository.
 * Todo el SQL de objetivos vive AQUÍ y solo aquí.
 * (Consultas idénticas a las del antiguo models/Goal.js.)
 */
const GoalRepository = require('../domain/GoalRepository');
const db = require('../../../config/database');

class MySqlGoalRepository extends GoalRepository {
  async findActiveByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM objetivos WHERE usuario_id = ? AND activo = TRUE ORDER BY fecha_creacion DESC',
      [userId]
    );
    return rows;
  }

  async findCompletedByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT * FROM objetivos WHERE usuario_id = ? AND completado = TRUE ORDER BY fecha_completado DESC LIMIT 10',
      [userId]
    );
    return rows;
  }

  async countActiveByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as total FROM objetivos WHERE usuario_id = ? AND activo = TRUE AND completado = FALSE',
      [userId]
    );
    return rows[0].total;
  }

  async create(userId, data) {
    const [result] = await db.execute(
      `INSERT INTO objetivos (usuario_id, tarjeta_id, tarjeta_nombre, tipo, descripcion, meta_valor, progreso_actual, fecha_inicio, fecha_limite, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, TRUE)`,
      [
        userId,
        data.tarjeta_id || null,
        data.tarjeta_nombre || null,
        data.tipo,
        data.descripcion,
        data.meta_valor || null,
        data.progreso_actual || 0,
        data.fecha_limite || null,
      ]
    );
    return result.insertId;
  }

  async updateProgress(goalId, userId, nuevoProgreso) {
    const [result] = await db.execute(
      'UPDATE objetivos SET progreso_actual = ? WHERE id = ? AND usuario_id = ?',
      [nuevoProgreso, goalId, userId]
    );
    return result.affectedRows > 0;
  }

  async markCompleted(goalId, userId) {
    const [result] = await db.execute(
      'UPDATE objetivos SET completado = TRUE, fecha_completado = NOW(), activo = FALSE WHERE id = ? AND usuario_id = ?',
      [goalId, userId]
    );
    return result.affectedRows > 0;
  }

  async deactivate(goalId, userId) {
    const [result] = await db.execute(
      'UPDATE objetivos SET activo = FALSE WHERE id = ? AND usuario_id = ?',
      [goalId, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = MySqlGoalRepository;
