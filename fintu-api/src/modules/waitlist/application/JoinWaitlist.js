/**
 * CASO DE USO: dejar el correo para que avisemos del lanzamiento.
 *
 * Privacidad: se responde igual si el correo ya estaba (no se revela quién
 * se anotó) y solo se envía el correo de confirmación la primera vez.
 * Cada correo lleva un enlace para darse de baja (borra el registro).
 */
const crypto = require('crypto');
const User = require('../../auth/domain/User');

class JoinWaitlist {
  constructor({ waitlistRepository, mailService }) {
    this.waitlistRepository = waitlistRepository;
    this.mailService = mailService;
  }

  /** @param {{ email: string, baseUrl: string }} — baseUrl: URL pública del API, para el enlace de baja */
  async execute({ email, baseUrl }) {
    const limpio = String(email || '').trim().toLowerCase();
    if (!limpio || limpio.length > 100 || !User.emailValido(limpio)) {
      return { status: 'INVALID_EMAIL' };
    }

    const token = crypto.randomBytes(20).toString('hex');
    const { nuevo, token: tokenGuardado } = await this.waitlistRepository.agregar(limpio, token);

    if (nuevo) {
      try {
        await this.mailService.sendWaitlistWelcome({
          email: limpio,
          enlaceBaja: `${baseUrl}/api/lista/baja?token=${tokenGuardado}`,
        });
      } catch (error) {
        // El correo de confirmación no es crítico: el registro ya quedó guardado
        console.error('⚠️  No se pudo enviar la confirmación de la lista:', error.message);
      }
    }

    return { status: 'OK' };
  }
}

module.exports = JoinWaitlist;
