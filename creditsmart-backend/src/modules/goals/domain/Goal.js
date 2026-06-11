/**
 * ENTIDAD DE DOMINIO: Goal (Objetivo financiero)
 *
 * Contiene SOLO reglas de negocio. No sabe nada de SQL ni de HTTP.
 * Las reglas que antes vivían dispersas en goalController ahora viven aquí:
 *   - Límite de objetivos activos por usuario
 *   - Cálculo de progreso inicial según tipo y tarjeta
 *   - Evaluación de progreso/completado contra el estado de la tarjeta
 */

class Goal {
  // Regla de negocio: un usuario puede tener máximo 3 objetivos activos
  static MAX_ACTIVOS = 3;

  static TIPOS = {
    REDUCIR_USO: 'reducir_uso',
    REDUCIR_DEUDA: 'reducir_deuda',
    PAGO_TOTAL: 'pago_total',
    MANTENER_USO: 'mantener_uso',
    NO_ATRASAR: 'no_atrasar',
  };

  constructor({
    id,
    usuario_id,
    tarjeta_id,
    tarjeta_nombre,
    tipo,
    descripcion,
    meta_valor,
    progreso_actual,
    fecha_inicio,
    fecha_limite,
    completado,
    activo,
  }) {
    this.id = id;
    this.usuarioId = usuario_id;
    this.tarjetaId = tarjeta_id;
    this.tarjetaNombre = tarjeta_nombre;
    this.tipo = tipo;
    this.descripcion = descripcion;
    this.metaValor = meta_valor;
    this.progresoActual = progreso_actual;
    this.fechaInicio = fecha_inicio;
    this.fechaLimite = fecha_limite;
    this.completado = completado;
    this.activo = activo;
  }

  static fromRow(row) {
    return new Goal(row);
  }

  /**
   * Progreso inicial al crear un objetivo, derivado de la tarjeta asociada.
   * reducir_uso  → % de uso actual de la línea
   * reducir_deuda → deuda actual
   * resto        → 0
   */
  static calcularProgresoInicial(tipo, tarjeta) {
    if (!tarjeta) return 0;
    const deuda = parseFloat(tarjeta.deuda_actual || 0);
    const linea = parseFloat(tarjeta.linea_credito || 1);
    if (tipo === Goal.TIPOS.REDUCIR_USO) return Math.round((deuda / linea) * 100);
    if (tipo === Goal.TIPOS.REDUCIR_DEUDA) return deuda;
    return 0;
  }

  /**
   * Evalúa el objetivo contra el estado actual de su tarjeta.
   * Devuelve el nuevo progreso y si el objetivo debe marcarse como completado.
   * (Lógica extraída de syncProgress, comportamiento idéntico.)
   */
  evaluarContraTarjeta(tarjeta) {
    const deuda = tarjeta ? parseFloat(tarjeta.deuda_actual || 0) : 0;
    const linea = tarjeta ? parseFloat(tarjeta.linea_credito || 1) : 1;
    const uso = Math.round((deuda / linea) * 100);

    let nuevoProgreso = this.progresoActual;
    let debeCompletarse = false;

    if (this.tipo === Goal.TIPOS.REDUCIR_USO) {
      nuevoProgreso = uso;
      if (uso <= this.metaValor) debeCompletarse = true;
    }
    if (this.tipo === Goal.TIPOS.REDUCIR_DEUDA) {
      nuevoProgreso = deuda;
      if (deuda <= this.metaValor) debeCompletarse = true;
    }
    if (this.tipo === Goal.TIPOS.PAGO_TOTAL) {
      nuevoProgreso = deuda === 0 ? 100 : 0;
      if (deuda === 0) debeCompletarse = true;
    }

    return { nuevoProgreso, debeCompletarse };
  }
}

module.exports = Goal;
