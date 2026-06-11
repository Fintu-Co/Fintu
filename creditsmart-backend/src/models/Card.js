const db = require('../config/database');  

class Card {
  
  // ==========================================
  // FUNCIÓN CLAVE: Calcular fechas del ciclo actual
  // ==========================================
static calcularCicloActual(diaInicio, diaCierre, diaPago) {
  const hoy = new Date();
  const mesActual = hoy.getMonth(); // 0-11
  const anioActual = hoy.getFullYear();
  const diaHoy = hoy.getDate();

  /*
    EJEMPLO REAL:
    Tarjeta BCP: inicio=26, cierre=25, pago=20
    
    Si hoy es 17 Febrero:
    - Ciclo actual: 26 Ene → 25 Feb
    - Pago: 20 Marzo
    
    Si hoy es 28 Febrero (cierre ya pasó):
    - Ciclo actual: 26 Feb → 25 Marzo  
    - Pago: 20 Abril
  */

  // Determinar el mes del cierre actual
  let mesCierre = mesActual;
  let anioCierre = anioActual;
  
  // Si ya pasó el día de cierre este mes, el cierre actual es el próximo mes
  if (diaHoy > diaCierre) {
    mesCierre = mesActual + 1;
    if (mesCierre > 11) {
      mesCierre = 0;
      anioCierre++;
    }
  }

  // Fecha de cierre del ciclo actual
  let fechaCierre = new Date(anioCierre, mesCierre, diaCierre);

  // Fecha de inicio del ciclo actual (mes anterior al cierre)
  let mesInicio = mesCierre - 1;
  let anioInicio = anioCierre;
  if (mesInicio < 0) {
    mesInicio = 11;
    anioInicio--;
  }
  
  let fechaInicio = new Date(anioInicio, mesInicio, diaInicio);

  // Fecha de pago (mes siguiente al cierre)
  let mesPago = mesCierre + 1;
  let anioPago = anioCierre;
  if (mesPago > 11) {
    mesPago = 0;
    anioPago++;
  }

  let fechaPago = new Date(anioPago, mesPago, diaPago);

  // Calcular días restantes
  const diasAlCierre = Math.ceil((fechaCierre - hoy) / (1000 * 60 * 60 * 24));
  const diasAlPago = Math.ceil((fechaPago - hoy) / (1000 * 60 * 60 * 24));

  // Formatear fechas para mostrar (ej: "26 Ene")
  const formatearFecha = (fecha) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${fecha.getDate()} ${meses[fecha.getMonth()]}`;
  };

  return {
    // Fechas ISO para la BD
    fecha_inicio: fechaInicio.toISOString().split('T')[0],
    fecha_cierre: fechaCierre.toISOString().split('T')[0],
    fecha_pago: fechaPago.toISOString().split('T')[0],
    
    // Fechas formateadas para UI
    fecha_inicio_formateada: formatearFecha(fechaInicio),
    fecha_cierre_formateada: formatearFecha(fechaCierre),
    fecha_pago_formateada: formatearFecha(fechaPago),
    
    // Días restantes
    dias_al_cierre: Math.max(0, diasAlCierre),
    dias_al_pago: Math.max(0, diasAlPago),
    
    // Info adicional para debugging
    ciclo_descripcion: `${formatearFecha(fechaInicio)} → ${formatearFecha(fechaCierre)}`
  };
}

  // ==========================================
  // Obtener las 4 tarjetas de un usuario CON CICLO CALCULADO
  // ==========================================
  static async getByUserId(userId) {
    try {
      const query = `
        SELECT 
          t.*,
          b.nombre as banco_nombre,
          b.logo_url as banco_logo,
          b.tea_promedio as banco_tea
        FROM tarjetas t
        LEFT JOIN bancos b ON t.banco_id = b.id
        WHERE t.usuario_id = ?
        ORDER BY t.slot_numero ASC
      `;
      
      const [rows] = await db.execute(query, [userId]);

      // Calcular ciclo para cada tarjeta que tenga datos
      const tarjetasConCiclo = rows.map(tarjeta => {
        if (!tarjeta.esta_vacia && tarjeta.dia_inicio_ciclo && tarjeta.dia_cierre_ciclo && tarjeta.dia_pago) {
          const ciclo = this.calcularCicloActual(
            tarjeta.dia_inicio_ciclo,
            tarjeta.dia_cierre_ciclo,
            tarjeta.dia_pago
          );

          // Calcular porcentaje de uso
          const porcentajeUso = tarjeta.linea_credito > 0 
            ? Math.round((tarjeta.deuda_actual / tarjeta.linea_credito) * 100)
            : 0;

          return {
            ...tarjeta,
            ...ciclo,
            porcentaje_uso: porcentajeUso,
            alerta_uso: porcentajeUso > 70 ? 'alta' : porcentajeUso > 30 ? 'media' : 'baja'
          };
        }

        return tarjeta;
      });

      return tarjetasConCiclo;
    } catch (error) {
      console.error('Error al obtener tarjetas:', error);
      throw error;
    }
  }

  // ==========================================
  // ACTUALIZAR (rellenar) una tarjeta vacía
  // ==========================================
static async updateSlot(userId, slotNumero, cardData) {
  try {
    const query = `
      UPDATE tarjetas 
      SET 
        banco_id = ?,
        banco_nombre_custom = ?,
        nombre_tarjeta = ?,
        linea_credito = ?,
        deuda_actual = ?,
        pago_minimo = ?,
        moneda = ?,
        simbolo_moneda = ?,
        dia_inicio_ciclo = ?,
        dia_cierre_ciclo = ?,
        dia_pago = ?,
        tasa_interes = ?,
        comision_mantenimiento = ?,
        categoria_principal = ?,
        notificar_dias_antes_cierre = ?,
        notificar_dias_antes_pago = ?,
        esta_vacia = FALSE,
        fecha_actualizacion = NOW()
      WHERE usuario_id = ? AND slot_numero = ?
    `;

    const [result] = await db.execute(query, [
      cardData.banco_id || null,
      cardData.banco_nombre_custom || null,   // ← NUEVO
      cardData.nombre_tarjeta || null,
      cardData.linea_credito,
      cardData.deuda_actual || 0,
      cardData.pago_minimo || 0,
      cardData.moneda || 'Soles',
      cardData.simbolo_moneda || 'S/',        // ← NUEVO
      cardData.dia_inicio_ciclo,
      cardData.dia_cierre_ciclo,
      cardData.dia_pago,
      cardData.tasa_interes || null,
      cardData.comision_mantenimiento || null,
      cardData.categoria_principal || null,
      cardData.notificar_dias_antes_cierre || 3,
      cardData.notificar_dias_antes_pago || 5,
      userId,
      slotNumero
    ]);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al actualizar tarjeta:', error);
    throw error;
  }
}

// ==========================================
// LIMPIAR (vaciar) una tarjeta - NO eliminar registro
// ==========================================
static async clearSlot(userId, slotNumero) {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. Obtener el ID de la tarjeta antes de limpiarla
    const [tarjetas] = await connection.execute(
      'SELECT id FROM tarjetas WHERE usuario_id = ? AND slot_numero = ?',
      [userId, slotNumero]
    );

    if (tarjetas.length === 0) {
      await connection.rollback();
      return false;
    }

    const tarjetaId = tarjetas[0].id;

    // 2. ELIMINAR TODOS LOS MOVIMIENTOS de esta tarjeta
    await connection.execute(
      'DELETE FROM movimientos WHERE tarjeta_id = ?',
      [tarjetaId]
    );

    // 3. Limpiar los datos de la tarjeta
    const query = `
      UPDATE tarjetas 
      SET 
        banco_id = NULL,
        nombre_tarjeta = NULL,
        linea_credito = NULL,
        deuda_actual = 0,
        pago_minimo = 0,
        moneda = 'PEN',
        dia_inicio_ciclo = NULL,
        dia_cierre_ciclo = NULL,
        dia_pago = NULL,
        tasa_interes = NULL,
        comision_mantenimiento = NULL,
        categoria_principal = NULL,
        notificar_dias_antes_cierre = 3,
        notificar_dias_antes_pago = 5,
        esta_vacia = TRUE,
        fecha_actualizacion = NOW()
      WHERE usuario_id = ? AND slot_numero = ?
    `;
    
    const [result] = await connection.execute(query, [userId, slotNumero]);
    
    await connection.commit();
    return result.affectedRows > 0;

  } catch (error) {
    await connection.rollback();
    console.error('Error al limpiar tarjeta:', error);
    throw error;
  } finally {
    connection.release();
  }
}

  // ==========================================
  // Actualizar SOLO la deuda actual (para dashboard)
  // ==========================================
  static async updateDeuda(userId, slotNumero, nuevaDeuda) {
    try {
      const query = `
        UPDATE tarjetas 
        SET deuda_actual = ?, fecha_actualizacion = NOW()
        WHERE usuario_id = ? AND slot_numero = ?
      `;
      
      const [result] = await db.execute(query, [nuevaDeuda, userId, slotNumero]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar deuda:', error);
      throw error;
    }
  }

  // ==========================================
  // Contar tarjetas CON DATOS (no vacías)
  // ==========================================
  static async countFilledByUserId(userId) {
    try {
      const query = `
        SELECT COUNT(*) as total 
        FROM tarjetas 
        WHERE usuario_id = ? AND esta_vacia = FALSE
      `;
      const [rows] = await db.execute(query, [userId]);
      return rows[0].total;
    } catch (error) {
      console.error('Error al contar tarjetas:', error);
      throw error;
    }
  }
}

module.exports = Card;