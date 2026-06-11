/**
 * ADAPTADOR: emisión de JWT (mismo secret y expiración que el original).
 */
const jwt = require('jsonwebtoken');
const TokenService = require('../domain/TokenService');

class JwtTokenService extends TokenService {
  static EXPIRES_IN = '30d';

  sign(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JwtTokenService.EXPIRES_IN });
  }
}

module.exports = JwtTokenService;
