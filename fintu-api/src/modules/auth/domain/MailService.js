/**
 * PUERTO: envío de correos transaccionales
 * (implementado con nodemailer en infraestructura).
 */

/* eslint-disable no-unused-vars */
class MailService {
  /**
   * Envía el código de recuperación de contraseña.
   * Devuelve 'email' si se envió por correo, o 'console' si se
   * registró por consola (modo desarrollo sin SMTP).
   */
  async sendPasswordResetCode({ email, nombre, code }) {
    throw new Error('MailService.sendPasswordResetCode no implementado');
  }

  /** Aviso de que el plan anual vence pronto. Mismo retorno que el anterior. */
  async sendRenewalReminder({ email, nombre, venceEl, precio, enlace }) {
    throw new Error('MailService.sendRenewalReminder no implementado');
  }
}

module.exports = MailService;
