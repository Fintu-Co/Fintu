/**
 * CASO DE USO: avisar por correo a quienes tienen plan anual y les vence
 * en DIAS_ANTES días. Lo ejecuta el scheduler una vez al día.
 * No hay cobros automáticos: el correo solo invita a renovar.
 */
const Plan = require('../domain/Plan');

class SendRenewalReminders {
  static DIAS_ANTES = 7;

  constructor({ userRepository, mailService }) {
    this.userRepository = userRepository;
    this.mailService = mailService;
  }

  async execute(hoy = new Date()) {
    const objetivo = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + SendRenewalReminders.DIAS_ANTES);
    const usuarios = await this.userRepository.findAnualesQueVencen(Plan.aISO(objetivo));
    const { precioAnual } = Plan.config();
    const appUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
    const venceEl = objetivo.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });

    let enviados = 0;
    for (const u of usuarios) {
      try {
        await this.mailService.sendRenewalReminder({
          email: u.email, nombre: u.nombre, venceEl, precio: precioAnual, enlace: `${appUrl}/login`,
        });
        enviados++;
      } catch (error) {
        console.error(`⚠️  No se pudo enviar el recordatorio a userId=${u.id}:`, error.message);
      }
    }
    return enviados;
  }
}

module.exports = SendRenewalReminders;
