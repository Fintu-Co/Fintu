/**
 * ADAPTADOR: emisión de JWT (mismo secret y expiración que el original).
 */
const jwt = require('jsonwebtoken');
const TokenService = require('../domain/TokenService');

class JwtTokenService extends TokenService {
  static EXPIRES_IN = '30d';
  static MAX_SEGUNDOS = 30 * 24 * 60 * 60;

  /**
   * @param {object} payload
   * @param {{ hasta?: string }} opciones  'YYYY-MM-DD': la sesión no dura más allá de ese día
   *   (plan anual). Sin `hasta`, dura lo normal (30 días).
   */
  sign(payload, { hasta } = {}) {
    let expiresIn = JwtTokenService.EXPIRES_IN;
    if (hasta) {
      const [a, m, d] = hasta.split('-').map(Number);
      const finDelDia = new Date(a, m - 1, d, 23, 59, 59);
      const segundos = Math.floor((finDelDia - Date.now()) / 1000);
      expiresIn = Math.max(60, Math.min(JwtTokenService.MAX_SEGUNDOS, segundos));
    }
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }
}

module.exports = JwtTokenService;
