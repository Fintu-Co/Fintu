/**
 * ADAPTADOR: implementación MySQL del puerto UserRepository.
 * SQL idéntico al del antiguo models/User.js (incluida la transacción
 * que crea los 4 slots de tarjeta al registrar).
 */
const UserRepository = require('../domain/UserRepository');
const db = require('../../../shared/infrastructure/database');

class MySqlUserRepository extends UserRepository {
  async create(userData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Crear usuario
      const userQuery = `
        INSERT INTO usuarios (nombre, apellido, email, password, ha_pagado, paypal_payment_id, monto_pagado, fecha_pago)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [userResult] = await connection.execute(userQuery, [
        userData.nombre,
        userData.apellido,
        userData.email,
        userData.password,
        userData.ha_pagado || false,
        userData.paypal_payment_id || null,
        userData.monto_pagado || null,
        userData.fecha_pago || null,
      ]);

      const userId = userResult.insertId;

      // 2. Crear 4 slots de tarjetas vacíos automáticamente
      const cardQuery = `
        INSERT INTO tarjetas (usuario_id, slot_numero, esta_vacia)
        VALUES (?, ?, TRUE)
      `;

      for (let slot = 1; slot <= 4; slot++) {
        await connection.execute(cardQuery, [userId, slot]);
      }

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      console.error('Error al crear usuario con slots:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
    return rows[0];
  }

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, nombre, apellido, email, ha_pagado, fecha_registro, fecha_pago FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0];
  }

  async updatePaymentStatus(userId, paymentId) {
    const [result] = await db.execute(
      `UPDATE usuarios
       SET ha_pagado = TRUE,
           paypal_payment_id = ?,
           fecha_pago = NOW()
       WHERE id = ?`,
      [paymentId, userId]
    );
    return result.affectedRows > 0;
  }

  async updateSentinelConsulta(userId) {
    const [result] = await db.execute(
      `UPDATE usuarios
       SET ultima_consulta_sentinel = NOW()
       WHERE id = ?`,
      [userId]
    );
    return result.affectedRows > 0;
  }

  async getSentinelConsulta(userId) {
    const [rows] = await db.execute(
      `SELECT ultima_consulta_sentinel
       FROM usuarios
       WHERE id = ?`,
      [userId]
    );
    return rows[0];
  }

  async saveResetToken(email, token, expiry) {
    const [result] = await db.execute(
      'UPDATE usuarios SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );
    return result.affectedRows > 0;
  }

  async updatePassword(email, hashedPassword) {
    const [result] = await db.execute(
      'UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE email = ?',
      [hashedPassword, email]
    );
    return result.affectedRows > 0;
  }

  async getProfile(userId) {
    const [rows] = await db.execute(
      `SELECT id, nombre, apellido, email, ha_pagado, fecha_registro, fecha_pago, paypal_payment_id, monto_pagado
       FROM usuarios WHERE id = ?`,
      [userId]
    );
    return rows[0];
  }

  async updateProfile(userId, nombre, apellido) {
    const [result] = await db.execute(
      'UPDATE usuarios SET nombre = ?, apellido = ? WHERE id = ?',
      [nombre, apellido, userId]
    );
    return result.affectedRows > 0;
  }

  async getPasswordById(userId) {
    const [rows] = await db.execute('SELECT password FROM usuarios WHERE id = ?', [userId]);
    return rows[0]?.password;
  }

  async changePassword(userId, hashedPassword) {
    const [result] = await db.execute(
      'UPDATE usuarios SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = MySqlUserRepository;
