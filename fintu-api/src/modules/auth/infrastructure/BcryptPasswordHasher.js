/**
 * ADAPTADOR: hashing con bcrypt (mismas rondas que el código original).
 */
const bcrypt = require('bcryptjs');
const PasswordHasher = require('../domain/PasswordHasher');

class BcryptPasswordHasher extends PasswordHasher {
  static SALT_ROUNDS = 10;

  async hash(plainPassword) {
    return bcrypt.hash(plainPassword, BcryptPasswordHasher.SALT_ROUNDS);
  }

  async compare(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = BcryptPasswordHasher;
