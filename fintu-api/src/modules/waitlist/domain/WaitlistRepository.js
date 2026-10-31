/**
 * PUERTO: lista de interesados ("Avísame cuando salga").
 * Guarda solo el correo, la fecha y un token para darse de baja.
 */

/* eslint-disable no-unused-vars */
class WaitlistRepository {
  /** Agrega el correo. Si ya estaba, no hace nada. Devuelve { nuevo, token }. */
  async agregar(email, token) {
    throw new Error('WaitlistRepository.agregar no implementado');
  }

  /** Borra el correo de la lista usando su token. Devuelve true si existía. */
  async quitarPorToken(token) {
    throw new Error('WaitlistRepository.quitarPorToken no implementado');
  }
}

module.exports = WaitlistRepository;
