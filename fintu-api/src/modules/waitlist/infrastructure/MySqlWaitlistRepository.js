/**
 * ADAPTADOR: lista de interesados en MySQL (tabla `interesados`).
 */
const WaitlistRepository = require('../domain/WaitlistRepository');
const db = require('../../../shared/infrastructure/database');

class MySqlWaitlistRepository extends WaitlistRepository {
  async agregar(email, token) {
    // INSERT IGNORE: si el correo ya está, no se duplica ni falla
    const [result] = await db.execute(
      'INSERT IGNORE INTO interesados (email, token_baja) VALUES (?, ?)',
      [email, token]
    );
    if (result.affectedRows > 0) return { nuevo: true, token };
    const [rows] = await db.execute('SELECT token_baja FROM interesados WHERE email = ?', [email]);
    return { nuevo: false, token: rows[0]?.token_baja };
  }

  async quitarPorToken(token) {
    const [result] = await db.execute('DELETE FROM interesados WHERE token_baja = ?', [token]);
    return result.affectedRows > 0;
  }
}

module.exports = MySqlWaitlistRepository;
