/**
 * ADAPTADOR: implementa el puerto `cardProvider` de goals
 * consumiendo la API pública del módulo cards.
 * (Reemplaza al antiguo LegacyCardProvider que apuntaba a models/Card.)
 */
const cardsModule = require('../../cards');

class CardsModuleCardProvider {
  async getByUserId(userId) {
    return cardsModule.useCases.getUserCards.execute(userId);
  }
}

module.exports = CardsModuleCardProvider;
