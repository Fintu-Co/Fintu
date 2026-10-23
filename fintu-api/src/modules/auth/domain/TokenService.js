/**
 * PUERTO: emisión de tokens de sesión (implementado con JWT en infraestructura).
 */

/* eslint-disable no-unused-vars */
class TokenService {
  /** Firma un token de sesión para { userId, email }. */
  sign(payload) {
    throw new Error('TokenService.sign no implementado');
  }
}

module.exports = TokenService;
