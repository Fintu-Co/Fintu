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

  /**
   * Días hacia atrás que se admiten al registrar un movimiento.
   * Cubre el "se me olvidó anotarlo" de varios ciclos sin llegar a la
   * retención de 12 meses (CleanupOldMovements), donde un movimiento
   * recién creado sería borrado por la limpieza automática.
   */
  static DIAS_RETRO_MAX = 90;

  static tipoValido(tipo) {
    return tipo === Movement.TIPOS.GASTO || tipo === Movement.TIPOS.PAGO;
  }

  static montoValido(monto) {
    return monto > 0;
  }

  /** Fecha sin hora, para comparar por día calendario. */
  static #soloDia(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /**
   * Normaliza y valida la fecha de un movimiento.
   *
   * Acepta 'YYYY-MM-DD' (lo que manda el selector del formulario), un Date
   * o una fecha ISO completa. Sin valor, es "ahora".
   *
   * Un 'YYYY-MM-DD' se ancla en hora LOCAL: `new Date('2026-07-15')` es
   * medianoche UTC y en Perú (UTC-5) se guardaría como el 14.
   *
   * @returns {{ ok: true, fecha: Date } | { ok: false, message: string }}
   */
  static normalizarFecha(valor, ahora = new Date()) {
    if (valor == null || valor === '') return { ok: true, fecha: ahora };

    let fecha;
    const soloFecha = typeof valor === 'string' && valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (soloFecha) {
      const [, a, m, d] = soloFecha;
      const esHoy = Number(a) === ahora.getFullYear()
        && Number(m) === ahora.getMonth() + 1
        && Number(d) === ahora.getDate();
      /* Si es hoy conserva la hora real (ordena bien entre los del día);
         si es un día pasado se ancla al mediodía, lejos de cualquier borde. */
      fecha = esHoy ? new Date(ahora) : new Date(Number(a), Number(m) - 1, Number(d), 12, 0, 0);
    } else {
      fecha = new Date(valor);
    }

    if (isNaN(fecha.getTime())) {
      return { ok: false, message: 'La fecha del movimiento no es válida' };
    }

    const dia = Movement.#soloDia(fecha);
    const hoy = Movement.#soloDia(ahora);

    if (dia > hoy) {
      return { ok: false, message: 'La fecha del movimiento no puede ser futura' };
    }

    const limite = new Date(hoy);
    limite.setDate(limite.getDate() - Movement.DIAS_RETRO_MAX);
    if (dia < limite) {
      return {
        ok: false,
        message: `La fecha no puede tener más de ${Movement.DIAS_RETRO_MAX} días de antigüedad`,
      };
    }

    return { ok: true, fecha };
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
