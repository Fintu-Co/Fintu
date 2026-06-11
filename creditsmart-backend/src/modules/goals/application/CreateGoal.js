/**
 * CASO DE USO: Crear un objetivo.
 *
 * Reglas aplicadas (vía dominio):
 *   - Máximo Goal.MAX_ACTIVOS objetivos activos por usuario.
 *   - El progreso inicial se deriva de la tarjeta asociada según el tipo.
 *
 * `cardProvider` es un puerto: solo exige { getByUserId(userId) }.
 * Hoy lo implementa un adaptador sobre el modelo legacy de Card;
 * cuando cards migre a DDD, se cambia el adaptador sin tocar esto.
 */
const Goal = require('../domain/Goal');

class CreateGoal {
  constructor({ goalRepository, cardProvider }) {
    this.goalRepository = goalRepository;
    this.cardProvider = cardProvider;
  }

  async execute({ usuario_id, tipo, descripcion, meta_valor, fecha_limite, tarjeta_id, tarjeta_nombre }) {
    const totalActivos = await this.goalRepository.countActiveByUserId(usuario_id);
    if (totalActivos >= Goal.MAX_ACTIVOS) {
      return {
        ok: false,
        message: 'Ya tienes 3 objetivos activos. Completa o elimina uno primero.',
      };
    }

    let progresoInicial = 0;
    if (tarjeta_id) {
      const tarjetas = await this.cardProvider.getByUserId(usuario_id);
      const tarjeta = tarjetas.find((t) => t.id === parseInt(tarjeta_id));
      progresoInicial = Goal.calcularProgresoInicial(tipo, tarjeta);
    }

    const id = await this.goalRepository.create(usuario_id, {
      tipo,
      descripcion,
      meta_valor: meta_valor || null,
      progreso_actual: progresoInicial,
      fecha_limite: fecha_limite || null,
      tarjeta_id: tarjeta_id || null,
      tarjeta_nombre: tarjeta_nombre || null,
    });

    return { ok: true, id };
  }
}

module.exports = CreateGoal;
