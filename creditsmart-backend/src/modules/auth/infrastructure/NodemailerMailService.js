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
      from: `"CreditSmart PE" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `Tu código de recuperación: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:40px auto;padding:0 20px;">
            <div style="background:linear-gradient(145deg,#1a1a1a,#111);border:1px solid rgba(212,165,116,0.2);border-radius:20px;overflow:hidden;">
              <div style="padding:32px 32px 20px;border-bottom:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(212,165,116,0.7);">CreditSmart PE</p>
                <h1 style="margin:12px 0 0;font-size:24px;font-weight:800;color:#e5e5e5;letter-spacing:-0.5px;">Recupera tu contraseña</h1>
              </div>
              <div style="padding:28px 32px;">
                <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">Hola ${nombre}, recibimos una solicitud para restablecer tu contraseña. Usa este código:</p>
                <div style="background:rgba(212,165,116,0.08);border:1px solid rgba(212,165,116,0.25);border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
                  <span style="font-size:42px;font-weight:900;letter-spacing:10px;color:#d4a574;font-family:'Courier New',monospace;">${code}</span>
                </div>
                <p style="margin:0 0 8px;font-size:13px;color:#555;">⏱ Este código expira en <strong style="color:#e5e5e5;">15 minutos</strong>.</p>
                <p style="margin:0;font-size:13px;color:#555;">Si no solicitaste este código, ignora este mensaje.</p>
              </div>
              <div style="padding:20px 32px;background:rgba(0,0,0,0.2);border-top:1px solid rgba(255,255,255,0.04);">
                <p style="margin:0;font-size:12px;color:#444;">Hecho para el Perú 🇵🇪 · CreditSmart PE</p>
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
