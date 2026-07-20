/**
 * CASO DE USO: Movimientos entre dos fechas (rango real de un ciclo).
 *
 * A diferencia de GetMovementsByCycle —que filtra por mes calendario—
 * este respeta el ciclo de facturación de la tarjeta, que normalmente
 * cruza de mes (p. ej. 25/06 → 24/07).
 */
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

class GetMovementsByRange {
  constructor({ movementRepository }) {
    this.movementRepository = movementRepository;
  }

  async execute({ tarjetaId, desde, hasta }) {
    if (!FORMATO_FECHA.test(desde) || !FORMATO_FECHA.test(hasta)) {
      return { ok: false, message: 'Las fechas deben tener formato YYYY-MM-DD' };
    }
    if (desde > hasta) {
      return { ok: false, message: 'La fecha inicial no puede ser posterior a la final' };
    }

    const movimientos = await this.movementRepository.findByDateRange(tarjetaId, desde, hasta);
    return { ok: true, movimientos };
  }
}

module.exports = GetMovementsByRange;
