/**
 * INTERFAZ HTTP: controller delgado de autenticación/identidad.
 * Traduce los estados de los casos de uso a las mismas respuestas
 * (códigos y mensajes) del controller anterior.
 */
function buildAuthController({
  registerUser,
  loginUser,
  confirmPayment,
  registerWithPayment,
  registerSentinelQuery,
  getSentinelQuery,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
}) {
  return {
    async register(req, res) {
      try {
        const { nombre, apellido, email, password } = req.body;

        if (!nombre || !apellido || !email || !password) {
          return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
        }

        const result = await registerUser.execute({ nombre, apellido, email, password });

        switch (result.status) {
          case 'INVALID_EMAIL':
            return res.status(400).json({ success: false, message: 'Email inválido' });
          case 'WEAK_PASSWORD':
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
          case 'EMAIL_TAKEN':
            return res.status(400).json({ success: false, message: 'Este email ya está registrado' });
          default:
            return res.status(201).json({
              success: true,
              message: 'Usuario registrado exitosamente. Completa tu pago para acceder.',
              userId: result.userId,
            });
        }
      } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error al registrar usuario' });
      }
    },

    async login(req, res) {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ success: false, message: 'Email y contraseña son obligatorios' });
        }

        const result = await loginUser.execute({ email, password });

        switch (result.status) {
          case 'INVALID_CREDENTIALS':
            return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
          case 'PAYMENT_REQUIRED':
            return res.status(403).json({
              success: false,
              message: 'Debes completar el pago de $4 para acceder',
              requiresPayment: true,
              userId: result.userId,
            });
          default:
            return res.json({
              success: true,
              message: 'Login exitoso',
              token: result.token,
              user: result.user,
            });
        }
      } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
      }
    },

    async confirmPayment(req, res) {
      try {
        const { userId, paymentId } = req.body;

        if (!userId || !paymentId) {
          return res.status(400).json({ success: false, message: 'Faltan datos del pago' });
        }

        const result = await confirmPayment.execute({ userId, paymentId });

        if (result.status === 'NOT_UPDATED') {
          return res.status(400).json({ success: false, message: 'No se pudo actualizar el estado del pago' });
        }

        res.json({
          success: true,
          message: 'Pago confirmado. Bienvenido a CreditSmart PE',
          token: result.token,
          user: result.user,
        });
      } catch (error) {
        console.error('Error confirmando pago:', error);
        res.status(500).json({ success: false, message: 'Error al confirmar el pago' });
      }
    },

    async registerWithPayment(req, res) {
      try {
        const { nombre, apellido, email, password, paymentId, montoPagado } = req.body;

        if (!nombre || !apellido || !email || !password || !paymentId) {
          return res.status(400).json({ success: false, message: 'Faltan datos del registro o del pago' });
        }

        const result = await registerWithPayment.execute({ nombre, apellido, email, password, paymentId, montoPagado });

        switch (result.status) {
          case 'INVALID_EMAIL':
            return res.status(400).json({ success: false, message: 'Email inválido' });
          case 'WEAK_PASSWORD':
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
          case 'EMAIL_TAKEN':
            return res.status(400).json({ success: false, message: 'Este email ya está registrado' });
          default:
            return res.status(201).json({
              success: true,
              message: '¡Bienvenido a CreditSmart PE!',
              token: result.token,
              user: result.user,
            });
        }
      } catch (error) {
        console.error('Error en registerWithPayment:', error);
        res.status(500).json({ success: false, message: 'Error al crear la cuenta' });
      }
    },

    async registrarSentinel(req, res) {
      try {
        const { userId } = req.body;

        const updated = await registerSentinelQuery.execute(userId);

        if (!updated) {
          return res.status(400).json({ success: false, message: 'No se pudo registrar la consulta' });
        }

        res.json({ success: true, message: 'Consulta registrada' });
      } catch (error) {
        console.error('Error Sentinel:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
      }
    },

    async getSentinel(req, res) {
      try {
        const { id } = req.params;

        const ultimaConsulta = await getSentinelQuery.execute(id);

        res.json({ success: true, ultima_consulta_sentinel: ultimaConsulta });
      } catch (error) {
        console.error('Error Sentinel:', error);
        res.status(500).json({ success: false, message: 'Error del servidor' });
      }
    },

    async forgotPassword(req, res) {
      try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'El email es obligatorio' });

        const result = await forgotPassword.execute({ email });

        switch (result.status) {
          case 'SILENT_OK':
            return res.json({ success: true, message: 'Si el email está registrado, recibirás un código en minutos.' });
          case 'DEV_CODE':
            return res.json({ success: true, message: 'Código generado. Revisa la consola del servidor (modo desarrollo).' });
          default:
            return res.json({ success: true, message: 'Código enviado a tu email. Revisa tu bandeja de entrada.' });
        }
      } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ success: false, message: 'Error al enviar el código. Intenta de nuevo.' });
      }
    },

    async resetPassword(req, res) {
      try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
          return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
        }

        const result = await resetPassword.execute({ email, code, newPassword });

        switch (result.status) {
          case 'WEAK_PASSWORD':
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
          case 'INVALID_CODE':
            return res.status(400).json({ success: false, message: 'Código inválido o expirado. Solicita uno nuevo.' });
          case 'EXPIRED':
            return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.' });
          case 'WRONG_CODE':
            return res.status(400).json({ success: false, message: 'Código incorrecto. Verifica e intenta de nuevo.' });
          default:
            return res.json({ success: true, message: '¡Contraseña actualizada! Ya puedes iniciar sesión.' });
        }
      } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
      }
    },

    async getProfile(req, res) {
      try {
        const { userId } = req.params;
        const user = await getProfile.execute(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        res.json({ success: true, user });
      } catch (error) {
        console.error('Error en getProfile:', error);
        res.status(500).json({ success: false, message: 'Error al obtener perfil' });
      }
    },

    async updateProfile(req, res) {
      try {
        const { userId, nombre, apellido } = req.body;
        if (!nombre?.trim() || !apellido?.trim()) {
          return res.status(400).json({ success: false, message: 'Nombre y apellido son obligatorios' });
        }

        const updated = await updateProfile.execute({ userId, nombre, apellido });
        res.json({ success: true, message: 'Perfil actualizado', user: updated });
      } catch (error) {
        console.error('Error en updateProfile:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
      }
    },

    async changePassword(req, res) {
      try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
        }

        const result = await changePassword.execute({ userId, currentPassword, newPassword });

        switch (result.status) {
          case 'WEAK_PASSWORD':
            return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' });
          case 'NOT_FOUND':
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
          case 'WRONG_PASSWORD':
            return res.status(400).json({ success: false, message: 'La contraseña actual es incorrecta' });
          default:
            return res.json({ success: true, message: 'Contraseña actualizada correctamente' });
        }
      } catch (error) {
        console.error('Error en changePassword:', error);
        res.status(500).json({ success: false, message: 'Error al cambiar la contraseña' });
      }
    },
  };
}

module.exports = buildAuthController;
