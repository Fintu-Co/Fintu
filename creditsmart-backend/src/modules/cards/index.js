/**
 * API PÚBLICA del módulo cards.
 *
 * Otros módulos (p. ej. goals) consumen tarjetas a través de este
 * punto de entrada, nunca importando archivos internos del módulo.
 * Expone los casos de uso ya cableados con su infraestructura.
 */
const MySqlCardRepository = require('./infrastructure/MySqlCardRepository');
const MySqlBankRepository = require('./infrastructure/MySqlBankRepository');

const GetUserCards = require('./application/GetUserCards');
const UpdateCardSlot = require('./application/UpdateCardSlot');
const ClearCardSlot = require('./application/ClearCardSlot');
const UpdateCardDebt = require('./application/UpdateCardDebt');
const GetBanks = require('./application/GetBanks');
const GetCardById = require('./application/GetCardById');

const cardRepository = new MySqlCardRepository();
const bankRepository = new MySqlBankRepository();

module.exports = {
  cardRepository,
  useCases: {
    getUserCards: new GetUserCards({ cardRepository }),
    updateCardSlot: new UpdateCardSlot({ cardRepository }),
    clearCardSlot: new ClearCardSlot({ cardRepository }),
    updateCardDebt: new UpdateCardDebt({ cardRepository }),
    getBanks: new GetBanks({ bankRepository }),
    getCardById: new GetCardById({ cardRepository }),
  },
};
