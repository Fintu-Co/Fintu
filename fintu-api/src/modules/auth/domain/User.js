/**
 * ENTIDAD DE DOMINIO: User.
 * Reglas de negocio de identidad: formato de email y política de contraseña.
 */
class User {
  static EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static PASSWORD_MIN = 6;

  static emailValido(email) {
    return User.EMAIL_REGEX.test(email);
  }

  static passwordValida(password) {
    return typeof password === 'string' && password.length >= User.PASSWORD_MIN;
  }
}

module.exports = User;
