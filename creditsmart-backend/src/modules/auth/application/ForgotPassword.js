/**
 * CASO DE USO: Solicitar código de recuperación de contraseña.
 *
 * Seguridad: si el email no existe, se responde igual que si existiera
 * (no se revela qué correos están registrados).
 */
class ForgotPassword {
  static CODE_TTL_MS = 15 * 60 * 1000; // 15 minutos

  constructor({ userRepository, mailService }) {
    this.userRepository = userRepository;
    this.mailService = mailService;
  }

  async execute({ email }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return { status: 'SILENT_OK' };
    }

    // Código de 6 dígitos con expiración corta
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + ForgotPassword.CODE_TTL_MS);

    await this.userRepository.saveResetToken(email, code, expiry);

    const delivered = await this.mailService.sendPasswordResetCode({
      email,
      nombre: user.nombre,
      code,
    });

    return { status: delivered === 'console' ? 'DEV_CODE' : 'SENT' };
  }
}

module.exports = ForgotPassword;
