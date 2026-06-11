const Movement = require('../models/Movement');
const Card = require('../models/Card');

// ==========================================
// Obtener movimientos de una tarjeta
// ==========================================
exports.getMovements = async (req, res) => {
  try {
    const { tarjetaId } = req.params;
    const { limite } = req.query;

    if (!tarjetaId) {
      return res.json({
        success: false,
        message: 'ID de tarjeta no proporcionado'
      });
    }

    const movimientos = await Movement.getMovementsByCard(tarjetaId, parseInt(limite) || 3);

    res.json({
      success: true,
      movimientos
    });

  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.json({
      success: false,
      message: 'Error al obtener movimientos'
    });
  }
};

// ==========================================
// Obtener movimientos de un ciclo específico
// ==========================================
exports.getMovementsByCycle = async (req, res) => {
  try {
    const { tarjetaId, mes, anio } = req.query;

    if (!tarjetaId || !mes || !anio) {
      return res.json({
        success: false,
        message: 'Faltan parámetros (tarjetaId, mes, anio)'
      });
    }

    const movimientos = await Movement.getMovementsByCycle(tarjetaId, mes, anio);

    res.json({
      success: true,
      movimientos
    });

  } catch (error) {
    console.error('Error al obtener movimientos del ciclo:', error);
    res.json({
      success: false,
      message: 'Error al obtener movimientos del ciclo'
    });
  }
};

// ==========================================
// Crear nuevo movimiento
// ==========================================
exports.createMovement = async (req, res) => {
  try {
    const {
      tarjeta_id,
      usuario_id,
      tipo,
      monto,
      descripcion,
      fecha_movimiento
    } = req.body;

    // Validaciones
    if (!tarjeta_id || !usuario_id || !tipo || !monto) {
      return res.json({
        success: false,
        message: 'Faltan campos obligatorios (tarjeta_id, usuario_id, tipo, monto)'
      });
    }

    if (tipo !== 'gasto' && tipo !== 'pago') {
      return res.json({
        success: false,
        message: 'El tipo debe ser "gasto" o "pago"'
      });
    }

    if (monto <= 0) {
      return res.json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    // Determinar ciclo (mes y año)
    const fechaMovimiento = fecha_movimiento ? new Date(fecha_movimiento) : new Date();
    const ciclo_mes = fechaMovimiento.getMonth() + 1; // 1-12
    const ciclo_anio = fechaMovimiento.getFullYear();

    const movimientoId = await Movement.create({
      tarjeta_id,
      usuario_id,
      tipo,
      monto,
      descripcion,
      fecha_movimiento: fechaMovimiento,
      ciclo_mes,
      ciclo_anio
    });

    // Actualizar deuda_actual de la tarjeta
    const db = require('../config/database');
    
    if (tipo === 'gasto') {
      // Sumar al saldo usado
      await db.execute(
        'UPDATE tarjetas SET deuda_actual = deuda_actual + ? WHERE id = ?',
        [monto, tarjeta_id]
      );
    } else if (tipo === 'pago') {
      // Restar del saldo usado (no puede ser negativo)
      await db.execute(
        'UPDATE tarjetas SET deuda_actual = GREATEST(deuda_actual - ?, 0) WHERE id = ?',
        [monto, tarjeta_id]
      );
    }

    res.json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      movimientoId
    });

  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.json({
      success: false,
      message: 'Error al crear movimiento'
    });
  }
};

// ==========================================
// Obtener estadísticas del ciclo actual
// ==========================================
exports.getStats = async (req, res) => {
  try {
    const { tarjetaId } = req.params;
    const { mes, anio } = req.query;

    if (!tarjetaId) {
      return res.json({
        success: false,
        message: 'ID de tarjeta no proporcionado'
      });
    }

    // Si no se especifica mes/año, usar actual
    const fecha = new Date();
    const ciclo_mes = mes ? parseInt(mes) : fecha.getMonth() + 1;
    const ciclo_anio = anio ? parseInt(anio) : fecha.getFullYear();

    const stats = await Movement.getStatsForCycle(tarjetaId, ciclo_mes, ciclo_anio);

    res.json({
      success: true,
      stats: {
        total_gastos: parseFloat(stats.total_gastos || 0),
        total_pagos: parseFloat(stats.total_pagos || 0),
        cantidad_gastos: parseInt(stats.cantidad_gastos || 0),
        cantidad_pagos: parseInt(stats.cantidad_pagos || 0),
        saldo_neto: parseFloat(stats.total_gastos || 0) - parseFloat(stats.total_pagos || 0)
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// ==========================================
// Obtener datos para gráfico
// ==========================================
exports.getChartData = async (req, res) => {
  try {
    const { tarjetaId } = req.params;
    const { dias } = req.query;

    if (!tarjetaId) {
      return res.json({
        success: false,
        message: 'ID de tarjeta no proporcionado'
      });
    }

    const chartData = await Movement.getChartData(tarjetaId, parseInt(dias) || 30);

    res.json({
      success: true,
      chartData
    });

  } catch (error) {
    console.error('Error al obtener datos del gráfico:', error);
    res.json({
      success: false,
      message: 'Error al obtener datos del gráfico'
    });
  }
};

// ==========================================
// Eliminar movimiento
// ==========================================
exports.deleteMovement = async (req, res) => {
  try {
    const { movimientoId, userId } = req.body;

    if (!movimientoId || !userId) {
      return res.json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const deleted = await Movement.delete(movimientoId, userId);

    if (deleted) {
      res.json({
        success: true,
        message: 'Movimiento eliminado'
      });
    } else {
      res.json({
        success: false,
        message: 'No se pudo eliminar el movimiento'
      });
    }

  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.json({
      success: false,
      message: 'Error al eliminar movimiento'
    });
  }
};

// ==========================================
// Limpieza de movimientos antiguos (cron job)
// ==========================================
exports.cleanup = async (req, res) => {
  try {
    const deleted = await Movement.cleanupOldMovements(12);

    res.json({
      success: true,
      message: `Limpieza completada. ${deleted} movimientos eliminados.`
    });

  } catch (error) {
    console.error('Error en limpieza:', error);
    res.json({
      success: false,
      message: 'Error en limpieza de movimientos'
    });
  }
  
};
// ==========================================
// Obtener datos detallados para gráfico
// ==========================================
exports.getDetailedChartData = async (req, res) => {
  try {
    const { tarjetaId } = req.params;
    const dias = parseInt(req.query.dias) || 14;

    const result = await Movement.getDetailedChartData(tarjetaId, dias);

    res.json({
      success: true,
      chartData: result.chartData,
      insights: result.insights
    });
  } catch (error) {
    console.error('Error al obtener datos del gráfico:', error);
    res.json({ success: false, message: 'Error al obtener datos' });
  }
};