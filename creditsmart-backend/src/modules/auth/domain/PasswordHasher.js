/**
 * PUERTO: hashing de contraseñas (implementado con bcrypt en infraestructura).
 */

/* eslint-disable no-unused-vars */
class PasswordHasher {
  async hash(plainPassword) {
    throw new Error('PasswordHasher.hash no implementado');
  }

  async compare(plainPassword, hashedPassword) {
    throw new Error('PasswordHasher.compare no implementado');
  }
}

module.exports = PasswordHasher;
