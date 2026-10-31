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

  async sendRenewalReminder({ email, nombre, venceEl, precio, enlace }) {
    if (!process.env.SMTP_HOST) {
      console.log(`\n📧 [DEV] Recordatorio de renovación para ${email}: vence el ${venceEl}\n`);
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
      subject: `Tu plan de Fintú vence el ${venceEl}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#E9E3DA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:40px auto;padding:0 20px;">
            <div style="background:#FBF8F3;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(43,27,23,0.12);">
              <div style="padding:28px 32px;background:#2B1B17;">
                <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F1B68C;">Fintú &amp; Co.</p>
                <h1 style="margin:10px 0 0;font-size:24px;font-weight:600;color:#F7F3ED;">Tu plan vence el ${venceEl}</h1>
              </div>
              <div style="padding:28px 32px;">
                <p style="margin:0 0 18px;font-size:15px;color:#6B5148;line-height:1.6;">Hola ${nombre}, tu plan anual de Fintú vence en 7 días. Renuévalo por <strong style="color:#2B1B17;">$${Number(precio).toFixed(2)} USD</strong> y sigue sabiendo cuánto y cuándo pagar tus tarjetas.</p>
                <a href="${enlace}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#2F4A3E;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;">Renovar mi plan</a>
                <p style="margin:22px 0 0;font-size:13px;color:#8A746A;">No hay cobros automáticos: solo se renueva si tú lo pagas. Tus datos se guardan aunque el plan venza.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return 'email';
  }

  async sendWaitlistWelcome({ email, enlaceBaja }) {
    if (!process.env.SMTP_HOST) {
      console.log(`\n📧 [DEV] Confirmación de lista para ${email}. Baja: ${enlaceBaja}\n`);
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
      subject: 'Te avisaremos cuando abramos',
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#E9E3DA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          <div style="max-width:480px;margin:40px auto;padding:0 20px;">
            <div style="background:#FBF8F3;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(43,27,23,0.12);">
              <div style="padding:28px 32px;background:#2B1B17;">
                <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F1B68C;">Fintú &amp; Co.</p>
                <h1 style="margin:10px 0 0;font-size:24px;font-weight:600;color:#F7F3ED;">Listo, estás en la lista</h1>
              </div>
              <div style="padding:28px 32px;">
                <p style="margin:0 0 14px;font-size:15px;color:#6B5148;line-height:1.6;">Te escribiremos una sola vez, cuando abramos, para contarte cuántos cupos de fundador quedan: <strong style="color:#2B1B17;">$5 una vez y acceso de por vida</strong>, solo para los primeros 100.</p>
                <p style="margin:0;font-size:15px;color:#6B5148;line-height:1.6;">Mientras tanto, puedes ver cómo funciona en la demo de nuestra página.</p>
                <p style="margin:22px 0 0;font-size:12.5px;color:#8A746A;">¿Te anotaste por error? <a href="${enlaceBaja}" style="color:#A5562F;">Sácame de la lista</a> y borramos tu correo.</p>
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
