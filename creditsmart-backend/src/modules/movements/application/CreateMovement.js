/**
 * CASO DE USO: Registrar un movimiento (gasto o pago).
 *
 * Orquesta dos efectos:
 *   1. Persistir el movimiento con su ciclo derivado (regla de dominio).
 *   2. Ajustar la deuda de la tarjeta vía puerto CardDebtPort
 *      (gasto suma; pago resta sin bajar de 0).
 */
const Movement = require('../domain/Movement');

class CreateMovement {
  constructor({ movementRepository, cardDebtPort }) {
    this.movementRepository = movementRepository;
    this.cardDebtPort = cardDebtPort;
  }

  async execute({ tarjeta_id, usuario_id, tipo, monto, descripcion, fecha_movimiento }) {
    if (!Movement.tipoValido(tipo)) {
      return { ok: false, message: 'El tipo debe ser "gasto" o "pago"' };
    }
    if (!Movement.montoValido(monto)) {
      return { ok: false, message: 'El monto debe ser mayor a 0' };
    }

    const { fecha, ciclo_mes, ciclo_anio } = Movement.derivarCiclo(fecha_movimiento);

    const movimientoId = await this.movementRepository.create({
      tarjeta_id,
      usuario_id,
      tipo,
      monto,
      descripcion,
      fecha_movimiento: fecha,
      ciclo_mes,
      ciclo_anio,
    });

    if (tipo === Movement.TIPOS.GASTO) {
      await this.cardDebtPort.increaseDebt(tarjeta_id, monto);
    } else {
      await this.cardDebtPort.decreaseDebt(tarjeta_id, monto);
    }

    return { ok: true, movimientoId };
  }
}

module.exports = CreateMovement;
