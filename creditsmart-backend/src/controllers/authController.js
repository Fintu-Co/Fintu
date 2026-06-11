const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Registrar usuario
exports.register = async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body;

    // Validar datos
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await User.create({ nombre, apellido, email, password: hashedPassword });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Completa tu pago para acceder.',
      userId: userId
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar datos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son obligatorios'
      });
    }

    // Buscar usuario
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Verificar si ha pagado
    if (!user.ha_pagado) {
      return res.status(403).json({
        success: false,
        message: 'Debes completar el pago de $4 para acceder',
        requiresPayment: true,
        userId: user.id
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token: token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};

// Confirmar pago de PayPal
exports.confirmPayment = async (req, res) => {
  try {
    const { userId, paymentId } = req.body;

    if (!userId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos del pago'
      });
    }

    // Actualizar estado de pago
    const updated = await User.updatePaymentStatus(userId, paymentId);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: 'No se pudo actualizar el estado del pago'
      });
    }

    // Buscar usuario actualizado
    const user = await User.findById(userId);

    // Generar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Pago confirmado. Bienvenido a CreditSmart PE',
      token: token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error confirmando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al confirmar el pago'
    });
  }
};

// Registrar usuario + confirmar pago PayPal en un solo paso
exports.registerWithPayment = async (req, res) => {
  try {
    const { nombre, apellido, email, password, paymentId, montoPagado } = req.body;

    // Validar campos obligatorios
    if (!nombre || !apellido || !email || !password || !paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos del registro o del pago'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Email inválido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Evitar duplicados
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Este email ya está registrado' });
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario con pago ya confirmado (incluye 4 slots automáticos)
    const userId = await User.create({
      nombre,
      apellido,
      email,
      password: hashedPassword,
      ha_pagado: true,
      paypal_payment_id: paymentId,
      monto_pagado: montoPagado || 4.00,
      fecha_pago: new Date()
    });

    // Generar token JWT
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: '¡Bienvenido a CreditSmart PE!',
      token,
      user: { id: userId, nombre, apellido, email }
    });

  } catch (error) {
    console.error('Error en registerWithPayment:', error);
    res.status(500).json({ success: false, message: 'Error al crear la cuenta' });
  }
};

// Registrar consulta a Sentinel
exports.registrarSentinel = async (req, res) => {
  try {
    const { userId } = req.body;

    const updated = await User.updateSentinelConsulta(userId);

    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "No se pudo registrar la consulta"
      });
    }

    res.json({
      success: true,
      message: "Consulta registrada"
    });

  } catch (error) {
    console.error("Error Sentinel:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

// Obtener última consulta Sentinel
exports.getSentinel = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await User.getSentinelConsulta(id);

    res.json({
      success: true,
      ultima_consulta_sentinel: data?.ultima_consulta_sentinel || null
    });

  } catch (error) {
    console.error("Error Sentinel:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor"
    });
  }
};

// Solicitar código de recuperación
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'El email es obligatorio' });

    const user = await User.findByEmail(email);
    // No revelar si el email existe o no (seguridad)
    if (!user) {
      return res.json({ success: true, message: 'Si el email está registrado, recibirás un código en minutos.' });
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await User.saveResetToken(email, code, expiry);

    // Log en desarrollo para testing sin SMTP
    if (!process.env.SMTP_HOST) {
      console.log(`\n📧 [DEV] Código de recuperación para ${email}: ${code}\n`);
      return res.json({ success: true, message: 'Código generado. Revisa la consola del servidor (modo desarrollo).' });
    }

    // Enviar email
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
                <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">Hola ${user.nombre}, recibimos una solicitud para restablecer tu contraseña. Usa este código:</p>
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

    res.json({ success: true, message: 'Código enviado a tu email. Revisa tu bandeja de entrada.' });

  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ success: false, message: 'Error al enviar el código. Intenta de nuevo.' });
  }
};

// Restablecer contraseña con código
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findByEmail(email);
    if (!user || !user.reset_token || !user.reset_token_expiry) {
      return res.status(400).json({ success: false, message: 'Código inválido o expirado. Solicita uno nuevo.' });
    }

    // Verificar expiración
    if (new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
    }

    // Verificar código
    if (code.trim() !== user.reset_token) {
      return res.status(400).json({ success: false, message: 'Código incorrecto. Verifica e intenta de nuevo.' });
    }

    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(email, hashedPassword);

    res.json({ success: true, message: '¡Contraseña actualizada! Ya puedes iniciar sesión.' });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
  }
};

// ── PERFIL ──

// Obtener perfil
exports.getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.getProfile(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({ success: false, message: 'Error al obtener perfil' });
  }
};

// Actualizar nombre y apellido
exports.updateProfile = async (req, res) => {
  try {
    const { userId, nombre, apellido } = req.body;
    if (!nombre?.trim() || !apellido?.trim())
      return res.status(400).json({ success: false, message: 'Nombre y apellido son obligatorios' });

    await User.updateProfile(userId, nombre.trim(), apellido.trim());
    const updated = await User.getProfile(userId);
    res.json({ success: true, message: 'Perfil actualizado', user: updated });
  } catch (error) {
    console.error('Error en updateProfile:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const hash = await User.getPasswordById(userId);
    if (!hash) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(currentPassword, hash);
    if (!match) return res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await User.changePassword(userId, newHash);
    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar la contraseña' });
  }
};
