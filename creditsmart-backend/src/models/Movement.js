const db = require('../config/database');

class Movement {
  
  // ==========================================
  // Obtener movimientos de una tarjeta (últimos N ciclos)
  // ==========================================
  static async getMovementsByCard(tarjetaId, limiteCiclos = 3) {
    try {
      const query = `
        SELECT 
          m.*,
          DATE_FORMAT(m.fecha_movimiento, '%d/%m/%Y %H:%i') as fecha_formateada
        FROM movimientos m
        WHERE m.tarjeta_id = ?
        ORDER BY m.fecha_movimiento DESC, m.id DESC
      `;
      
      const [rows] = await db.execute(query, [tarjetaId]);
      return rows;
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      throw error;
    }
  }

  // ==========================================
  // Obtener movimientos de un ciclo específico
  // ==========================================
  static async getMovementsByCycle(tarjetaId, mes, anio) {
    try {
      const query = `
        SELECT 
          m.*,
          DATE_FORMAT(m.fecha_movimiento, '%d/%m/%Y %H:%i') as fecha_formateada
        FROM movimientos m
        WHERE m.tarjeta_id = ? 
          AND m.ciclo_mes = ? 
          AND m.ciclo_anio = ?
        ORDER BY m.fecha_movimiento DESC
      `;
      
      const [rows] = await db.execute(query, [tarjetaId, mes, anio]);
      return rows;
    } catch (error) {
      console.error('Error al obtener movimientos del ciclo:', error);
      throw error;
    }
  }

  // ==========================================
  // Crear nuevo movimiento (gasto o pago)
  // ==========================================
  static async create(movementData) {
    try {
      const query = `
        INSERT INTO movimientos (
          tarjeta_id,
          usuario_id,
          tipo,
          monto,
          descripcion,
          fecha_movimiento,
          ciclo_mes,
          ciclo_anio
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(query, [
        movementData.tarjeta_id,
        movementData.usuario_id,
        movementData.tipo,
        movementData.monto,
        movementData.descripcion || null,
        movementData.fecha_movimiento,
        movementData.ciclo_mes,
        movementData.ciclo_anio
      ]);

      return result.insertId;
    } catch (error) {
      console.error('Error al crear movimiento:', error);
      throw error;
    }
  }

  // ==========================================
  // Obtener estadísticas del ciclo actual
  // ==========================================
  static async getStatsForCycle(tarjetaId, mes, anio) {
    try {
      const query = `
        SELECT 
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as total_gastos,
          SUM(CASE WHEN tipo = 'pago' THEN monto ELSE 0 END) as total_pagos,
          COUNT(CASE WHEN tipo = 'gasto' THEN 1 END) as cantidad_gastos,
          COUNT(CASE WHEN tipo = 'pago' THEN 1 END) as cantidad_pagos
        FROM movimientos
        WHERE tarjeta_id = ? 
          AND ciclo_mes = ? 
          AND ciclo_anio = ?
      `;
      
      const [rows] = await db.execute(query, [tarjetaId, mes, anio]);
      return rows[0];
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  }

  // ==========================================
  // Obtener historial para gráfico (últimos 30 días)
  // ==========================================
  static async getChartData(tarjetaId, dias = 30) {
    try {
      const query = `
        SELECT 
          DATE(fecha_movimiento) as fecha,
          SUM(CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END) as gastos,
          SUM(CASE WHEN tipo = 'pago' THEN monto ELSE 0 END) as pagos
        FROM movimientos
        WHERE tarjeta_id = ? 
          AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(fecha_movimiento)
        ORDER BY fecha ASC
      `;
      
      const [rows] = await db.execute(query, [tarjetaId, dias]);
      return rows;
    } catch (error) {
      console.error('Error al obtener datos del gráfico:', error);
      throw error;
    }
  }

  // ==========================================
  // Eliminar movimientos antiguos (limpieza automática)
  // ==========================================
  static async cleanupOldMovements(mesesAntiguos = 12) {
    try {
      const query = `
        DELETE FROM movimientos
        WHERE fecha_movimiento < DATE_SUB(NOW(), INTERVAL ? MONTH)
      `;
      
      const [result] = await db.execute(query, [mesesAntiguos]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error al limpiar movimientos antiguos:', error);
      throw error;
    }
  }

  // ==========================================
  // Eliminar un movimiento específico
  // ==========================================
  static async delete(movimientoId, userId) {
    try {
      const query = `
        DELETE FROM movimientos
        WHERE id = ? AND usuario_id = ?
      `;
      
      const [result] = await db.execute(query, [movimientoId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar movimiento:', error);
      throw error;
    }
  }

// ==========================================
// Obtener movimientos individuales para gráfico detallado
// ==========================================
static async getDetailedChartData(tarjetaId, dias = 14) {
  try {
    // Obtener tarjeta para datos adicionales
    const [tarjetaData] = await db.execute(
      'SELECT deuda_actual, linea_credito FROM tarjetas WHERE id = ?',
      [tarjetaId]
    );

    if (tarjetaData.length === 0) {
      return { chartData: [], insights: null };
    }

    const deudaActualTotal = parseFloat(tarjetaData[0].deuda_actual || 0);
    const lineaCredito = parseFloat(tarjetaData[0].linea_credito || 0);

    // Obtener movimientos del período
    const query = `
      SELECT id, tipo, monto, fecha_movimiento
      FROM movimientos 
      WHERE tarjeta_id = ? 
      AND fecha_movimiento >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY fecha_movimiento ASC, id ASC
    `;

    const [movimientos] = await db.execute(query, [tarjetaId, dias]);

    if (movimientos.length === 0) {
      return { chartData: [], insights: null };
    }

    // Calcular deuda inicial del período
    let sumaGastosPeriodo = 0;
    let sumaPagosPeriodo = 0;

    movimientos.forEach(mov => {
      if (mov.tipo === 'gasto') {
        sumaGastosPeriodo += parseFloat(mov.monto);
      } else if (mov.tipo === 'pago') {
        sumaPagosPeriodo += parseFloat(mov.monto);
      }
    });

    const deudaInicioPeriodo = deudaActualTotal - sumaGastosPeriodo + sumaPagosPeriodo;
    
    // Construir datos del gráfico
    let deudaAcumulada = deudaInicioPeriodo;
    const chartData = [];

    // Agregar punto inicial
    if (movimientos.length > 0) {
      const primeraFecha = new Date(movimientos[0].fecha_movimiento);
      primeraFecha.setDate(primeraFecha.getDate() - 1);
      
      chartData.push({
        fecha: primeraFecha,
        tipo: 'inicial',
        gasto: 0,
        pago: 0,
        deuda_acumulada: deudaInicioPeriodo
      });
    }

    // Procesar movimientos
    let maxGasto = 0;
    let maxGastoFecha = null;
    let maxPago = 0;
    let maxPagoFecha = null;

    movimientos.forEach(mov => {
      const monto = parseFloat(mov.monto);
      
      if (mov.tipo === 'gasto') {
        deudaAcumulada += monto;
        chartData.push({
          fecha: mov.fecha_movimiento,
          tipo: 'gasto',
          gasto: monto,
          pago: 0,
          deuda_acumulada: deudaAcumulada
        });
        
        if (monto > maxGasto) {
          maxGasto = monto;
          maxGastoFecha = mov.fecha_movimiento;
        }
      } else if (mov.tipo === 'pago') {
        deudaAcumulada = Math.max(0, deudaAcumulada - monto);
        chartData.push({
          fecha: mov.fecha_movimiento,
          tipo: 'pago',
          gasto: 0,
          pago: monto,
          deuda_acumulada: deudaAcumulada
        });
        
        if (monto > maxPago) {
          maxPago = monto;
          maxPagoFecha = mov.fecha_movimiento;
        }
      }
    });

    // Calcular insights
    const insights = {
      pico_gasto: maxGasto > 0 ? {
        monto: maxGasto,
        fecha: maxGastoFecha
      } : null,
      mejor_pago: maxPago > 0 ? {
        monto: maxPago,
        fecha: maxPagoFecha
      } : null,
      total_gastos: sumaGastosPeriodo,
      total_pagos: sumaPagosPeriodo,
      num_gastos: movimientos.filter(m => m.tipo === 'gasto').length,
      num_pagos: movimientos.filter(m => m.tipo === 'pago').length,
      promedio_gasto_diario: sumaGastosPeriodo / dias,
      deuda_inicial: deudaInicioPeriodo,
      deuda_final: deudaActualTotal,
      variacion_deuda: deudaActualTotal - deudaInicioPeriodo,
      linea_credito: lineaCredito,
      uso_30_porciento: lineaCredito * 0.3,
      uso_70_porciento: lineaCredito * 0.7
    };

    return { chartData, insights };

  } catch (error) {
    console.error('Error en getDetailedChartData:', error);
    throw error;
  }
}


}


module.exports = Movement;