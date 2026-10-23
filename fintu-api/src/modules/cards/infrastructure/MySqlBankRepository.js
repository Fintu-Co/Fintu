/**
 * ADAPTADOR: implementación MySQL del catálogo de bancos.
 *
 * El catálogo son ~10 filas que casi nunca cambian, pero se consultan en
 * cada carga del comparador, cada apertura del modal de "agregar tarjeta"
 * y en el dashboard. Se cachea en memoria para no golpear MySQL cada vez.
 *
 * Si actualizas las TEA en la base, el cache se renueva solo al vencer el TTL
 * (o reinicia el servidor para verlo al instante).
 */
const BankRepository = require('../domain/BankRepository');
const db = require('../../../shared/infrastructure/database');

const TTL_MS = 10 * 60 * 1000; // 10 minutos

let cache = null;
let cacheExpira = 0;

class MySqlBankRepository extends BankRepository {
  async findAll() {
    const ahora = Date.now();
    if (cache && ahora < cacheExpira) return cache;

    const query = `
      SELECT id, nombre, tea_minima, tea_maxima, tea_promedio
      FROM bancos
      ORDER BY nombre
    `;
    const [bancos] = await db.execute(query);

    cache = bancos;
    cacheExpira = ahora + TTL_MS;
    return bancos;
  }

  /** Invalida el cache manualmente (útil si algún día editas bancos desde la app). */
  static invalidarCache() {
    cache = null;
    cacheExpira = 0;
  }
}

module.exports = MySqlBankRepository;
