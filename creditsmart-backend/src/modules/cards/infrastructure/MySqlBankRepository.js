/**
 * ADAPTADOR: implementación MySQL del catálogo de bancos.
 */
const BankRepository = require('../domain/BankRepository');
const db = require('../../../shared/infrastructure/database');

class MySqlBankRepository extends BankRepository {
  async findAll() {
    const query = `
      SELECT id, nombre, logo_url, tea_minima, tea_maxima, tea_promedio
      FROM bancos
      ORDER BY nombre
    `;
    const [bancos] = await db.execute(query);
    return bancos;
  }
}

module.exports = MySqlBankRepository;
