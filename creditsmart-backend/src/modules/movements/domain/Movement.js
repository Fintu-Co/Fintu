/**
 * ENTIDAD DE DOMINIO: Movement (gasto o pago de una tarjeta).
 *
 * Reglas de negocio:
 *   - Solo existen dos tipos: gasto y pago.
 *   - El monto debe ser mayor a 0.
 *   - Todo movimiento pertenece a un ciclo (mes/año) derivado de su fecha.
 */
class Movement {
  static TIPOS = { GASTO: 'gasto', PAGO: 'pago' };

  static tipoValido(tipo) {
    return tipo === Movement.TIPOS.GASTO || tipo === Movement.TIPOS.PAGO;
  }

  static montoValido(monto) {
    return monto > 0;
  }

  /**
   * Deriva el ciclo (mes 1-12 y año) al que pertenece un movimiento.
   * Si no se da fecha, se usa el momento actual.
   */
  static derivarCiclo(fechaMovimiento) {
    const fecha = fechaMovimiento ? new Date(fechaMovimiento) : new Date();
    return {
      fecha,
      ciclo_mes: fecha.getMonth() + 1,
      ciclo_anio: fecha.getFullYear(),
    };
  }
}

module.exports = Movement;
