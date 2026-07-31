/**
 * ADAPTADOR: envío de correos con nodemailer.
 * Mantiene el modo desarrollo del original: sin SMTP_HOST configurado,
 * el código se imprime en consola en lugar de enviarse.
 */
const nodemailer = require('nodemailer');
const MailService = require('../domain/MailService');

class NodemailerMailService extends MailService {
  async sendPasswordResetCode({ email, nombre, code }) {
    // Log en desarrollo para testing sin SMTP
    if (!process.env.SMTP_HOST) {
      console.log(`\n📧 [DEV] Código de recuperación para ${email}: ${code}\n`);
      return 'console';
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Fintú & Co." <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `Tu código de recuperación: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:40px auto;padding:0 20px;">
            <div style="background:#ffffff;border:1px solid #e6ebf2;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(30,45,100,0.08);">
              <div style="padding:32px 32px 20px;border-bottom:1px solid #eef1f6;">
                <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#3d6aa8;">Fintú &amp; Co.</p>
                <h1 style="margin:12px 0 0;font-size:24px;font-weight:800;color:#1e2a44;letter-spacing:-0.5px;">Recupera tu contraseña</h1>
              </div>
              <div style="padding:28px 32px;">
                <p style="margin:0 0 24px;font-size:14px;color:#5b6478;line-height:1.6;">Hola ${nombre}, recibimos una solicitud para restablecer tu contraseña. Usa este código:</p>
                <div style="background:#eef3fa;border:1px solid #d4e1f1;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
                  <span style="font-size:42px;font-weight:900;letter-spacing:10px;color:#3d6aa8;font-family:'Courier New',monospace;">${code}</span>
                </div>
                <p style="margin:0 0 8px;font-size:13px;color:#8a92a6;">Este código expira en <strong style="color:#1e2a44;">15 minutos</strong>.</p>
                <p style="margin:0;font-size:13px;color:#8a92a6;">Si no solicitaste este código, ignora este mensaje.</p>
              </div>
              <div style="padding:20px 32px;background:#f7f9fc;border-top:1px solid #eef1f6;">
                <p style="margin:0;font-size:12px;color:#9aa4b8;">Hecho para el Perú 🇵🇪 · Fintú &amp; Co.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return 'email';
  }
}

module.exports = NodemailerMailService;
