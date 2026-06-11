/**
 * ADAPTADOR TEMPORAL: puente hacia el modelo legacy de Card.
 *
 * El módulo goals necesita consultar tarjetas (puerto `cardProvider`:
 * { getByUserId }). Mientras cards no esté migrado a DDD, este adaptador
 * delega en el modelo antiguo. Cuando cards migre, este archivo se
 * reemplaza por un adaptador hacia su módulo — sin tocar dominio
 * ni casos de uso de goals.
 */
const Card = require('../../../models/Card');

class LegacyCardProvider {
  async getByUserId(userId) {
    return Card.getByUserId(userId);
  }
}

module.exports = LegacyCardProvider;
