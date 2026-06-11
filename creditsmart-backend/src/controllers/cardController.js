const Card = require('../models/Card');

// ==========================================
// Obtener las 4 tarjetas del usuario (con ciclo calculado)
// ==========================================
exports.getUserCards = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.json({
        success: false,
        message: 'Usuario no identificado'
      });
    }

    const tarjetas = await Card.getByUserId(userId);

    res.json({
      success: true,
      tarjetas
    });

  } catch (error) {
    console.error('Error al obtener tarjetas:', error);
    res.json({
      success: false,
      message: 'Error al obtener tarjetas'
    });
  }
};

// ==========================================
// Actualizar (rellenar) una tarjeta
// ==========================================
exports.updateCard = async (req, res) => {
  try {
    const {
      usuario_id,
      slot_numero,
      banco_id,
      banco_nombre_custom,
      nombre_tarjeta,
      linea_credito,
      deuda_actual,
      pago_minimo,
      moneda,
      simbolo_moneda,
      dia_inicio_ciclo,
      dia_cierre_ciclo,
      dia_pago,
      tasa_interes,
      comision_mantenimiento,
      categoria_principal,
      notificar_dias_antes_cierre,
      notificar_dias_antes_pago
    } = req.body;

    // ✅ banco_id puede ser null si se usa banco_nombre_custom
    const bancoValido = banco_id || banco_nombre_custom;

    if (!usuario_id || !slot_numero || !bancoValido || !linea_credito || 
        !dia_inicio_ciclo || !dia_cierre_ciclo || !dia_pago) {
      return res.json({
        success: false,
        message: 'Faltan campos obligatorios (banco, línea de crédito, días de ciclo)'
      });
    }

    if (dia_inicio_ciclo < 1 || dia_inicio_ciclo > 31 ||
        dia_cierre_ciclo < 1 || dia_cierre_ciclo > 31 ||
        dia_pago < 1 || dia_pago > 31) {
      return res.json({
        success: false,
        message: 'Los días del ciclo deben estar entre 1 y 31'
      });
    }

    const updated = await Card.updateSlot(usuario_id, slot_numero, {
      banco_id,
      banco_nombre_custom,
      nombre_tarjeta,
      linea_credito,
      deuda_actual,
      pago_minimo,
      moneda,
      simbolo_moneda,
      dia_inicio_ciclo,
      dia_cierre_ciclo,
      dia_pago,
      tasa_interes,
      comision_mantenimiento,
      categoria_principal,
      notificar_dias_antes_cierre,
      notificar_dias_antes_pago
    });

    if (updated) {
      res.json({ success: true, message: 'Tarjeta agregada exitosamente' });
    } else {
      res.json({ success: false, message: 'No se pudo actualizar la tarjeta' });
    }

  } catch (error) {
    console.error('Error al actualizar tarjeta:', error);
    res.json({ success: false, message: 'Error al actualizar tarjeta' });
  }
};

// ==========================================
// Limpiar (vaciar) una tarjeta
// ==========================================
exports.clearCard = async (req, res) => {
  try {
    const { userId, slotNumero } = req.body;

    if (!userId || !slotNumero) {
      return res.json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const cleared = await Card.clearSlot(userId, slotNumero);

    if (cleared) {
      res.json({
        success: true,
        message: 'Tarjeta limpiada exitosamente'
      });
    } else {
      res.json({
        success: false,
        message: 'No se pudo limpiar la tarjeta'
      });
    }

  } catch (error) {
    console.error('Error al limpiar tarjeta:', error);
    res.json({
      success: false,
      message: 'Error al limpiar tarjeta'
    });
  }
};

// ==========================================
// Actualizar solo la deuda de una tarjeta
// ==========================================
exports.updateDeuda = async (req, res) => {
  try {
    const { userId, slotNumero, nuevaDeuda } = req.body;

    if (!userId || !slotNumero || nuevaDeuda === undefined) {
      return res.json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const updated = await Card.updateDeuda(userId, slotNumero, nuevaDeuda);

    if (updated) {
      res.json({
        success: true,
        message: 'Deuda actualizada exitosamente'
      });
    } else {
      res.json({
        success: false,
        message: 'No se pudo actualizar la deuda'
      });
    }

  } catch (error) {
    console.error('Error al actualizar deuda:', error);
    res.json({
      success: false,
      message: 'Error al actualizar deuda'
    });
  }
};

// ==========================================
// Obtener lista de bancos
// ==========================================
exports.getBancos = async (req, res) => {
  try {
    const db = require('../config/database');
    const query = `
      SELECT id, nombre, logo_url, tea_minima, tea_maxima, tea_promedio 
      FROM bancos 
      ORDER BY nombre
    `;
    const [bancos] = await db.execute(query);

    res.json({
      success: true,
      bancos
    });

  } catch (error) {
    console.error('Error al obtener bancos:', error);
    res.json({
      success: false,
      message: 'Error al obtener bancos'
    });
  }
};

// Obtener una tarjeta específica por ID
exports.getCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM tarjetas WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }

    res.json({
      success: true,
      tarjeta: rows[0]
    });

  } catch (error) {
    console.error('Error al obtener tarjeta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tarjeta'
    });
  }
};