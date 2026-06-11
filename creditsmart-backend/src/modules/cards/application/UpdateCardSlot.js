/**
 * CASO DE USO: Rellenar (configurar) un slot de tarjeta.
 * La validación de rango de días es regla de dominio.
 */
const Card = require('../domain/Card');

class UpdateCardSlot {
  constructor({ cardRepository }) {
    this.cardRepository = cardRepository;
  }

  async execute({ usuario_id, slot_numero, ...cardData }) {
    if (!Card.diasCicloValidos(cardData.dia_inicio_ciclo, cardData.dia_cierre_ciclo, cardData.dia_pago)) {
      return { ok: false, message: 'Los días del ciclo deben estar entre 1 y 31' };
    }

    const updated = await this.cardRepository.updateSlot(usuario_id, slot_numero, cardData);
    if (!updated) {
      return { ok: false, message: 'No se pudo actualizar la tarjeta' };
    }
    return { ok: true };
  }
}

module.exports = UpdateCardSlot;
