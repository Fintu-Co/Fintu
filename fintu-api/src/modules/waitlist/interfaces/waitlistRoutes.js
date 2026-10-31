/**
 * RUTAS + COMPOSITION ROOT del módulo waitlist ("Avísame cuando salga").
 *   POST /api/lista/unirse  { email }   → lo usa el landing
 *   GET  /api/lista/baja?token=…        → enlace del correo; responde una página simple
 */
const express = require('express');
const { waitlistLimiter } = require('../../../shared/middleware/rateLimit');
const MySqlWaitlistRepository = require('../infrastructure/MySqlWaitlistRepository');
const NodemailerMailService = require('../../auth/infrastructure/NodemailerMailService');
const JoinWaitlist = require('../application/JoinWaitlist');
const LeaveWaitlist = require('../application/LeaveWaitlist');

const waitlistRepository = new MySqlWaitlistRepository();
const joinWaitlist = new JoinWaitlist({ waitlistRepository, mailService: new NodemailerMailService() });
const leaveWaitlist = new LeaveWaitlist({ waitlistRepository });

const router = express.Router();

router.post('/unirse', waitlistLimiter, async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const result = await joinWaitlist.execute({ email: req.body?.email, baseUrl });
    if (result.status === 'INVALID_EMAIL') {
      return res.status(400).json({ success: false, message: 'Revisa tu correo: parece que no es válido.' });
    }
    res.json({ success: true, message: 'Listo. Te avisaremos cuando abramos.' });
  } catch (error) {
    console.error('Error en lista de interesados:', error);
    res.status(500).json({ success: false, message: 'No pudimos guardar tu correo. Intenta de nuevo.' });
  }
});

/* Página mínima con los colores de la marca: se abre desde el correo */
const pagina = (titulo, texto) => `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} · Fintú &amp; Co.</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#E9E3DA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:16px;">
  <div style="max-width:420px;background:#2B1B17;color:#F7F3ED;border-radius:22px;padding:32px;">
    <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#F1B68C;">Fintú &amp; Co.</p>
    <h1 style="margin:10px 0 8px;font-size:24px;font-weight:600;">${titulo}</h1>
    <p style="margin:0;font-size:15px;line-height:1.55;color:rgba(247,243,237,0.75);">${texto}</p>
  </div>
</body></html>`;

router.get('/baja', async (req, res) => {
  try {
    const result = await leaveWaitlist.execute({ token: String(req.query.token || '') });
    if (result.status === 'OK') {
      return res.send(pagina('Listo, te borramos', 'Tu correo ya no está en nuestra lista. No te escribiremos más.'));
    }
    res.status(404).send(pagina('No encontramos ese enlace', 'Puede que ya te hayas dado de baja. Si tienes dudas, escríbenos a soporte.fintu@gmail.com.'));
  } catch (error) {
    console.error('Error en baja de la lista:', error);
    res.status(500).send(pagina('Algo salió mal', 'Intenta de nuevo en unos minutos o escríbenos a soporte.fintu@gmail.com.'));
  }
});

module.exports = router;
